#!/bin/bash

# Meta Lingua Deployment Script
# For production deployment in Iranian infrastructure

set -e

echo "========================================="
echo "Meta Lingua Platform Deployment"
echo "========================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please copy .env.example to .env and configure it."
    exit 1
fi

# Load environment variables
source .env

# Function to check command availability
check_command() {
    if ! command -v $1 &> /dev/null; then
        echo "Error: $1 is not installed. Please install it first."
        exit 1
    fi
}

# Check required commands
echo "Checking prerequisites..."
check_command docker
check_command docker-compose
check_command git

# Create necessary directories
echo "Creating directories..."
mkdir -p uploads logs backup attached_assets

# Set proper permissions
echo "Setting permissions..."
chmod 755 uploads logs backup
chmod +x scripts/*.sh

# Pull latest code (optional)
read -p "Pull latest code from repository? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git pull origin main
fi

# Build and start services
echo "Building Docker images..."
docker-compose build --no-cache

# Database migration
echo "Running database migrations..."
docker-compose run --rm app npm run db:push

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "Waiting for services to be healthy..."
sleep 10

# Check service status
docker-compose ps

# Install Ollama models if needed
echo "Setting up Ollama models..."
docker exec metalingua-ollama ollama pull llama3.2:3b

# Run health check
echo "Running health check..."
curl -f http://localhost:5000/health || echo "Warning: Health check failed"

echo "========================================="
echo "Deployment completed successfully!"
echo "Access the application at: ${APP_URL:-http://localhost:5000}"
echo ""
echo "Important commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Backup database: ./scripts/backup.sh"
echo "  View status: docker-compose ps"
echo "========================================="