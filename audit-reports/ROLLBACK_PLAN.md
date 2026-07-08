# ROLLBACK PLAN — GED-ISIPA

**Date**: 2026-07-08  
**Scope**: Stratégie de retour arrière en cas d'échec de déploiement  

---

## PRINCIPES DE ROLLBACK

1. **Chaque déploiement doit être réversible** — Tag Git obligatoire avant chaque déploiement
2. **Backup DB avant migration** — SQLite: cp custom.db custom.db.pre-deploy
3. **Tests smoke post-déploiement** — Health check + auth test + CRUD test
4. **Rollback automatique si smoke test échoue** — Script de rollback prêt

---

## PROCÉDURE DE ROLLBACK

### Rollback Application Code
```bash
# 1. Identifier le dernier tag stable
git tag -l 'v*' | sort -V | tail -1

# 2. Revenir au tag précédent
git checkout v0.1.0-pre-audit  # Tag de backup initial

# 3. Rebuilder
npm ci && npx prisma generate && npm run build

# 4. Redémarrer
pm2 restart ged-isipa  # ou docker compose restart app
```

### Rollback Base de Données
```bash
# SQLite (développement)
cp db/custom.db.pre-deploy db/custom.db

# PostgreSQL (production)
pg_restore -d ged_isipa backup/pre-deploy.dump
# OU
psql ged_isipa < backup/pre-deploy.sql
```

### Rollback Prisma Migration
```bash
# Rollback la dernière migration
npx prisma migrate resolve --rolled-back <migration_name>

# Revenir à un état spécifique
npx prisma migrate resolve --applied <target_migration>
```

---

## POINTS DE ROLLBACK PRÉ-DÉFINIS

| Tag | Description | Commit | Risque |
|-----|-------------|--------|--------|
| v0.1.0-pre-audit | État avant audit (backup initial) | TBD | Référence |
| v0.2.0-post-p0 | Après corrections P0 (bcrypt, secret, escalation) | TBD | Stable |
| v0.3.0-post-p1 | Après corrections P1 (org isolation, headers, health) | TBD | Stable |

---

## TESTS SMOKE POST-DÉPLOIEMENT

```bash
#!/bin/bash
# smoke-test.sh — À exécuter après chaque déploiement

BASE_URL="http://localhost:3000"
FAILED=0

# 1. Health check
echo "Testing health endpoint..."
HEALTH=$(curl -s $BASE_URL/api/health)
if echo "$HEALTH" | grep -q '"status":"ok"'; then
  echo "✅ Health check passed"
else
  echo "❌ Health check FAILED: $HEALTH"
  FAILED=1
fi

# 2. Login test
echo "Testing login..."
LOGIN=$(curl -s -X POST $BASE_URL/api/auth/callback/credentials \
  -d "email=superadmin@aeip.cd&password=Admin@2024!")
if [ -n "$LOGIN" ]; then
  echo "✅ Login endpoint responding"
else
  echo "❌ Login FAILED"
  FAILED=1
fi

# 3. Static page
echo "Testing static page..."
PAGE=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL/login)
if [ "$PAGE" = "200" ]; then
  echo "✅ Login page accessible"
else
  echo "❌ Login page FAILED (HTTP $PAGE)"
  FAILED=1
fi

# Result
if [ $FAILED -eq 0 ]; then
  echo "🎉 All smoke tests passed"
  exit 0
else
  echo "💥 Smoke tests failed — INITIATE ROLLBACK"
  exit 1
fi
```

---

## CONTACTS D'ESCALADE

| Rôle | Responsabilité |
|------|---------------|
| DevOps Lead | Exécution rollback, infrastructure |
| Tech Lead | Décision rollback, validation code |
| Security Lead | Validation sécurité post-rollback |
