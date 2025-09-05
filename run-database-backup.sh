#!/bin/bash

# Meta Lingua Database Backup Restoration Script
# Run this on your Iranian server to restore the complete database

echo "🚀 Starting Meta Lingua Database Backup Restoration..."
echo "====================================================="

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Backup current database (safety measure)
echo "📦 Creating safety backup of current database..."
pg_dump -h localhost -U postgres metalingua > "metalingua_backup_$(date +%Y%m%d_%H%M%S).sql"

# Run the restoration
echo "🔄 Restoring production database backup..."
psql -h localhost -U postgres -d metalingua -f complete-database-backup-2025-09-05.sql

# Check if restoration was successful
if [ $? -eq 0 ]; then
    echo "✅ Database backup restoration completed successfully!"
    echo ""
    echo "🎯 PRODUCTION USERS READY:"
    echo "👤 Admin: admin@test.com / password"
    echo "🎓 Student: sara.ahmadi@gmail.com / password (30M IRR + Callern)"
    echo "🎓 Student: mohammad.rezaei@gmail.com / password (30M IRR + Callern)"
    echo "👨‍🏫 Teacher: dr.smith@institute.com / password (Callern Authorized)"
    echo "👨‍🏫 Teacher: ali.hosseini@institute.com / password (Callern Authorized)"
    echo "👩‍💼 Supervisor: supervisor@metalingua.com / password"
    echo ""
    echo "🚀 Ready for Callern AI testing!"
    echo "💡 Make sure to update your .env file with:"
    echo "   OLLAMA_HOST=http://localhost:11434"
    echo "   WHISPER_API_URL=http://localhost:8000"
    echo "   TTS_API_URL=http://localhost:5002"
else
    echo "❌ Database restoration failed. Check the error messages above."
    exit 1
fi