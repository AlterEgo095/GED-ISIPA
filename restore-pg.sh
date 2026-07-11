#!/bin/bash
# GED-ISIPA PostgreSQL Restore Script
# Usage: ./restore-pg.sh <backup_file.sql.gz>

set -e

BACKUP_FILE=$1
DB_NAME="ged_isipa"

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo "Available backups:"
    ls -la /opt/ged-isipa/backups/*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "[$(date)] WARNING: This will REPLACE the current database!"
echo "[$(date)] Press Ctrl+C to cancel, or wait 5 seconds..."
sleep 5

echo "[$(date)] Restoring from: $BACKUP_FILE"
gunzip -c "$BACKUP_FILE" | sudo -u postgres psql -d "$DB_NAME" 2>&1 | tail -5

echo "[$(date)] Restore completed"
