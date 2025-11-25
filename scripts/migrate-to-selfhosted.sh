#!/bin/bash

# Meta Lingua Database Migration Script
# Migrate from Neon (development) to Self-Hosted PostgreSQL (production - Iran)
# 
# IMPORTANT: This script is designed for institute administrators.
# For complex migrations, please consult with a database administrator.
#
# Prerequisites:
#   - PostgreSQL 14+ installed on target server
#   - PostgreSQL client tools (pg_dump, psql) installed
#   - Target database created and accessible
#   - Required extensions pre-installed (uuid-ossp, pgcrypto)
#
# Usage:
#   export NEON_DATABASE_URL='postgresql://...'
#   export SELFHOST_DATABASE_URL='postgresql://...'
#   ./migrate-to-selfhosted.sh export      # Export from Neon
#   ./migrate-to-selfhosted.sh import      # Import to self-hosted
#   ./migrate-to-selfhosted.sh verify      # Verify migration
#   ./migrate-to-selfhosted.sh full        # All steps with confirmations

set -e

echo "========================================="
echo "Meta Lingua Database Migration Tool"
echo "Neon (Development) → Self-Hosted (Production)"
echo "========================================="
echo ""

# Configuration
BACKUP_DIR=${BACKUP_DIR:-./migration}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
EXPORT_FILE="${BACKUP_DIR}/neon_export_${TIMESTAMP}.sql"
COMPRESSED_FILE="${EXPORT_FILE}.gz"
DRY_RUN=${DRY_RUN:-false}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Confirmation prompt
confirm() {
    local message="$1"
    local default="${2:-n}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would ask: $message"
        return 0
    fi
    
    if [ "$default" = "y" ]; then
        read -p "$message [Y/n]: " response
        response=${response:-y}
    else
        read -p "$message [y/N]: " response
        response=${response:-n}
    fi
    
    case "$response" in
        [yY][eE][sS]|[yY]) return 0 ;;
        *) return 1 ;;
    esac
}

# Check required environment variables
check_env() {
    print_step "Checking environment configuration..."
    
    if [ -z "$NEON_DATABASE_URL" ]; then
        print_error "NEON_DATABASE_URL is not set."
        echo ""
        echo "Please set it to your Neon database URL:"
        echo "  export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/neondb'"
        echo ""
        exit 1
    fi
    
    if [ -z "$SELFHOST_DATABASE_URL" ] && [ "$1" == "import" -o "$1" == "full" -o "$1" == "verify" ]; then
        print_error "SELFHOST_DATABASE_URL is not set."
        echo ""
        echo "Please set it to your self-hosted PostgreSQL URL:"
        echo "  export SELFHOST_DATABASE_URL='postgresql://user:pass@localhost:5432/metalingua'"
        echo ""
        exit 1
    fi
    
    print_success "Environment variables configured"
}

