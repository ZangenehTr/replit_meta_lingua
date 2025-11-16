# Meta Lingua Platform - Deployment Guide for Iran

This guide provides step-by-step instructions for deploying the Meta Lingua platform on a self-hosted server in Iran.

## Prerequisites

Before starting, ensure your server has the following installed:

- **PostgreSQL** (version 14 or higher)
- **Node.js** (version 18 or higher)
- **Git** (for cloning the repository)
- **Nginx** (optional, for production deployment)

## Deployment Steps

### Step 1: Clone the Repository

```bash
git clone https://github.com/ZangenehTr/replit_meta_lingua.git
cd replit_meta_lingua
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages for the platform.

### Step 3: Configure Environment Variables

Create a `.env` file in the root directory with your database connection:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/metalingua

# JWT Secret (generate a random string)
JWT_SECRET=your-secure-random-string-here

# Application Settings
NODE_ENV=production
PORT=5000

# Optional: AI Services (if using local Ollama)
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=llama3.2

# Optional: SMS Service (Kavenegar)
KAVENEGAR_API_KEY=your-kavenegar-api-key

# Optional: Payment Gateway (Shetab)
SHETAB_MERCHANT_ID=your-merchant-id
SHETAB_TERMINAL_ID=your-terminal-id
```

**Important:** Replace the placeholder values with your actual configuration.

### Step 4: Create Database

Create a new PostgreSQL database:

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;
\q
```

### Step 5: Initialize Database Schema

Run the following command to create all database tables:

```bash
npm run db:push
```

This creates all 79+ tables needed for the platform (users, courses, payments, CallerN, LinguaQuest, etc.).

### Step 6: Seed Test Users

Start the application temporarily to access the seeding endpoints:

```bash
npm run dev
```

Then, in a new terminal or browser, call the seeding endpoint:

**Using curl:**
```bash
curl -X POST http://localhost:5000/api/seed-test-users
```

**Using browser:**
Open your browser and use a REST client extension, or use Postman to send a POST request to:
```
http://localhost:5000/api/seed-test-users
```

This creates 9 essential test users:

**Teachers (2):**
- sara.rezaei@example.com
- ali.mohammadi@example.com

**Students (2):**
- maryam.karimi@example.com (has CallerN service - 5 sessions)
- reza.ahmadi@example.com (has 10 billion rials in wallet)

**Admin Roles (5):**
- admin@metalingua.com (full system access)
- accountant@metalingua.com (financial management)
- callcenter@metalingua.com (student outreach)
- frontdesk@metalingua.com (reception duties)
- mentor@metalingua.com (student guidance)

**All test users have password:** `test123`

### Step 7: Seed LinguaQuest Lessons (Optional)

To add the 12 LinguaQuest educational lessons:

```bash
curl -X POST http://localhost:5000/api/content-bank/seed-lessons
```

This creates:
- 6 A1-A2 level lessons (beginner)
- 6 B1-C1 level lessons (intermediate to advanced)

### Step 8: Build for Production

Stop the development server (Ctrl+C) and build the production version:

```bash
npm run build
```

### Step 9: Start the Application

**For Development/Testing:**
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

**For Production with Process Manager (Recommended):**
```bash
# Install PM2
npm install -g pm2

# Start the application
pm2 start npm --name "metalingua" -- start

# Save PM2 configuration
pm2 save

# Set PM2 to start on system boot
pm2 startup
```

### Step 10: Access the Platform

Open your browser and navigate to:
```
http://localhost:5000
```

Or if accessing from another machine:
```
http://your-server-ip:5000
```

## Post-Deployment

### Login with Test Accounts

You can now login with any of the test user accounts:

1. Go to the login page
2. Use any test user email (e.g., `admin@metalingua.com`)
3. Password: `test123`
4. **Important:** Change these passwords after first login!

### Production Configuration (Optional)

For production deployment, consider:

1. **Nginx Reverse Proxy:** Configure Nginx to serve the application
2. **SSL Certificate:** Use Let's Encrypt for HTTPS
3. **Firewall:** Configure firewall rules (allow port 5000 or your chosen port)
4. **Backup:** Set up automated database backups
5. **Monitoring:** Configure server monitoring tools

### External Services Setup

Depending on your needs, configure:

- **Kavenegar SMS:** For SMS notifications
- **Shetab Payment Gateway:** For Iranian payments
- **Ollama AI Server:** For AI-powered features
- **Isabel VoIP:** For telephone integration

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use
```bash
# Check what's using port 5000
sudo lsof -i :5000

# Kill the process or change PORT in .env file
```

### Permission Issues
```bash
# Ensure correct ownership
sudo chown -R $USER:$USER /path/to/replit_meta_lingua
```

## Updating the Platform

To update to the latest version:

```bash
cd replit_meta_lingua
git pull origin main
npm install
npm run db:push
pm2 restart metalingua
```

## Support

For issues or questions, contact the development team or refer to the platform documentation in `replit.md`.

---

**Deployment Date:** November 2025  
**Platform Version:** 1.0  
**Database Tables:** 79+  
**Test Users:** 9  
**LinguaQuest Lessons:** 12
