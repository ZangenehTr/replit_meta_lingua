# MetaLingo Academy — Deployment Guide

**Version:** 1.3.0  
**Last Updated:** April 2, 2026  
**Audience:** System Administrators, DevOps Engineers

---

## Overview

This guide covers deploying MetaLingo Academy to a self-hosted Linux server in a production environment. The setup is Docker-based and includes PostgreSQL, Redis, Nginx, and the application itself. No external cloud services are required.

**Estimated setup time:** 2–4 hours for a fresh server.

---

## Table of Contents

1. [Server Requirements](#1-server-requirements)
2. [External Services Required](#2-external-services-required)
3. [Pre-Deployment Checklist](#3-pre-deployment-checklist)
4. [Installing Docker](#4-installing-docker)
5. [Cloning and Configuring the Application](#5-cloning-and-configuring-the-application)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Database Setup](#7-database-setup)
8. [Running with Docker Compose](#8-running-with-docker-compose)
9. [Nginx Reverse Proxy](#9-nginx-reverse-proxy)
10. [SSL Certificate Setup](#10-ssl-certificate-setup)
11. [Installing Ollama (AI)](#11-installing-ollama-ai)
12. [Installing coturn (WebRTC)](#12-installing-coturn-webrtc)
13. [Issabel VoIP Setup](#13-issabel-voip-setup)
14. [Post-Deployment Verification](#14-post-deployment-verification)
15. [Applying Database Migrations](#15-applying-database-migrations)
16. [Backup Procedures](#16-backup-procedures)
17. [Updating the Platform](#17-updating-the-platform)
18. [Security Hardening](#18-security-hardening)
19. [Performance Tuning](#19-performance-tuning)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Server Requirements

### Minimum (up to ~200 concurrent users)
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 4 cores | 8 cores |
| RAM | 8 GB | 16 GB |
| Disk | 100 GB SSD | 500 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| Network | 100 Mbps | 1 Gbps |

### With Local AI (Ollama)
Add 8 GB RAM and one of:
- NVIDIA GPU with 8 GB VRAM (strongly recommended for speed)
- CPU-only inference (usable but slow — budget 8+ extra CPU cores)

### Ports to Open (Firewall)
| Port | Protocol | Purpose |
|---|---|---|
| 80 | TCP | HTTP (redirects to HTTPS) |
| 443 | TCP | HTTPS (main application) |
| 3478 | TCP+UDP | coturn STUN/TURN |
| 5349 | TCP+UDP | coturn STUN/TURN (TLS) |
| 5038 | TCP | Issabel AMI (internal only, do NOT expose to internet) |
| 11434 | TCP | Ollama API (internal only, do NOT expose to internet) |

---

## 2. External Services Required

These are Iranian-compatible services you must register and obtain credentials for **before** starting deployment.

| Service | Purpose | Provider |
|---|---|---|
| SMS Gateway | OTP authentication, notifications | [Kavenegar](https://kavenegar.com) |
| Payment Gateway | Course payments, wallet top-ups | Shetab / IDPay / Zarinpal / Zibal |
| Domain Name | Your institute's web address | Any Iranian or international registrar |

---

## 3. Pre-Deployment Checklist

Before you start, have these ready:

- [ ] Linux server with SSH access
- [ ] Your domain name pointed to the server IP (A record set)
- [ ] Kavenegar account with API key and verified sender line
- [ ] Payment gateway account with API credentials
- [ ] SSH key pair for the server
- [ ] The MetaLingo source code package (zip or git repo)

---

## 4. Installing Docker

Run these commands on your server as root or a user with sudo:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y ca-certificates curl gnupg lsb-release

# Add Docker GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list

# Install Docker and Compose
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add your user to docker group (log out and back in after this)
sudo usermod -aG docker $USER

# Verify installation
docker --version
docker compose version
```

---

## 5. Cloning and Configuring the Application

```bash
# Create application directory
sudo mkdir -p /opt/metalingo
sudo chown $USER:$USER /opt/metalingo
cd /opt/metalingo

# Extract or clone the source
# If you received a zip file:
unzip metalingo-source.zip -d .

# Create uploads directory (for logos, teacher photos, etc.)
mkdir -p uploads/logos uploads/teacher-photos uploads/videos uploads/media

# Create the environment file
cp .env.example .env
nano .env   # Edit with your actual values (see Section 6)
```

---

## 6. Environment Variables Reference

Edit `/opt/metalingo/.env` with your actual values:

### Core Application

```env
# The full public URL of your site — used in payment callbacks and email links
# All three must be identical
APP_URL=https://yourdomain.com
BASE_URL=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Generate with: openssl rand -base64 64
JWT_SECRET=your-very-long-random-secret-here

# Server port (keep 5000 — Nginx proxies to this)
PORT=5000

NODE_ENV=production
```

### Database

```env
DATABASE_URL=postgresql://metalingo:yourpassword@postgres:5432/metalingo
PGHOST=postgres
PGPORT=5432
PGDATABASE=metalingo
PGUSER=metalingo
PGPASSWORD=yourpassword
```

### Redis

```env
REDIS_HOST=redis
REDIS_PORT=6379
# Leave blank if no Redis password (not recommended for production)
REDIS_PASSWORD=yourredispassword
```

### SMS (Kavenegar)

```env
KAVENEGAR_API_KEY=your-kavenegar-api-key
KAVENEGAR_SENDER=your-verified-kavenegar-number
```

### Payment Gateways (configure the ones you use)

```env
# Shetab (Shaparak direct)
SHETAB_TERMINAL_ID=your-terminal-id
SHETAB_MERCHANT_ID=your-merchant-id

# IDPay
IDPAY_API_KEY=your-idpay-api-key

# Zarinpal
ZARINPAL_MERCHANT_ID=your-36-char-merchant-id

# Zibal
ZIBAL_MERCHANT=your-zibal-merchant-code
```

### AI Provider

```env
# Use 'ollama' for local AI (zero cost) or 'openai' for cloud
AI_PROVIDER=ollama

# Ollama settings (if AI_PROVIDER=ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b

# OpenAI settings (if AI_PROVIDER=openai, or as fallback)
OPENAI_API_KEY=sk-...
```

### VoIP (Issabel PBX)

```env
VOIP_AMI_HOST=192.168.1.100   # Your Issabel server's IP
VOIP_AMI_PORT=5038
VOIP_AMI_USERNAME=your-ami-user
VOIP_AMI_SECRET=your-ami-password
VOIP_DEFAULT_TRUNK=SIP/your-trunk-name
```

### Telegram Bot (optional)

```env
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### WebRTC TURN Server

```env
TURN_SERVER_URL=turn:yourdomain.com:3478
TURN_SERVER_USERNAME=turnuser
TURN_SERVER_CREDENTIAL=turnpassword
```

---

## 7. Database Setup

The database is automatically created by Docker Compose. After first startup, you need to apply the schema.

### Production Database (Self-Hosted PostgreSQL in Docker)
This is handled by running `npm run db:push` inside the app container (see Section 8 step 3).

### Migrating from Development (Neon/Replit)
If you have data in a development Neon database and want to bring it to production:

```bash
# Dump from Neon
pg_dump "postgresql://user:pass@neon-host/dbname" \
  --no-owner --no-privileges \
  -f backup_dev.sql

# Restore to production
docker compose exec postgres psql \
  -U metalingo -d metalingo < backup_dev.sql
```

---

## 8. Running with Docker Compose

### Step 1 — Build the Application Image

```bash
cd /opt/metalingo
docker compose build
```

This builds the Node.js application into a production Docker image (multi-stage build, ~800 MB final).

### Step 2 — Start All Services

```bash
docker compose up -d
```

This starts:
- `app` — the MetaLingo Node.js server on port 5000
- `postgres` — PostgreSQL 14 database
- `redis` — Redis 7 for queue management

### Step 3 — Apply Database Schema

Run this once on first deployment (and after updates that add new tables):

```bash
docker compose exec app npm run db:push
```

Then apply the migration files:

```bash
# Apply all migrations in order
docker compose exec app node -e "
const { execSync } = require('child_process');
const fs = require('fs');
const files = fs.readdirSync('./migrations').sort().filter(f => f.endsWith('.sql'));
files.forEach(f => {
  console.log('Applying:', f);
  execSync('psql \$DATABASE_URL < ./migrations/' + f, { stdio: 'inherit' });
});
"
```

Or apply manually per file:

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0000_nostalgic_blue_blade.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0020_payment_gateway_configs.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0030_promo_codes_certificates.sql
```

### Step 4 — Check Everything Is Running

```bash
docker compose ps
# All services should show "Up"

docker compose logs app --tail=50
# Should see: "Server running on port 5000"
```

### Step 5 — Validate Environment Configuration

Before going further, verify all required environment variables are present and valid:

```bash
docker compose exec app npx tsx scripts/validate-env.ts
```

This script checks every required variable (database, SMS, payment gateway, AI provider, etc.) and exits with a clear error message if anything is missing or misconfigured. Fix any issues in `.env` and restart the app before continuing.

### Step 6 — Seed Initial Data

After the schema is applied, seed the platform with its required starting data. **All seed scripts are idempotent — safe to run multiple times.**

#### 6a — Curriculum Tracks

Populates the default curriculum categories (IELTS Preparation and Conversation tracks). Without this, the course catalog will be empty.

```bash
docker compose exec app npx tsx scripts/populate-curriculum-data.ts
```

#### 6b — LinguaQuest Games

Seeds the 12 LinguaQuest game types, their levels, and the achievement badge definitions. Without this, the gamification module will have no games to display.

```bash
docker compose exec app npx tsx scripts/populate-sample-games.ts
```

#### 6c — MST Question Bank (Placement Test)

Seeds AI-generated IRT-calibrated questions for the Multi-Stage Adaptive placement test across all CEFR levels (A1–C2) and skill domains (listening, reading, grammar, vocabulary). Without this, the placement test will have no questions.

This requires your AI service (Ollama or OpenAI) to be running, as it generates questions via the configured AI provider.

```bash
# Standard seed — generates ~5 questions per cell (skill × CEFR level × stage)
docker compose exec app npm run seed:mst

# Optional: dry run first to preview what will be generated
docker compose exec app npm run seed:mst:dry

# Optional: seed only a specific skill or level
docker compose exec app npx tsx server/scripts/seed-mst-question-bank.ts --skill listening --cefr B1
```

> **Note:** The full seed (all skills × all levels) uses your AI service and may take 10–30 minutes depending on your hardware. For a quick start, seed one level at a time and add more later.

#### 6d — Generate MST Audio Files (Optional)

If you have Microsoft Edge TTS configured, generate audio files for all listening-type placement test questions:

```bash
docker compose exec app npm run generate:mst-audio
```

Audio files are saved to the server filesystem and served directly. Skip this step if you don't have TTS configured — listening questions will fall back to text-only mode.

### Step 7 — Create the Admin Account

Set up the first admin user with a secure auto-generated password:

```bash
docker compose exec app npx tsx scripts/secure-admin-setup.ts
```

This creates (or updates) the admin account and prints the temporary password to the console. **Copy this password immediately** — it is only shown once. You will be prompted to change it on first login.

---

### Useful Docker Commands

```bash
# View live logs
docker compose logs -f app

# Restart just the app (after code changes)
docker compose restart app

# Stop everything
docker compose down

# Stop and remove all data (DESTRUCTIVE)
docker compose down -v
```

---

## 9. Nginx Reverse Proxy

Install Nginx on the host server (not inside Docker):

```bash
sudo apt install -y nginx
```

Create the site configuration:

```bash
sudo nano /etc/nginx/sites-available/metalingo
```

Paste this configuration:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy strict-origin-when-cross-origin;

    # Upload size limit (for video uploads)
    client_max_body_size 500M;

    # Serve static uploads directly from host
    location /uploads/ {
        alias /opt/metalingo/uploads/;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # WebSocket support (for real-time features)
    location /ws/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600;
    }

    # Main application
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;
    }
}
```

Enable and test:

```bash
sudo ln -s /etc/nginx/sites-available/metalingo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 10. SSL Certificate Setup

Use Certbot to get a free SSL certificate:

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

Certbot automatically sets up a cron job to renew the certificate before it expires (certificates last 90 days, renew at 60 days).

### If You Already Have a Certificate (from a local CA)
Place the certificate files at:
- `/etc/ssl/metalingo/fullchain.pem`
- `/etc/ssl/metalingo/privkey.pem`

And update the Nginx `ssl_certificate` and `ssl_certificate_key` paths accordingly.

---

## 11. Installing Ollama (AI)

Ollama runs the local AI model. Install it **on the host server** (not inside Docker) for best GPU access.

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
sudo systemctl start ollama
sudo systemctl enable ollama

# Download the recommended model
ollama pull llama3.2:3b

# Verify it's running
curl http://localhost:11434/api/tags
```

### Choosing a Model

| Model | Size | RAM Required | Quality |
|---|---|---|---|
| `llama3.2:3b` | ~2 GB | 8 GB | Good for most use cases |
| `llama3.2:8b` | ~5 GB | 12 GB | Better quality |
| `llama3.1:70b` | ~40 GB | 48 GB | Excellent (needs GPU) |
| `qwen2.5:7b` | ~4.5 GB | 10 GB | Good Arabic/Persian support |

For **Persian language teaching**, `qwen2.5:7b` may perform better due to stronger multilingual training.

### Configure in .env
```env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
```

If Ollama is on a separate server:
```env
OLLAMA_HOST=http://192.168.1.50:11434
```

---

## 12. Installing coturn (WebRTC)

coturn is the TURN/STUN server for WebRTC video calls when peers cannot connect directly (common behind NAT/firewalls).

```bash
sudo apt install -y coturn
```

Edit the configuration:

```bash
sudo nano /etc/turnserver.conf
```

Paste:

```conf
listening-port=3478
tls-listening-port=5349
fingerprint
lt-cred-mech
user=turnuser:yourpassword
realm=yourdomain.com
server-name=yourdomain.com
cert=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
pkey=/etc/letsencrypt/live/yourdomain.com/privkey.pem
log-file=/var/log/coturn/turn.log
no-multicast-peers
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
allowed-peer-ip=0.0.0.1
```

Enable and start:

```bash
sudo systemctl enable coturn
sudo systemctl start coturn
```

Set in `.env`:
```env
TURN_SERVER_URL=turn:yourdomain.com:3478
TURN_SERVER_USERNAME=turnuser
TURN_SERVER_CREDENTIAL=yourpassword
```

---

## 13. Issabel VoIP Setup

This section assumes you already have an Issabel PBX running on your local network.

### Enable AMI in Issabel
1. Log into Issabel admin panel
2. Go to **PBX → PBX Configuration → Asterisk Manager Users**
3. Create a new AMI user with these permissions:
   - `read`: all
   - `write`: all (or at minimum: originate, call)
4. Note the username and secret

### Test AMI Connectivity from Server

```bash
telnet YOUR_ISSABEL_IP 5038
# You should see: Asterisk Call Manager/x.x.x
# Type: Action: Login\r\nUsername: youruser\r\nSecret: yoursecret\r\n\r\n
# You should see: Response: Success
```

### Configure in .env
```env
VOIP_AMI_HOST=192.168.1.100
VOIP_AMI_PORT=5038
VOIP_AMI_USERNAME=metalingo_ami
VOIP_AMI_SECRET=yoursecret
VOIP_DEFAULT_TRUNK=SIP/your-sip-trunk
```

**Security Note:** Never expose port 5038 to the internet. This should only be accessible within your private network.

---

## 14. Post-Deployment Verification

After all services are up, verify each component:

### Application Health
```bash
curl https://yourdomain.com/api/health
# Expected: {"status":"ok","timestamp":"..."}
```

### Check All Containers
```bash
docker compose ps
# All should show: Up (healthy)
```

### Admin Panel Access
1. Open `https://yourdomain.com` in your browser
2. Click "Login" and enter the admin phone number
3. You should receive an OTP SMS within 30 seconds
4. Enter the OTP and confirm you reach the admin dashboard

### Verify Infrastructure Status Widget
In the admin dashboard, check the **Infrastructure Status** widget:
- Database: Connected
- Redis: Connected
- AI Service (Ollama or OpenAI): Reachable
- VoIP (if configured): Reachable
- Kavenegar SMS: Reachable

### Test a Payment Gateway
Go to **Admin → Settings → Payment Gateways**, select your active gateway, and click **Test Connection**.

---

## 15. Applying Database Migrations

Each new release may include SQL migration files in the `migrations/` folder. Apply them in numeric order.

### Check Which Migrations Have Been Applied

```bash
docker compose exec postgres psql -U metalingo metalingo \
  -c "SELECT tablename FROM information_schema.tables WHERE table_schema='public' ORDER BY tablename;"
```

### Apply a Specific Migration

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0030_promo_codes_certificates.sql
```

All migration files use `IF NOT EXISTS` and `EXCEPTION WHEN duplicate_column` handling, so they are **safe to re-run** if you are unsure whether they were applied.

### v1.1.0 Migration — Marketing & Attribution Tables

If upgrading from v1.0.0 to v1.1.0, apply the following changes. These are all additive (no data loss):

```sql
-- Course Reviews
CREATE TABLE IF NOT EXISTS course_reviews (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  student_id INTEGER REFERENCES users(id),
  enrollment_id INTEGER,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_text_fa TEXT,
  review_text_ar TEXT,
  status VARCHAR(20) DEFAULT 'pending' NOT NULL,
  rejection_reason TEXT,
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  is_approved BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_anonymous BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(course_id, student_id)
);

-- Referral Program
CREATE TABLE IF NOT EXISTS referral_codes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
  code VARCHAR(20) NOT NULL UNIQUE,
  total_referrals INTEGER DEFAULT 0,
  total_converted INTEGER DEFAULT 0,
  total_credits_earned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_events (
  id SERIAL PRIMARY KEY,
  referral_code_id INTEGER NOT NULL REFERENCES referral_codes(id),
  referrer_id INTEGER NOT NULL REFERENCES users(id),
  referred_user_id INTEGER REFERENCES users(id),
  event_type VARCHAR(30) NOT NULL,
  course_payment_id INTEGER,
  referrer_credit_awarded INTEGER DEFAULT 0,
  referred_credit_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- CallerN Session Ratings
CREATE TABLE IF NOT EXISTS session_ratings (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  teacher_id INTEGER NOT NULL REFERENCES users(id),
  student_id INTEGER NOT NULL REFERENCES users(id),
  teacher_rating INTEGER CHECK (teacher_rating BETWEEN 1 AND 5),
  student_rating INTEGER CHECK (student_rating BETWEEN 1 AND 5),
  teacher_comment TEXT,
  student_comment TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- UTM Attribution columns on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS callern_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS callern_session_count INTEGER DEFAULT 0;

-- UTM Attribution columns on course_payments
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE course_payments ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);

-- UTM Attribution columns on enrollments
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_source VARCHAR(100);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_medium VARCHAR(100);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(100);
```

Run this block against the production database:

```bash
docker compose exec postgres psql -U metalingo metalingo < /opt/metalingo/migrations/0040_marketing_attribution.sql
```

### v1.1.1 Migration — CallerN Teacher Followers & Private Class Stack

If upgrading from v1.1.0, apply these additional migration files before moving to v1.2.0:

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0050_callern_teacher_followers.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0060_private_class_operational_stack.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0070_mst_question_bank_indexes.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0080_sublevel_system.sql
```

- `0050` — adds CallerN teacher follower tracking tables
- `0060` — full private class operational tables (bookings, teacher assignments, package purchases)
- `0070` — performance indexes on the MST question bank
- `0080` — sub-level system columns on users, courses, and curriculum levels

### v1.2.0 Migration — Private Classes, Sub-levels & Accessibility

If upgrading from v1.1.0 to v1.2.0, apply the following. All changes are additive (no data loss).

**Private classes and session packages** — new tables and columns:

```sql
-- Sub-level columns on session_packages (if table exists from v1.1.0)
ALTER TABLE session_packages
  ADD COLUMN IF NOT EXISTS min_sub_level_id INTEGER REFERENCES curriculum_levels(id),
  ADD COLUMN IF NOT EXISTS max_sub_level_id INTEGER REFERENCES curriculum_levels(id);

-- If session_packages doesn't exist yet, apply the full migration:
-- migrations/0090_sublevel_session_packages_leads.sql
```

**Curriculum levels unique constraint** (prevents duplicate level codes per language):

```sql
-- migrations/0100_curriculum_levels_unique_constraint.sql
-- Safe to apply — uses IF NOT EXISTS
```

Apply all v1.2.0 migration files in order:

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0090_sublevel_session_packages_leads.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0100_curriculum_levels_unique_constraint.sql

docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0110_session_packages_sublevel_fk.sql
```

All migrations use `IF NOT EXISTS` / `EXCEPTION WHEN duplicate_object` guards and are safe to re-run.

**No changes required for the RTL & Accessibility update** — all changes are frontend-only (CSS logical properties, ARIA attributes, focus management). No database migrations needed.

### v1.3.0 Migration — IRT/MST Reliability & AI Content Pipeline

If upgrading from v1.2.0 to v1.3.0, apply the following. All changes are additive (no data loss).

**IRT/MST reliability tables** — stores per-session response telemetry and IRT scoring history:

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/0120_irt_mst_reliability_tables.sql
```

**Social media content tables** — required for the AI Content & SEO Pipeline social media post type:

```bash
docker compose exec postgres psql -U metalingo metalingo \
  < /opt/metalingo/migrations/manual_social_media_tables.sql
```

- `0120` — adds IRT response telemetry tables and IRT scoring history per test session; fixes CEFR theta thresholds
- `manual_social_media_tables` — adds social media post tables used by the AI content generation pipeline

---

## 16. Backup Procedures

### Database Backup (Automated Daily)

Add this to your crontab (`crontab -e`):

```bash
# Daily database backup at 2:00 AM
0 2 * * * docker exec metalingo-postgres-1 pg_dump \
  -U metalingo metalingo | gzip \
  > /opt/backups/metalingo_$(date +\%Y\%m\%d).sql.gz

# Keep only last 30 days
0 3 * * * find /opt/backups -name "metalingo_*.sql.gz" -mtime +30 -delete
```

Create the backup directory:
```bash
sudo mkdir -p /opt/backups
sudo chown $USER:$USER /opt/backups
```

### Restore from Backup

```bash
# Stop the app to prevent writes during restore
docker compose stop app

# Restore the dump
gunzip -c /opt/backups/metalingo_20260329.sql.gz | \
  docker exec -i metalingo-postgres-1 psql -U metalingo metalingo

# Restart
docker compose start app
```

### Uploads Backup

Video files, logos, and teacher photos are stored in `/opt/metalingo/uploads/`. Back these up separately:

```bash
tar -czf /opt/backups/uploads_$(date +%Y%m%d).tar.gz \
  /opt/metalingo/uploads/
```

---

## 17. Updating the Platform

When a new version of MetaLingo is released:

```bash
cd /opt/metalingo

# 1. Back up current database
docker exec metalingo-postgres-1 pg_dump \
  -U metalingo metalingo > /opt/backups/pre_update_$(date +%Y%m%d).sql

# 2. Pull new source code (or extract updated zip)
# git pull   # or: unzip new-version.zip -d .

# 3. Rebuild the Docker image
docker compose build app

# 4. Apply any new migrations
# Check the migrations/ folder for new .sql files and apply them

# 5. Restart with new image
docker compose up -d app

# 6. Verify
docker compose logs app --tail=30
curl https://yourdomain.com/api/health
```

> **Automated post-merge handling (v1.2.0+):** If you are using the provided `scripts/post-merge.sh` script (configured as a git post-merge hook), dependency installation and all new SQL migrations are applied automatically after every code merge — no manual migration step required. The script runs `npm install` and then applies any unapplied migration files in order.

---

## 18. Security Hardening

### Server Level

```bash
# Disable root SSH login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# Set up UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3478      # coturn
sudo ufw allow 5349      # coturn TLS
sudo ufw enable

# Install fail2ban
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
```

### Application Level

- **Change default JWT_SECRET**: Use `openssl rand -base64 64` to generate
- **Restrict database access**: PostgreSQL should only be accessible from within the Docker network
- **Ollama and AMI**: Never expose ports 11434 or 5038 to the internet
- **Logo uploads**: The upload endpoint validates MIME type and limits file size to 2 MB
- **File paths**: The system uses SSRF protection — logo URLs are validated before being loaded by the PDF generator

### Nginx Rate Limiting

Add this to your Nginx config inside the `server` block:

```nginx
# Rate limit OTP requests (prevent abuse)
limit_req_zone $binary_remote_addr zone=otp:10m rate=5r/m;

location /api/auth/request-otp {
    limit_req zone=otp burst=3 nodelay;
    proxy_pass http://127.0.0.1:5000;
}
```

---

## 19. Performance Tuning

### PostgreSQL

Add to `/etc/postgresql/14/main/postgresql.conf` (or via Docker env):

```conf
max_connections = 200
shared_buffers = 2GB           # 25% of total RAM
effective_cache_size = 6GB     # 75% of total RAM
work_mem = 64MB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 64MB
```

### Node.js App

Set in `.env`:
```env
UV_THREADPOOL_SIZE=16
```

### Redis

In `docker-compose.yml` for the Redis service, add:
```yaml
command: redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Nginx Worker Processes

```nginx
worker_processes auto;
worker_connections 2048;
keepalive_timeout 65;
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

---

## 20. Troubleshooting

### Application Won't Start

```bash
# Check logs
docker compose logs app --tail=100

# Most common causes:
# 1. DATABASE_URL is wrong — check connection string
# 2. JWT_SECRET not set
# 3. Port 5000 already in use on host
```

### Cannot Connect to Database

```bash
# Test from inside the app container
docker compose exec app node -e \
  "const {Pool} = require('pg'); const p = new Pool({connectionString: process.env.DATABASE_URL}); p.query('SELECT 1').then(r => console.log('DB OK')).catch(console.error)"
```

### Redis Connection Refused

The application will work without Redis (queued jobs will not run, but core features remain operational). For full functionality:

```bash
docker compose ps redis
# If not running: docker compose up -d redis
```

### Nginx 502 Bad Gateway

```bash
# Check if app container is running
docker compose ps app

# Check app is listening on port 5000
docker compose exec app netstat -tlnp | grep 5000

# Check Nginx can reach the app
curl http://127.0.0.1:5000/api/health
```

### OTP Not Arriving

```bash
# Test Kavenegar from the server
curl -X POST "https://api.kavenegar.com/v1/YOUR_API_KEY/verify/lookup.json" \
  -d "receptor=09XXXXXXXXX&token=12345&template=your-template"
```

### SSL Certificate Issues

```bash
# Check certificate expiry
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx
```

### Video Calls Not Working

1. Verify coturn is running: `sudo systemctl status coturn`
2. Test TURN server: use [WebRTC Trickle ICE tester](https://webrtc.github.io/samples/src/content/peerconnection/trickle-ice/) with your TURN credentials
3. Ensure UDP traffic is allowed on port 3478 in your firewall
4. Check the `.env` for correct `TURN_SERVER_URL`, `TURN_SERVER_USERNAME`, `TURN_SERVER_CREDENTIAL`

---

## Quick Reference

### Key File Locations

| File | Location |
|---|---|
| Environment config | `/opt/metalingo/.env` |
| Docker Compose | `/opt/metalingo/docker-compose.yml` |
| Nginx site config | `/etc/nginx/sites-available/metalingo` |
| coturn config | `/etc/turnserver.conf` |
| Uploads directory | `/opt/metalingo/uploads/` |
| Database backups | `/opt/backups/` |
| Application logs | `docker compose logs app` |

### Key Commands

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Restart just the app
docker compose restart app

# View live logs
docker compose logs -f app

# Apply schema changes
docker compose exec app npm run db:push

# Open database shell
docker compose exec postgres psql -U metalingo metalingo

# Open Redis shell
docker compose exec redis redis-cli
```

---

*For feature documentation and daily use, refer to the [Buyer Manual](./buyer-manual.md).*  
*For platform architecture details, refer to the [README](./README.md).*
