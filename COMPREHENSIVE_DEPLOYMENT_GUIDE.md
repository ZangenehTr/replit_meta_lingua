
# Meta Lingua Platform - Comprehensive Deployment Guide

## Overview
Meta Lingua is a complete AI-enhanced multilingual language learning and institute management platform designed for self-hosting with zero external dependencies. This guide covers deployment on Replit for production use.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Configuration](#application-configuration)
5. [Service Integration](#service-integration)
6. [Deployment Process](#deployment-process)
7. [Post-Deployment Configuration](#post-deployment-configuration)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

---

## 1. Prerequisites

### System Requirements
- **Platform**: Replit (recommended for production)
- **Database**: PostgreSQL 14+
- **Node.js**: Version 18+
- **Storage**: 10GB minimum (50GB recommended)
- **Memory**: 4GB RAM minimum (8GB recommended)

### Required Accounts & Services
- Replit Pro account (for production deployment)
- PostgreSQL database (Neon or similar)
- Iranian SMS provider account (Kavenegar)
- Iranian payment gateway (Shetab)
- Email service (optional)
- VoIP service (Isabel - optional)

---

## 2. Environment Setup

### Step 1: Create Replit Project
1. Go to [replit.com](https://replit.com)
2. Click "Create Repl"
3. Select "Import from GitHub" or upload the Meta Lingua codebase
4. Choose "Node.js" as the template
5. Name your repl (e.g., "metalingua-production")

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@host:port/database
NODE_ENV=production

# Application Settings
PORT=5000
HOST=0.0.0.0
JWT_SECRET=your-very-long-random-jwt-secret-here
JWT_REFRESH_SECRET=another-very-long-random-secret-here
SESSION_SECRET=yet-another-very-long-random-secret-here

# AI Services (Local - Ollama)
OLLAMA_HOST=http://0.0.0.0:11434
OLLAMA_ENABLED=true

# Iranian SMS Service (Kavenegar)
KAVENEGAR_API_KEY=your-kavenegar-api-key
KAVENEGAR_SENDER=your-sender-number
SMS_ENABLED=true

# Iranian Payment Gateway (Shetab)
SHETAB_MERCHANT_ID=your-merchant-id
SHETAB_TERMINAL_ID=your-terminal-id
SHETAB_PRIVATE_KEY=your-private-key
PAYMENT_ENABLED=true

# VoIP Integration (Isabel - Optional)
VOIP_SERVER_ADDRESS=your-isabel-server-ip
VOIP_PORT=5038
VOIP_USERNAME=your-voip-username
VOIP_PASSWORD=your-voip-password
VOIP_ENABLED=false

# File Upload Settings
UPLOAD_DIR=/tmp/uploads
MAX_FILE_SIZE=50MB

# Email Settings (Optional)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USER=your-email@domain.com
SMTP_PASS=your-email-password
EMAIL_ENABLED=false

# Security Settings
CORS_ORIGIN=*
RATE_LIMIT_ENABLED=true
```

### Step 3: Generate Secure Secrets
Use the following commands to generate secure secrets:

```bash
# Generate JWT secrets (run in Shell)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 3. Database Configuration

### Step 1: Set Up PostgreSQL Database
1. **Using Neon (Recommended for Replit)**:
   - Go to [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string
   - Add to `DATABASE_URL` in `.env`

2. **Alternative: Self-hosted PostgreSQL**:
   ```bash
   # If using local PostgreSQL
   createdb metalingua
   createuser metalingua_user
   ```

### Step 2: Initialize Database Schema
Run the database migration:

```bash
npm run db:push
```

### Step 3: Create Initial Admin User
```bash
# Run in Shell to create admin account
node -e "
const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  await client.query(\`
    INSERT INTO users (email, password, first_name, last_name, role, is_active)
    VALUES ('admin@metalingua.com', $1, 'System', 'Administrator', 'Admin', true)
    ON CONFLICT (email) DO NOTHING
  \`, [hashedPassword]);
  
  console.log('Admin user created: admin@metalingua.com / admin123');
  await client.end();
}

createAdmin().catch(console.error);
"
```

---

## 4. Application Configuration

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Build Application
```bash
npm run build
```

### Step 3: Configure Replit for Production
Update `.replit` file:

```toml
run = "npm run dev"
hidden = [".config", "package-lock.json"]
modules = ["nodejs-18"]

[nix]
channel = "stable-23.11"

[deployment]
run = ["sh", "-c", "npm run build && npm start"]
deploymentTarget = "cloudrun"

[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx,*.json}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"

[env]
NODE_ENV = "production"
```

---

## 5. Service Integration

### Step 1: Configure Ollama (AI Services)
```bash
# Install Ollama in Shell
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve &

# Download required models
ollama pull llama3.2:3b
ollama pull mistral:7b
```

### Step 2: Set Up SMS Service (Kavenegar)
1. Register at [kavenegar.com](https://kavenegar.com)
2. Get API key from dashboard
3. Configure sender number
4. Test SMS functionality:

```bash
# Test SMS in Shell
curl -X POST "https://api.kavenegar.com/v1/YOUR_API_KEY/sms/send.json" \
  -d "receptor=09123456789" \
  -d "sender=YOUR_SENDER" \
  -d "message=Test message from Meta Lingua"
```

### Step 3: Configure Payment Gateway (Shetab)
1. Contact your Iranian bank for Shetab merchant account
2. Obtain merchant ID, terminal ID, and private key
3. Configure in environment variables
4. Test payment integration

### Step 4: Set Up VoIP (Optional - Isabel)
1. Configure Isabel VoIP server details
2. Test connection:

```bash
# Test VoIP connection
npm run test:voip
```

---

## 6. Deployment Process

### Step 1: Final Configuration Check
```bash
# Verify all environment variables
npm run config:check

# Run system health check
npm run health:check
```

### Step 2: Deploy on Replit
1. **Using Replit Deployments**:
   - Click the "Deploy" button in Replit
   - Choose "Autoscale Deployment"
   - Configure domain (optional)
   - Set environment variables
   - Deploy

2. **Manual Deployment**:
   ```bash
   # Start production server
   npm start
   ```

### Step 3: Configure Domain (Optional)
1. In Replit Deployments, add custom domain
2. Configure DNS settings:
   ```
   Type: CNAME
   Name: www
   Value: your-repl-name.replit.app
   ```

---

## 7. Post-Deployment Configuration

### Step 1: Access Admin Panel
1. Navigate to `https://your-domain.com`
2. Login with admin credentials: `admin@metalingua.com / admin123`
3. Change default password immediately

### Step 2: Configure System Settings
1. **Branding Configuration**:
   - Go to Admin → System → Branding
   - Upload institute logo
   - Set primary/secondary colors
   - Configure institute name and description

2. **SMS Settings**:
   - Go to Admin → Settings → SMS Configuration
   - Enter Kavenegar API key
   - Set sender number
   - Test SMS functionality

3. **Payment Configuration**:
   - Go to Admin → Settings → Payment Gateway
   - Configure Shetab credentials
   - Set currency (IRR)
   - Test payment flow

4. **AI Services**:
   - Go to Admin → AI Services
   - Verify Ollama connection
   - Download additional models if needed

### Step 3: Create User Roles and Permissions
1. Go to Admin → User Management → Roles
2. Configure permissions for each role:
   - **Students**: Course access, Callern, wallet, progress tracking
   - **Teachers**: Class management, Callern authorization, student reports
   - **Mentors**: Student guidance, progress monitoring
   - **Supervisors**: Quality assurance, teacher oversight
   - **Call Center**: Lead management, CRM workflows
   - **Accountants**: Financial reports, payment management

### Step 4: Set Up Course Catalog
1. **Create Course Categories**:
   - General English
   - Business English
   - IELTS Preparation
   - Conversation Practice

2. **Add Sample Courses**:
   - Use Admin → Course Management
   - Import provided sample courses
   - Assign teachers to courses

### Step 5: Configure Callern (Video Tutoring)
1. **Authorize Teachers**:
   - Go to Admin → Callern Management
   - Select teachers for video tutoring
   - Set hourly rates (default: 600,000 IRR/hour)

2. **Create Session Packages**:
   - Go to Admin → Callern → Packages
   - Create packages (e.g., "10 Hours English" - 5,000,000 IRR)

---

## 8. Monitoring & Maintenance

### Step 1: Set Up Monitoring
1. **Health Monitoring**:
   ```bash
   # Check system health
   curl https://your-domain.com/api/health
   ```

2. **Database Monitoring**:
   - Monitor connection count
   - Check query performance
   - Monitor storage usage

3. **Application Monitoring**:
   - Check error logs: `npm run logs`
   - Monitor memory usage
   - Track API response times

### Step 2: Regular Maintenance Tasks

#### Daily
- Check application logs
- Monitor system resources
- Verify payment transactions

#### Weekly
- Update AI models
- Review user activity reports
- Check SMS delivery rates

#### Monthly
- Database optimization
- Security updates
- Backup verification
- Performance optimization

### Step 3: Backup Strategy
1. **Database Backups**:
   ```bash
   # Daily automated backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
   ```

2. **File Backups**:
   ```bash
   # Backup uploaded files
   tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
   ```

3. **Configuration Backup**:
   ```bash
   # Backup environment and configuration
   cp .env .env.backup.$(date +%Y%m%d)
   ```

---

## 9. Troubleshooting

### Common Issues and Solutions

#### 1. Database Connection Error
```bash
# Check database status
npm run db:status

# Reconnect to database
npm run db:reconnect
```

**Solutions**:
- Verify DATABASE_URL in .env
- Check database server status
- Ensure firewall allows connections

#### 2. AI Services Not Working
```bash
# Check Ollama status
curl http://0.0.0.0:11434/api/tags

# Restart Ollama
pkill ollama && ollama serve &
```

**Solutions**:
- Restart Ollama service
- Download missing models
- Check disk space

#### 3. SMS Not Sending
```bash
# Test Kavenegar API
curl -X POST "https://api.kavenegar.com/v1/$KAVENEGAR_API_KEY/account/info.json"
```

**Solutions**:
- Verify API key
- Check account balance
- Validate phone number format

#### 4. Video Calls Not Connecting
**Solutions**:
- Check WebRTC configuration
- Verify TURN server settings
- Test network connectivity

#### 5. Payment Gateway Errors
**Solutions**:
- Verify Shetab credentials
- Check merchant account status
- Test with small amount

### Performance Optimization

#### 1. Database Optimization
```sql
-- Optimize frequently queried tables
REINDEX DATABASE metalingua;
VACUUM ANALYZE;

-- Add missing indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(student_id);
```

#### 2. Application Optimization
```bash
# Enable gzip compression
export COMPRESSION_ENABLED=true

# Optimize bundle size
npm run build:optimize
```

#### 3. Caching Strategy
- Enable Redis for session storage (optional)
- Implement API response caching
- Cache static assets

---

## Security Checklist

### Pre-Production Security
- [ ] Change all default passwords
- [ ] Configure secure JWT secrets
- [ ] Enable HTTPS (handled by Replit)
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Validate all user inputs
- [ ] Enable SQL injection protection

### Ongoing Security
- [ ] Regular security updates
- [ ] Monitor failed login attempts
- [ ] Review user permissions
- [ ] Audit API access logs
- [ ] Backup encryption
- [ ] Secure file uploads

---

## Support and Documentation

### Getting Help
1. **Application Logs**: Check `/var/log/metalingua/`
2. **Database Logs**: Check PostgreSQL logs
3. **System Logs**: Use `npm run logs`

### Documentation Resources
- API Documentation: `/api/docs`
- User Manual: See BUYER_MANUAL.md
- System Architecture: See META_LINGUA_DETAILED_REPORT.md

### Contact Information
- Technical Support: Configure in Admin → Settings
- Emergency Contact: Set up 24/7 monitoring

---

## Conclusion

This deployment guide provides a complete setup process for Meta Lingua platform. The system is designed for Iranian market requirements with local payment gateways, SMS services, and AI processing capabilities.

**Key Success Factors**:
1. Follow all steps in sequence
2. Test each component thoroughly
3. Configure monitoring from day one
4. Maintain regular backups
5. Keep security measures updated

**Next Steps**:
1. Complete deployment following this guide
2. Review the Buyer's Manual for feature usage
3. Train staff on system administration
4. Set up user onboarding processes
5. Begin marketing and user acquisition

The Meta Lingua platform is production-ready and designed to scale with your institute's growth while maintaining complete data sovereignty and compliance with Iranian regulations.
