# Meta Lingua Production Deployment Guide

> **Comprehensive deployment documentation for self-hosted Iranian production environment**

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Target Environment**: Iranian Self-Hosted Infrastructure

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Infrastructure Requirements](#infrastructure-requirements)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [PostgreSQL Database Setup](#postgresql-database-setup)
6. [Redis Setup](#redis-setup)
7. [Main Application Deployment](#main-application-deployment)
8. [AI Services Configuration](#ai-services-configuration)
9. [WebRTC & TURN Server Setup](#webrtc--turn-server-setup)
10. [Iranian Services Integration](#iranian-services-integration)
11. [File Storage Configuration](#file-storage-configuration)
12. [Environment Variables Reference](#environment-variables-reference)
13. [Deployment Workflow](#deployment-workflow)
14. [Post-Deployment Verification](#post-deployment-verification)
15. [Monitoring & Logging](#monitoring--logging)
16. [Backup & Disaster Recovery](#backup--disaster-recovery)
17. [Security Hardening](#security-hardening)
18. [Troubleshooting](#troubleshooting)

---

## Executive Summary

Meta Lingua is a comprehensive AI-enhanced language learning platform designed for complete self-hosting in Iran. This deployment guide covers all infrastructure components, external services, and configuration required for production deployment.

### System Components

**Core Stack:**
- Express.js/TypeScript backend
- React 18 frontend
- PostgreSQL 14+ database
- Redis 7+ (sessions, queues, caching)

**AI Services:**
- Ollama (local LLM processing)
- Whisper (speech-to-text transcription)
- Edge TTS (text-to-speech)

**Real-time Services:**
- Socket.IO (WebSocket communication)
- WebRTC (video calling)
- CoTURN (TURN/STUN server)

**Iranian Services:**
- Kavenegar (SMS gateway)
- Shetab (payment gateway)
- Isabel VoIP (telephony integration)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Internet/Users                           │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │   Nginx Reverse Proxy  │
          │   (SSL/TLS Termination)│
          └─────────┬──────────────┘
                    │
      ┌─────────────┼─────────────┐
      │             │             │
      ▼             ▼             ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Express  │ │ Express  │ │ Express  │
│ App #1   │ │ App #2   │ │ App #N   │
│ (PM2)    │ │ (PM2)    │ │ (PM2)    │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     └────────────┼────────────┘
                  │
     ┌────────────┼────────────┐
     │            │            │
     ▼            ▼            ▼
┌─────────┐  ┌─────────┐  ┌─────────┐
│PostgreSQL│  │  Redis  │  │ Socket.IO│
│Database │  │ (Cache) │  │ Server  │
└─────────┘  └─────────┘  └─────────┘

External Services (Same Datacenter/Network):
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Ollama  │  │ Whisper  │  │ CoTURN   │
│ AI Server│  │ STT API  │  │ (WebRTC) │
└──────────┘  └──────────┘  └──────────┘

Iranian Services (External APIs):
┌──────────┐  ┌──────────┐  ┌──────────┐
│Kavenegar │  │  Shetab  │  │  Isabel  │
│   SMS    │  │ Payment  │  │  VoIP    │
└──────────┘  └──────────┘  └──────────┘
```

---

## Infrastructure Requirements

### Server Specifications

#### **Server 1: Main Application Server**
```
CPU: 4+ cores (8 recommended)
RAM: 8GB minimum (16GB recommended)
Storage: 100GB SSD
OS: Ubuntu 22.04 LTS or CentOS 8
Network: 100 Mbps+ connection
```

#### **Server 2: AI Services Server (GPU-Enabled)**
```
CPU: 8+ cores
RAM: 16GB minimum (32GB recommended for large models)
GPU: NVIDIA GPU with 8GB+ VRAM (for Whisper large models)
Storage: 200GB SSD (for AI models)
OS: Ubuntu 22.04 LTS with CUDA drivers
Network: 1 Gbps connection to main server
```

#### **Server 3: Database Server**
```
CPU: 4+ cores
RAM: 16GB minimum (32GB recommended)
Storage: 500GB SSD (RAID 10 recommended)
OS: Ubuntu 22.04 LTS
Network: 1 Gbps connection
```

### Network Requirements

```
Firewall Rules:
- Port 80   (HTTP)    → Nginx
- Port 443  (HTTPS)   → Nginx  
- Port 5000 (App)     → Internal only
- Port 5432 (PostgreSQL) → Internal only
- Port 6379 (Redis)   → Internal only
- Port 3478 (TURN TCP/UDP) → Public
- Port 5349 (TURN TLS) → Public
- Port 49152-65535 (TURN media) → Public (UDP)
```

### Domain & SSL Requirements

```
Primary Domain: yourdomain.com
SSL Certificate: Let's Encrypt (free) or commercial
DNS Records:
  - A record: @ → Your Server IP
  - A record: www → Your Server IP
  - A record: api → Your Server IP (optional)
```

---

## Pre-Deployment Checklist

Before beginning deployment, ensure you have:

- [ ] 3 dedicated servers (App, AI, Database) with root access
- [ ] Domain name configured and pointing to your servers
- [ ] SSL certificates obtained (Let's Encrypt recommended)
- [ ] PostgreSQL 14+ installed on database server
- [ ] Redis 7+ installed on app server
- [ ] Node.js 18+ installed on app server
- [ ] Python 3.10+ installed on AI server
- [ ] NVIDIA GPU with CUDA drivers (for AI server)
- [ ] Kavenegar SMS account and API key
- [ ] Shetab payment gateway credentials
- [ ] Isabel VoIP account credentials (optional)
- [ ] GitHub access to Meta Lingua repository

---

## PostgreSQL Database Setup

### Installation (Ubuntu 22.04)

```bash
# Install PostgreSQL 14
sudo apt update
sudo apt install -y postgresql-14 postgresql-contrib-14

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Database Creation

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;

# Enable UUID extension
\c metalingua
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

# Exit
\q
```

### PostgreSQL Configuration

Edit `/etc/postgresql/14/main/postgresql.conf`:

```conf
# Performance Tuning
max_connections = 200
shared_buffers = 4GB
effective_cache_size = 12GB
maintenance_work_mem = 1GB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 20MB
min_wal_size = 1GB
max_wal_size = 4GB

# Logging
log_destination = 'stderr'
logging_collector = on
log_directory = '/var/log/postgresql'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
```

Edit `/etc/postgresql/14/main/pg_hba.conf`:

```conf
# Allow connections from app server
host    metalingua    metalingua_user    10.0.0.0/8    md5
host    metalingua    metalingua_user    172.16.0.0/12 md5
host    metalingua    metalingua_user    192.168.0.0/16 md5
```

Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

### Connection String Format

```
DATABASE_URL=postgresql://metalingua_user:your_secure_password_here@db-server-ip:5432/metalingua?sslmode=prefer
```

---

## Redis Setup

### Installation (Ubuntu 22.04)

```bash
# Install Redis
sudo apt update
sudo apt install -y redis-server

# Start and enable Redis
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Redis Configuration

Edit `/etc/redis/redis.conf`:

```conf
# Network
bind 127.0.0.1 ::1
protected-mode yes
port 6379

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes

# Security (if exposing to network)
requirepass your_redis_password_here

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

Restart Redis:

```bash
sudo systemctl restart redis-server
```

---

## Main Application Deployment

### Prerequisites Installation

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install build tools
sudo apt install -y build-essential git
```

### Clone Repository from GitHub

```bash
# Create application directory
sudo mkdir -p /var/www/metalingua
sudo chown $USER:$USER /var/www/metalingua
cd /var/www/metalingua

# Clone repository
git clone https://github.com/your-org/meta-lingua.git .

# Or if using SSH
git clone git@github.com:your-org/meta-lingua.git .
```

### Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install Python dependencies (for Edge TTS)
sudo apt install -y python3-pip python3-venv
pip3 install edge-tts
```

### Environment Configuration

Create `.env` file:

```bash
cp .env.production.template .env
nano .env
```

Fill in all required variables (see [Environment Variables Reference](#environment-variables-reference))

### Build Application

```bash
# Build frontend and backend
npm run build

# Verify build success
ls -la dist/
```

### Database Migrations

```bash
# Run Drizzle migrations
npm run db:push --force

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

### PM2 Process Management

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'metalingua',
    script: 'dist/index.js',
    instances: 'max',  // Use all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/metalingua/error.log',
    out_file: '/var/log/metalingua/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

Start application:

```bash
# Create log directory
sudo mkdir -p /var/log/metalingua
sudo chown $USER:$USER /var/log/metalingua

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup

# Monitor
pm2 monit
```

---

## AI Services Configuration

### Ollama AI Server Setup

**Server**: AI Services Server (GPU-enabled)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
sudo systemctl start ollama
sudo systemctl enable ollama

# Pull required model
ollama pull llama3.2:3b

# Verify
ollama list
```

Configure Ollama to listen on network:

Edit `/etc/systemd/system/ollama.service`:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```

Restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

Test from app server:

```bash
curl http://ai-server-ip:11434/api/tags
```

**Environment Variable:**
```
OLLAMA_HOST=http://ai-server-ip:11434
OLLAMA_MODEL=llama3.2:3b
```

### Whisper Speech-to-Text Setup

**Server**: AI Services Server (GPU-enabled)

```bash
# Install CUDA drivers (if not already installed)
wget https://developer.download.nvidia.com/compute/cuda/repos/ubuntu2204/x86_64/cuda-keyring_1.1-1_all.deb
sudo dpkg -i cuda-keyring_1.1-1_all.deb
sudo apt update
sudo apt install -y cuda

# Install Python environment
sudo apt install -y python3-pip python3-venv ffmpeg

# Create virtual environment
python3 -m venv /opt/whisper-env
source /opt/whisper-env/bin/activate

# Install Whisper
pip install openai-whisper torch torchvision torchaudio

# Install API server (FastAPI)
pip install fastapi uvicorn python-multipart

# Create Whisper API server
cat > /opt/whisper-server.py << 'EOF'
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
import whisper
import tempfile
import os

app = FastAPI()
model = whisper.load_model("base")  # Options: tiny, base, small, medium, large

@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        result = model.transcribe(tmp_path)
        return JSONResponse(content={"text": result["text"]})
    finally:
        os.unlink(tmp_path)

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Create systemd service
sudo cat > /etc/systemd/system/whisper.service << EOF
[Unit]
Description=Whisper API Server
After=network.target

[Service]
Type=simple
User=whisper
WorkingDirectory=/opt
ExecStart=/opt/whisper-env/bin/python /opt/whisper-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Create whisper user
sudo useradd -r -s /bin/false whisper
sudo chown -R whisper:whisper /opt/whisper-env /opt/whisper-server.py

# Start service
sudo systemctl daemon-reload
sudo systemctl start whisper
sudo systemctl enable whisper
```

Test from app server:

```bash
curl http://ai-server-ip:8000/health
```

**Environment Variables:**
```
WHISPER_API_URL=http://ai-server-ip:8000
WHISPER_ENABLED=true
```

**Note**: Whisper models will be cached in `~/.cache/whisper/` (~8GB for large model). This is normal and required for operation.

### Edge TTS Setup

**Server**: Main Application Server

Edge TTS is installed via pip and called as a command-line tool. Already included in application dependencies.

Verify installation:

```bash
edge-tts --list-voices | grep -E "fa-IR|en-US|ar-SA"
```

No separate server needed - TTS is integrated into the main application.

---

## WebRTC & TURN Server Setup

### CoTURN Installation

**Server**: Dedicated TURN server or Main App Server

```bash
# Install CoTURN
sudo apt update
sudo apt install -y coturn

# Enable CoTURN
sudo sed -i 's/#TURNSERVER_ENABLED=1/TURNSERVER_ENABLED=1/' /etc/default/coturn
```

### CoTURN Configuration

Edit `/etc/turnserver.conf`:

```conf
# Listener Configuration
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_PUBLIC_IP
external-ip=YOUR_SERVER_PUBLIC_IP

# Realm and Server Name
realm=metalingua.com
server-name=turn.metalingua.com

# Authentication
fingerprint
use-auth-secret
static-auth-secret=GENERATE_RANDOM_SECRET_HERE

# Security
no-multicast-peers
no-cli
stale-nonce=600

# Performance
total-quota=100
bps-capacity=0
user-quota=50
max-bps=0

# Logging
log-file=/var/log/turnserver.log
syslog

# SSL/TLS (if using)
cert=/etc/letsencrypt/live/turn.metalingua.com/fullchain.pem
pkey=/etc/letsencrypt/live/turn.metalingua.com/privkey.pem

# Relay Configuration
min-port=49152
max-port=65535
```

### Firewall Configuration

```bash
# UFW
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp
sudo ufw allow 49152:65535/udp

# Or iptables
sudo iptables -A INPUT -p tcp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 3478 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5349 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 5349 -j ACCEPT
sudo iptables -A INPUT -p udp --dport 49152:65535 -j ACCEPT
```

Start CoTURN:

```bash
sudo systemctl start coturn
sudo systemctl enable coturn
```

### Test TURN Server

```bash
# Install turnutils
sudo apt install -y turnutils-clients

# Test TURN
turnutils_uclient -v -u test -w test YOUR_SERVER_IP
```

**Environment Variables:**
```
TURN_SERVER_URL=turn:turn.metalingua.com:3478
TURN_USERNAME=metalingua
TURN_PASSWORD=GENERATE_RANDOM_SECRET_HERE
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

---

## Iranian Services Integration

### Kavenegar SMS Service

**Provider**: Kavenegar (https://kavenegar.com)

1. **Register Account**: Sign up at Kavenegar
2. **Get API Key**: Dashboard → API Keys → Generate
3. **Note Sender Number**: Your dedicated sender number

**Configuration:**

```bash
# .env
KAVENEGAR_API_KEY=your_api_key_here
KAVENEGAR_SENDER=your_sender_number
```

**Test Integration:**

```bash
curl -X POST http://localhost:5000/api/sms/test \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "09123456789",
    "message": "Test message from Meta Lingua"
  }'
```

**Rate Limits**: Check your plan (typically 100-1000 SMS/day)

### Shetab Payment Gateway

**Provider**: Your Iranian bank's Shetab gateway

1. **Contact Your Bank**: Request Shetab payment gateway activation
2. **Receive Credentials**:
   - Merchant ID
   - Terminal ID
   - Secret Key
   - Gateway URL
   - Callback URL (your domain)

**Configuration:**

```bash
# .env
SHETAB_MERCHANT_ID=your_merchant_id
SHETAB_TERMINAL_ID=your_terminal_id
SHETAB_SECRET_KEY=your_secret_key_min_32_chars
SHETAB_GATEWAY_URL=https://payment.your-bank.ir/api
SHETAB_CALLBACK_URL=https://yourdomain.com/api/payment/callback
```

**Test Integration:**

```bash
# Create test payment
curl -X POST http://localhost:5000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Test payment"
  }'
```

**Important**: Always test in sandbox mode first before going live.

### Isabel VoIP Service (Optional)

**Provider**: Isabel Telecom (Iranian VoIP provider)

1. **Contact Provider**: Request SIP trunk service
2. **Receive Credentials**:
   - SIP server address
   - SIP port (usually 5060)
   - Username
   - Password

**Configuration:**

```bash
# .env
ISABEL_VOIP_ENABLED=true
ISABEL_VOIP_SERVER=sip.isabel.ir
ISABEL_VOIP_PORT=5060
ISABEL_VOIP_USERNAME=your_username
ISABEL_VOIP_PASSWORD=your_password
ISABEL_VOIP_RECORDING_ENABLED=true
ISABEL_VOIP_RECORDING_PATH=/var/recordings
```

**Setup Asterisk Integration** (if needed):

```bash
# Install Asterisk
sudo apt install -y asterisk

# Configure SIP trunk in /etc/asterisk/sip.conf
[isabel-trunk]
type=friend
host=sip.isabel.ir
username=your_username
secret=your_password
context=incoming
```

---

## File Storage Configuration

### Create Storage Directories

```bash
# Create directories
sudo mkdir -p /var/www/metalingua/uploads/{tts,recordings,transcripts,avatars,media}
sudo mkdir -p /var/www/metalingua/logs
sudo mkdir -p /var/www/metalingua/backups

# Set ownership
sudo chown -R $USER:$USER /var/www/metalingua/uploads
sudo chown -R $USER:$USER /var/www/metalingua/logs
sudo chown -R $USER:$USER /var/www/metalingua/backups

# Set permissions
sudo chmod -R 755 /var/www/metalingua/uploads
sudo chmod -R 755 /var/www/metalingua/logs
sudo chmod -R 700 /var/www/metalingua/backups
```

### Storage Structure

```
/var/www/metalingua/
├── uploads/
│   ├── tts/              # Text-to-speech audio files
│   ├── recordings/       # Call recordings
│   ├── transcripts/      # Speech-to-text transcripts
│   ├── avatars/          # User avatars
│   └── media/            # General media uploads
├── logs/
│   ├── app.log           # Application logs
│   ├── error.log         # Error logs
│   └── access.log        # Access logs
└── backups/
    ├── daily/            # Daily backups
    └── weekly/           # Weekly backups
```

### Nginx Configuration for Static Files

```nginx
# Serve uploads
location /uploads/ {
    alias /var/www/metalingua/uploads/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

---

## Environment Variables Reference

> **⚠️ CRITICAL**: Always use `.env.production.template` as your authoritative reference for variable names. After populating your `.env` file, validate it before proceeding with deployment.

### Environment Validation

Before deploying, **ALWAYS** validate your environment configuration:

```bash
# Validate environment variables (catches naming errors and missing values)
npx tsx -e "import { validateEnvironment } from './server/config/env-validator.ts'; validateEnvironment();"
```

**What this checks:**
- JWT_SECRET is at least 32 characters
- DATABASE_URL is a valid PostgreSQL URL
- All service credentials use correct variable names
- SHETAB_SECRET_KEY is at least 32 characters (if configured)
- Isabel VoIP variables use `ISABEL_VOIP_*` prefix (not just `VOIP_*`)

**Common mistakes that validation catches:**
- ❌ Using `VOIP_SERVER` instead of `ISABEL_VOIP_SERVER`
- ❌ Using `SHETAB_API_KEY` instead of `SHETAB_SECRET_KEY`
- ❌ JWT_SECRET too short (< 32 chars)
- ❌ Invalid DATABASE_URL format

### Critical (Required)

```bash
# JWT Authentication
JWT_SECRET=<generate_32_char_random_string>

# Database
DATABASE_URL=postgresql://user:password@host:5432/metalingua

# Environment
NODE_ENV=production
PORT=5000
```

### AI Services (Recommended)

```bash
# Ollama
OLLAMA_HOST=http://ai-server-ip:11434
OLLAMA_MODEL=llama3.2:3b

# Whisper (Optional)
WHISPER_API_URL=http://ai-server-ip:8000
WHISPER_ENABLED=true
```

### Iranian Services

```bash
# Kavenegar SMS
KAVENEGAR_API_KEY=<your_api_key>
KAVENEGAR_SENDER=<your_sender_number>

# Shetab Payment
SHETAB_MERCHANT_ID=<merchant_id>
SHETAB_TERMINAL_ID=<terminal_id>
SHETAB_SECRET_KEY=<secret_key_min_32_chars>
SHETAB_GATEWAY_URL=<gateway_url>
SHETAB_CALLBACK_URL=https://yourdomain.com/api/payment/callback

# Isabel VoIP (Optional)
ISABEL_VOIP_ENABLED=true
ISABEL_VOIP_SERVER=<sip_server>
ISABEL_VOIP_PORT=5060
ISABEL_VOIP_USERNAME=<username>
ISABEL_VOIP_PASSWORD=<password>
```

### WebRTC

```bash
# TURN Server
TURN_SERVER_URL=turn:turn.metalingua.com:3478
TURN_USERNAME=<username>
TURN_PASSWORD=<password>
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

### Optional Configuration

```bash
# Server Instance
SERVER_INSTANCE_ID=server-01

# Logging
LOG_LEVEL=info

# Redis (if password-protected)
REDIS_URL=redis://:password@localhost:6379

# Session
SESSION_SECRET=<generate_random_string>
```

---

## Deployment Workflow

### Step-by-Step Production Deployment

```bash
# 1. Clone repository
cd /var/www/metalingua
git clone https://github.com/your-org/meta-lingua.git .

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.production.template .env
nano .env  # Fill in all variables

# 3a. Validate environment variables
# This step is CRITICAL - it catches configuration errors before deployment
npx tsx -e "import { validateEnvironment } from './server/config/env-validator.ts'; validateEnvironment();"

# 4. Build application
npm run build

# 5. Run database migrations
npm run db:push --force

# 6. Start application
pm2 start ecosystem.config.js

# 7. Save PM2 config
pm2 save

# 8. Setup PM2 startup
pm2 startup

# 9. Configure Nginx
sudo nano /etc/nginx/sites-available/metalingua

# 10. Enable site
sudo ln -s /etc/nginx/sites-available/metalingua /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 11. Setup SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Nginx Configuration

`/etc/nginx/sites-available/metalingua`:

```nginx
# Upstream to Node.js app
upstream metalingua {
    least_conn;
    server localhost:5000;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Logging
    access_log /var/log/nginx/metalingua-access.log;
    error_log /var/log/nginx/metalingua-error.log;

    # Client body size (for file uploads)
    client_max_body_size 100M;

    # Static files
    location /uploads/ {
        alias /var/www/metalingua/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Frontend static assets
    location /assets/ {
        alias /var/www/metalingua/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://metalingua;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Proxy to Node.js app
    location / {
        proxy_pass http://metalingua;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

### Updates and Maintenance

```bash
# Pull latest code
cd /var/www/metalingua
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Run migrations
npm run db:push

# Reload application (zero downtime)
pm2 reload all

# Or restart if needed
pm2 restart all
```

---

## Post-Deployment Verification

### System Health Checks

```bash
# 1. Check application status
pm2 status
pm2 logs --lines 50

# 2. Test database connection
psql $DATABASE_URL -c "SELECT version();"

# 3. Test Redis
redis-cli ping

# 4. Check disk space
df -h

# 5. Check memory
free -h

# 6. Check Nginx
sudo nginx -t
curl -I https://yourdomain.com
```

### Feature Testing Checklist

```bash
# Authentication
curl -X POST https://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"09123456789","password":"test123"}'

# SMS (Kavenegar)
curl -X POST https://yourdomain.com/api/sms/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"phone":"09123456789","message":"Test"}'

# Payment (Shetab)
curl -X POST https://yourdomain.com/api/payment/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"amount":10000,"description":"Test"}'

# AI (Ollama)
curl http://ai-server-ip:11434/api/generate \
  -d '{"model":"llama3.2:3b","prompt":"Hello","stream":false}'

# TTS
curl -X POST https://yourdomain.com/api/tts/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"text":"سلام","language":"fa"}'

# WebRTC connectivity
# Test video call feature from browser
```

### Verify Services

- [ ] Application responds on HTTPS
- [ ] Database queries work
- [ ] Redis caching works
- [ ] User authentication works
- [ ] SMS sending works (Kavenegar)
- [ ] Payment flow works (Shetab)
- [ ] Video calls work (WebRTC/TURN)
- [ ] AI features work (Ollama)
- [ ] TTS generation works
- [ ] File uploads work
- [ ] Static files serve correctly

---

## Monitoring & Logging

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Web dashboard
pm2 install pm2-server-monit
```

### Log Management

```bash
# View application logs
pm2 logs metalingua

# Nginx logs
tail -f /var/log/nginx/metalingua-access.log
tail -f /var/log/nginx/metalingua-error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# System logs
sudo journalctl -u metalingua -f
```

### Automated Monitoring

Install monitoring tools:

```bash
# Install Netdata (system monitoring)
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Access at http://your-server:19999
```

### Alerts Configuration

Create monitoring script `/opt/monitor-metalingua.sh`:

```bash
#!/bin/bash

# Check if app is running
if ! pm2 list | grep -q "metalingua.*online"; then
    echo "App is down!" | mail -s "Alert: MetaLingua Down" admin@yourdomain.com
    pm2 restart metalingua
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is ${DISK_USAGE}%" | mail -s "Alert: Disk Space Low" admin@yourdomain.com
fi

# Check database
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "PostgreSQL is down!" | mail -s "Alert: Database Down" admin@yourdomain.com
fi
```

Add to cron:

```bash
# Run every 5 minutes
*/5 * * * * /opt/monitor-metalingua.sh
```

---

## Backup & Disaster Recovery

### Database Backups

Create backup script `/opt/backup-db.sh`:

```bash
#!/bin/bash

BACKUP_DIR=/var/www/metalingua/backups/daily
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="metalingua_${DATE}.sql"

# Create backup directory
mkdir -p $BACKUP_DIR

# Dump database
pg_dump $DATABASE_URL > $BACKUP_DIR/$BACKUP_FILE

# Compress
gzip $BACKUP_DIR/$BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

Schedule backups:

```bash
# Daily at 2 AM
0 2 * * * /opt/backup-db.sh

# Weekly full backup
0 3 * * 0 /opt/backup-db-full.sh
```

### File Backups

```bash
#!/bin/bash

BACKUP_DIR=/var/www/metalingua/backups/files
DATE=$(date +%Y%m%d)

# Backup uploads
tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz /var/www/metalingua/uploads

# Remove old backups
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete
```

### Restore Procedures

```bash
# Restore database
gunzip < backup_file.sql.gz | psql $DATABASE_URL

# Restore files
tar -xzf uploads_backup.tar.gz -C /var/www/metalingua/
```

---

## Security Hardening

### Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow TURN
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 5349/tcp
sudo ufw allow 49152:65535/udp

# Enable firewall
sudo ufw enable
```

### SSL/TLS Configuration

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

### Application Security

```bash
# Set secure file permissions
chmod 600 .env
chmod 700 /var/www/metalingua/backups

# Disable directory listing
# Already configured in Nginx

# Enable security headers (in Nginx)
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### Database Security

```bash
# Use strong passwords
# Limit network access (pg_hba.conf)
# Regular updates
sudo apt update && sudo apt upgrade postgresql-14
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check PM2 logs
pm2 logs metalingua --lines 100

# Common issues:
# 1. Database connection
psql $DATABASE_URL -c "SELECT 1"

# 2. Port already in use
sudo lsof -i :5000

# 3. Environment variables
pm2 env metalingua

# 4. File permissions
ls -la /var/www/metalingua
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check PostgreSQL status
sudo systemctl status postgresql

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Verify pg_hba.conf allows your IP
```

### WebRTC/TURN Not Working

```bash
# Test TURN server
turnutils_uclient -v YOUR_SERVER_IP

# Check firewall
sudo ufw status
sudo iptables -L -n

# Check CoTURN logs
sudo journalctl -u coturn -f

# Verify ports open
sudo netstat -tulpn | grep -E "3478|5349"
```

### AI Services Not Responding

```bash
# Ollama
curl http://ai-server-ip:11434/api/tags
sudo systemctl status ollama

# Whisper
curl http://ai-server-ip:8000/health
sudo systemctl status whisper
```

### SMS/Payment Not Working

```bash
# Check Kavenegar
curl "https://api.kavenegar.com/v1/YOUR_API_KEY/utils/getdate.json"

# Check application logs
pm2 logs | grep -i kavenegar
pm2 logs | grep -i shetab
```

### Performance Issues

```bash
# Check CPU/Memory
htop

# Check database performance
pg_top

# Check slow queries
# In PostgreSQL:
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

# Check Nginx
sudo tail -f /var/log/nginx/metalingua-access.log

# PM2 monitoring
pm2 monit
```

---

## Support & Resources

### Documentation

- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Nginx: https://nginx.org/en/docs/
- PM2: https://pm2.keymetrics.io/docs/
- Ollama: https://ollama.ai/docs

### Iranian Services

- Kavenegar: https://kavenegar.com/docs
- Shetab: Contact your bank for API documentation
- Isabel VoIP: Contact provider for documentation

### Emergency Contacts

```
Database Issues: DBA team
Application Issues: Dev team
Infrastructure Issues: DevOps team
Payment Gateway Issues: Bank support
SMS Issues: Kavenegar support
```

---

## Deployment Checklist

Use this checklist before going live:

### Pre-Deployment
- [ ] All servers provisioned and accessible
- [ ] Domain configured and SSL certificates obtained
- [ ] PostgreSQL installed and configured
- [ ] Redis installed and configured
- [ ] Node.js 18+ installed
- [ ] All environment variables configured from `.env.production.template`
- [ ] Environment variables validated (run validation before proceeding)
- [ ] Kavenegar SMS account ready
- [ ] Shetab payment gateway credentials received
- [ ] Ollama server setup (optional but recommended)
- [ ] Whisper server setup (optional)
- [ ] TURN server configured

### Deployment
- [ ] Repository cloned from GitHub
- [ ] Dependencies installed (`npm install`)
- [ ] Application built (`npm run build`)
- [ ] Database migrations run (`npm run db:push`)
- [ ] PM2 configured and started
- [ ] Nginx configured and SSL enabled
- [ ] Firewall rules applied

### Post-Deployment
- [ ] Application accessible via HTTPS
- [ ] User authentication works
- [ ] SMS sending works
- [ ] Payment processing works
- [ ] Video calls work
- [ ] AI features work
- [ ] File uploads work
- [ ] Backups configured and tested
- [ ] Monitoring enabled
- [ ] SSL auto-renewal configured

### Production Readiness
- [ ] Load testing completed
- [ ] Security audit completed
- [ ] Backup/restore tested
- [ ] Disaster recovery plan documented
- [ ] Team trained on deployment procedures
- [ ] Monitoring alerts configured
- [ ] Support contacts documented

---

**End of Deployment Guide**

*For questions or issues, contact the Meta Lingua development team*

**Version**: 1.0.0  
**Last Updated**: November 2025
