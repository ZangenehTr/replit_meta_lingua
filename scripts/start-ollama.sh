#!/bin/bash

# Start Ollama in the background
echo "Starting Ollama server..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
sleep 10

# Check if Ollama is running
if curl -f http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama is running successfully"
    
    # Pull the default model if it doesn't exist
    if ! ollama list | grep -q "llama3.2:1b"; then
        echo "Pulling default model llama3.2:1b..."
        ollama pull llama3.2:1b
    fi
    
    echo "Ollama setup complete"
else
    echo "Failed to start Ollama"
fi

# Keep the script running
wait $OLLAMA_PID