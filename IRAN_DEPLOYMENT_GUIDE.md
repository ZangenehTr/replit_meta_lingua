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

**IMPORTANT**: If you deployed before November 17, 2025, you need to update to get the test user seeding endpoint and other fixes.

To update to the latest version:

```bash
# Navigate to the project directory
cd replit_meta_lingua

# Pull the latest code from GitHub
git pull origin main

# Install any new dependencies
npm install

# Sync database schema (if there are schema changes)
npm run db:push

# Restart the server
# If using PM2:
pm2 restart metalingua

# If running manually (Ctrl+C to stop first, then):
npm run dev
```

After updating, verify the test seeding endpoint works:
```bash
curl -X POST http://localhost:5000/api/seed-test-users
```

You should see a response like:
```json
{
  "success": true,
  "message": "Created 9 test users successfully",
  "users": [...]
}
```

## Accessing the Platform

### For the First Time

After deployment, you can access the platform at:

```
http://localhost:5000
```

Or from another machine:
```
http://YOUR-SERVER-IP:5000
```

**Important**: The **homepage** (public marketing website) should display automatically when you visit the root URL. You should see:
- Hero section with "Learn Languages The Smart Way"
- Feature cards
- Statistics section
- Blog posts and videos (if any exist)
- CTA buttons to "Start Free Trial" or "Learn More"

**If you only see the login page**, follow the troubleshooting steps below.

### Logging In

Click "Login" in the top navigation or visit:
```
http://localhost:5000/auth
```

Use any of the test user credentials:
- Email: `admin@metalingua.com`
- Password: `test123`

After login, you'll be redirected to the dashboard based on your role.

## Troubleshooting

### Issue: Homepage Shows Login Page Instead

**Symptoms**: When visiting the root URL, you're immediately redirected to `/auth` or only see a login form.

**Causes**:
1. Database connection error causing authentication check to fail
2. Missing environment variables
3. Server not running or crashed

**Solutions**:

#### 1. Check if the server is running properly

Look at the terminal where you ran `npm run dev` or `npm start`. You should see:
```
✅ Database connected successfully
✅ Server initialized
serving on port 5000
```

If you see errors like:
- `❌ Database connection failed`
- `Error: connect ECONNREFUSED`
- `❌ FATAL: Cannot start server`

Then the database isn't configured correctly.

#### 2. Verify environment variables

Check your `.env` file exists and contains:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/metalingua
JWT_SECRET=your-secure-random-string
```

If the `.env` file is missing or `DATABASE_URL` is not set:
```bash
# Copy the example and edit it
cp .env.example .env

# Edit with your database credentials
nano .env
```

#### 3. Verify database exists and is running

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Try connecting to the database
psql -U metalingua_user -d metalingua -h localhost

# If it fails, create the database again (see Step 4)
```

#### 4. Check browser console for errors

Open your browser's Developer Tools (F12) and check the Console tab. Look for errors like:
- `Failed to fetch` - Server is not running
- `Network Error` - Database connection issue
- `500 Internal Server Error` - Check server logs

#### 5. Clear browser cache and localStorage

Sometimes old tokens cause issues:
```javascript
// In browser console (F12), run:
localStorage.clear()
// Then refresh the page
```

#### 6. Restart the server

```bash
# Stop the server (Ctrl+C)
# Then restart
npm run dev
```

### Issue: "Cannot connect to database" error

**Solution**:
1. Ensure PostgreSQL is running: `sudo systemctl start postgresql`
2. Verify database exists: `psql -l` (should list `metalingua`)
3. Check `.env` file has correct `DATABASE_URL`
4. Run: `npm run db:push` to create tables

### Issue: Port 5000 already in use

**Solution**:
```bash
# Find what's using port 5000
sudo lsof -i :5000

# Kill the process (replace PID with actual process ID)
kill -9 PID

# Or change the port in .env (not recommended)
PORT=5001
```

### Issue: Test users not found

**Symptoms**: Can't login with `admin@metalingua.com` / `test123`

**Solution**:
```bash
# Make sure the server is running
npm run dev

# In another terminal or browser, seed the test users
curl -X POST http://localhost:5000/api/seed-test-users

# You should see: "✅ Created 9 test users successfully"
```

### Issue: Missing LinguaQuest lessons

**Symptoms**: LinguaQuest page shows no lessons

**Solution**:
```bash
curl -X POST http://localhost:5000/api/content-bank/seed-lessons
```

## Support

For issues or questions, contact the development team or refer to the platform documentation in `replit.md`.

## Quick Reference

### Important URLs
- **Homepage**: `http://localhost:5000/`
- **Login**: `http://localhost:5000/auth`
- **Dashboard**: `http://localhost:5000/dashboard` (after login)
- **LinguaQuest**: `http://localhost:5000/linguaquest`
- **About**: `http://localhost:5000/about`
- **Contact**: `http://localhost:5000/contact`

### Test Credentials
All test users use password: `test123`

**Admins**:
- admin@metalingua.com
- accountant@metalingua.com
- callcenter@metalingua.com
- frontdesk@metalingua.com
- mentor@metalingua.com

**Teachers**:
- sara.rezaei@example.com
- ali.mohammadi@example.com

**Students**:
- maryam.karimi@example.com
- reza.ahmadi@example.com

---

**Deployment Date:** November 2025  
**Platform Version:** 1.0  
**Database Tables:** 79+  
**Test Users:** 9  
**LinguaQuest Lessons:** 12
