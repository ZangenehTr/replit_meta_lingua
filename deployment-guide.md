# Meta Lingua Deployment Guide for Iranian Self-Hosting

## Prerequisites

### System Requirements
- **Server**: Linux (Ubuntu 20.04+ or CentOS 8+)
- **Node.js**: Version 18 or higher
- **PostgreSQL**: Version 14 or higher
- **RAM**: Minimum 4GB, Recommended 8GB+
- **Storage**: Minimum 50GB for application + database
- **Network**: Local Iranian network with Ollama server access

### Required Services
- **PostgreSQL Database** (local installation)
- **Ollama AI Server** (local installation) 
- **Iranian SMTP Server** (for email notifications)
- **Kavenegar SMS Service** (for OTP authentication)

## Step 1: Environment Setup

1. **Copy Environment File**:
   ```bash
   cp .env.production.example .env
   ```

2. **Configure Environment Variables**:
   Edit `.env` file with your Iranian server settings:
   
   ```bash
   # Database - CRITICAL: Use your local PostgreSQL
   DATABASE_URL=postgresql://username:password@localhost:5432/meta_lingua

   # Security - CRITICAL: Generate strong random keys
   JWT_SECRET=$(openssl rand -base64 32)
   SESSION_SECRET=$(openssl rand -base64 32)

   # Your domain
   APP_URL=https://metalingua.your-domain.ir
   CORS_ORIGIN=https://metalingua.your-domain.ir

   # SMS (Kavenegar)
   KAVENEGAR_API_KEY=your_kavenegar_key
   KAVENEGAR_SENDER=your_number

   # Local Ollama
   OLLAMA_HOST=http://localhost:11434
   ```

## Step 2: Database Setup

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib

   # CentOS/RHEL  
   sudo dnf install postgresql-server postgresql-contrib
   ```

2. **Create Database**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE meta_lingua;
   CREATE USER meta_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE meta_lingua TO meta_user;
   \q
   ```

3. **Run Database Migrations**:
   ```bash
   npm run db:push
   ```

## Step 3: Dependencies Installation

1. **Install Node.js Dependencies**:
   ```bash
   npm install --production
   ```

2. **Create Upload Directories**:
   ```bash
   mkdir -p uploads/{audio,videos/{raw,processed},teacher-photos,documents}
   chmod 755 uploads/
   ```

## Step 4: Ollama AI Setup

1. **Install Ollama** (on your Iranian server):
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama Service**:
   ```bash
   sudo systemctl start ollama
   sudo systemctl enable ollama
   ```

3. **Pull Required Models**:
   ```bash
   ollama pull llama3.2
   ```

## Step 5: Application Startup

1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   # Option 1: Direct start
   npm start

   # Option 2: Process Manager (recommended)
   npm install -g pm2
   pm2 start dist/index.js --name "meta-lingua"
   pm2 startup
   pm2 save
   ```

## Step 6: Create Admin User

After deployment, create the admin account via database:

```sql
-- Connect to your database
psql -h localhost -U meta_user -d meta_lingua

-- Insert admin user (password: admin123)
INSERT INTO users (email, password, role, first_name, last_name, phone_number) 
VALUES (
  'admin@metalingua.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'Admin',
  'User', 
  '+98xxxxxxxxxx'
);
```

## Troubleshooting Common Issues

### 1. Login 500 Error (Your Current Issue)

**Cause**: Missing JWT_SECRET environment variable

**Fix**: 
```bash
# Add to .env file
JWT_SECRET=your-super-secure-32-character-secret-key

# Restart application
pm2 restart meta-lingua
```

### 2. Database Connection Failed

**Cause**: Incorrect DATABASE_URL or PostgreSQL not running

**Fix**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql $DATABASE_URL -c "SELECT version();"
```

### 3. Ollama AI Not Responding

**Cause**: Ollama service not running or wrong host

**Fix**:
```bash
# Check Ollama status
sudo systemctl status ollama

# Test Ollama connection
curl http://localhost:11434/api/tags
```

### 4. File Upload Permissions

**Cause**: Upload directory permissions

**Fix**:
```bash
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/
```

## Security Recommendations

1. **Firewall Configuration**:
   ```bash
   # Only allow necessary ports
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

2. **SSL/TLS Setup**:
   Use Iranian SSL certificate providers or Let's Encrypt

3. **Database Security**:
   - Use strong passwords
   - Enable PostgreSQL SSL
   - Regular backups

4. **Application Security**:
   - Strong JWT secrets
   - Regular updates
   - Monitor logs

## Complete Independence Checklist

✅ **Database**: Local PostgreSQL (no AWS/external)
✅ **AI Processing**: Local Ollama server (no OpenAI) 
✅ **SMS**: Kavenegar Iranian service
✅ **Email**: Iranian SMTP servers
✅ **File Storage**: Local filesystem (no cloud)
✅ **Fonts**: Self-hosted Persian/Arabic fonts
✅ **WebRTC**: Self-hosted TURN/STUN servers

Your Meta Lingua platform is now completely independent and suitable for Iranian deployment!