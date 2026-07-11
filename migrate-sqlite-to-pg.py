#!/usr/bin/env python3
"""
SQLite → PostgreSQL Data Migration Script for GED-ISIPA
Preserves all data, IDs, relations, foreign keys, timestamps.
"""
import sqlite3
import psycopg2
import psycopg2.extras
import json
import os
import sys

SQLITE_DB = '/opt/ged-isipa/db/ged-isipa.db.before-pg-migration'
PG_DSN = 'postgresql://ged_isipa:GedIsipa2026Secure!@localhost:5432/ged_isipa'

def parse_bool(val):
    if isinstance(val, bool):
        return val
    if isinstance(val, int):
        return val != 0
    if isinstance(val, str):
        return val.lower() in ('true', '1', 'yes')
    return False

def parse_json(val):
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val)
    try:
        parsed = json.loads(val)
        return json.dumps(parsed)
    except (json.JSONDecodeError, TypeError):
        return val

EPOCH = '1970-01-01 00:00:00'

from datetime import datetime, timezone

def _convert_ts(val):
    """Convert a timestamp value that could be a Unix epoch (int/float) or ISO string."""
    if val is None or (isinstance(val, str) and not val.strip()):
        return None
    # Unix epoch (integer or float)
    if isinstance(val, (int, float)):
        try:
            return datetime.fromtimestamp(val, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        except (ValueError, OSError):
            return EPOCH
    # String - could be ISO format already or a numeric string
    if isinstance(val, str):
        val_stripped = val.strip()
        # Try as numeric string (Unix epoch)
        try:
            epoch_val = float(val_stripped)
            return datetime.fromtimestamp(epoch_val, tz=timezone.utc).strftime('%Y-%m-%d %H:%M:%S')
        except (ValueError, OSError):
            pass
        # Already a datetime string
        return val_stripped
    return EPOCH

def dt(val):
    """Nullable datetime"""
    return _convert_ts(val)

def dtn(val):
    """NOT NULL datetime - fallback to epoch"""
    result = _convert_ts(val)
    return result if result is not None else EPOCH

def main():
    print("===== SQLite -> PostgreSQL Data Migration =====")

    sqlite_path = SQLITE_DB
    if not os.path.exists(sqlite_path):
        sqlite_path = '/opt/ged-isipa/db/ged-isipa.db'
    if not os.path.exists(sqlite_path):
        print("No SQLite database found. Fresh PostgreSQL database - nothing to migrate.")
        return

    sl = sqlite3.connect(sqlite_path)
    sl.row_factory = sqlite3.Row

    pg = psycopg2.connect(PG_DSN)
    pg.autocommit = False
    cur = pg.cursor()

    try:
        # SystemSetting
        print("  Migrating SystemSetting...")
        rows = sl.execute("SELECT * FROM SystemSetting").fetchall()
        for r in rows:
            cur.execute('INSERT INTO "SystemSetting" (id, key, value) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING',
                        (r['id'], r['key'], r['value']))
        print(f"    OK {len(rows)} SystemSetting")

        # Organization
        print("  Migrating Organization...")
        rows = sl.execute("SELECT * FROM Organization").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Organization" (id, name, slug, code, type, status, plan,
                           logo, "primaryColor", "accentColor", settings, "trialEndsAt",
                           "subscriptionEndsAt", "maxUsers", "maxStorage", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                           ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['name'], r['slug'], r['code'], r['type'], r['status'], r['plan'],
                         r['logo'], r['primaryColor'], r['accentColor'],
                         parse_json(r['settings']),
                         dt(r['trialEndsAt']), dt(r['subscriptionEndsAt']),
                         r['maxUsers'], r['maxStorage'],
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} Organization")

        # Department
        print("  Migrating Department...")
        rows = sl.execute("SELECT * FROM Department").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Department" (id, name, code, description, "organizationId",
                           "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['name'], r['code'], r['description'], r['organizationId'],
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} Department")

        # User
        print("  Migrating User...")
        rows = sl.execute("SELECT * FROM User").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "User" (id, email, name, password, role, "organizationId",
                           "departmentId", "isActive", "lastLogin", "isPlatformAdmin",
                           "accountStatus", "emailVerified", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                           ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['email'], r['name'], r['password'], r['role'], r['organizationId'],
                         r['departmentId'], parse_bool(r['isActive']), dt(r['lastLogin']),
                         parse_bool(r['isPlatformAdmin']), r['accountStatus'],
                         parse_bool(r['emailVerified']),
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} User")

        # Workflow
        print("  Migrating Workflow...")
        rows = sl.execute("SELECT * FROM Workflow").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Workflow" (id, name, description, "isActive", "organizationId",
                           "initialStateId", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['name'], r['description'], parse_bool(r['isActive']),
                         r['organizationId'], r['initialStateId'],
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} Workflow")

        # WorkflowState
        print("  Migrating WorkflowState...")
        rows = sl.execute("SELECT * FROM WorkflowState").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "WorkflowState" (id, "workflowId", name, "isInitial", "isFinal",
                           color, "order")
                           VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['workflowId'], r['name'], parse_bool(r['isInitial']),
                         parse_bool(r['isFinal']), r['color'], r['order']))
        print(f"    OK {len(rows)} WorkflowState")

        # WorkflowTransition
        print("  Migrating WorkflowTransition...")
        rows = sl.execute("SELECT * FROM WorkflowTransition").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "WorkflowTransition" (id, "workflowId", "fromStateId", "toStateId",
                           name, "allowedRoles", condition)
                           VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['workflowId'], r['fromStateId'], r['toStateId'], r['name'],
                         parse_json(r['allowedRoles']), r['condition']))
        print(f"    OK {len(rows)} WorkflowTransition")

        # Document
        print("  Migrating Document...")
        rows = sl.execute("SELECT * FROM Document").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Document" (id, title, reference, description, type, status,
                           classification, "filePath", "fileName", "fileSize", "mimeType", "fileHash",
                           version, tags, metadata, "organizationId", "authorId", "departmentId",
                           "workflowStateId", "isArchived", "archivedAt", "archivedBy", "archiveRef",
                           "retentionPeriod", "expiresAt", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                           ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['title'], r['reference'], r['description'], r['type'], r['status'],
                         r['classification'], r['filePath'], r['fileName'], r['fileSize'],
                         r['mimeType'], r['fileHash'], r['version'], r['tags'],
                         parse_json(r['metadata']), r['organizationId'], r['authorId'],
                         r['departmentId'], r['workflowStateId'], parse_bool(r['isArchived']),
                         dt(r['archivedAt']), r['archivedBy'], r['archiveRef'],
                         r['retentionPeriod'], dt(r['expiresAt']),
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} Document")

        # DocumentVersion
        print("  Migrating DocumentVersion...")
        rows = sl.execute("SELECT * FROM DocumentVersion").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "DocumentVersion" (id, "documentId", version, "filePath",
                           "fileName", "fileSize", "fileHash", "changeLog", "createdBy", "createdAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['documentId'], r['version'], r['filePath'], r['fileName'],
                         r['fileSize'], r['fileHash'], r['changeLog'], r['createdBy'],
                         dtn(r['createdAt'])))
        print(f"    OK {len(rows)} DocumentVersion")

        # OrganizationModule
        print("  Migrating OrganizationModule...")
        rows = sl.execute("SELECT * FROM OrganizationModule").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "OrganizationModule" (id, "organizationId", "moduleKey", name,
                           description, status, config, "activatedAt", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['organizationId'], r['moduleKey'], r['name'], r['description'],
                         r['status'], parse_json(r['config']), dt(r['activatedAt']),
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} OrganizationModule")

        # Subscription
        print("  Migrating Subscription...")
        rows = sl.execute("SELECT * FROM Subscription").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Subscription" (id, "organizationId", plan, status,
                           "currentPeriodStart", "currentPeriodEnd", amount, currency,
                           "stripeSessionId", "createdAt", "updatedAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['organizationId'], r['plan'], r['status'],
                         dtn(r['currentPeriodStart']), dtn(r['currentPeriodEnd']),
                         r['amount'], r['currency'], r['stripeSessionId'],
                         dtn(r['createdAt']), dtn(r['updatedAt'])))
        print(f"    OK {len(rows)} Subscription")

        # AuditLog - handle orphaned documentId references
        print("  Migrating AuditLog...")
        # Get valid document IDs from PG
        cur.execute('SELECT id FROM "Document"')
        valid_doc_ids = {row[0] for row in cur.fetchall()}
        rows = sl.execute("SELECT * FROM AuditLog").fetchall()
        for r in rows:
            doc_id = r['documentId']
            # Set documentId to NULL if the referenced document doesn't exist
            if doc_id and doc_id not in valid_doc_ids:
                doc_id = None
            cur.execute("""INSERT INTO "AuditLog" (id, action, "entityType", "entityId", details,
                           "organizationId", "userId", "documentId", "ipAddress", "userAgent", "createdAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['action'], r['entityType'], r['entityId'], r['details'],
                         r['organizationId'], r['userId'], doc_id,
                         r['ipAddress'], r['userAgent'], dtn(r['createdAt'])))
        print(f"    OK {len(rows)} AuditLog")

        # AccessLog
        print("  Migrating AccessLog...")
        rows = sl.execute("SELECT * FROM AccessLog").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "AccessLog" (id, "documentId", "userId", action, "ipAddress", "createdAt")
                           VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['documentId'], r['userId'], r['action'],
                         r['ipAddress'], dtn(r['createdAt'])))
        print(f"    OK {len(rows)} AccessLog")

        # Notification
        print("  Migrating Notification...")
        rows = sl.execute("SELECT * FROM Notification").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "Notification" (id, "userId", title, message, type, "isRead",
                           link, "createdAt")
                           VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['userId'], r['title'], r['message'], r['type'],
                         parse_bool(r['isRead']), r['link'], dtn(r['createdAt'])))
        print(f"    OK {len(rows)} Notification")

        # PasswordReset
        print("  Migrating PasswordReset...")
        rows = sl.execute("SELECT * FROM PasswordReset").fetchall()
        for r in rows:
            cur.execute("""INSERT INTO "PasswordReset" (id, "userId", "tokenHash", "expiresAt",
                           "usedAt", "createdAt")
                           VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (id) DO NOTHING""",
                        (r['id'], r['userId'], r['tokenHash'], dtn(r['expiresAt']),
                         dt(r['usedAt']), dtn(r['createdAt'])))
        print(f"    OK {len(rows)} PasswordReset")

        # Commit all changes
        pg.commit()
        print("\n  All data migrated successfully!")

        # Verify counts
        print("\n  Verifying data counts in PostgreSQL...")
        tables = ['Organization', 'User', 'Department', 'Document', 'DocumentVersion',
                  'Workflow', 'WorkflowState', 'WorkflowTransition', 'OrganizationModule',
                  'Subscription', 'AuditLog', 'AccessLog', 'Notification', 'PasswordReset', 'SystemSetting']
        for t in tables:
            try:
                sqlite_count = sl.execute(f'SELECT COUNT(*) FROM "{t}"').fetchone()[0]
            except:
                sqlite_count = -1
            try:
                cur.execute(f'SELECT COUNT(*) FROM "{t}"')
                pg_count = cur.fetchone()[0]
            except:
                pg_count = -1
            match = "OK" if sqlite_count == pg_count else "MISMATCH"
            print(f"    {t}: SQLite={sqlite_count} PostgreSQL={pg_count} [{match}]")

        sl.close()
        cur.close()
        pg.close()

        print("\n===== Migration Complete! =====")

    except Exception as e:
        pg.rollback()
        print(f"\nMigration FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()
