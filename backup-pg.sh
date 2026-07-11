#!/bin/bash
# GED-ISIPA PostgreSQL Backup Script
# Runs daily, keeps 30 days of backups

set -e

BACKUP_DIR="/opt/ged-isipa/backups"
DB_NAME="ged_isipa"
DB_USER="ged_isipa"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ged_isipa_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=30

echo "[$(date)] Starting PostgreSQL backup..."

# Create backup directory if needed
mkdir -p "${BACKUP_DIR}"

# Dump and compress
sudo -u postgres pg_dump -d ${DB_NAME} --clean --if-exists | gzip > "${BACKUP_FILE}"

# Verify backup was created
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup created: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] ERROR: Backup failed!"
    exit 1
fi

# Verify backup integrity
gunzip -t "${BACKUP_FILE}" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "[$(date)] Backup integrity verified"
else
    echo "[$(date)] ERROR: Backup integrity check failed!"
    exit 1
fi

# Remove backups older than retention period
find "${BACKUP_DIR}" -name "ged_isipa_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Old backups cleaned (retention: ${RETENTION_DAYS} days)"

echo "[$(date)] Backup completed successfully"
