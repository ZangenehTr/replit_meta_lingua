FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Piper TTS
RUN pip install --no-cache-dir \
    flask \
    requests \
    piper-tts

# Create directories
RUN mkdir -p /app/models /app/voices

# Download Farsi voice model
RUN cd /app/models && \
    wget -q https://github.com/rhasspy/piper/releases/download/v1.2.0/voice-fa_IR-amir-medium.tar.gz && \
    tar -xzf voice-fa_IR-amir-medium.tar.gz && \
    rm voice-fa_IR-amir-medium.tar.gz

# Create the Flask API server
COPY <<'EOF' /app/server.py
from flask import Flask, request, jsonify, send_file
import subprocess
import tempfile
import os
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)

# Default voice configuration
DEFAULT_VOICE = os.environ.get('DEFAULT_VOICE', 'fa_IR-amir-medium')
MODELS_PATH = '/app/models'

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'piper-tts'})

@app.route('/synthesize', methods=['POST'])
def synthesize():
    try:
        data = request.json
        text = data.get('text', '')
        voice = data.get('voice', DEFAULT_VOICE)
        speed = data.get('speed', 1.0)
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Create temporary file for output
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        # Find model path
        model_path = os.path.join(MODELS_PATH, voice, f'{voice}.onnx')
        config_path = os.path.join(MODELS_PATH, voice, f'{voice}.onnx.json')
        
        if not os.path.exists(model_path):
            return jsonify({'error': f'Voice model {voice} not found'}), 404
        
        # Run Piper
        cmd = [
            'piper',
            '--model', model_path,
            '--config', config_path,
            '--output_file', output_path,
            '--speed', str(speed)
        ]
        
        process = subprocess.Popen(
            cmd,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        stdout, stderr = process.communicate(input=text)
        
        if process.returncode != 0:
            logging.error(f'Piper error: {stderr}')
            return jsonify({'error': 'TTS synthesis failed'}), 500
        
        # Return the audio file
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='speech.wav'
        )
        
    except Exception as e:
        logging.error(f'Error in synthesize: {str(e)}')
        return jsonify({'error': str(e)}), 500
    finally:
        # Clean up temporary file
        if 'output_path' in locals() and os.path.exists(output_path):
            try:
                os.remove(output_path)
            except:
                pass

@app.route('/voices', methods=['GET'])
def list_voices():
    voices = []
    for voice_dir in os.listdir(MODELS_PATH):
        model_path = os.path.join(MODELS_PATH, voice_dir, f'{voice_dir}.onnx')
        if os.path.exists(model_path):
            voices.append({
                'id': voice_dir,
                'name': voice_dir.replace('_', ' ').title(),
                'language': voice_dir.split('_')[0]
            })
    return jsonify({'voices': voices})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)
EOF

# Set the entrypoint
CMD ["python", "/app/server.py"]