# Check required tools
check_tools() {
    print_step "Checking required tools..."
    
    local missing_tools=()
    
    for tool in pg_dump psql gzip; do
        if ! command -v $tool &> /dev/null; then
            missing_tools+=($tool)
        fi
    done
    
    if [ ${#missing_tools[@]} -gt 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        echo ""
        echo "Please install PostgreSQL client tools:"
        echo "  Ubuntu/Debian: sudo apt-get install postgresql-client"
        echo "  CentOS/RHEL:   sudo yum install postgresql"
        echo "  macOS:         brew install postgresql"
        echo ""
        exit 1
    fi
    
    print_success "All required tools available"
}

# Check target database prerequisites
check_prerequisites() {
    print_step "Checking target database prerequisites..."
    
    # Check connection
    if ! psql "${SELFHOST_DATABASE_URL}" -c "SELECT 1" > /dev/null 2>&1; then
        print_error "Cannot connect to self-hosted PostgreSQL"
        echo ""
        echo "Please verify:"
        echo "  1. PostgreSQL is running on the target server"
        echo "  2. The database exists"
        echo "  3. Your connection URL is correct"
        echo "  4. Network/firewall allows connection"
        echo ""
        exit 1
    fi
    
    # Check required extensions
    print_info "Checking required extensions..."
    local extensions="uuid-ossp"
    
    for ext in $extensions; do
        if ! psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT 1 FROM pg_extension WHERE extname='$ext'" | grep -q 1; then
            print_warning "Extension '$ext' not installed. Attempting to create..."
            if ! psql "${SELFHOST_DATABASE_URL}" -c "CREATE EXTENSION IF NOT EXISTS \"$ext\"" 2>/dev/null; then
                print_warning "Could not auto-install '$ext'. You may need to install it manually."
                echo "  Run: CREATE EXTENSION \"$ext\";"
            else
                print_success "Extension '$ext' created successfully"
            fi
        fi
    done
    
    print_success "Prerequisites check completed"
}

# Export from Neon
export_from_neon() {
    print_step "Exporting data from Neon database..."
    
    mkdir -p ${BACKUP_DIR}
    
    # Show what will be exported
    print_info "Analyzing source database..."
    local table_count=$(psql "${NEON_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')
    echo "  - Tables to export: ${table_count}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] Would export to: ${EXPORT_FILE}"
        return 0
    fi
    
    # Export schema and data (data-only mode for safer import)
    echo "  - Exporting schema and data..."
    pg_dump "${NEON_DATABASE_URL}" \
        --format=plain \
        --no-owner \
        --no-acl \
        --if-exists \
        --clean \
        --encoding=UTF8 \
        > "${EXPORT_FILE}"
    
    # Get file size
    EXPORT_SIZE=$(du -h "${EXPORT_FILE}" | cut -f1)
    
    # Count tables in export
    local exported_tables=$(grep -c "CREATE TABLE" "${EXPORT_FILE}" || echo "0")
    
    print_success "Export completed"
    echo "  - Export file: ${EXPORT_FILE}"
    echo "  - File size: ${EXPORT_SIZE}"
    echo "  - Tables exported: ${exported_tables}"
    
    # Compress the export
    print_step "Compressing export file..."
    gzip -c "${EXPORT_FILE}" > "${COMPRESSED_FILE}"
    COMPRESSED_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
    print_success "Compressed to ${COMPRESSED_SIZE}"
    
    echo ""
    print_info "Export file saved to: ${COMPRESSED_FILE}"
    echo "Transfer this file to your production server for import."
}

# Import to self-hosted PostgreSQL
import_to_selfhost() {
    print_step "Preparing import to self-hosted PostgreSQL..."
    
    # Find the export file (use most recent if not specified)
    if [ ! -f "${EXPORT_FILE}" ]; then
        EXPORT_FILE=$(ls -t ${BACKUP_DIR}/neon_export_*.sql 2>/dev/null | head -1)
        if [ -z "${EXPORT_FILE}" ]; then
            print_error "No export file found in ${BACKUP_DIR}"
            echo ""
            echo "Please run the export step first:"
            echo "  ./migrate-to-selfhosted.sh export"
            echo ""
            exit 1
        fi
        print_info "Using most recent export: ${EXPORT_FILE}"
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Show target database info
    local target_tables=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public'" | tr -d ' ')
    
    echo ""
    print_warning "Target database analysis:"
    echo "  - Existing tables: ${target_tables}"
    
    if [ "$target_tables" -gt 0 ]; then
        print_warning "The target database has existing tables!"
        echo "  - Import will DROP and recreate all tables"
        echo "  - Existing data will be REPLACED"
        echo ""
        
        if [ "$DRY_RUN" = "true" ]; then
            echo "[DRY RUN] Would proceed with import"
            return 0
        fi
        
        if ! confirm "Are you sure you want to proceed? This will replace existing data."; then
            print_info "Import cancelled by user"
            exit 0
        fi
    fi
    
    # Create backup of existing data
    if [ "$target_tables" -gt 0 ]; then
        print_step "Creating backup of existing data..."
        SELFHOST_BACKUP="${BACKUP_DIR}/selfhost_backup_${TIMESTAMP}.sql.gz"
        if pg_dump "${SELFHOST_DATABASE_URL}" --format=plain 2>/dev/null | gzip > "${SELFHOST_BACKUP}"; then
            print_success "Backup saved to: ${SELFHOST_BACKUP}"
        else
            print_warning "Could not create backup (may be empty database)"
        fi
    fi
    
    # Import the data
    print_step "Importing data (this may take a while)..."
    echo ""
    
    if psql "${SELFHOST_DATABASE_URL}" < "${EXPORT_FILE}" 2>&1; then
        print_success "Import completed successfully!"
    else
        print_error "Import encountered errors"
        echo ""
        echo "Common issues and solutions:"
        echo "  - Extension not found: Install required extensions manually"
        echo "  - Permission denied: Check database user permissions"
        echo "  - Relation already exists: Use a fresh database"
        echo ""
        if [ -n "${SELFHOST_BACKUP}" ]; then
            echo "Backup available at: ${SELFHOST_BACKUP}"
        fi
        exit 1
    fi
}

# Verify migration
verify_migration() {
    print_step "Verifying migration..."
    
    echo ""
    echo "Record counts in self-hosted database:"
    echo "----------------------------------------"
    
    # Check key tables
    local key_tables="users courses enrollments payments linguaquest_lessons guest_progress_tracking"
    local total_records=0
    
    for table in $key_tables; do
        count=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM ${table}" 2>/dev/null | tr -d ' ' || echo "N/A")
        if [ "$count" != "N/A" ]; then
            total_records=$((total_records + count))
        fi
        printf "  %-30s %s records\n" "${table}:" "${count}"
    done
    
    echo "----------------------------------------"
    echo "  Total records in key tables: ${total_records}"
    echo ""
    
    # Check essential data
    print_step "Checking essential data..."
    
    # Check admin user exists
    admin_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users WHERE role='Admin'" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$admin_check" -gt 0 ]; then
        print_success "Admin users found: ${admin_check}"
    else
        print_warning "No admin users found"
        echo "  Run POST /api/seed-test-users to create test users"
    fi
    
    # Check teachers exist
    teacher_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users WHERE role='Teacher'" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$teacher_check" -gt 0 ]; then
        print_success "Teacher users found: ${teacher_check}"
    fi
    
    # Check students exist
    student_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM users WHERE role='Student'" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$student_check" -gt 0 ]; then
        print_success "Student users found: ${student_check}"
    fi
    
    # Check courses exist
    course_check=$(psql "${SELFHOST_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM courses" 2>/dev/null | tr -d ' ' || echo "0")
    if [ "$course_check" -gt 0 ]; then
        print_success "Courses found: ${course_check}"
    else
        print_warning "No courses found - you may need to seed sample data"
    fi
    
    echo ""
    print_success "Migration verification completed"
}

