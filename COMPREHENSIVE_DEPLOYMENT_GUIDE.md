# Meta Lingua Platform — Comprehensive Deployment Guide

> Last updated to reflect Docker-based self-hosted deployment for Iranian infrastructure.
> Authentication is phone-only OTP via Kavenegar — there are no email/password logins.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Requirements](#2-server-requirements)
3. [Pre-deployment Checklist](#3-pre-deployment-checklist)
4. [Domain & DNS Setup](#4-domain--dns-setup)
5. [Server Preparation](#5-server-preparation)
6. [Install Docker & Docker Compose](#6-install-docker--docker-compose)
7. [Get the Codebase](#7-get-the-codebase)
8. [Configure Environment Variables](#8-configure-environment-variables)
9. [Configure Nginx Reverse Proxy](#9-configure-nginx-reverse-proxy)
10. [SSL Certificate (Let's Encrypt)](#10-ssl-certificate-lets-encrypt)
11. [Deploy the Application](#11-deploy-the-application)
12. [Create the First Admin User](#12-create-the-first-admin-user)
13. [Install Ollama AI Server (Optional)](#13-install-ollama-ai-server-optional)
14. [Install TURN Server for Video Calls (Optional)](#14-install-turn-server-for-video-calls-optional)
15. [Verify All Services](#15-verify-all-services)
16. [Monitoring & Maintenance](#16-monitoring--maintenance)
17. [Backup Strategy](#17-backup-strategy)
18. [Troubleshooting](#18-troubleshooting)
19. [Upgrading the Platform](#19-upgrading-the-platform)

---

## 1. Architecture Overview

```
Internet
   │
   ▼
Nginx (port 80/443)  ──  SSL termination, WebSocket upgrade
   │
   ▼
App container (port 5000)  ──  Express.js + Vite-built frontend
   │                ├── PostgreSQL 14 container (port 5432)
   │                ├── Redis 7 container (port 6379)
   │                └── Ollama server (port 11434, separate machine recommended)
   │
   ▼
Iranian External Services:
  ├── Kavenegar SMS  — OTP login codes, enrollment notifications
  ├── Shetab gateway — Tuition payments, wallet top-ups
  └── Issabel PBX    — AMI on port 5038 for call center dialing
```

### What each service does

| Service | Purpose | Required? |
|---|---|---|
| PostgreSQL 14 | All application data | **Yes — mandatory** |
| Redis 7 | Content generation job queue | Yes (included in compose) |
| Kavenegar SMS | OTP codes for every login | **Yes — platform unusable without it** |
| Shetab gateway | Tuition payments, wallet top-ups | Yes for paid features |
| Ollama | AI content generation, placement tests | Recommended |
| Issabel PBX (AMI) | Call center auto-dialing, recording | Optional |
| TURN server | Cross-NAT WebRTC video calls | Required for internet video |

---

## 2. Server Requirements

### Minimum (up to ~50 concurrent users)
- **CPU**: 4 vCPU
- **RAM**: 8 GB
- **Disk**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS or Debian 12
- **Network**: Static IP, ports 80, 443, and 5432 (DB if remote access needed)

### Recommended (up to ~200 concurrent users)
- **CPU**: 8 vCPU
- **RAM**: 16 GB
- **Disk**: 200 GB SSD
- **OS**: Ubuntu 22.04 LTS

### With Ollama AI on the same machine
- Add 8 GB RAM per AI model loaded (e.g. llama3.2:3b needs ~4 GB, llama2:7b needs ~8 GB)
- Recommended: run Ollama on a dedicated server with a GPU for production

---

## 3. Pre-deployment Checklist

Before starting, make sure you have all of the following ready:

- [ ] Domain name pointed at your server IP (see section 4)
- [ ] Kavenegar account with API key and approved sender number
- [ ] Shetab merchant account with merchant ID, terminal ID, and secret key
- [ ] (Optional) Issabel PBX server with AMI credentials
- [ ] SSH access to your server as root or a user with sudo

---

## 4. Domain & DNS Setup

1. Purchase a domain (e.g. `metalingua.yourinstitute.ir`)
2. Add an **A record** pointing to your server's public IP:
   ```
   Type: A
   Name: @  (or metalingua)
   Value: YOUR_SERVER_IP
   TTL: 300
   ```
3. Verify it resolves before continuing:
   ```bash
   nslookup yourdomain.com
   ```

**Important:** The domain must resolve before you can get an SSL certificate in section 10.

---

## 5. Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required system tools
sudo apt install -y curl git ufw

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Create a deployment directory
sudo mkdir -p /opt/metalingua
sudo chown $USER:$USER /opt/metalingua
```

---

## 6. Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install -y docker-compose-plugin

# Log out and back in so the group change takes effect
# Then verify
docker --version
docker compose version
```

---

## 7. Get the Codebase

```bash
cd /opt/metalingua

# Option A: Clone from repository
git clone https://github.com/your-org/metalingua.git .

# Option B: Upload the ZIP from Replit and extract
# (Download the ZIP from Replit's Files panel → upload via scp)
# scp metalingua.zip user@yourserver:/opt/metalingua/
# unzip metalingua.zip
```

---

## 8. Configure Environment Variables

```bash
# Copy the example config
cp .env.example .env

# Edit with your values
nano .env
```

### Required variables — the platform will not start without these

```env
# ---- Your public domain (all three must be identical) ----
# These control payment callback URLs and post-payment redirects.
APP_URL=https://yourdomain.com
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# ---- Database ----
DATABASE_URL=postgresql://metalingua:STRONG_PASSWORD@postgres:5432/metalingua
DB_NAME=metalingua
DB_USER=metalingua
DB_PASSWORD=STRONG_PASSWORD

# ---- Redis (queue worker) ----
# Keep as-is when using Docker Compose — "redis" is the container hostname
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# ---- JWT secrets ----
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=generate_a_64_byte_hex_string_here
REFRESH_SECRET=generate_a_different_64_byte_hex_string_here

# ---- Iranian SMS — MANDATORY for OTP login ----
KAVENEGAR_API_KEY=your_kavenegar_api_key
```

### Payment gateway (required for tuition payments)

```env
SHETAB_MERCHANT_ID=your_merchant_id
SHETAB_TERMINAL_ID=your_terminal_id
SHETAB_API_KEY=your_shetab_api_key
SHETAB_GATEWAY_URL=https://sep.shaparak.ir/payment.aspx

# CRITICAL: Register this exact URL in your Shetab merchant portal
# The path /api/payments/shetab/callback is fixed — do not change it
SHETAB_CALLBACK_URL=https://yourdomain.com/api/payments/shetab/callback
```

### AI services (recommended)

```env
# Point this at your Ollama server (can be on the same machine or a separate server)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

### Issabel PBX / VoIP (optional — call center auto-dialing)

```env
# Enable only when your Issabel PBX is reachable from this server
ISABEL_VOIP_ENABLED=false

ISABEL_VOIP_SERVER=192.168.1.100        # IP of your Issabel server
ISABEL_VOIP_PORT=5038                    # AMI port — NOT the SIP port 5060
ISABEL_VOIP_USERNAME=your_ami_username   # Defined in /etc/asterisk/manager.conf
ISABEL_VOIP_PASSWORD=your_ami_secret
ISABEL_VOIP_RECORDING_ENABLED=true
ISABEL_VOIP_RECORDING_PATH=./recordings
```

### WebRTC / Video calls (required for internet video across NAT)

```env
TURN_SERVER_URL=turn:yourdomain.com:3478
TURN_SERVER_USERNAME=turnuser
TURN_SERVER_PASSWORD=turnpassword
STUN_SERVER_URL=stun:yourdomain.com:3478
```

---

## 9. Configure Nginx Reverse Proxy

```bash
sudo apt install -y nginx

# Copy the provided example config
sudo cp nginx-example.conf /etc/nginx/sites-available/metalingua

# Edit and replace 'yourdomain.com' with your actual domain
sudo nano /etc/nginx/sites-available/metalingua

# Enable the site
sudo ln -s /etc/nginx/sites-available/metalingua /etc/nginx/sites-enabled/metalingua
sudo rm -f /etc/nginx/sites-enabled/default

# Test the config (expect "syntax is ok")
sudo nginx -t

# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

The `nginx-example.conf` file in the repository already configures:
- HTTP → HTTPS redirect
- WebSocket upgrade headers (for Socket.io and video calls)
- 100 MB upload size limit (for video files)
- Gzip compression
- Security headers (X-Frame-Options, HSTS, etc.)

---

## 10. SSL Certificate (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate — replace with your actual domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify auto-renewal is set up
sudo systemctl status certbot.timer
```

Certbot will automatically update the Nginx config with the certificate paths.

---

## 11. Deploy the Application

```bash
cd /opt/metalingua

# Generate secrets if you haven't yet
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run twice — once for JWT_SECRET, once for REFRESH_SECRET

# Build and start all containers
docker compose up -d --build

# Run database migrations (creates all tables)
docker compose exec app npm run db:push

# Watch the startup logs to confirm everything connected
docker compose logs -f app
```

### Healthy startup looks like

```
✅ Environment validation passed
5:32:53 AM [express] 🚀 Server listening on port 5000 (development mode)
✅ Kavenegar API Key configured
✅ All main routes registered
✅ SMS Reminder Worker initialized
```

You should NOT see any red errors for mandatory services (database, Redis, Kavenegar).

### Check all containers are running

```bash
docker compose ps
```

All three services (`metalingua-db`, `metalingua-redis`, `metalingua-app`) should show **Up (healthy)**.

---

## 12. Create the First Admin User

> **Important:** Meta Lingua uses phone-only OTP authentication — there are no email/password logins.
> The first admin account must be created directly in the database.

```bash
# Connect to the database container
docker compose exec postgres psql -U metalingua -d metalingua

# Insert an admin user with a verified Iranian phone number
INSERT INTO users (
  phone, first_name, last_name, role, is_active,
  phone_verified, language_preference, created_at
) VALUES (
  '+989121234567',   -- Replace with the admin's real phone number (+98 format)
  'مدیر',
  'سیستم',
  'admin',
  true,
  true,
  'fa',
  NOW()
)
ON CONFLICT (phone) DO NOTHING;

\q
```

To log in, go to `https://yourdomain.com`, enter the phone number you inserted, and enter the OTP sent by Kavenegar to that number.

---

## 13. Install Ollama AI Server (Optional)

Ollama powers the AI placement test, lesson content generation, Lexi chatbot, and CallerN AI coaching.

### On the application server (simple setup)

```bash
# The installation script is included in the repository
bash install-ollama-iran.sh

# Or install manually
curl -fsSL https://ollama.ai/install.sh | sh

# Start the service
systemctl enable ollama
systemctl start ollama

# Pull the default model (3B parameters — needs ~2GB disk, ~4GB RAM)
ollama pull llama3.2:3b

# Verify it works
curl http://localhost:11434/api/tags
```

Then set `OLLAMA_HOST=http://localhost:11434` in your `.env` and restart:
```bash
docker compose restart app
```

### On a separate GPU server (recommended for production)

```bash
# On the AI server, start Ollama bound to all interfaces
OLLAMA_HOST=0.0.0.0 ollama serve

# On the application server, point to the AI server IP
OLLAMA_HOST=http://AI_SERVER_IP:11434
```

---

## 14. Install TURN Server for Video Calls (Optional)

CallerN (on-demand video tutoring) works without a TURN server on a local network. For internet-based calls across NAT (students at home), a TURN server is required.

```bash
# Install coturn
sudo apt install -y coturn

# Configure
sudo nano /etc/turnserver.conf
```

Minimum `turnserver.conf`:
```conf
listening-port=3478
tls-listening-port=5349
realm=yourdomain.com
server-name=yourdomain.com
lt-cred-mech
user=turnuser:STRONG_PASSWORD
fingerprint
cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/yourdomain.com/privkey.pem
log-file=/var/log/turnserver/turnserver.log
```

```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

Then update `.env`:
```env
TURN_SERVER_URL=turn:yourdomain.com:3478
TURN_SERVER_USERNAME=turnuser
TURN_SERVER_PASSWORD=STRONG_PASSWORD
```

Restart the app: `docker compose restart app`

---

## 15. Verify All Services

Run these checks from your server after deployment:

```bash
# 1. Application is responding
curl -s -o /dev/null -w "%{http_code}" https://yourdomain.com/
# Expect: 200

# 2. API health endpoint
curl https://yourdomain.com/api/health
# Expect: JSON with service status

# 3. Database inside the container
docker compose exec postgres pg_isready -U metalingua
# Expect: metalingua:5432 - accepting connections

# 4. Redis inside the container
docker compose exec redis redis-cli ping
# Expect: PONG

# 5. Ollama (if installed)
curl http://localhost:11434/api/tags
# Expect: JSON with list of installed models

# 6. Check application logs for errors
docker compose logs --tail=50 app | grep -E "❌|ERROR|Error"
# Expect: no output (no errors)
```

### End-to-end payment test

1. Register a student phone number via OTP
2. Browse to a paid course and click Enroll
3. Complete the Shetab payment flow
4. Confirm the student's enrollment status changes to "enrolled" in the admin panel

---

## 16. Monitoring & Maintenance

### View live logs

```bash
# All containers
docker compose logs -f

# App only
docker compose logs -f app

# Last 100 lines of app logs
docker compose logs --tail=100 app
```

### Container resource usage

```bash
docker stats
```

### Restart a single service

```bash
docker compose restart app
docker compose restart postgres
docker compose restart redis
```

### Stop everything safely

```bash
docker compose down
# Data volumes (postgres_data, redis_data) are preserved
```

### Rebuild after a code update

```bash
git pull origin main           # or upload new zip
docker compose up -d --build   # rebuild app image only
docker compose exec app npm run db:push   # apply any schema changes
```

---

## 17. Backup Strategy

### Automated daily database backup

```bash
# Create backup script
cat > /opt/metalingua/scripts/backup-daily.sh << 'EOF'
#!/bin/bash
set -e
BACKUP_DIR="/opt/metalingua/backup"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p "$BACKUP_DIR"

# Database dump
docker compose -f /opt/metalingua/docker-compose.yml exec -T postgres \
  pg_dump -U metalingua metalingua > "$BACKUP_DIR/db_$DATE.sql"

# Uploaded files
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C /opt/metalingua uploads/

# Remove backups older than 30 days
find "$BACKUP_DIR" -name "*.sql" -mtime +30 -delete
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/metalingua/scripts/backup-daily.sh

# Schedule via cron — runs at 2:00 AM Tehran time
crontab -e
# Add: 0 2 * * * /opt/metalingua/scripts/backup-daily.sh >> /var/log/metalingua-backup.log 2>&1
```

### Restore from backup

```bash
# Stop the app (keep database running)
docker compose stop app

# Restore database
docker compose exec -T postgres psql -U metalingua -d metalingua < backup/db_20260101_020000.sql

# Restore files
tar -xzf backup/uploads_20260101_020000.tar.gz -C /opt/metalingua/

# Restart
docker compose start app
```

---

## 18. Troubleshooting

### Platform is not loading

```bash
# Check all containers are up and healthy
docker compose ps

# Check for crash loops (app may be restarting due to config error)
docker compose logs --tail=30 app

# Common cause: missing required env var
# Look for lines starting with ❌ in the logs
```

### OTP codes not arriving (login broken)

```bash
# Verify Kavenegar key is set correctly
docker compose exec app printenv KAVENEGAR_API_KEY

# Test the API directly
curl "https://api.kavenegar.com/v1/YOUR_API_KEY/account/info.json"
# Should return account balance and status

# Check phone number format — must be +98XXXXXXXXXX
# The platform normalizes 09XX → +98XX automatically
```

### Payment callback not completing enrollments

```bash
# Confirm the callback URL registered in Shetab portal exactly matches:
# https://yourdomain.com/api/payments/shetab/callback
# (plural "payments", with "/shetab/" in the path)

# Check logs for callback hits
docker compose logs app | grep -i "shetab\|callback\|payment"
```

### Video calls not connecting (CallerN)

```bash
# For local network calls (same institute): no TURN needed, check firewall
# For internet calls: TURN server required

# Check coturn is running
systemctl status coturn

# Test TURN connectivity (replace with your domain)
# Use https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/
# Add TURN server: turn:yourdomain.com:3478 with your credentials
```

### Isabel VoIP calls not dialing

```bash
# Verify AMI port — must be 5038, NOT 5060
docker compose exec app printenv ISABEL_VOIP_PORT
# Expected: 5038

# Test AMI connectivity from the server
telnet YOUR_ISSABEL_IP 5038
# Should open — type "Action: Ping" and hit Enter twice
# Expected: Response: Pong

# Check VoIP diagnostic in the admin panel:
# Admin → Infrastructure → VoIP Status
```

### Redis queue not processing

```bash
# Verify Redis is reachable from the app container
docker compose exec app sh -c "nc -z redis 6379 && echo OK"
# Expected: OK

# Check REDIS_HOST is set to "redis" (not localhost) in the app container
docker compose exec app printenv REDIS_HOST
# Expected: redis
```

### Database connection failed

```bash
# Check DATABASE_URL is set correctly
docker compose exec app printenv DATABASE_URL

# Test connection
docker compose exec postgres pg_isready -U metalingua
# Expected: accepting connections

# If DATABASE_URL points to Neon (neon.tech), make sure that IP is allowed
# in Neon's connection settings
```

---

## 19. Upgrading the Platform

```bash
cd /opt/metalingua

# 1. Pull latest code
git pull origin main

# 2. Back up the database before upgrading
./scripts/backup-daily.sh

# 3. Rebuild containers with the new code
docker compose up -d --build

# 4. Apply any new database schema changes
docker compose exec app npm run db:push

# 5. Verify the app started cleanly
docker compose logs --tail=50 app | grep -E "✅|❌|listening"
```

---

## Quick Reference — Useful Commands

| Task | Command |
|---|---|
| Start all services | `docker compose up -d` |
| Stop all services | `docker compose down` |
| Rebuild & restart app | `docker compose up -d --build app` |
| Apply DB schema changes | `docker compose exec app npm run db:push` |
| View live app logs | `docker compose logs -f app` |
| Connect to database | `docker compose exec postgres psql -U metalingua -d metalingua` |
| Check container health | `docker compose ps` |
| Backup database | `docker compose exec -T postgres pg_dump -U metalingua metalingua > backup.sql` |
| Restart nginx | `sudo systemctl restart nginx` |
| Renew SSL cert | `sudo certbot renew` |

---

## Security Hardening Checklist

- [ ] `DB_PASSWORD` is a strong random password (not "changeme")
- [ ] `JWT_SECRET` and `REFRESH_SECRET` are 64+ byte random hex strings (generated, not typed)
- [ ] `ISABEL_VOIP_ENABLED=false` unless VoIP is actually configured and tested
- [ ] Firewall blocks all ports except 22 (SSH), 80, and 443
- [ ] PostgreSQL port 5432 is NOT exposed to the internet (only within docker network)
- [ ] Redis port 6379 is NOT exposed to the internet
- [ ] SSL/TLS certificate is installed (Let's Encrypt)
- [ ] Nginx has `HSTS` header enabled (already in nginx-example.conf)
- [ ] `CORS_ORIGINS` is set to your domain only, not `*`
- [ ] Regular backups are scheduled and tested
- [ ] Kavenegar account has spending limits configured to prevent abuse
