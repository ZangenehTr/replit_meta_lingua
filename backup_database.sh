#!/bin/bash
# Database backup script for Meta Lingua
# Use this to export data before migrating to self-hosted PostgreSQL

echo "Creating database backup for self-hosting migration..."
pg_dump $DATABASE_URL --no-owner --no-privileges --clean --if-exists > metalingua_backup_$(date +%Y%m%d).sql
echo "Backup created: metalingua_backup_$(date +%Y%m%d).sql"
echo "Transfer this file to your Iranian server and import with:"
echo "  psql -U your_user -d metalingua < metalingua_backup_$(date +%Y%m%d).sql"