# Show help
show_help() {
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  export    Export data from Neon database"
    echo "  import    Import data to self-hosted PostgreSQL"
    echo "  verify    Verify migration was successful"
    echo "  full      Run all steps (export, import, verify)"
    echo "  help      Show this help message"
    echo ""
    echo "Options:"
    echo "  DRY_RUN=true    Preview operations without executing"
    echo ""
    echo "Environment Variables:"
    echo "  NEON_DATABASE_URL       Source Neon database URL"
    echo "  SELFHOST_DATABASE_URL   Target self-hosted PostgreSQL URL"
    echo "  BACKUP_DIR              Directory for backups (default: ./migration)"
    echo ""
    echo "Examples:"
    echo "  # Export from Neon"
    echo "  export NEON_DATABASE_URL='postgresql://user:pass@ep-xxx.neon.tech/neondb'"
    echo "  $0 export"
    echo ""
    echo "  # Import to self-hosted"
    echo "  export SELFHOST_DATABASE_URL='postgresql://user:pass@localhost:5432/metalingua'"
    echo "  $0 import"
    echo ""
    echo "  # Full migration with dry run"
    echo "  DRY_RUN=true $0 full"
    echo ""
    echo "Manual Alternative (if script fails):"
    echo "  1. pg_dump \$NEON_DATABASE_URL > backup.sql"
    echo "  2. psql \$SELFHOST_DATABASE_URL < backup.sql"
    echo "  3. Run: npm run db:push (to sync schema)"
}

# Main execution
case "${1:-help}" in
    export)
        check_env export
        check_tools
        export_from_neon
        ;;
    import)
        check_env import
        check_tools
        import_to_selfhost
        ;;
    verify)
        check_env verify
        verify_migration
        ;;
    full)
        check_env full
        check_tools
        
        echo ""
        print_info "This will perform a full migration from Neon to self-hosted PostgreSQL."
        echo ""
        
        if [ "$DRY_RUN" != "true" ]; then
            if ! confirm "Ready to proceed with full migration?"; then
                print_info "Migration cancelled"
                exit 0
            fi
        fi
        
        export_from_neon
        echo ""
        import_to_selfhost
        echo ""
        verify_migration
        
        echo ""
        print_success "========================================="
        print_success "Migration completed successfully!"
        print_success "========================================="
        echo ""
        echo "Next steps:"
        echo "  1. Update your production environment variables"
        echo "  2. Set DATABASE_URL to your self-hosted PostgreSQL URL"
        echo "  3. Start the application and verify functionality"
        echo "  4. Run: npm run db:push (if schema updates needed)"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
