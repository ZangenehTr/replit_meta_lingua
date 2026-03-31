#!/bin/bash
set -e

echo "Running post-merge setup..."

# Install/update dependencies (non-interactive)
npm install --legacy-peer-deps

# Apply any pending SQL migrations safely (each migration uses IF NOT EXISTS guards)
if [ -d "migrations" ]; then
  for f in migrations/*.sql; do
    [ -f "$f" ] || continue
    echo "Applying migration: $f"
    psql "$DATABASE_URL" -f "$f" 2>&1 | grep -v "^$" || true
  done
fi

echo "Post-merge setup complete."
