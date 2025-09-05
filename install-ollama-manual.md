# Manual Ollama Installation for Iranian Servers

## Option 1: Direct Binary Installation

```bash
# Download the installation script
chmod +x install-ollama-iran.sh
./install-ollama-iran.sh
```

## Option 2: Manual Steps (if script fails)

### Step 1: Download Binary
```bash
# Create directories
sudo mkdir -p /usr/local/bin
sudo mkdir -p /usr/local/lib/ollama

# Download from GitHub (alternative to ollama.ai)
sudo wget -O /usr/local/bin/ollama https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64

# Or try with curl
sudo curl -L -o /usr/local/bin/ollama https://github.com/ollama/ollama/releases/latest/download/ollama-linux-amd64

# Make executable
sudo chmod +x /usr/local/bin/ollama
```

### Step 2: Create User and Service
```bash
# Create ollama user
sudo useradd -r -s /bin/false -m -d /usr/share/ollama ollama

# Create systemd service file
sudo nano /etc/systemd/system/ollama.service
```

Add this content:
```ini
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
```

### Step 3: Start Service
```bash
# Start and enable
sudo systemctl daemon-reload
sudo systemctl enable ollama
sudo systemctl start ollama

# Check status
sudo systemctl status ollama
```

### Step 4: Download Models
```bash
# Download a small model first
ollama pull llama3.2:3b

# Or try llama2 if llama3.2 is blocked
ollama pull llama2:7b
```

## Option 3: Using VPN/Proxy (if available)

```bash
# If you have access to VPN/proxy, use original method
curl -fsSL https://ollama.ai/install.sh | sh
```

## Update Meta Lingua Configuration

After installation, update your `.env` file:
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

## Verification

Test if Ollama is working:
```bash
# Check service
sudo systemctl status ollama

# Test API
curl http://localhost:11434/api/version

# List downloaded models
ollama list
```

## Troubleshooting

If download fails with 403 errors:
1. Try using different mirrors or proxies
2. Download models manually from alternative sources
3. Use smaller models that download faster
4. Contact your network administrator about accessing AI model repositories