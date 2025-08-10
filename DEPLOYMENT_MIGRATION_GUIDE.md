# Meta Lingua - Database Migration Guide for Self-Hosting

## Development to Production Migration

This guide explains how to migrate from Replit's development database to your own self-hosted PostgreSQL in Iran.

### Current Development Setup
- **Database**: Replit PostgreSQL (for development only)
- **Connection**: `postgresql://runner@localhost:5432/metalingua_db?host=/tmp`
- **Location**: Temporary Replit environment

### Production Self-Hosting Requirements

#### 1. PostgreSQL Installation (for Iranian servers)
```bash
# For Ubuntu/Debian servers in Iran
sudo apt update
sudo apt install postgresql-14 postgresql-client-14

# For RHEL/CentOS/AlmaLinux
sudo yum install postgresql14-server postgresql14

# Initialize the database
sudo postgresql-setup initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

#### 2. Database Creation
```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE metalingua;
CREATE USER metalingua_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE metalingua TO metalingua_user;
\q
```

#### 3. Export Development Data from Replit
```bash
# On Replit, export the database structure and data
pg_dump postgresql://runner@localhost:5432/metalingua_db?host=/tmp > metalingua_backup.sql

# Download the backup file to your local machine
```

#### 4. Import to Production Server
```bash
# On your production server
psql -U metalingua_user -d metalingua < metalingua_backup.sql
```

#### 5. Environment Configuration
Create a `.env` file on your production server:
```env
# Production Database (Your own PostgreSQL in Iran)
DATABASE_URL=postgresql://metalingua_user:your_secure_password@localhost:5432/metalingua

# Other production settings
NODE_ENV=production
PORT=5000

# Iranian services (no external dependencies)
SMS_PROVIDER=kavenegar
PAYMENT_GATEWAY=shetab
```

#### 6. Network Configuration (Iran-specific)
```nginx
# Nginx configuration for reverse proxy
server {
    listen 80;
    server_name your-domain.ir;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Important Notes for Iranian Deployment

1. **No External Dependencies**: The production system uses only:
   - Self-hosted PostgreSQL
   - Local file storage
   - Iranian SMS providers (Kavenegar)
   - Iranian payment gateways (Shetab)

2. **Data Sovereignty**: All data remains within Iran's borders

3. **Backup Strategy**: Set up regular PostgreSQL backups:
```bash
# Daily backup script
pg_dump -U metalingua_user metalingua > /backups/metalingua_$(date +%Y%m%d).sql
```

4. **SSL Certificates**: Use Let's Encrypt or Iranian SSL providers

### Migration Checklist

- [ ] PostgreSQL 14+ installed on production server
- [ ] Database and user created
- [ ] Development data exported from Replit
- [ ] Data imported to production database
- [ ] Environment variables configured
- [ ] Nginx reverse proxy set up
- [ ] SSL certificate installed
- [ ] Backup system configured
- [ ] All external service dependencies removed
- [ ] Application tested with production database

### Support

For issues specific to Iranian hosting:
- Ensure all services are accessible within Iran
- No reliance on blocked services (Google, AWS, etc.)
- Use local CDNs if needed
- Configure proper RTL support for Persian/Arabic