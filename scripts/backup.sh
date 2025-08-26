#!/bin/bash

# Meta Lingua Database Backup Script
# Automated backup for PostgreSQL database

set -e

# Configuration
BACKUP_DIR=${BACKUP_DIR:-./backup}
DB_NAME=${DB_NAME:-metalingua}
DB_USER=${DB_USER:-metalingua}
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="metalingua_backup_${TIMESTAMP}.sql.gz"

echo "========================================="
echo "Meta Lingua Database Backup"
echo "Started at: $(date)"
echo "========================================="

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

# Perform backup
echo "Backing up database: ${DB_NAME}..."

if [ -f /.dockerenv ]; then
    # Running inside Docker
    pg_dump -U ${DB_USER} -d ${DB_NAME} | gzip > ${BACKUP_DIR}/${BACKUP_FILE}
else
    # Running on host
    docker exec metalingua-db pg_dump -U ${DB_USER} -d ${DB_NAME} | gzip > ${BACKUP_DIR}/${BACKUP_FILE}
fi

# Check backup file size
BACKUP_SIZE=$(du -h ${BACKUP_DIR}/${BACKUP_FILE} | cut -f1)
echo "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE})"

# Remove old backups
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
find ${BACKUP_DIR} -name "metalingua_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List current backups
echo ""
echo "Current backups:"
ls -lh ${BACKUP_DIR}/metalingua_backup_*.sql.gz 2>/dev/null || echo "No backups found"

echo ""
echo "========================================="
echo "Backup completed successfully!"
echo "Backup location: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "========================================="

# Optional: Upload to remote storage (S3 compatible)
# Uncomment and configure if needed
# if [ ! -z "${S3_BUCKET}" ]; then
#     echo "Uploading to S3..."
#     aws s3 cp ${BACKUP_DIR}/${BACKUP_FILE} s3://${S3_BUCKET}/backups/
# fi