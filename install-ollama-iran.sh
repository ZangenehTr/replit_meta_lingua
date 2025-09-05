#!/bin/bash

echo "🚀 Installing Ollama for Iranian Servers"
echo "======================================="

# Method 1: Try direct binary download from GitHub releases
echo "📥 Attempting direct binary download..."

# Create ollama directory
sudo mkdir -p /usr/local/bin
sudo mkdir -p /usr/local/lib/ollama

# Download Ollama binary directly from GitHub (may work better than ollama.ai)
if command -v wget >/dev/null 2>&1; then
    echo "Using wget to download..."
    sudo wget -O /usr/local/bin/ollama https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64
elif command -v curl >/dev/null 2>&1; then
    echo "Using curl to download..."
    sudo curl -L -o /usr/local/bin/ollama https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64
else
    echo "❌ Neither wget nor curl available"
    exit 1
fi

# Make executable
sudo chmod +x /usr/local/bin/ollama

# Create ollama user and service
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama 2>/dev/null || echo "User ollama already exists"

# Create systemd service
sudo tee /etc/systemd/system/ollama.service > /dev/null <<EOF
[Unit]
Description=Ollama Service
After=network-online.target

[Service]
ExecStart=/usr/local/bin/ollama serve
User=ollama
Group=ollama
Restart=always
RestartSec=3
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
Environment="OLLAMA_HOST=0.0.0.0"

[Install]
WantedBy=default.target
EOF

# Start and enable service
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Wait for service to start
sleep 5

# Check if service is running
if sudo systemctl is-active --quiet ollama; then
    echo "✅ Ollama service started successfully!"
    
    # Download models
    echo "📚 Downloading language models..."
    
    # Try downloading llama3.2:3b (smaller model, faster download)
    ollama pull llama3.2:3b
    
    # If that fails, try llama2:7b
    if [ $? -ne 0 ]; then
        echo "Trying alternative model..."
        ollama pull llama2:7b
    fi
    
    echo "🎯 Installation complete!"
    echo "Ollama is running on: http://localhost:11434"
    echo ""
    echo "Update your Meta Lingua .env file:"
    echo "OLLAMA_HOST=http://localhost:11434"
    echo "OLLAMA_MODEL=llama3.2:3b"
    
else
    echo "❌ Ollama service failed to start"
    echo "Checking logs..."
    sudo journalctl -u ollama --no-pager --lines=10
    exit 1
fi