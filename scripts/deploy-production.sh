#!/bin/bash

# Production Deployment Script for Smart LMS
# Usage: ./scripts/deploy-production.sh

set -e  # Exit on error

echo "🚀 Starting Production Deployment..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
LOG_FILE="./logs/deployment_$(date +%Y%m%d_%H%M%S).log"

# Functions
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Pre-deployment checks
log "Running pre-deployment checks..."

# Check if .env.production exists
if [ ! -f "server/.env.production" ]; then
    error ".env.production not found in server directory"
fi

if [ ! -f "client/.env.production" ]; then
    error ".env.production not found in client directory"
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    error "Node.js is not installed"
fi

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    warn "PM2 is not installed. Installing..."
    npm install -g pm2
fi

# Create backup directory
log "Creating backup directory..."
mkdir -p "$BACKUP_DIR"

# Backup current deployment
log "Backing up current deployment..."
if [ -d "server/node_modules" ]; then
    tar -czf "$BACKUP_DIR/server_backup.tar.gz" server/ || warn "Server backup failed"
fi
if [ -d "client/.next" ]; then
    tar -czf "$BACKUP_DIR/client_backup.tar.gz" client/.next/ || warn "Client backup failed"
fi

# Git operations
log "Pulling latest code..."
git fetch origin
git checkout main
git pull origin main

COMMIT_HASH=$(git rev-parse --short HEAD)
log "Deploying commit: $COMMIT_HASH"

# Backend deployment
log "Deploying backend..."
cd server

log "Installing backend dependencies..."
npm ci --production

log "Running database migrations (if any)..."
# Add migration commands here if needed
# npm run migrate

log "Stopping existing backend process..."
pm2 stop smart-lms-api || log "No existing process to stop"

log "Starting backend with PM2..."
pm2 start ecosystem.config.js --env production --update-env

log "Saving PM2 configuration..."
pm2 save

cd ..

# Frontend deployment
log "Deploying frontend..."
cd client

log "Installing frontend dependencies..."
npm ci

log "Building frontend..."
npm run build

log "Stopping existing frontend process..."
pm2 stop smart-lms-web || log "No existing process to stop"

log "Starting frontend with PM2..."
pm2 start npm --name "smart-lms-web" -- start

log "Saving PM2 configuration..."
pm2 save

cd ..

# Post-deployment checks
log "Running post-deployment checks..."

# Wait for services to start
sleep 10

# Check backend health
log "Checking backend health..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$BACKEND_HEALTH" != "200" ]; then
    error "Backend health check failed (HTTP $BACKEND_HEALTH)"
fi
log "✓ Backend is healthy"

# Check frontend
log "Checking frontend..."
FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" != "200" ]; then
    error "Frontend health check failed (HTTP $FRONTEND_HEALTH)"
fi
log "✓ Frontend is healthy"

# Display PM2 status
log "Current PM2 processes:"
pm2 list

# Deployment summary
echo ""
echo "=================================="
echo -e "${GREEN}✓ Deployment Successful!${NC}"
echo "=================================="
echo "Commit: $COMMIT_HASH"
echo "Backup: $BACKUP_DIR"
echo "Log: $LOG_FILE"
echo ""
echo "Next steps:"
echo "1. Monitor logs: pm2 logs"
echo "2. Check metrics: pm2 monit"
echo "3. Verify functionality in browser"
echo ""
echo "To rollback:"
echo "./scripts/rollback.sh $BACKUP_DIR"
echo ""

log "Deployment completed successfully!"
