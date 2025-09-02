#!/bin/bash

# Meta Lingua Quick Deployment Script
# Run this on your server after downloading the code

echo "======================================"
echo "Meta Lingua - Quick Deployment Script"
echo "======================================"
echo ""
echo "This script will help you deploy Meta Lingua on your server"
echo ""

# Step 1: Get the code from GitHub
echo "Step 1: Getting the latest code..."
echo "---------------------------------------"
echo "Run these commands to get the code:"
echo ""
echo "git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git metalingua"
echo "cd metalingua"
echo "git checkout replit-agent"
echo ""
read -p "Press Enter after you've cloned the repository..."

# Step 2: Install dependencies
echo ""
echo "Step 2: Installing dependencies..."
echo "---------------------------------------"
npm install

# Step 3: Create environment file
echo ""
echo "Step 3: Creating environment configuration..."
echo "---------------------------------------"
cat > .env << 'EOF'
# Database Configuration (PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/metalingua?sslmode=require
PGHOST=localhost
PGUSER=metalingua_user
PGPASSWORD=your_secure_password
PGDATABASE=metalingua
PGPORT=5432

# Security Keys (Auto-generated - DO NOT SHARE)
JWT_SECRET=CHANGE_THIS_TO_RANDOM_STRING_$(openssl rand -hex 32)
SESSION_SECRET=CHANGE_THIS_TO_RANDOM_STRING_$(openssl rand -hex 32)

# Server Configuration
NODE_ENV=production
PORT=5000

# Optional: OpenAI (for AI features)
OPENAI_API_KEY=

# Optional: Ollama (for self-hosted AI)
OLLAMA_HOST=http://45.89.239.250:11434
OLLAMA_MODEL=llama3.2b

# Optional: WebRTC TURN servers (for video calling)
TURN_SERVER_URL=
TURN_SERVER_USERNAME=
TURN_SERVER_CREDENTIAL=

# Optional: SMS Provider (Kavenegar for Iran)
KAVENEGAR_API_KEY=
KAVENEGAR_SENDER=

# Optional: Payment Gateway (Shetab for Iran)
SHETAB_MERCHANT_ID=
SHETAB_TERMINAL_ID=
SHETAB_API_KEY=
EOF

echo "✅ Created .env file"
echo ""
echo "⚠️  IMPORTANT: Edit the .env file and update:"
echo "   - Database credentials (DATABASE_URL, PGUSER, PGPASSWORD)"
echo "   - API keys if you have them"
echo ""
read -p "Press Enter after updating .env file..."

# Step 4: Setup database
echo ""
echo "Step 4: Setting up database..."
echo "---------------------------------------"
echo "Make sure PostgreSQL is installed and running"
echo ""
echo "Create database and user by running these commands in PostgreSQL:"
echo ""
echo "sudo -u postgres psql"
echo "CREATE DATABASE metalingua;"
echo "CREATE USER metalingua_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
echo "GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;"
echo "\q"
echo ""
read -p "Press Enter after creating the database..."

# Step 5: Run migrations
echo ""
echo "Step 5: Running database migrations..."
echo "---------------------------------------"
npm run db:push

# Step 6: Build the application
echo ""
echo "Step 6: Building the application..."
echo "---------------------------------------"
npm run build

# Step 7: Create PM2 configuration
echo ""
echo "Step 7: Creating PM2 configuration..."
echo "---------------------------------------"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'metalingua',
    script: './dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Step 8: Start the application
echo ""
echo "Step 8: Starting the application..."
echo "---------------------------------------"
echo ""
echo "To start with PM2 (recommended):"
echo "  npm install -g pm2"
echo "  pm2 start ecosystem.config.js"
echo "  pm2 save"
echo "  pm2 startup"
echo ""
echo "Or to start directly:"
echo "  NODE_ENV=production node dist/index.js"
echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Your application should be running on port 5000"
echo ""
echo "Next steps:"
echo "1. Set up Nginx as reverse proxy (see nginx-example.conf)"
echo "2. Configure SSL certificates"
echo "3. Set up firewall rules"
echo "4. Configure domain DNS"
echo ""
echo "To check if it's running:"
echo "  curl http://localhost:5000/api/branding"
echo ""