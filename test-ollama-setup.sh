#!/bin/bash

echo "🧪 Testing Ollama Setup for Meta Lingua"
echo "======================================"

# Test 1: Check if Ollama service is running
echo "1. Checking Ollama service status..."
if systemctl is-active --quiet ollama; then
    echo "✅ Ollama service is running"
else
    echo "❌ Ollama service is not running"
    echo "Starting Ollama service..."
    sudo systemctl start ollama
fi

# Test 2: Check if Ollama API is responding
echo "2. Testing Ollama API..."
if curl -s http://localhost:11434/api/version >/dev/null; then
    echo "✅ Ollama API is responding"
    curl -s http://localhost:11434/api/version | jq '.'
else
    echo "❌ Ollama API is not responding"
fi

# Test 3: List available models
echo "3. Checking available models..."
ollama list
echo ""

# Test 4: Test model response
echo "4. Testing model response..."
ollama run llama3.2:3b "Hello, how are you?" 2>/dev/null | head -3
echo ""

# Test 5: Check if model used by Meta Lingua exists
echo "5. Checking if llama3.2b model exists..."
if ollama list | grep -q "llama3.2b"; then
    echo "✅ llama3.2b model found"
elif ollama list | grep -q "llama3.2:3b"; then
    echo "✅ llama3.2:3b model found (compatible)"
elif ollama list | grep -q "llama2"; then
    echo "⚠️  llama2 model found (will work but not optimal)"
    echo "Consider downloading: ollama pull llama3.2:3b"
else
    echo "❌ No compatible model found"
    echo "Downloading recommended model..."
    ollama pull llama3.2:3b
fi

echo ""
echo "🔧 Meta Lingua Configuration:"
echo "Add this to your .env file:"
echo "OLLAMA_HOST=http://localhost:11434"
echo "OLLAMA_MODEL=llama3.2:3b"
echo ""
echo "🎯 Your Meta Lingua platform now has full AI capabilities!"