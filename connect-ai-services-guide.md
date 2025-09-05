# AI Services Connection Guide

Your Callern test setup is ready! Here's how to connect your existing AI services running on your server.

## 🎯 Current Status
- ✅ Ollama: Detected by application
- ❌ Whisper: Not connected  
- ❌ Coqui TTS: Not connected

## 🔧 Service Connection Instructions

### 1. Whisper Speech-to-Text Service

Your application expects Whisper at `http://localhost:8000`. Update your `.env` file:

```env
# Whisper Configuration
WHISPER_API_URL=http://localhost:8000
WHISPER_ENABLED=true
```

**If your Whisper runs on a different port/host:**
```env
WHISPER_API_URL=http://YOUR_SERVER_IP:YOUR_WHISPER_PORT
```

### 2. Coqui TTS Service

Add to your `.env` file:

```env
# Coqui TTS Configuration  
TTS_API_URL=http://localhost:5002
TTS_ENABLED=true
TTS_VOICE_MODEL=tts_models/multilingual/multi-dataset/your_farsi_model
```

**If your Coqui TTS runs on a different port:**
```env
TTS_API_URL=http://YOUR_SERVER_IP:YOUR_TTS_PORT
```

### 3. Ollama Configuration (Already Working)

Your current Ollama configuration:
```env
OLLAMA_HOST=http://45.89.239.250:11434
OLLAMA_MODEL=llama3.2b
```

**For local server deployment, update to:**
```env
OLLAMA_HOST=http://localhost:11434  
OLLAMA_MODEL=llama2:latest
# Or use: mistral:7b-instruct-q5_K_M
```

## 🚀 Restart Application

After updating your `.env` file:

```bash
# Method 1: If using PM2
pm2 restart metalingua

# Method 2: If using npm
npm run dev

# Method 3: If using Docker
docker-compose restart

# Method 4: If running directly
# Stop current process (Ctrl+C) then:
npm start
```

## 🧪 Test AI Services

### Test Whisper Connection
```bash
curl -X POST http://localhost:8000/transcribe \
  -F "audio=@test_audio.wav" \
  -H "Content-Type: multipart/form-data"
```

### Test Coqui TTS
```bash
curl -X POST http://localhost:5002/tts \
  -H "Content-Type: application/json" \
  -d '{"text": "سلام، من آماده صحبت هستم", "language": "fa"}'
```

### Test Ollama (Should already work)
```bash
curl http://45.89.239.250:11434/api/chat \
  -d '{"model": "llama3.2b", "messages": [{"role": "user", "content": "Hello"}]}'
```

## 🎯 Callern Test Ready!

Once all services are connected, you can test:

1. **Login as student**: `sara.ahmadi@gmail.com / password`
2. **Access Callern**: Go to video calling section
3. **Start session**: AI features should now work:
   - 🎤 **Whisper**: Speech recognition during calls
   - 🔊 **Coqui TTS**: Text-to-speech for pronunciation practice
   - 🤖 **Ollama**: Real-time AI suggestions and corrections

## 📋 Service Health Check

After restart, check the console logs for:
```
✅ Whisper service available at http://localhost:8000
✅ Coqui TTS service available at http://localhost:5002  
✅ Ollama service initialized with host: http://localhost:11434
```

## 🔧 Troubleshooting

**If services still show as unavailable:**

1. **Check if services are running:**
   ```bash
   # Check ports
   netstat -tulpn | grep :8000  # Whisper
   netstat -tulpn | grep :5002  # Coqui TTS
   netstat -tulpn | grep :11434 # Ollama
   ```

2. **Verify service endpoints manually**
3. **Check firewall settings**
4. **Ensure correct IP addresses in .env file**

Your Callern platform is now ready for comprehensive AI-powered language learning sessions! 🚀