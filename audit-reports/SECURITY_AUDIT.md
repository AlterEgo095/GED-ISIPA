# SECURITY AUDIT — GED-ISIPA / AEIP Enterprise Platform

**Date**: 2026-07-08  
**Classification**: CONFIDENTIEL  
**Scope**: Authentication, Authorization, Input Validation, API Security, Secrets, File Upload, Dependencies  

---

## RÉSUMÉ DES FINDINGS SÉCURITÉ

| Sévérité | Count | Status |
|----------|:-----:|--------|
| 🔴 CRITICAL | 3 | ✅ Tous corrigés |
| 🟠 HIGH | 6 | ⚠️ 3 corrigés, 3 restants |
| 🟡 MEDIUM | 5 | ⚠️ 1 corrigé, 4 restants |
| 🟢 LOW | 3 | 1 corrigé, 2 restants |
| ℹ️ INFO | 1 | Acceptable |

---

## FINDINGS DÉTAILLÉS

### 🔴 CRITICAL — Tous Corrigés ✅

**SEC-001: Plaintext Password Storage & Comparison**
- **Fichier**: src/lib/auth.ts:69, src/app/api/users/route.ts:82
- **Impact**: Toute fuite DB expose tous les mots de passe
- **Correction**: bcrypt.compare() pour vérification, bcrypt.hash(SALT_ROUNDS=12) pour stockage
- **Migration**: 9 utilisateurs migrés via scripts/migrate-passwords.ts

**SEC-002: NEXTAUTH_SECRET Prévisible**
- **Fichier**: .env:2
- **Valeur précédente**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Impact**: Forge de session JWT possible
- **Correction**: Remplacé par `openssl rand -base64 48`

**SEC-003: Vertical Privilege Escalation**
- **Fichier**: src/app/api/users/[id]/route.ts:58
- **Impact**: ORG_ADMIN peut assigner SUPER_ADMIN
- **Correction**: getRoleLevel() guard — impossible d'assigner un rôle ≥ au sien

### 🟠 HIGH — 3 Corrigés, 3 Restants

**SEC-004: Brute Force Protection Insuffisant** ⚠️ RESTANT
- **Fichier**: middleware.ts:6-23
- **Problème**: Rate limiting IP-only, in-memory, 30/min trop permissif
- **Recommandation**: Account lockout (5 échecs → 15min), CAPTCHA, store persistant

**SEC-005: No Input Validation (Zod)** ⚠️ RESTANT
- **Fichier**: All API routes
- **Problème**: Zod installé mais jamais utilisé, validation manuelle minimale
- **Recommandation**: Schémas Zod pour chaque endpoint API

**SEC-006: Workflow Cross-Org Update** ✅ CORRIGÉ
- **Correction**: findFirst({ where: { id, organizationId: orgId } }) avant update

**SEC-007: User Cross-Org Access** ✅ CORRIGÉ
- **Correction**: Vérification org membership, 404 au lieu de 403 (anti-enumeration)

**SEC-008: No Security Headers** ✅ CORRIGÉ
- **Correction**: CSP, HSTS, X-Frame-Options, Permissions-Policy dans next.config.ts

**SEC-009: File Upload Zero Validation** ⚠️ RESTANT
- **Fichier**: documents/route.ts, document-upload.tsx
- **Problème**: Pas de validation MIME, taille, hash, scan antivirus
- **Recommandation**: Server-side upload, MIME whitelist, size limits, hash computation

### 🟡 MEDIUM — 1 Corrigé, 4 Restants

**SEC-010: JWT Role Staleness** ✅ CORRIGÉ
- **Correction**: jwt callback avec trigger='update' re-fetch role/org depuis DB

**SEC-011: SameSite=None Cookies** ⚠️ RESTANT
- **Fichier**: auth.ts:152
- **Note**: Requis pour preview HTTPS, mais dangereux en production
- **Recommandation**: sameSite='lax' en production

**SEC-012: In-Memory Rate Limiting** ⚠️ RESTANT
- **Recommandation**: Redis ou SQLite-backed store persistant

**SEC-013: No CORS Configuration** ⚠️ RESTANT
- **Recommandation**: Configurer CORS restrictif pour API routes

**SEC-014: Notification Ownership** ✅ CORRIGÉ (S2→S0)
- **Correction**: Vérification userId avant mark-as-read

### 🟢 LOW

**SEC-015: Health Info Leak** ✅ CORRIGÉ — Version/service retirés
**SEC-016: XSS Risk** ✅ Acceptable — Un seul dangerouslySetInnerHTML contrôlé
**SEC-017: Missing Security Packages** ⚠️ RESTANT — helmet, dompurify, file-type

---

## POSITIVE FINDINGS

1. ✅ Prisma ORM — Toutes les requêtes sont paramétrées, pas d'injection SQL
2. ✅ Cookie security — httpOnly + secure sur tous les cookies auth
3. ✅ .gitignore — Exclut correctement .env*
4. ✅ Middleware auth check — Toutes les routes API exigent un JWT
5. ✅ RBAC matrix — 14 rôles × 9 ressources × 12 actions
6. ✅ Multi-tenant isolation — La majorité des requêtes filtrent par organizationId
7. ✅ Audit logging — Actions CRUD et workflow créent des entrées audit
8. ✅ bcryptjs + zod — Installés (maintenant utilisés)
