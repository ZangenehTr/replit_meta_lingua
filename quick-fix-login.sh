#!/bin/bash

echo "🔧 Quick Login Fix for Meta Lingua"
echo "=================================="

# Run the login fix SQL
echo "Fixing password hashes..."
psql -U postgres -d metalingua -f fix-login-issues.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ LOGIN ISSUES FIXED!"
    echo ""
    echo "🎯 You can now login with:"
    echo "Email: sara.ahmadi@gmail.com"  
    echo "Password: password"
    echo ""
    echo "All users now work with password: password"
else
    echo "❌ Fix failed. Check the database connection."
fi