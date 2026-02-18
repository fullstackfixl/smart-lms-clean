#!/bin/bash

# Rollback Script for Smart LMS
# Usage: ./scripts/rollback.sh [backup_directory]

set -e

echo "🔄 Starting Rollback Process..."
echo "================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup directory is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Backup directory not specified${NC}"
    echo "Usage: ./scripts/rollback.sh [backup_directory]"
    echo ""
    echo "Available backups:"
    ls -lt backups/ | head -10
    exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
    echo -e "${RED}Error: Backup directory not found: $BACKUP_DIR${NC}"
    exit 1
fi

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Confirm rollback
echo -e "${YELLOW}WARNING: This will rollback to backup: $BACKUP_DIR${NC}"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Rollback cancelled"
    exit 0
fi

# Stop current processes
log "Stopping current processes..."
pm2 stop smart-lms-api smart-lms-web || log "Processes already stopped"

# Restore backend
if [ -f "$BACKUP_DIR/server_backup.tar.gz" ]; then
    log "Restoring backend..."
    tar -xzf "$BACKUP_DIR/server_backup.tar.gz" -C .
    log "✓ Backend restored"
else
    error "Backend backup not found"
fi

# Restore frontend
if [ -f "$BACKUP_DIR/client_backup.tar.gz" ]; then
    log "Restoring frontend..."
    tar -xzf "$BACKUP_DIR/client_backup.tar.gz" -C client/
    log "✓ Frontend restored"
else
    error "Frontend backup not found"
fi

# Restart processes
log "Restarting processes..."
cd server
pm2 start ecosystem.config.js --env production
cd ../client
pm2 start npm --name "smart-lms-web" -- start
cd ..

# Wait for services
sleep 10

# Health checks
log "Running health checks..."
BACKEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
if [ "$BACKEND_HEALTH" != "200" ]; then
    error "Backend health check failed after rollback"
fi

FRONTEND_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_HEALTH" != "200" ]; then
    error "Frontend health check failed after rollback"
fi

echo ""
echo "================================"
echo -e "${GREEN}✓ Rollback Successful!${NC}"
echo "================================"
echo "Restored from: $BACKUP_DIR"
echo ""
echo "Services are running. Please verify functionality."
echo ""

pm2 list
