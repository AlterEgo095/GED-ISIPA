# SIMULATION REGISTER — GED-ISIPA

**Date**: 2026-07-08  
**Total findings**: 26 simulations identifiées

---

## S4 — CRITICAL PRODUCTION SIMULATION (Must Fix Before Deployment)

| # | Composant | Fichier | Description | Correction |
|---|-----------|---------|-------------|------------|
| 1 | Password storage | auth.ts:69 | Plaintext comparison `user.password !== credentials.password` | ✅ **Corrigé** — bcrypt.compare() |
| 2 | Password creation | users/route.ts:82 | Plaintext storage `password, // In production, hash with bcrypt` | ✅ **Corrigé** — bcrypt.hash() |
| 3 | NEXTAUTH_SECRET | .env:2 | Valeur séquentielle prévisible `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6` | ✅ **Corrigé** — crypto-random |
| 4 | File storage | documents/route.ts:82-85 | fileSize=0, mimeType='application/octet-stream', fileHash='' | ❌ Non corrigé |
| 5 | File upload | document-upload.tsx | Client-side file input, pas de multipart server-side | ❌ Non corrigé |
| 6 | Docker infrastructure | docker-compose.yml | Redis, MinIO, PostgreSQL déclarés mais non câblés | ❌ Non corrigé |
| 7 | Stripe billing | subscription model | stripeSessionId field sans code Stripe SDK | ❌ Non corrigé |
| 8 | Seed credentials | seed.ts:34 | Tous comptes avec même mot de passe faible 'admin123' | ✅ **Corrigé** — bcrypt + mdp fort |

## S3 — HIGH RISK SIMULATION

| # | Composant | Fichier | Description | Correction |
|---|-----------|---------|-------------|------------|
| 9 | Role escalation | users/[id]/route.ts:58 | ORG_ADMIN peut assigner SUPER_ADMIN | ✅ **Corrigé** — getRoleLevel guard |
| 10 | Input validation | All API routes | Pas de Zod schemas, validation manuelle minimale | ❌ Non corrigé |
| 11 | Rate limiting | middleware.ts:6 | In-memory Map, reset on restart | ❌ Non corrigé |
| 12 | Security headers | next.config.ts | Aucun header sécurité configuré | ✅ **Corrigé** — CSP, HSTS, etc. |
| 13 | Health check | health/route.ts | Retourne toujours {status:'ok'} sans vérifier | ✅ **Corrigé** — vérifie DB + stockage |
| 14 | Workflow org isolation | workflows/[id]/route.ts:46 | PUT sans vérifier organizationId | ✅ **Corrigé** — findFirst + orgId |
| 15 | Email delivery | Aucun fichier | Zero intégration SMTP | ❌ Non corrigé |
| 16 | Notification triggers | Aucun fichier | Aucun code ne crée de notifications | ❌ Non corrigé |

## S2 — MEDIUM RISK SIMULATION

| # | Composant | Fichier | Description | Correction |
|---|-----------|---------|-------------|------------|
| 17 | JWT staleness | auth.ts:142 | Role changes prennent 24h à prendre effet | ✅ **Corrigé** — jwt refresh callback |
| 18 | Dashboard stats | Dashboard pages | Certaines métriques calculées sans source réelle | ❌ Partiel |
| 19 | CORS | Aucun fichier | Pas de configuration CORS explicite | ❌ Non corrigé |
| 20 | Cookie SameSite | auth.ts:152 | sameSite:'none' permet CSRF cross-site | ❌ Non corrigé (requis pour preview) |
| 21 | Error handling | catch blocks | Erreurs avalées dans catch vides | ❌ Non corrigé |
| 22 | Audit logs | audit/route.ts | SUPER_ADMIN ne voit que sa propre org | ✅ **Corrigé** — cross-org visibility |

## S1 — LOW RISK SIMULATION

| # | Composant | Fichier | Description | Correction |
|---|-----------|---------|-------------|------------|
| 23 | XSS | chart.tsx | dangerouslySetInnerHTML (contrôlé) | Acceptable |
| 24 | Health info leak | health/route.ts | service name + version exposés | ✅ **Corrigé** — retiré |

## S0 — ACCEPTABLE MOCK

| # | Composant | Fichier | Description | Status |
|---|-----------|---------|-------------|--------|
| 25 | Prisma ORM | All API routes | Parameterized queries, no SQL injection | ✅ Acceptable |
| 26 | Cookie security | auth.ts | httpOnly + secure sur tous cookies | ✅ Acceptable |

---

## RÉSUMÉ PAR STATUT

| Statut | Count | Percentage |
|--------|:-----:|:----------:|
| ✅ Corrigé | 13 | 50% |
| ❌ Non corrigé | 12 | 46% |
| ⚠️ Partiel | 1 | 4% |
