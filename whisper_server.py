#!/usr/bin/env python3
"""
Local Whisper Transcription Service
Runs on localhost:8000 for Meta Lingua MST
"""

import os
import tempfile
import whisper
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
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
    whisper_model = whisper.load_model("base")
    logger.info("✅ Whisper base model loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load Whisper model: {e}")
    whisper_model = None

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if whisper_model else "unhealthy",
        "service": "Local Whisper Transcription",
        "model": "base" if whisper_model else "not_loaded"
    }

@app.post("/v1/audio/transcriptions")
async def transcribe_audio(
    file: UploadFile = File(...),
    model: str = Form(default="whisper-1"),
    language: str = Form(default=None),
    task: str = Form(default="transcribe"),
    response_format: str = Form(default="json")
):
    """Transcribe uploaded audio file - OpenAI API compatible"""
    if not whisper_model:
        raise HTTPException(status_code=503, detail="Whisper model not loaded")
    
    # Check file type
    if not file.content_type or not file.content_type.startswith('audio/'):
        logger.warning(f"Invalid content type: {file.content_type}")
        # Accept anyway for MST compatibility
    
    try:
        # Save uploaded file to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        logger.info(f"Transcribing audio file: {temp_file_path}")
        
        # Transcribe with Whisper
        transcribe_language = language if language else None  # Let Whisper auto-detect if not specified
        result = whisper_model.transcribe(temp_file_path, language=transcribe_language, task=task)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        # Format response for OpenAI API compatibility
        text_content = result["text"].strip() if isinstance(result["text"], str) else ""
        
        if response_format == "verbose_json":
            response = {
                "text": text_content,
                "language": result.get("language", language or "en"),
                "duration": result.get("duration", 0),
                "segments": [
                    {
                        "start": seg.get("start", 0),
                        "end": seg.get("end", 0),
                        "text": seg.get("text", "")
                    }
                    for seg in result.get("segments", [])
                ]
            }
        else:
            response = {
                "text": text_content
            }
        
        logger.info(f"✅ Transcription successful: '{text_content[:50]}...'")
        return JSONResponse(content=response)
        
    except Exception as e:
        logger.error(f"❌ Transcription failed: {e}")
        # Clean up temp file if it was created
        try:
            if 'temp_file_path' in locals() and temp_file_path:
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