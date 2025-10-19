# MetaLingua Platform - Complete Deployment Guide
**Date:** October 19, 2025  
**Version:** 1.0.0 - Production Ready  
**Status:** All 7 Critical Production Issues Resolved ✅

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Development)](#quick-start-development)
4. [Production Deployment](#production-deployment)
5. [Iranian Self-Hosting Setup](#iranian-self-hosting-setup)
6. [Environment Configuration](#environment-configuration)
7. [Database Setup](#database-setup)
8. [External Services Integration](#external-services-integration)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)
11. [Test Credentials](#test-credentials)

---

## Overview

MetaLingua is a comprehensive AI-enhanced multilingual language learning and institute management platform designed for **self-hosting in Iran with zero external dependencies**. This guide covers complete deployment from development to production.

### Key Features
- 🎓 **LinguaQuest** - Free gamified learning platform (19 activity types)
- 📹 **CallerN** - 24/7 AI-powered video tutoring (WebRTC)
- 💰 **Wallet System** - IRR-based payments with Shetab integration
- 🤖 **AI Integration** - Ollama-powered adaptive learning
- 📊 **Unified Dashboard** - 8 user roles (Admin, Teacher, Student, etc.)
- 🌍 **Multi-language** - Persian, English, Arabic with RTL/LTR support

### Production Readiness Status ✅
- ✅ **Issue #1**: JWT validation with refresh tokens
- ✅ **Issue #2**: Shetab payment idempotency
- ✅ **Issue #3**: Wallet atomic operations
- ✅ **Issue #4**: CallerN memory leak prevention
- ✅ **Issue #5**: WebSocket state synchronization
- ✅ **Issue #6**: Self-hosted telemetry & logging
- ✅ **Issue #7**: Disk space monitoring

---

## Prerequisites

### System Requirements

#### Development Environment
- **Node.js:** 18.x or higher
- **PostgreSQL:** 14.x or higher
- **RAM:** Minimum 4GB
- **Disk Space:** Minimum 10GB free

#### Production Environment (Iranian Self-Hosting)
- **Server OS:** Ubuntu 20.04 LTS or higher / CentOS 8+
- **Node.js:** 18.x or higher
- **PostgreSQL:** 14.x or higher
- **Nginx:** 1.18+ (reverse proxy)
- **RAM:** Minimum 8GB (16GB recommended)
- **Disk Space:** Minimum 50GB free
- **CPU:** 4 cores minimum (8 cores recommended)
- **Docker:** 20.10+ (optional, for containerized deployment)

### Required Iranian Services
1. **Shetab Payment Gateway** - Iranian banking network
2. **Kavenegar SMS** - Iranian SMS provider
3. **Isabel VoIP Line** - Iranian telecom provider
4. **Ollama Server** - Local AI processing (self-hosted)

---

## Quick Start (Development)

### 1. Clone or Download Project
```bash
# If using Replit, download as ZIP
# Extract to your local machine
cd metalingua-platform
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
Create a `.env` file in the project root:

```bash
# Database (Development - Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/database"

# JWT Secrets
JWT_SECRET="meta-lingua-secret-2025-change-in-production"
JWT_REFRESH_SECRET="meta-lingua-refresh-secret-2025-change-in-production"

# Application
NODE_ENV="development"
PORT="5000"

# OpenAI (Development only - will use Ollama in production)
OPENAI_API_KEY="sk-your-openai-key-here"

# Optional: Metered API for WebRTC
VITE_METERED_API_KEY="your-metered-api-key"
```

### 4. Initialize Database
```bash
# Push schema to database (creates all tables)
npm run db:push

# If you get data-loss warnings, force push (safe for fresh install)
npm run db:push --force
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at: `http://localhost:5000`

### 6. Access the Platform
Use the [test credentials](#test-credentials) to log in and explore different user roles.

---

## Production Deployment

### Option 1: Replit Deploy (Recommended for Quick Deployment)

1. **Ensure all tests pass**:
```bash
npm run test
```

2. **Set production environment variables** in Replit Secrets:
   - `DATABASE_URL` (production PostgreSQL)
   - `JWT_SECRET` (strong random secret)
   - `JWT_REFRESH_SECRET` (strong random secret)
   - All other required secrets (see [Environment Configuration](#environment-configuration))

3. **Deploy via Replit UI**:
   - Click the "Deploy" button
   - Configure custom domain (optional)
   - Enable auto-scaling if needed

4. **Post-deployment**:
   - Run database migrations: `npm run db:push`
   - Verify all monitoring endpoints are active
   - Test login and core features

### Option 2: Docker Deployment (Recommended for Iranian Self-Hosting)

#### Step 1: Download Project
```bash
# Download from Replit as ZIP or clone repository
wget https://your-replit-url/download.zip
unzip download.zip
cd metalingua-platform
```

#### Step 2: Create Dockerfile
The project includes a production-ready Dockerfile. Build the image:

```bash
docker build -t metalingua:latest .
```

#### Step 3: Create docker-compose.yml
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: metalingua
      POSTGRES_USER: metalingua_user
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  app:
    image: metalingua:latest
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://metalingua_user:your-secure-password@postgres:5432/metalingua
      JWT_SECRET: your-jwt-secret-change-this
      JWT_REFRESH_SECRET: your-refresh-secret-change-this
      NODE_ENV: production
      PORT: 5000
      OLLAMA_BASE_URL: http://ollama:11434
      SHETAB_MERCHANT_ID: your-shetab-merchant-id
      SHETAB_API_KEY: your-shetab-api-key
      KAVENEGAR_API_KEY: your-kavenegar-api-key
      ISABEL_VOIP_NUMBER: your-isabel-number
      ISABEL_VOIP_API_KEY: your-isabel-api-key
    ports:
      - "5000:5000"
    volumes:
      - app_uploads:/app/uploads
      - app_recordings:/app/recordings
      - app_logs:/app/logs
    restart: unless-stopped

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    depends_on:
      - app
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    restart: unless-stopped

volumes:
  postgres_data:
  app_uploads:
  app_recordings:
  app_logs:
  ollama_data:
```

#### Step 4: Create Nginx Configuration
Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream metalingua {
        server app:5000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

    server {
        listen 80;
        server_name your-domain.com;

        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration (obtain certificates from Iranian CA)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Security Headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # WebSocket Support
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

        # API Endpoints
        location /api/ {
            limit_req zone=api_limit burst=20 nodelay;
            proxy_pass http://metalingua;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Login Endpoint (stricter rate limiting)
        location /api/auth/login {
            limit_req zone=login_limit burst=3 nodelay;
            proxy_pass http://metalingua;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static Files
        location / {
            proxy_pass http://metalingua;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # File Upload Limits
        client_max_body_size 100M;
    }
}
```

#### Step 5: Deploy
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Run database migrations
docker-compose exec app npm run db:push

# Pull Ollama models
docker-compose exec ollama ollama pull llama2
docker-compose exec ollama ollama pull mistral
```

### Option 3: Manual Server Deployment (Traditional)

#### Step 1: Prepare Server
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
sudo npm install -g pm2
```

#### Step 2: Set Up PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;
\q
```

#### Step 3: Deploy Application
```bash
# Create app directory
sudo mkdir -p /var/www/metalingua
sudo chown $USER:$USER /var/www/metalingua

# Copy application files
cd /var/www/metalingua
# Upload your project files here

# Install dependencies
npm ci --production

# Set up environment variables
nano .env
# Add all required environment variables (see Environment Configuration)

# Build frontend
npm run build

# Run database migrations
npm run db:push
```

#### Step 4: Configure PM2
```bash
# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'metalingua',
    script: './server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G'
  }]
};
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup systemd
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
```

#### Step 5: Configure Nginx
```bash
# Create Nginx site configuration
sudo nano /etc/nginx/sites-available/metalingua

# Use the Nginx configuration from Step 4 above

# Enable site
sudo ln -s /etc/nginx/sites-available/metalingua /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Iranian Self-Hosting Setup

### 1. Ollama Installation (Local AI)

#### On Ubuntu/Debian:
```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Start Ollama service
sudo systemctl enable ollama
sudo systemctl start ollama

# Pull required models
ollama pull llama2
ollama pull mistral
ollama pull codellama

# Test Ollama
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Test"
}'
```

#### Configure MetaLingua to use Ollama:
Add to `.env`:
```bash
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"
```

### 2. Shetab Payment Gateway

#### Registration:
1. Contact your bank's merchant services
2. Request Shetab payment gateway account
3. Obtain merchant ID and API credentials

#### Configuration:
Add to `.env`:
```bash
SHETAB_MERCHANT_ID="your-merchant-id"
SHETAB_API_KEY="your-api-key"
SHETAB_TERMINAL_ID="your-terminal-id"
SHETAB_CALLBACK_URL="https://your-domain.com/api/payments/shetab/callback"
```

#### Test Mode:
```bash
SHETAB_TEST_MODE="true"
SHETAB_TEST_MERCHANT_ID="test-merchant"
```

### 3. Kavenegar SMS Service

#### Setup:
1. Register at kavenegar.com
2. Verify your Iranian phone number
3. Purchase SMS credits
4. Get API key from dashboard

#### Configuration:
Add to `.env`:
```bash
KAVENEGAR_API_KEY="your-kavenegar-api-key"
KAVENEGAR_SENDER="your-sender-number"
```

#### Test SMS:
```bash
curl -X POST "https://api.kavenegar.com/v1/{API-KEY}/sms/send.json" \
  -d "sender=your-sender&receptor=09123456789&message=Test"
```

### 4. Isabel VoIP Integration

#### Setup:
1. Contact Isabel telecom for VoIP line
2. Obtain VoIP number and SIP credentials
3. Configure SIP trunk

#### Configuration:
Add to `.env`:
```bash
ISABEL_VOIP_NUMBER="your-voip-number"
ISABEL_VOIP_API_KEY="your-api-key"
ISABEL_VOIP_SIP_SERVER="sip.isabel.ir"
ISABEL_VOIP_SIP_USER="your-sip-user"
ISABEL_VOIP_SIP_PASSWORD="your-sip-password"
```

### 5. Self-Hosted TURN/STUN Server (WebRTC)

For CallerN video calls, set up your own TURN/STUN server:

#### Install Coturn:
```bash
sudo apt install -y coturn

# Edit configuration
sudo nano /etc/turnserver.conf
```

Add:
```conf
listening-port=3478
fingerprint
lt-cred-mech
realm=your-domain.com
server-name=your-domain.com
user=username:password
```

#### Start Coturn:
```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

#### Configure MetaLingua:
Add to `.env`:
```bash
TURN_SERVER_URL="turn:your-domain.com:3478"
TURN_SERVER_USERNAME="username"
TURN_SERVER_PASSWORD="password"
STUN_SERVER_URL="stun:your-domain.com:3478"
```

---

## Environment Configuration

### Complete .env Template (Production)

```bash
# ============================================
# MetaLingua Production Environment Variables
# Date: October 19, 2025
# ============================================

# Database
DATABASE_URL="postgresql://metalingua_user:your-secure-password@localhost:5432/metalingua"

# JWT Authentication
JWT_SECRET="generate-strong-random-secret-256-bits"
JWT_REFRESH_SECRET="generate-another-strong-random-secret-256-bits"

# Application
NODE_ENV="production"
PORT="5000"
APP_URL="https://your-domain.com"

# AI Services (Ollama - Self-Hosted)
OLLAMA_BASE_URL="http://localhost:11434"
OLLAMA_MODEL="llama2"
OLLAMA_TIMEOUT="30000"

# Shetab Payment Gateway (Iranian)
SHETAB_MERCHANT_ID="your-merchant-id"
SHETAB_API_KEY="your-api-key"
SHETAB_TERMINAL_ID="your-terminal-id"
SHETAB_CALLBACK_URL="https://your-domain.com/api/payments/shetab/callback"
SHETAB_TEST_MODE="false"

# Kavenegar SMS (Iranian)
KAVENEGAR_API_KEY="your-kavenegar-api-key"
KAVENEGAR_SENDER="your-sender-number"

# Isabel VoIP (Iranian)
ISABEL_VOIP_NUMBER="your-voip-number"
ISABEL_VOIP_API_KEY="your-api-key"
ISABEL_VOIP_SIP_SERVER="sip.isabel.ir"
ISABEL_VOIP_SIP_USER="your-sip-user"
ISABEL_VOIP_SIP_PASSWORD="your-sip-password"

# WebRTC (Self-Hosted TURN/STUN)
TURN_SERVER_URL="turn:your-domain.com:3478"
TURN_SERVER_USERNAME="your-turn-username"
TURN_SERVER_PASSWORD="your-turn-password"
STUN_SERVER_URL="stun:your-domain.com:3478"

# File Storage
UPLOAD_DIR="/var/www/metalingua/uploads"
RECORDINGS_DIR="/var/www/metalingua/recordings"
MAX_FILE_SIZE="104857600"  # 100MB in bytes

# Logging & Monitoring
LOG_LEVEL="info"
LOG_DIR="/var/www/metalingua/logs"
ENABLE_TELEMETRY="true"
ENABLE_DISK_MONITORING="true"

# Security
CORS_ORIGIN="https://your-domain.com"
SESSION_SECRET="generate-another-strong-random-secret"
RATE_LIMIT_MAX="100"
RATE_LIMIT_WINDOW="900000"  # 15 minutes in ms

# Email (Optional - for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@your-domain.com"
```

### Generate Secure Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate JWT_REFRESH_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Setup

### Initial Setup

```bash
# Push schema to database (creates all tables)
npm run db:push

# If you encounter data-loss warnings on fresh install
npm run db:push --force
```

### Database Schema Overview

MetaLingua uses **50+ tables** including:

- **Users & Authentication**: users, user_sessions, password_reset_tokens, otp_codes
- **Courses & Enrollment**: courses, enrollments, lessons, assignments
- **Payments & Wallet**: transactions, wallet_transactions, payment_gateways
- **Video Tutoring**: video_sessions, call_recordings, ai_session_feedback
- **LinguaQuest**: linguaquest_lessons, linguaquest_progress, linguaquest_achievements
- **Testing System**: mst_sessions, mst_skill_states, mst_responses
- **Monitoring**: audit_logs, error_logs, performance_metrics

### Backup & Restore

#### Automated Backups:
```bash
# Create backup script
cat > /usr/local/bin/backup-metalingua.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/metalingua"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
pg_dump metalingua | gzip > $BACKUP_DIR/metalingua_$DATE.sql.gz

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/metalingua/uploads

# Keep only last 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /usr/local/bin/backup-metalingua.sh

# Schedule daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-metalingua.sh") | crontab -
```

#### Manual Backup:
```bash
# Backup database
pg_dump metalingua > metalingua_backup.sql

# Backup with compression
pg_dump metalingua | gzip > metalingua_backup.sql.gz
```

#### Restore:
```bash
# Restore from backup
psql metalingua < metalingua_backup.sql

# Restore from compressed backup
gunzip -c metalingua_backup.sql.gz | psql metalingua
```

---

## External Services Integration

### TTS Services (Text-to-Speech)

MetaLingua uses **Microsoft Edge TTS** (self-hosted, no API key required):

#### Installation:
```bash
pip3 install edge-tts
```

#### Test:
```bash
edge-tts --text "سلام، این یک تست است" --voice fa-IR-DilaraNeural --write-media test.mp3
```

### Social Media Integration (9 Platforms)

For the AI sales/marketing agent, configure social media API access:

1. **Instagram** - Meta Business API
2. **Telegram** - Bot API
3. **WhatsApp** - Meta Business API
4. **LinkedIn** - LinkedIn API
5. **Twitter/X** - Twitter API v2
6. **Facebook** - Meta Graph API
7. **YouTube** - YouTube Data API
8. **TikTok** - TikTok API
9. **Discord** - Discord Bot API

Add to `.env`:
```bash
# Social Media APIs
INSTAGRAM_ACCESS_TOKEN="your-token"
TELEGRAM_BOT_TOKEN="your-bot-token"
WHATSAPP_API_TOKEN="your-token"
LINKEDIN_CLIENT_ID="your-client-id"
LINKEDIN_CLIENT_SECRET="your-client-secret"
TWITTER_API_KEY="your-api-key"
TWITTER_API_SECRET="your-api-secret"
FACEBOOK_APP_ID="your-app-id"
FACEBOOK_APP_SECRET="your-app-secret"
```

---

## Monitoring & Maintenance

### 1. Self-Hosted Telemetry

MetaLingua includes built-in telemetry without external dependencies.

#### Access Telemetry API:
```bash
# Admin login required
# Get metrics
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/telemetry/metrics

# Get logs
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/telemetry/logs
```

#### Available Metrics:
- **Performance**: Response times (p50, p95, p99), error rates
- **System**: CPU usage, memory usage, disk space
- **Application**: Active users, concurrent sessions, API calls
- **Database**: Query performance, connection pool status

### 2. Disk Space Monitoring

#### Access Disk Monitor API:
```bash
# Admin login required
# Get disk status
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/disk/status

# Get orphaned files
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/disk/orphaned-files

# Cleanup recommendations
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/disk/cleanup-recommendations
```

#### Features:
- Real-time disk space checking
- Orphaned file detection
- Age-based cleanup recommendations
- Automated alerts when disk usage > 80%

### 3. Log Management

#### View Logs:
```bash
# Application logs
tail -f /var/www/metalingua/logs/app.log

# Error logs
tail -f /var/www/metalingua/logs/error.log

# Access logs
tail -f /var/log/nginx/access.log

# PM2 logs
pm2 logs metalingua
```

#### Log Rotation:
```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/metalingua
```

Add:
```conf
/var/www/metalingua/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 4. Health Checks

MetaLingua includes health check endpoints:

```bash
# Basic health check
curl https://your-domain.com/api/health

# Detailed health check (admin only)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  https://your-domain.com/api/health/detailed
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-19T12:00:00.000Z",
  "services": {
    "database": "healthy",
    "ollama": "healthy"
  },
  "uptime": 86400
}
```

### 5. Automated Monitoring Script

```bash
#!/bin/bash
# /usr/local/bin/monitor-metalingua.sh

# Check application health
APP_HEALTH=$(curl -s https://your-domain.com/api/health | jq -r '.status')

if [ "$APP_HEALTH" != "healthy" ]; then
    echo "MetaLingua is unhealthy!" | mail -s "Alert: MetaLingua Health Check Failed" admin@your-domain.com
    # Restart application
    pm2 restart metalingua
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "Disk usage is at ${DISK_USAGE}%" | mail -s "Alert: High Disk Usage" admin@your-domain.com
fi

# Check database connections
DB_CONNECTIONS=$(psql -U metalingua_user -d metalingua -t -c "SELECT count(*) FROM pg_stat_activity;")
if [ $DB_CONNECTIONS -gt 90 ]; then
    echo "Database has ${DB_CONNECTIONS} connections" | mail -s "Alert: High DB Connections" admin@your-domain.com
fi
```

Schedule it:
```bash
chmod +x /usr/local/bin/monitor-metalingua.sh
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/monitor-metalingua.sh") | crontab -
```

---

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

**Symptom**: `npm run dev` fails or application crashes immediately

**Solutions**:
```bash
# Check Node.js version
node --version  # Should be 18.x or higher

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check environment variables
cat .env | grep -E "DATABASE_URL|JWT_SECRET"

# Check database connection
psql $DATABASE_URL -c "SELECT 1;"

# Check logs
tail -f logs/error.log
```

#### 2. Database Connection Failed

**Symptom**: `Error: connect ECONNREFUSED` or `password authentication failed`

**Solutions**:
```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql

# Check DATABASE_URL format
# Correct: postgresql://user:password@host:5432/database

# Test connection manually
psql "postgresql://user:password@host:5432/database" -c "SELECT 1;"

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 3. Ollama Connection Timeout

**Symptom**: AI features not working, Ollama timeout errors

**Solutions**:
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama
sudo systemctl start ollama

# Check Ollama logs
journalctl -u ollama -f

# Test model availability
ollama list

# Pull missing models
ollama pull llama2
```

#### 4. Port 5000 Already in Use

**Symptom**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solutions**:
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT="5001"
```

#### 5. JWT Token Invalid

**Symptom**: Users getting logged out, `Invalid token` errors

**Solutions**:
```bash
# Ensure JWT_SECRET is set and consistent
grep JWT_SECRET .env

# Generate new secrets if needed
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Clear all user sessions (forces re-login)
psql $DATABASE_URL -c "TRUNCATE user_sessions;"
```

#### 6. Shetab Payment Callback Failed

**Symptom**: Payments stuck in "pending" status

**Solutions**:
```bash
# Check callback URL is accessible from Shetab
curl https://your-domain.com/api/payments/shetab/callback

# Verify Shetab credentials
grep SHETAB .env

# Check payment logs
tail -f logs/payments.log

# Test idempotency
curl -X POST https://your-domain.com/api/payments/shetab/callback \
  -d "authority=test&status=OK"
```

#### 7. WebRTC Connection Failed (CallerN)

**Symptom**: Video calls not connecting, "ICE connection failed"

**Solutions**:
```bash
# Check TURN/STUN server
curl http://your-turn-server:3478

# Verify Coturn is running
sudo systemctl status coturn

# Check firewall rules
sudo ufw status
sudo ufw allow 3478/tcp
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp  # TURN port range

# Test WebRTC from browser console
new RTCPeerConnection({
  iceServers: [{
    urls: 'turn:your-domain.com:3478',
    username: 'your-username',
    credential: 'your-password'
  }]
});
```

#### 8. High Memory Usage

**Symptom**: Application using excessive RAM, crashes with OOM

**Solutions**:
```bash
# Check memory usage
free -h
pm2 monit

# Restart application
pm2 restart metalingua

# Increase PM2 memory limit
pm2 start ecosystem.config.js --max-memory-restart 2G

# Enable memory leak detection
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

#### 9. Disk Space Full

**Symptom**: Application crashes, database errors, disk at 100%

**Solutions**:
```bash
# Check disk usage
df -h
du -sh /var/www/metalingua/*

# Use built-in disk monitor
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  https://your-domain.com/api/disk/orphaned-files

# Clean old recordings (older than 30 days)
find /var/www/metalingua/recordings -name "*.webm" -mtime +30 -delete

# Clean old logs
find /var/www/metalingua/logs -name "*.log" -mtime +7 -delete

# Vacuum database
psql metalingua -c "VACUUM FULL;"
```

#### 10. Nginx 502 Bad Gateway

**Symptom**: Users see 502 error, application unreachable

**Solutions**:
```bash
# Check if application is running
pm2 status

# Start application if stopped
pm2 start metalingua

# Check Nginx configuration
sudo nginx -t

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify upstream connection
curl http://localhost:5000/api/health

# Restart Nginx
sudo systemctl restart nginx
```

---

## Test Credentials

### Default Test Accounts

Use these credentials to test different user roles:

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| **Student** | enrolled.student@test.com | password123 | Test student features, enrollment, LinguaQuest |
| **Teacher** | teacher1@metalingua.com | password123 | Test teaching features, assignments, grading |
| **Teacher** | teacher2@metalingua.com | password123 | Test scheduling, CallerN sessions |
| **Teacher** | teacher3@metalingua.com | password123 | Test course management |
| **Admin** | test-admin@meta-lingua.com | password123 | Test admin features, telemetry, monitoring |
| **Front Desk** | frontdesk@test.com | password123 | Test enrollment, student management |

### Creating New Test Users

#### Via Registration:
1. Navigate to `/register`
2. Fill in details
3. Select role from dropdown
4. Submit

#### Via Admin Panel:
1. Login as admin
2. Navigate to Users → Create User
3. Fill in details
4. Assign role
5. Submit

#### Via API:
```bash
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User",
    "role": "Student"
  }'
```

### Resetting Test Data

```bash
# Reset all test users (CAUTION: Production data will be lost)
psql $DATABASE_URL -c "DELETE FROM users WHERE email LIKE '%@test.com';"

# Reset specific test user
psql $DATABASE_URL -c "DELETE FROM users WHERE email='enrolled.student@test.com';"

# Clear all sessions
psql $DATABASE_URL -c "TRUNCATE user_sessions;"
```

---

## Security Checklist

Before going to production, ensure:

- [ ] All `.env` variables are set with **strong random secrets**
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are **different** and **secure**
- [ ] Database password is **strong** (16+ characters)
- [ ] Nginx SSL certificates are installed and valid
- [ ] Firewall rules are configured (only ports 80, 443, 22 open)
- [ ] SSH key-based authentication is enabled (disable password login)
- [ ] Database backups are automated and tested
- [ ] Rate limiting is enabled on all API endpoints
- [ ] CORS is configured to only allow your domain
- [ ] File upload limits are set appropriately
- [ ] All test accounts have **strong passwords** or are **disabled**
- [ ] Monitoring and alerting are configured
- [ ] Error logs do NOT expose sensitive information
- [ ] All external API keys are stored in environment variables (never committed)
- [ ] Database is NOT publicly accessible
- [ ] Admin panel requires strong authentication

---

## Post-Deployment Verification

### 1. Smoke Tests

```bash
# Test homepage
curl https://your-domain.com

# Test health endpoint
curl https://your-domain.com/api/health

# Test login
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"enrolled.student@test.com","password":"password123"}'

# Test protected endpoint
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-domain.com/api/users/me
```

### 2. Feature Tests

- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Course enrollment works
- [ ] Video calls connect (CallerN)
- [ ] LinguaQuest lessons load
- [ ] Payment flow completes (Shetab test mode)
- [ ] SMS verification works (Kavenegar)
- [ ] AI features respond (Ollama)
- [ ] WebRTC connections establish
- [ ] File uploads work
- [ ] Dashboard loads for all roles

### 3. Monitoring Setup Verification

- [ ] Telemetry endpoints accessible at `/api/telemetry/*`
- [ ] Disk monitor endpoints accessible at `/api/disk/*`
- [ ] Logs are being written to `/var/www/metalingua/logs`
- [ ] Metrics are being collected
- [ ] Health checks are passing

---

## Maintenance Schedule

### Daily
- Check application health: `curl https://your-domain.com/api/health`
- Review error logs: `tail -f logs/error.log`
- Monitor disk space: `df -h`

### Weekly
- Review telemetry metrics
- Check for orphaned files
- Analyze slow database queries
- Review user activity logs

### Monthly
- Test backup restoration
- Update dependencies: `npm update`
- Review security patches
- Optimize database: `VACUUM FULL`
- Clean old recordings and logs

### Quarterly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review and rotate secrets
- Audit user accounts
- Review and update SSL certificates
- Performance optimization review

---

## Appendix

### A. Port Usage

| Port | Service | Description |
|------|---------|-------------|
| 5000 | Node.js App | Main application server |
| 5432 | PostgreSQL | Database server |
| 11434 | Ollama | Local AI service |
| 3478 | Coturn | TURN/STUN server |
| 80 | Nginx | HTTP (redirects to HTTPS) |
| 443 | Nginx | HTTPS |

### B. Directory Structure

```
/var/www/metalingua/
├── client/               # Frontend React app
├── server/               # Backend Express app
├── shared/               # Shared types and schemas
├── uploads/              # User uploaded files
├── recordings/           # Video call recordings
├── logs/                 # Application logs
├── node_modules/         # Dependencies
├── .env                  # Environment variables
├── package.json          # Project configuration
└── ecosystem.config.js   # PM2 configuration
```

### C. Critical Production Issues (All Resolved ✅)

1. **JWT Validation** - Secure token validation with refresh tokens
2. **Shetab Idempotency** - Prevent duplicate payment processing
3. **Wallet Atomicity** - Transaction consistency and rollback
4. **CallerN Memory** - Proper cleanup and leak prevention
5. **WebSocket Sync** - State synchronization across connections
6. **Telemetry** - Self-hosted logging and metrics
7. **Disk Monitoring** - Real-time space tracking and cleanup

### D. API Endpoints Summary

- **Authentication**: `/api/auth/*` (login, register, refresh, logout)
- **Users**: `/api/users/*` (profile, preferences, wallet)
- **Courses**: `/api/courses/*` (list, enroll, progress)
- **LinguaQuest**: `/api/linguaquest/*` (lessons, progress, feedback)
- **CallerN**: `/api/callern/*` (sessions, join, recordings)
- **Payments**: `/api/payments/*` (shetab, wallet, transactions)
- **Admin**: `/api/admin/*` (users, analytics, settings)
- **Telemetry**: `/api/telemetry/*` (metrics, logs, performance)
- **Disk Monitor**: `/api/disk/*` (status, cleanup, orphaned)

---

## Conclusion

This deployment guide covers everything needed to deploy MetaLingua from development to production, specifically optimized for Iranian self-hosting with zero external dependencies.

### Key Takeaways:
✅ **Self-hosted** - Complete independence from external services  
✅ **Iranian Infrastructure** - Shetab, Kavenegar, Isabel VoIP integration  
✅ **Production Ready** - All 7 critical issues resolved  
✅ **Monitoring Built-in** - Telemetry and disk monitoring included  
✅ **Scalable** - Docker and PM2 clustering support  
✅ **Secure** - JWT, rate limiting, audit logs  

### Next Steps:
1. Complete external services setup (Shetab, Kavenegar, Isabel)
2. Run production smoke tests
3. Configure monitoring alerts
4. Train your team on admin panel
5. Go live! 🚀

### Support:
- **Documentation**: See `METALINGUA_SYSTEM_WORKFLOW.md` and `METALINGUA_VISUAL_DIAGRAMS.md`
- **Health Check**: `https://your-domain.com/api/health`
- **Telemetry**: `https://your-domain.com/api/telemetry/metrics`
- **Disk Monitor**: `https://your-domain.com/api/disk/status`

**Good luck with your deployment!** 🎉

---

*MetaLingua Platform - Complete Deployment Guide*  
*Version 1.0.0 - October 19, 2025*  
*Designed for Iranian Self-Hosting with Zero External Dependencies*
