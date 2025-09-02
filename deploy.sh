#!/bin/bash

# Meta Lingua Deployment Script
# This script will deploy the Meta Lingua platform on your server

set -e  # Exit on error

echo "======================================"
echo "Meta Lingua Platform Deployment Script"
echo "======================================"

# Configuration - Update these values
DB_HOST="YOUR_DB_HOST"
DB_NAME="metalingua"
DB_USER="YOUR_DB_USER"
DB_PASSWORD="YOUR_DB_PASSWORD"
DB_PORT="5432"

# Optional: Your domain (for production)
DOMAIN="YOUR_DOMAIN.com"

# Node.js version requirement
NODE_VERSION="18"

echo ""
echo "Step 1: Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v${NODE_VERSION} or higher"
    exit 1
fi

NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
    echo "❌ Node.js version must be ${NODE_VERSION} or higher. Current: v${NODE_CURRENT}"
    exit 1
fi
echo "✅ Node.js version OK: $(node -v)"

echo ""
echo "Step 2: Installing dependencies..."
npm install --production=false

echo ""
echo "Step 3: Creating .env file..."
cat > .env << EOL
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require
PGHOST=${DB_HOST}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASSWORD}
PGDATABASE=${DB_NAME}
PGPORT=${DB_PORT}

# JWT Secret (Generate a secure random string)
JWT_SECRET=$(openssl rand -base64 32)

# Session Secret (Generate a secure random string)
SESSION_SECRET=$(openssl rand -base64 32)

# OpenAI Configuration (Optional - for AI features)
OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE

# Ollama Configuration (For self-hosted AI)
OLLAMA_HOST=http://45.89.239.250:11434
OLLAMA_MODEL=llama3.2b

# WebRTC TURN Server (Optional - for better video calling)
TURN_SERVER_URL=
TURN_SERVER_USERNAME=
TURN_SERVER_CREDENTIAL=

# SMS Provider (Kavenegar for Iran)
KAVENEGAR_API_KEY=
KAVENEGAR_SENDER=

# Payment Gateway (Shetab for Iran)
SHETAB_MERCHANT_ID=
SHETAB_TERMINAL_ID=
SHETAB_API_KEY=

# Application Settings
NODE_ENV=production
PORT=5000
APP_URL=https://${DOMAIN}

# Redis Configuration (Optional - for caching)
REDIS_URL=

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=./uploads
EOL

echo "✅ .env file created (Please update with your actual credentials)"

echo ""
echo "Step 4: Setting up database..."
echo "Running database migrations..."
npm run db:push || {
    echo "⚠️  Database migration failed. Please ensure PostgreSQL is running and credentials are correct."
    echo "You can manually run: npm run db:push"
}

echo ""
echo "Step 5: Creating necessary directories..."
mkdir -p uploads
mkdir -p logs
mkdir -p dist

echo ""
echo "Step 6: Building the application..."
npm run build

echo ""
echo "Step 7: Setting up PM2 for process management..."
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 globally..."
    npm install -g pm2
fi

# Create PM2 ecosystem file
cat > ecosystem.config.js << 'EOL'
module.exports = {
  apps: [{
    name: 'metalingua',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false
  }]
};
EOL

echo ""
echo "Step 8: Setting up Nginx configuration..."
cat > nginx.conf << EOL
server {
    listen 80;
    server_name ${DOMAIN};

    # Redirect to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    # SSL Configuration (update paths to your certificates)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # File upload size
    client_max_body_size 50M;

    # Proxy to Node.js application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }

    # Static files
    location /uploads {
        alias /var/www/metalingua/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
EOL

echo "✅ Nginx configuration created (nginx.conf)"

echo ""
echo "======================================"
echo "Deployment preparation complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Update the .env file with your actual credentials"
echo "2. Update nginx.conf with your SSL certificate paths"
echo "3. Copy nginx.conf to /etc/nginx/sites-available/${DOMAIN}"
echo "4. Enable the site: ln -s /etc/nginx/sites-available/${DOMAIN} /etc/nginx/sites-enabled/"
echo "5. Test nginx: nginx -t"
echo "6. Reload nginx: systemctl reload nginx"
echo "7. Start the application: pm2 start ecosystem.config.js"
echo "8. Save PM2 configuration: pm2 save"
echo "9. Setup PM2 to start on boot: pm2 startup"
echo ""
echo "To start the application manually (without PM2):"
echo "  NODE_ENV=production node dist/index.js"
echo ""
echo "To monitor the application:"
echo "  pm2 monit"
echo "  pm2 logs metalingua"
echo ""
echo "Application will be running on port 5000"
echo "Access it at: https://${DOMAIN}"