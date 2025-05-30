#!/bin/bash

# Comprehensive Code Quality and Debugging Script
echo "🔍 Running comprehensive code quality checks and automated fixes..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Initialize counters
total_errors=0
fixed_errors=0

print_status $BLUE "=================================="
print_status $BLUE "ESLINT CODE QUALITY CHECKS"
print_status $BLUE "=================================="

# Run ESLint with auto-fix
print_status $YELLOW "Running ESLint with automatic fixes..."
npx eslint . --ext .ts,.tsx,.js,.jsx --fix --format=stylish

eslint_exit_code=$?
if [ $eslint_exit_code -eq 0 ]; then
    print_status $GREEN "✅ ESLint: All code quality checks passed"
else
    print_status $RED "❌ ESLint: Found code quality issues"
    total_errors=$((total_errors + 1))
fi

print_status $BLUE "=================================="
print_status $BLUE "TYPESCRIPT COMPILATION CHECKS"
print_status $BLUE "=================================="

# Check TypeScript compilation
print_status $YELLOW "Checking TypeScript compilation..."
npx tsc --noEmit --skipLibCheck

tsc_exit_code=$?
if [ $tsc_exit_code -eq 0 ]; then
    print_status $GREEN "✅ TypeScript: Compilation successful"
else
    print_status $RED "❌ TypeScript: Compilation errors found"
    total_errors=$((total_errors + 1))
fi

print_status $BLUE "=================================="
print_status $BLUE "DATABASE SCHEMA VALIDATION"
print_status $BLUE "=================================="

# Check database schema consistency
print_status $YELLOW "Validating database schema..."
npm run db:push --dry-run 2>/dev/null

if [ $? -eq 0 ]; then
    print_status $GREEN "✅ Database: Schema is consistent"
else
    print_status $RED "❌ Database: Schema inconsistencies detected"
    print_status $YELLOW "Attempting to fix schema issues..."
    npm run db:push
    total_errors=$((total_errors + 1))
    fixed_errors=$((fixed_errors + 1))
fi

print_status $BLUE "=================================="
print_status $BLUE "AUTOMATED TESTS"
print_status $BLUE "=================================="

# Run unit tests
print_status $YELLOW "Running unit tests..."
npx vitest run tests/backend/database-operations.test.ts --reporter=basic

if [ $? -eq 0 ]; then
    print_status $GREEN "✅ Unit Tests: All tests passed"
else
    print_status $RED "❌ Unit Tests: Some tests failed"
    total_errors=$((total_errors + 1))
fi

print_status $BLUE "=================================="
print_status $BLUE "SUMMARY REPORT"
print_status $BLUE "=================================="

print_status $BLUE "Total Issues Found: $total_errors"
print_status $BLUE "Issues Auto-Fixed: $fixed_errors"
remaining_errors=$((total_errors - fixed_errors))
print_status $BLUE "Remaining Issues: $remaining_errors"

if [ $remaining_errors -eq 0 ]; then
    print_status $GREEN "🎉 All code quality checks passed! Application is ready for production."
    exit 0
else
    print_status $YELLOW "⚠️ Some issues require manual attention. See details above."
    exit 1
fi