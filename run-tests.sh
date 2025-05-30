#!/bin/bash

# Comprehensive Test Runner for Meta Lingua Platform
echo "🚀 Starting comprehensive test suite for Meta Lingua Platform..."

# Set test environment
export NODE_ENV=test

# Function to run tests and capture results
run_test_suite() {
    local test_name=$1
    local test_path=$2
    
    echo "📋 Running $test_name..."
    npx vitest run $test_path --reporter=verbose
    
    if [ $? -eq 0 ]; then
        echo "✅ $test_name: PASSED"
        return 0
    else
        echo "❌ $test_name: FAILED"
        return 1
    fi
}

# Initialize test results
backend_tests=0
frontend_tests=0
integration_tests=0
failed_tests=0

echo "=================================="
echo "BACKEND API TESTS"
echo "=================================="

# Run backend tests
if run_test_suite "Student API Tests" "tests/backend/student-api.test.ts"; then
    backend_tests=$((backend_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

if run_test_suite "Database Operations Tests" "tests/backend/database-operations.test.ts"; then
    backend_tests=$((backend_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo "=================================="
echo "FRONTEND COMPONENT TESTS"
echo "=================================="

# Run frontend tests
if run_test_suite "Student Management Component Tests" "tests/frontend/student-management.test.tsx"; then
    frontend_tests=$((frontend_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo "=================================="
echo "INTEGRATION TESTS"
echo "=================================="

# Run integration tests
if run_test_suite "Full Workflow Integration Tests" "tests/integration/full-workflow.test.ts"; then
    integration_tests=$((integration_tests + 1))
else
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo "=================================="
echo "TEST SUMMARY"
echo "=================================="
echo "Backend Tests Passed: $backend_tests"
echo "Frontend Tests Passed: $frontend_tests"
echo "Integration Tests Passed: $integration_tests"
echo "Total Failed Tests: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    echo "🎉 ALL TESTS PASSED! Platform is ready for deployment."
    exit 0
else
    echo "⚠️  Some tests failed. Review the output above for details."
    exit 1
fi