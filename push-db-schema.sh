#!/bin/bash
# Script to push database schema with automatic selection

echo "Pushing database schema..."
echo "Automatically selecting option 1 (create table) for ai_knowledge_base"

# Use printf to send "1" followed by Enter to the db:push command
printf "1\n" | npm run db:push

echo "Database schema push completed!"