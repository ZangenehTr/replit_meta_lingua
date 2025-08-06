# Meta Lingua Complete Deployment Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Pre-Installation Checklist](#pre-installation-checklist)
3. [Step-by-Step Installation](#step-by-step-installation)
4. [TURN Server Setup](#turn-server-setup)
5. [Database Setup](#database-setup)
6. [Application Configuration](#application-configuration)
7. [Running the Application](#running-the-application)
8. [Post-Installation Steps](#post-installation-steps)
9. [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Hardware Requirements
- **CPU**: 4 cores (8 cores recommended)
- **RAM**: 8GB minimum (16GB recommended)
- **Storage**: 50GB SSD (100GB+ recommended for growth)
- **Network**: 100Mbps connection (1Gbps recommended)

### Software Requirements
- **Operating System**: Ubuntu 20.04 LTS or newer (or any Linux distribution)
- **Node.js**: Version 18.0 or higher
- **PostgreSQL**: Version 14 or higher
- **Nginx**: Latest stable version (for reverse proxy)
- **PM2**: For process management
- **Git**: For downloading the application

## Pre-Installation Checklist

Before starting, ensure you have:
- [ ] Root or sudo access to your server
- [ ] Static IP address or domain name
- [ ] SSL certificate (or use Let's Encrypt)
- [ ] Firewall configured with required ports
- [ ] Backup of any existing data

## Step-by-Step Installation

### Step 1: Update System and Install Dependencies

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl wget git build-essential

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
node --version  # Should show v18.x.x
npm --version

# Install PM2 globally
sudo npm install -g pm2

# Install PostgreSQL 14
sudo apt install -y postgresql-14 postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Coturn (TURN server)
sudo apt install -y coturn
```

### Step 2: Download Meta Lingua Application

```bash
# Create application directory
sudo mkdir -p /opt/metalingua
cd /opt/metalingua

# Download the application
# Option 1: From Git repository (if available)
git clone https://your-repository-url/metalingua.git .

# Option 2: From ZIP file
# Upload your ZIP file to the server, then:
unzip metalingua.zip

# Set proper permissions
sudo chown -R www-data:www-data /opt/metalingua
sudo chmod -R 755 /opt/metalingua
```

### Step 3: Install Application Dependencies

```bash
cd /opt/metalingua

# Install Node.js dependencies
npm install

# Build the application
npm run build
```

## TURN Server Setup

### Step 4: Configure Coturn for WebRTC

```bash
# Edit Coturn configuration
sudo nano /etc/turnserver.conf
```

Add the following configuration:

```conf
# Network settings
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
relay-ip=YOUR_SERVER_INTERNAL_IP
external-ip=YOUR_SERVER_PUBLIC_IP/YOUR_SERVER_INTERNAL_IP

# Authentication
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_VERY_LONG_RANDOM_SECRET_KEY_HERE

# Realm (use your domain or server name)
realm=metalingua.local
server-name=metalingua.local

# Security
fingerprint
no-loopback-peers
no-multicast-peers
no-cli
no-tlsv1
no-tlsv1_1

# Performance
min-port=49152
max-port=65535
verbose

# Logging
log-file=/var/log/turnserver.log
syslog

# Bandwidth (adjust based on your needs)
max-bps=1000000
bps-capacity=0
```

Generate a secure secret:
```bash
# Generate random secret
openssl rand -hex 32
# Copy this value and use it in static-auth-secret above
```

Enable and start Coturn:
```bash
# Enable Coturn
sudo sed -i 's/#TURNSERVER_ENABLED/TURNSERVER_ENABLED/' /etc/default/coturn

# Start Coturn service
sudo systemctl enable coturn
sudo systemctl start coturn

# Check status
sudo systemctl status coturn
```

## Database Setup

### Step 5: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;

# Enable required extensions
\c metalingua
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

# Exit PostgreSQL
\q
```

### Step 6: Configure PostgreSQL for Remote Access (if needed)

```bash
# Edit PostgreSQL configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Add/modify:
listen_addresses = 'localhost'  # Or '*' for all interfaces

# Edit pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Add:
host    metalingua    metalingua_user    127.0.0.1/32    md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

## Application Configuration

### Step 7: Create Environment Configuration

```bash
cd /opt/metalingua

# Create .env file
sudo nano .env
```

Add the following environment variables:

```env
# Database Configuration
DATABASE_URL=postgresql://metalingua_user:your_secure_password_here@localhost:5432/metalingua

# Application Settings
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security
JWT_SECRET=your_very_long_random_jwt_secret_here
JWT_REFRESH_SECRET=another_very_long_random_secret_here
SESSION_SECRET=yet_another_very_long_random_secret_here

# TURN Server Configuration
TURN_SERVER_URL=turn:YOUR_SERVER_IP:3478
TURN_SECRET=YOUR_TURN_SECRET_FROM_STEP_4

# File Upload Settings
UPLOAD_DIR=/opt/metalingua/uploads
MAX_FILE_SIZE=10485760

# Email Settings (optional, for notifications)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password

# SMS Service (for Iranian users)
KAVENEGAR_API_KEY=your_kavenegar_api_key

# VoIP Settings (if using Isabel)
VOIP_SERVER=your-voip-server.com
VOIP_USERNAME=your-voip-username
VOIP_PASSWORD=your-voip-password

# AI Service (Ollama - local)
OLLAMA_HOST=http://localhost:11434
```

Generate secure secrets:
```bash
# Generate JWT secrets
openssl rand -base64 64  # For JWT_SECRET
openssl rand -base64 64  # For JWT_REFRESH_SECRET
openssl rand -base64 64  # For SESSION_SECRET
```

### Step 8: Initialize Database

```bash
cd /opt/metalingua

# Run database migrations
npm run db:push

# Seed initial data (if available)
npm run db:seed
```

## Running the Application

### Step 9: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/metalingua
```

Add the following configuration:

```nginx
upstream metalingua_backend {
    server 127.0.0.1:5000;
    keepalive 64;
}

server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # Replace with your domain

    # SSL Configuration
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/metalingua_access.log;
    error_log /var/log/nginx/metalingua_error.log;

    # Client upload size
    client_max_body_size 100M;

    # Main application
    location / {
        proxy_pass http://metalingua_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://metalingua_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /uploads {
        alias /opt/metalingua/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:
```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/metalingua /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 10: Start Application with PM2

```bash
cd /opt/metalingua

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Add the following:

```javascript
module.exports = {
  apps: [{
    name: 'metalingua',
    script: 'npm',
    args: 'run start',
    cwd: '/opt/metalingua',
    instances: 2,
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/pm2/metalingua-error.log',
    out_file: '/var/log/pm2/metalingua-out.log',
    log_file: '/var/log/pm2/metalingua-combined.log',
    time: true
  }]
};
```

Start the application:
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command it outputs

# Check status
pm2 status
pm2 logs metalingua
```

## Post-Installation Steps

### Step 11: Configure Firewall

```bash
# Allow required ports
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3478/tcp  # TURN
sudo ufw allow 3478/udp  # TURN
sudo ufw allow 5349/tcp  # TURN TLS
sudo ufw allow 5349/udp  # TURN TLS
sudo ufw allow 49152:65535/udp  # TURN relay ports

# Enable firewall
sudo ufw enable
```

### Step 12: Setup SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### Step 13: Create Admin Account

```bash
cd /opt/metalingua

# Run admin creation script (if available)
npm run create-admin

# Or use the application's first-run setup at:
# https://your-domain.com/setup
```

### Step 14: Setup Monitoring

```bash
# Install monitoring tools
sudo apt install -y htop nethogs iotop

# Setup PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# Optional: Setup external monitoring
# - Install Prometheus Node Exporter
# - Configure Grafana dashboards
```

### Step 15: Configure Backups

```bash
# Create backup script
sudo nano /opt/metalingua/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/backup/metalingua"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U metalingua_user metalingua > $BACKUP_DIR/db_$DATE.sql

# Backup uploaded files
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /opt/metalingua/uploads

# Backup configuration
tar -czf $BACKUP_DIR/config_$DATE.tar.gz /opt/metalingua/.env

# Keep only last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Make it executable and schedule:
```bash
chmod +x /opt/metalingua/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/metalingua/backup.sh
```

## Testing Your Installation

### Step 16: Verify All Services

```bash
# Check all services
sudo systemctl status postgresql
sudo systemctl status nginx
sudo systemctl status coturn
pm2 status

# Test database connection
psql -U metalingua_user -d metalingua -h localhost

# Test TURN server
turnutils_uclient -v -t -T -u metalingua -w YOUR_TURN_SECRET YOUR_SERVER_IP

# Check application logs
pm2 logs metalingua --lines 100
```

### Step 17: Access the Application

1. Open your browser and navigate to: `https://your-domain.com`
2. You should see the Meta Lingua login page
3. Login with the admin account created in Step 13
4. Test key features:
   - User registration
   - Course creation
   - Video calling (Callern system)
   - File uploads
   - Payment processing (if configured)

## Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection string in .env
# Verify database exists
sudo -u postgres psql -l

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 2. TURN Server Not Working
```bash
# Check Coturn status
sudo systemctl status coturn

# Test TURN connectivity
turnutils_uclient -v YOUR_SERVER_IP

# Check Coturn logs
sudo journalctl -u coturn -f

# Verify firewall rules
sudo ufw status verbose
```

#### 3. Application Not Starting
```bash
# Check PM2 logs
pm2 logs metalingua --err

# Check Node.js version
node --version

# Verify all dependencies installed
cd /opt/metalingua && npm install

# Check disk space
df -h

# Check memory usage
free -m
```

#### 4. WebSocket/Video Calls Not Working
```bash
# Check Nginx WebSocket configuration
# Verify /socket.io/ location block exists

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://your-domain.com/socket.io/

# Check browser console for errors
# Ensure HTTPS is properly configured
```

#### 5. Performance Issues
```bash
# Increase PM2 instances
pm2 scale metalingua +2

# Check CPU and memory
htop

# Optimize PostgreSQL
sudo nano /etc/postgresql/14/main/postgresql.conf
# Adjust shared_buffers, work_mem, etc.

# Enable Nginx caching
# Add to Nginx config:
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=cache:10m;
```

## Maintenance

### Regular Maintenance Tasks

#### Daily
- Check application logs: `pm2 logs metalingua`
- Monitor disk space: `df -h`
- Check backup completion

#### Weekly
- Update system packages: `sudo apt update && sudo apt upgrade`
- Review error logs: `pm2 logs metalingua --err`
- Test TURN server connectivity

#### Monthly
- Update Node.js dependencies: `npm audit fix`
- Review and rotate logs
- Test backup restoration
- Check SSL certificate expiry

## Security Checklist

- [ ] Change all default passwords
- [ ] Configure firewall rules
- [ ] Enable SSL/TLS
- [ ] Set up regular backups
- [ ] Configure fail2ban for SSH
- [ ] Disable root SSH login
- [ ] Keep all software updated
- [ ] Monitor access logs
- [ ] Set up intrusion detection
- [ ] Configure rate limiting

## Support Resources

### Log Files Location
- Application logs: `/var/log/pm2/`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`
- Coturn logs: `/var/log/turnserver.log`

### Configuration Files
- Application: `/opt/metalingua/.env`
- Nginx: `/etc/nginx/sites-available/metalingua`
- PostgreSQL: `/etc/postgresql/14/main/`
- Coturn: `/etc/turnserver.conf`

### Getting Help
- Check application logs first
- Review this documentation
- Contact system administrator
- Submit issues to the development team

## Notes for Iranian Deployment

### Special Considerations
1. All services are self-hosted within Iran
2. No dependency on blocked external services
3. SMS service uses Kavenegar (Iranian provider)
4. Payment gateway uses Shetab network
5. TURN server ensures video calls work within Iranian networks

### Network Configuration
- Ensure your ISP allows required ports
- Consider bandwidth limitations
- Test with Iranian mobile networks
- Configure proper MTU size for local networks

## Final Checklist

Before going live:
- [ ] All services running and healthy
- [ ] SSL certificate installed and working
- [ ] Firewall configured properly
- [ ] Backup system tested
- [ ] Admin account created
- [ ] TURN server tested for video calls
- [ ] Database backed up
- [ ] Monitoring configured
- [ ] Documentation updated with server specifics
- [ ] Emergency procedures documented

## Congratulations!

Your Meta Lingua installation is now complete. The system should be fully operational with:
- Web application accessible via HTTPS
- Database storing all application data
- TURN server enabling video calls
- Automatic backups protecting your data
- Process management ensuring uptime

For any issues, refer to the troubleshooting section or contact support.