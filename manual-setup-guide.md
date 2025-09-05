# Manual Setup Guide for Meta Lingua (Iran Deployment)

## Alternative Methods to Get the Code

### Method 1: Individual File Copy via Browser
Since zip download fails, you can copy files individually:

1. **Copy package.json**:
   - Open the file in Replit editor
   - Select all (Ctrl+A), copy (Ctrl+C)
   - Create the file on your server and paste

2. **Copy source directories**:
   - Do this for: client/, server/, shared/ directories
   - Copy each file individually through the browser

### Method 2: Git Repository (Recommended)
If you can create a Git repository:

```bash
# In your Replit shell
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

Then on your Iranian server:
```bash
git clone YOUR_GITHUB_REPO_URL metalingua
```

### Method 3: Direct Server Setup
Create the project structure manually on your server:

```bash
mkdir -p metalingua/{client,server,shared}
cd metalingua
```

Then copy the essential files I've listed.

## Essential Environment Setup

Create your .env file with:

```env
# Database
DATABASE_URL=postgresql://metalingua_user:YOUR_PASSWORD@localhost:5432/metalingua
PGHOST=localhost
PGUSER=metalingua_user
PGPASSWORD=YOUR_PASSWORD
PGDATABASE=metalingua
PGPORT=5432

# Security
JWT_SECRET=$(openssl rand -hex 32)
REFRESH_SECRET=$(openssl rand -hex 32)
SESSION_SECRET=$(openssl rand -hex 32)

# Server
NODE_ENV=production
PORT=5000

# Your AI Setup (with your existing Ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama2:latest
# Alternative: mistral:7b-instruct-q5_K_M

# Whisper & Coqui (adjust ports as needed)
WHISPER_HOST=http://localhost:8000
COQUI_HOST=http://localhost:5002

# Iranian Services (when available)
KAVENEGAR_API_KEY=
SHETAB_MERCHANT_ID=
SHETAB_TERMINAL_ID=
```

## Database Schema

Your PostgreSQL database needs these tables. Run this after connecting:

```sql
-- Core user management
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) DEFAULT 'student',
  phone VARCHAR(20),
  wallet_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Branding table (for institute customization)
CREATE TABLE branding (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) DEFAULT 'Meta Lingua Academy',
  logo TEXT DEFAULT '',
  primary_color VARCHAR(7) DEFAULT '#3B82F6',
  secondary_color VARCHAR(7) DEFAULT '#1E40AF',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default branding
INSERT INTO branding (name, logo) VALUES ('Meta Lingua Academy', '') ON CONFLICT (id) DO NOTHING;

-- Create admin user
INSERT INTO users (email, password_hash, first_name, last_name, role, wallet_balance) 
VALUES ('admin@test.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'admin', 30000000)
ON CONFLICT (email) DO NOTHING;
```

This gives you the basic structure to start. The app will automatically create additional tables when it runs.

## Quick Start Commands

Once you have the files:

```bash
# Install dependencies
npm install

# Setup database (make sure PostgreSQL is running)
npm run db:push

# Build application
npm run build

# Start with PM2
npm install -g pm2
pm2 start dist/index.js --name metalingua
pm2 save
pm2 startup
```

## Test Your Setup

```bash
# Check if running
curl http://localhost:5000/api/branding

# Check logs
pm2 logs metalingua
```

The app should respond with your institute's branding information when working correctly.