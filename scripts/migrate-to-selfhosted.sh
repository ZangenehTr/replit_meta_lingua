#!/bin/bash

# Meta Lingua Database Migration Script
# Migrate from Neon (development) to Self-Hosted PostgreSQL (production - Iran)
# This script handles complete data migration with verification

set -e

echo "========================================="
echo "Meta Lingua Database Migration Tool"
echo "Neon (Development) → Self-Hosted (Production)"
echo "========================================="

# Configuration
BACKUP_DIR=${BACKUP_DIR:-./migration}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${BACKUP_DIR}/neon_export_${TIMESTAMP}.sql"
COMPRESSED_FILE="${EXPORT_FILE}.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${GREEN}[STEP]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Check required environment variables
check_env() {
    print_step "Checking environment configuration..."
    
    if [ -z "$NEON_DATABASE_URL" ]; then
        print_error "NEON_DATABASE_URL is not set. Please set it to your Neon database URL."
        echo "Example: export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/neondb'"
        exit 1
    fi
    
    if [ -z "$SELFHOST_DATABASE_URL" ] && [ "$1" == "import" ]; then
        print_error "SELFHOST_DATABASE_URL is not set. Please set it to your self-hosted PostgreSQL URL."
        echo "Example: export SELFHOST_DATABASE_URL='postgresql://user:pass@localhost:5432/metalingua'"
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Check required tools
check_tools() {
    print_step "Checking required tools..."
    
    for tool in pg_dump psql gzip; do
        if ! command -v $tool &> /dev/null; then
            print_error "$tool is not installed. Please install PostgreSQL client tools."
            exit 1
        fi
    done
    
    print_success "All required tools available"
}

# Export from Neon
export_from_neon() {
    print_step "Exporting data from Neon database..."
    
    mkdir -p ${BACKUP_DIR}
    
    # Export full database with schema and data
    echo "  - Exporting schema and data..."
    pg_dump "${NEON_DATABASE_URL}" \
        --format=plain \
        --no-owner \
        --no-acl \
        --if-exists \
        --clean \
        --create \
        --encoding=UTF8 \
        > "${EXPORT_FILE}"
    
    # Get file size
    EXPORT_SIZE=$(du -h "${EXPORT_FILE}" | cut -f1)
    
    # Count tables
    TABLE_COUNT=$(grep -c "CREATE TABLE" "${EXPORT_FILE}" || echo "0")
    
    print_success "Export completed"
    echo "  - Export file: ${EXPORT_FILE}"
    echo "  - File size: ${EXPORT_SIZE}"
    echo "  - Tables exported: ${TABLE_COUNT}"
    
    # Compress the export
    print_step "Compressing export file..."
    gzip -c "${EXPORT_FILE}" > "${COMPRESSED_FILE}"
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    print_success "Compressed to ${COMPRESSED_SIZE}"
}

# Import to self-hosted PostgreSQL
import_to_selfhost() {
    print_step "Importing data to self-hosted PostgreSQL..."
    
    if [ ! -f "${EXPORT_FILE}" ]; then
        print_error "Export file not found: ${EXPORT_FILE}"
        echo "Please run the export step first: ./migrate-to-selfhosted.sh export"
        exit 1
    fi
    
    # Check connection to self-hosted DB
    print_step "Verifying connection to self-hosted PostgreSQL..."
    if ! psql "${SELFHOST_DATABASE_URL}" -c "SELECT 1" > /dev/null 2>&1; then
        print_error "Cannot connect to self-hosted PostgreSQL"
        echo "Please verify your SELFHOST_DATABASE_URL and ensure PostgreSQL is running"
        exit 1
    fi
    print_success "Connection verified"
    
    # Create backup of existing self-hosted data (if any)
    print_warning "Creating backup of existing data (if any)..."
    SELFHOST_BACKUP="${BACKUP_DIR}/selfhost_backup_${TIMESTAMP}.sql.gz"
    pg_dump "${SELFHOST_DATABASE_URL}" --format=plain 2>/dev/null | gzip > "${SELFHOST_BACKUP}" || true
    
    # Import the data
    print_step "Importing data (this may take a while)..."
    psql "${SELFHOST_DATABASE_URL}" < "${EXPORT_FILE}"
    
    print_success "Import completed"
}

# Verify migration
verify_migration() {
    print_step "Verifying migration..."
    
    # Count records in key tables
    echo ""
    echo "Record counts in self-hosted database:"
    echo "----------------------------------------"
    
    for table in users courses enrollments payments linguaquest_lessons guest_progress_tracking; do
        count=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM ${table}" 2>/dev/null | tr -d ' ' || echo "N/A")
        echo "  ${table}: ${count} records"
    done
    
    echo ""
    
    # Check for essential data
    print_step "Checking essential data..."
    
    # Check admin user exists
    admin_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users WHERE role='Admin'" | tr -d ' ')
    if [ "$admin_check" -gt 0 ]; then
        print_success "Admin users found: ${admin_check}"
    else
        print_warning "No admin users found - you may need to seed test users"
    fi
    
    # Check teachers exist
    teacher_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users WHERE role='Teacher'" | tr -d ' ')
    if [ "$teacher_check" -gt 0 ]; then
        print_success "Teacher users found: ${teacher_check}"
    else
        print_warning "No teacher users found"
    fi
    
    echo ""
    print_success "Migration verification completed"
}

# Post-migration setup
post_migration() {
    print_step "Running post-migration setup..."
    
    echo ""
    echo "Next Steps for Iranian Self-Hosting:"
    echo "====================================="
    echo ""
    echo "1. Update your .env file with the new database URL:"
    echo "   DATABASE_URL=\${SELFHOST_DATABASE_URL}"
    echo ""
    echo "2. Configure local AI services:"
    echo "   OLLAMA_HOST=http://localhost:11434"
    echo "   OLLAMA_MODEL=llama3.2:3b"
    echo ""
    echo "3. Configure Iranian services:"
    echo "   KAVENEGAR_API_KEY=your-key"
    echo "   SHETAB_MERCHANT_ID=your-merchant-id"
    echo "   ISABEL_VOIP_SERVER=your-voip-server"
    echo ""
    echo "4. Set up TURN/STUN server for WebRTC"
    echo ""
    echo "5. Configure Nginx reverse proxy (see IRAN_DEPLOYMENT_GUIDE.md)"
    echo ""
    echo "6. Start the application:"
    echo "   npm run build && npm start"
    echo ""
    echo "7. Seed test users if needed:"
    echo "   curl -X POST http://localhost:5000/api/seed-test-users"
    echo ""
}

# Generate migration report
generate_report() {
    REPORT_FILE="${BACKUP_DIR}/migration_report_${TIMESTAMP}.txt"
    
    print_step "Generating migration report..."
    
    {
        echo "Meta Lingua Database Migration Report"
        echo "====================================="
        echo ""
        echo "Migration Date: $(date)"
        echo "Source: Neon (Development)"
        echo "Target: Self-Hosted PostgreSQL (Production)"
        echo ""
        echo "Export File: ${EXPORT_FILE}"
        echo "Compressed File: ${COMPRESSED_FILE}"
        echo ""
        echo "Table Record Counts:"
        echo "-------------------"
        
        for table in users courses enrollments payments linguaquest_lessons guest_progress_tracking visitor_chat_sessions custom_fonts blog_posts videos media_items; do
            count=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM ${table}" 2>/dev/null | tr -d ' ' || echo "N/A")
            echo "${table}: ${count}"
        done
        
        echo ""
        echo "Migration Status: COMPLETED"
        echo ""
        echo "Files Generated:"
        echo "- Export: ${EXPORT_FILE}"
        echo "- Compressed: ${COMPRESSED_FILE}"
        echo "- Report: ${REPORT_FILE}"
        
    } > "${REPORT_FILE}"
    
    print_success "Report generated: ${REPORT_FILE}"
}

# Main menu
show_usage() {
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  export    - Export data from Neon database"
    echo "  import    - Import data to self-hosted PostgreSQL"
    echo "  verify    - Verify migration was successful"
    echo "  full      - Run complete migration (export + import + verify)"
    echo "  report    - Generate migration report"
    echo ""
    echo "Environment Variables Required:"
    echo "  NEON_DATABASE_URL     - Your Neon development database URL"
    echo "  SELFHOST_DATABASE_URL - Your self-hosted PostgreSQL URL"
    echo ""
    echo "Example:"
    echo "  export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/neondb'"
    echo "  export SELFHOST_DATABASE_URL='postgresql://user:pass@localhost:5432/metalingua'"
    echo "  $0 full"
    echo ""
}

# Main execution
case "$1" in
    export)
        check_env
        check_tools
        export_from_neon
        ;;
    import)
        check_env import
        check_tools
        import_to_selfhost
        ;;
    verify)
        check_env import
        verify_migration
        ;;
    full)
        check_env import
        check_tools
        export_from_neon
        import_to_selfhost
        verify_migration
        post_migration
        generate_report
        ;;
    report)
        check_env import
        generate_report
        ;;
    *)
        show_usage
        ;;
esac

echo ""
echo "========================================="
echo "Migration tool finished"
echo "========================================="
