# Meta Lingua - Simple Deployment Instructions

## Your Complete Deployment Package

I've prepared everything you need to deploy Meta Lingua on your own server.

## Files Created for You:

1. **deploy.sh** - Automated deployment script
2. **quick-deploy.sh** - Interactive deployment helper
3. **nginx-example.conf** - Nginx configuration template
4. **DEPLOYMENT_GUIDE.md** - Detailed deployment guide

## Quick Deployment Steps

### 1. Transfer Code to Your Server

```bash
# On your local machine, run:
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
git checkout replit-agent
```

Or download directly from Replit and transfer via SCP:
```bash
scp -r * root@YOUR_SERVER_IP:/var/www/metalingua/
```

### 2. On Your Server, Run:

```bash
cd /var/www/metalingua
chmod +x quick-deploy.sh
./quick-deploy.sh
```

This script will guide you through:
- Installing dependencies
- Setting up database
- Configuring environment
- Building the application
- Starting with PM2

### 3. Database Credentials You'll Need:

When the script asks, provide:
- **Database Host**: localhost (or your DB server IP)
- **Database Name**: metalingua
- **Database User**: metalingua_user
- **Database Password**: (your secure password)

### 4. Optional API Keys:

If you have these services, add to `.env`:
- **OpenAI API Key**: For AI features
- **Kavenegar API Key**: For SMS in Iran
- **Shetab Credentials**: For payments in Iran

### 5. Start the Application:

```bash
# Build the application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 6. Setup Nginx (for domain access):

```bash
# Copy the nginx config
sudo cp nginx-example.conf /etc/nginx/sites-available/metalingua

# Update with your domain name
sudo nano /etc/nginx/sites-available/metalingua

# Enable the site
sudo ln -s /etc/nginx/sites-available/metalingua /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Important Information:

### Default Ports:
- **Application**: Port 5000
- **PostgreSQL**: Port 5432
- **Nginx**: Port 80/443

### Check if Running:
```bash
pm2 status
curl http://localhost:5000/api/branding
```

### View Logs:
```bash
pm2 logs metalingua
```

### Restart Application:
```bash
pm2 restart metalingua
```

## Database Setup Commands:

```sql
-- Run these in PostgreSQL
sudo -u postgres psql

CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH PASSWORD 'your_password';
GRANT ALL ON DATABASE metalingua TO metalingua_user;
\q
```

Then run migrations:
```bash
npm run db:push
```

## Your Server Requirements:

- Ubuntu/Debian Linux (recommended)
- 2GB+ RAM
- Node.js 18+
- PostgreSQL 14+
- Nginx (optional, for domain)

## Need Help?

1. Check logs: `pm2 logs metalingua`
2. Check database connection in `.env`
3. Ensure PostgreSQL is running: `sudo systemctl status postgresql`
4. Make sure port 5000 is accessible

The application will run on: `http://YOUR_SERVER_IP:5000`

With Nginx configured: `https://yourdomain.com`