#!/bin/bash
set -e
echo "===== PHASE 2: SQLite → PostgreSQL Migration ====="
cd /opt/ged-isipa

echo '[1/8] Backing up SQLite database...'
cp db/ged-isipa.db db/ged-isipa.db.before-pg-migration
echo '  ✓ SQLite backup done'

echo '[2/8] Backing up Prisma schema...'
cp prisma/schema.prisma prisma/schema.prisma.sqlite-backup
echo '  ✓ Schema backup done'

echo '[3/8] Updating Prisma schema for PostgreSQL...'
