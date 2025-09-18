#!/usr/bin/env python3
"""
Local Whisper Transcription Service
Runs on localhost:8000 for Meta Lingua MST
"""

import os
import tempfile
import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import uvicorn
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Local Whisper Service", version="1.0.0")

# Load Whisper model (using base model for speed)
logger.info("Loading Whisper model...")
try:
    model = whisper.load_model("base")
    logger.info("✅ Whisper base model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load Whisper model: {e}")
    model = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model else "unhealthy",
        "service": "Local Whisper Transcription",
        "model": "base" if model else "not_loaded"
    }

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    """Transcribe uploaded audio file"""
    if not model:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    # Check file type
    if not audio.content_type or not audio.content_type.startswith('audio/'):
        logger.warning(f"Invalid content type: {audio.content_type}")
        # Accept anyway for MST compatibility
    
    try:
        # Save uploaded file to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await audio.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        logger.info(f"Transcribing audio file: {temp_file_path}")
        
        # Transcribe with Whisper
        result = model.transcribe(temp_file_path, language='en')
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        # Format response for Meta Lingua compatibility
        response = {
            "text": result["text"].strip(),
            "language": result.get("language", "en"),
            "duration": result.get("duration", 0),
            "segments": [
                {
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", "")
                }
                for seg in result.get("segments", [])
            ],
            "confidence": calculate_confidence(result)
        }
        
        logger.info(f"✅ Transcription successful: '{response['text'][:50]}...'")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"❌ Transcription failed: {e}")
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")

def calculate_confidence(result):
    """Calculate average confidence from Whisper result"""
    if "segments" in result and result["segments"]:
        confidences = []
        for segment in result["segments"]:
            if "avg_logprob" in segment:
                # Convert log probability to confidence (0-1)
                conf = min(1.0, max(0.0, (segment["avg_logprob"] + 1.0) / 1.0))
                confidences.append(conf)
        
        if confidences:
            return sum(confidences) / len(confidences)
    
    return 0.8  # Default confidence for successful transcription

if __name__ == "__main__":
    logger.info("🎤 Starting Local Whisper Service on localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")