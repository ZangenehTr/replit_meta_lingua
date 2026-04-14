# MetaLingo — Self-Hosted Deployment Guide

> **Target environment:** Ubuntu 22.04 LTS on an Iranian server (no external cloud dependencies).

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Server Preparation](#2-server-preparation)
3. [Install Docker & Docker Compose](#3-install-docker--docker-compose)
4. [Clone / Upload the Project](#4-clone--upload-the-project)
5. [Configure Environment Variables](#5-configure-environment-variables)
6. [Start the Stack](#6-start-the-stack)
7. [First-Boot Checklist](#7-first-boot-checklist)
8. [Nginx Reverse Proxy & SSL](#8-nginx-reverse-proxy--ssl)
9. [Install Ollama (Local AI)](#9-install-ollama-local-ai)
10. [WebRTC / TURN Server (coturn)](#10-webrtc--turn-server-coturn)
11. [Issabel VoIP (AMI)](#11-issabel-voip-ami)
12. [Backups](#12-backups)
13. [Updating the Application](#13-updating-the-application)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

| Requirement | Minimum | Recommended |
|---|---|---|
| CPU | 2 cores | 4+ cores |
| RAM | 4 GB | 8+ GB (16 GB with Ollama) |
| Disk | 40 GB SSD | 100 GB SSD |
| OS | Ubuntu 22.04 | Ubuntu 22.04 |
| Open ports | 80, 443, 5432*, 6379*, 3478 | same |

> \* Ports 5432 and 6379 should **not** be exposed to the internet — they are internal Docker services.

---

## 2. Server Preparation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git wget unzip ufw net-tools

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3478/tcp     # TURN (WebRTC)
sudo ufw allow 3478/udp     # TURN (WebRTC)
sudo ufw --force enable

# Set timezone to Tehran
sudo timedatectl set-timezone Asia/Tehran
```

---

## 3. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sudo bash

# Add your user to the docker group (avoid sudo every time)
sudo usermod -aG docker $USER
newgrp docker

# Verify
docker --version
docker compose version
```

---

## 4. Clone / Upload the Project

**Option A — Git (if you have a private repo):**
```bash
git clone https://your-repo-url.git /opt/metalingo
cd /opt/metalingo
```

**Option B — Upload via SCP (from your local machine):**
```bash
# On your local machine — zip and upload
zip -r metalingo.zip . -x "node_modules/*" -x ".git/*"
scp metalingo.zip user@YOUR_SERVER_IP:/opt/

# On the server — extract
sudo mkdir -p /opt/metalingo
cd /opt/metalingo
sudo unzip /opt/metalingo.zip
sudo chown -R $USER:$USER /opt/metalingo
```

---

## 5. Configure Environment Variables

```bash
cd /opt/metalingo

# Copy the example file
cp .env.example .env

# Open and edit
nano .env
```

**Fill in every value. Key settings are marked below:**

```dotenv
# ── REQUIRED ──────────────────────────────────────────────────
NODE_ENV=production
PORT=5000

# All three MUST be your public domain (with https)
APP_URL=https://yourdomain.ir
BASE_URL=https://yourdomain.ir
FRONTEND_URL=https://yourdomain.ir

# Database password — change this
DB_PASSWORD=choose_a_strong_password_here
DB_NAME=metalingo
DB_USER=metalingo

# Redis (leave blank if no password needed on local Redis)
REDIS_PASSWORD=

# JWT secrets — generate these:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=GENERATE_AND_PASTE_HERE
REFRESH_SECRET=GENERATE_AND_PASTE_HERE

# ── IRANIAN SERVICES ──────────────────────────────────────────
KAVENEGAR_API_KEY=your_kavenegar_api_key

SHETAB_MERCHANT_ID=your_merchant_id
SHETAB_TERMINAL_ID=your_terminal_id
SHETAB_API_KEY=your_shetab_api_key
SHETAB_CALLBACK_URL=https://yourdomain.ir/api/payments/shetab/callback

# ── AI (leave as-is for local Ollama) ─────────────────────────
OLLAMA_HOST=http://host.docker.internal:11434
OLLAMA_MODEL=llama3.2:3b

# Optional: ArvanCloud (Qwen / Xerxes-1) — Iranian hosted AI
# ARVANCLOUD_API_KEY=your_arvancloud_key
# ARVANCLOUD_BASE_URL=https://api.arvancloud.ir/aiapi/v1
# ARVANCLOUD_MODEL=Qwen3-30B-A3B

# ── VOIP (skip if not using Issabel) ──────────────────────────
ISABEL_VOIP_ENABLED=false
ISABEL_VOIP_SERVER=192.168.1.x
ISABEL_VOIP_PORT=5038
ISABEL_VOIP_USERNAME=ami_user
ISABEL_VOIP_PASSWORD=ami_secret

# ── WebRTC TURN ───────────────────────────────────────────────
TURN_SERVER_URL=turn:yourdomain.ir:3478
TURN_SERVER_USERNAME=turnuser
TURN_SERVER_PASSWORD=choose_turn_password
STUN_SERVER_URL=stun:yourdomain.ir:3478
```

> **Security tip:** After editing, set strict permissions:
> ```bash
> chmod 600 /opt/metalingo/.env
> ```

---

## 6. Start the Stack

```bash
cd /opt/metalingo

# Build and start all services (PostgreSQL + Redis + App)
docker compose up -d --build

# Watch logs during first start (Ctrl+C to stop watching)
docker compose logs -f app
```

The first boot automatically:
- Runs all database migrations
- Seeds required data (admin settings, legal CMS pages, curriculum categories)

Wait for the log line:
```
Server running on port 5000
```

---

## 7. First-Boot Checklist

```bash
# Check all containers are running
docker compose ps

# Confirm the app responds
curl -s http://localhost:5000/health
# Expected: {"status":"ok"}

# Check the database connected
docker compose exec app node -e "
  const { Pool } = require('pg');
  const p = new Pool({ connectionString: process.env.DATABASE_URL });
  p.query('SELECT NOW()').then(r => { console.log('DB OK:', r.rows[0].now); process.exit(0); });
"
```

**Create the first admin account:**
```bash
# The app seeds a default admin on first boot.
# Login via the web UI at: https://yourdomain.ir/auth
# Default admin phone: +989101234567
# OTP code will be sent via Kavenegar (or check server logs in dev mode)
```

> Change the default admin phone and credentials immediately after first login via **Admin → Users**.

---

## 8. Nginx Reverse Proxy & SSL

### Install Nginx
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Create site config
```bash
sudo nano /etc/nginx/sites-available/metalingo
```

Paste the following (replace `yourdomain.ir`):
```nginx
server {
    listen 80;
    server_name yourdomain.ir www.yourdomain.ir;

    # Redirect HTTP → HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.ir www.yourdomain.ir;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.ir/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.ir/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;

    client_max_body_size 50M;

    location / {
        proxy_pass         http://127.0.0.1:5000;
        proxy_http_version 1.1;

        # WebSocket support (for CallerN video / real-time features)
        proxy_set_header Upgrade    $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_read_timeout  300s;
        proxy_send_timeout  300s;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/metalingo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Obtain SSL certificate (requires domain to point to your server IP first)
sudo certbot --nginx -d yourdomain.ir -d www.yourdomain.ir

# Auto-renewal is set up automatically by certbot
```

---

## 9. Install Ollama (Local AI)

Ollama runs **on the host** (outside Docker) so it can use the GPU.

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Pull the default model
ollama pull llama3.2:3b

# (Optional) Pull a larger model for better quality
ollama pull llama3.1:8b

# Verify it works
ollama run llama3.2:3b "Hello"

# Ollama listens on port 11434 by default
# The docker-compose.yml already maps host.docker.internal:11434 → Ollama
```

> **ArvanCloud alternative:** If Ollama is too slow on your server, use ArvanCloud's Qwen3-30B-A3B model (Iranian-hosted). Just set `ARVANCLOUD_API_KEY` in your `.env` and uncomment the ArvanCloud lines.

---

## 10. WebRTC / TURN Server (coturn)

Required for CallerN video tutoring when students/teachers are behind NAT.

```bash
# Install coturn
sudo apt install -y coturn

# Edit config
sudo nano /etc/turnserver.conf
```

Paste:
```
listening-port=3478
tls-listening-port=5349
fingerprint
use-auth-secret
static-auth-secret=choose_turn_password   # must match TURN_SERVER_PASSWORD in .env
realm=yourdomain.ir
server-name=yourdomain.ir
log-file=/var/log/turnserver.log
no-multicast-peers
no-cli
```

```bash
# Enable and start
sudo systemctl enable coturn
sudo systemctl start coturn

# Verify
sudo systemctl status coturn
```

---

## 11. Issabel VoIP (AMI)

Only needed if you use the call-center / auto-dial features.

1. Install Issabel PBX on a separate server (or VM) — see [issabel.org](https://issabel.org)
2. In Issabel: **Admin → Asterisk Manager Interface** → create a user with `read=all,write=all`
3. In your `.env`:
   ```dotenv
   ISABEL_VOIP_ENABLED=true
   ISABEL_VOIP_SERVER=192.168.1.x      # Issabel server IP
   ISABEL_VOIP_PORT=5038
   ISABEL_VOIP_USERNAME=your_ami_user
   ISABEL_VOIP_PASSWORD=your_ami_secret
   ```
4. Restart the app: `docker compose restart app`
5. Test connectivity: **Admin → VoIP Diagnostics** in the admin panel

---

## 12. Backups

### Automated daily database backup

```bash
sudo nano /opt/metalingo/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR=/opt/metalingo/backups
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker compose -f /opt/metalingo/docker-compose.yml exec -T postgres \
  pg_dump -U metalingo metalingo | gzip > $BACKUP_DIR/metalingo_$DATE.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup done: $BACKUP_DIR/metalingo_$DATE.sql.gz"
```

```bash
chmod +x /opt/metalingo/backup.sh

# Schedule daily at 2am
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/metalingo/backup.sh >> /var/log/metalingo-backup.log 2>&1") | crontab -
```

### Restore from backup

```bash
gunzip < /opt/metalingo/backups/metalingo_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose exec -T postgres psql -U metalingo metalingo
```

---

## 13. Updating the Application

```bash
cd /opt/metalingo

# Pull latest code (if using git)
git pull

# Rebuild and restart with zero downtime
docker compose up -d --build app

# Watch logs
docker compose logs -f app
```

Database migrations run automatically on every boot — no manual steps needed.

---

## 14. Troubleshooting

### App won't start

```bash
docker compose logs app --tail=50
```

### Database connection refused

```bash
# Check postgres is healthy
docker compose ps
docker compose logs postgres --tail=20
```

### App returns 502 Bad Gateway

```bash
# Check the app is listening
curl -s http://localhost:5000/health
# If no response, the app is down — check logs
docker compose logs app
```

### Reset everything (nuclear option)

```bash
docker compose down -v        # destroys all data volumes
docker compose up -d --build  # fresh start
```

### Check Redis queue

```bash
docker compose exec redis redis-cli ping
# Expected: PONG
```

### Rebuild just the app container (without touching DB)

```bash
docker compose up -d --build --no-deps app
```

### View live application logs

```bash
docker compose logs -f app
```

---

## Quick Reference

| Service | Internal URL | External |
|---|---|---|
| App | `http://localhost:5000` | `https://yourdomain.ir` |
| PostgreSQL | `postgres:5432` (internal only) | not exposed |
| Redis | `redis:6379` (internal only) | not exposed |
| Ollama | `http://host.docker.internal:11434` | not exposed |
| TURN | — | `turn:yourdomain.ir:3478` |

| Admin panel path | Purpose |
|---|---|
| `/auth` | Login |
| `/admin` | Main admin dashboard |
| `/admin/users` | User management |
| `/admin/payment-gateway-config` | Payment gateway setup |
| `/admin/voip` | VoIP diagnostics |
| `/admin/ai-hub` | AI service configuration |
| `/admin/callern` | CallerN video tutoring management |
