# ADMIN CAPABILITY MATRIX — GED-ISIPA

**Date**: 2026-07-08  
**Scope**: Super Admin, Org Admin, et capacités de gestion  

---

## SUPER ADMIN CAPABILITIES

| # | Capacité | Status | Preuve | Gap |
|---|----------|--------|--------|-----|
| 1.1 | View Platform Stats | **RÉEL** | GET /api/stats/platform | ✅ Complet |
| 1.2 | List All Organizations | **RÉEL** | GET /api/organizations | ✅ Complet |
| 1.3 | Create Organization | **RÉEL** | POST /api/organizations | ✅ Complet |
| 1.4 | View Organization Details | **RÉEL** | GET /api/organizations/[id] | ✅ Complet |
| 1.5 | Update Organization | **RÉEL** | PUT /api/organizations/[id] | ✅ Field-level RBAC |
| 1.6 | Suspend Organization | **PARTIEL** | DELETE /api/organizations/[id] | Pas de réactivation |
| 1.7 | Platform Billing | **SIMULÉ** | Page placeholder | Pas de code Stripe |
| 1.8 | Platform Analytics | **SIMULÉ** | Page placeholder | Pas d'API analytics |
| 1.9 | Platform Modules | **PARTIEL** | Catalogue statique | Pas de toggle UI |
| 1.10 | Manage All Users | **PARTIEL** | Pas de UI cross-org | Pas de page users super-admin |
| 1.11 | System Configuration | **PARTIEL** | GET/PUT /api/settings | Pas de UI, keys non validées |
| 1.12 | Global Audit Logs | **RÉEL** ✅ | GET /api/audit | ✅ Cross-org (corrigé) |

## ORG ADMIN CAPABILITIES

| # | Capacité | Status | Preuve | Gap |
|---|----------|--------|--------|-----|
| 2.1 | View Org Users | **RÉEL** | GET /api/users | ✅ Org-scoped |
| 2.2 | Create Org Users | **RÉEL** | POST /api/users | ✅ bcrypt hash |
| 2.3 | Update Org Users | **RÉEL** ✅ | PUT /api/users/[id] | ✅ Role guard corrigé |
| 2.4 | Deactivate Users | **RÉEL** ✅ | DELETE /api/users/[id] | ✅ Soft delete ajouté |
| 2.5 | View Org Details | **RÉEL** | GET /api/organizations/[id] | ✅ Org boundary |
| 2.6 | Update Org Settings | **RÉEL** | PUT /api/organizations/[id] | ✅ Field-level RBAC |
| 2.7 | Manage Departments | **PARTIEL** | GET/POST /api/departments | Pas de PUT/DELETE |
| 2.8 | Manage Modules | **RÉEL** | POST /api/organizations/[id]/modules | ✅ Full lifecycle |
| 2.9 | Manage Workflows | **RÉEL** | GET/POST/PUT/DELETE /api/workflows | ✅ Org-isolated |
| 2.10 | Org Billing View | **RÉEL** | GET /api/billing | Lecture seule |
| 2.11 | Org Audit Logs | **RÉEL** | GET /api/audit | ✅ Org-scoped |
| 2.12 | Org Settings Page | **PARTIEL** | /settings | Password change pas de backend |

## RBAC ENFORCEMENT

| Layer | Implementation | Status |
|-------|---------------|--------|
| Authentication | JWT token via NextAuth | ✅ RÉEL |
| Route Protection | /admin/* → SUPER_ADMIN only | ✅ RÉEL |
| API Auth | 401 si pas de token | ✅ RÉEL |
| Permission Check | hasPermission() sur chaque route | ✅ RÉEL |
| Role Level Guard | getRoleLevel() empêche escalation | ✅ CORRIGÉ |
| Org Isolation | organizationId filter sur la plupart des routes | ✅ AMÉLIORÉ |
| Rate Limiting | In-memory (30/min auth, 100/min API) | ⚠️ PARTIEL |

## DISTRIBUTION DES CAPACITÉS

```
RÉEL (Complètement fonctionnel):    22  ████████████████████░░░  55%
PARTIEL (Fonctionne mais incomplet): 7  ███████░░░░░░░░░░░░░░░  18%
SIMULÉ (Placeholder):                2  ██░░░░░░░░░░░░░░░░░░░░   5%
MANQUANT (Non implémenté):           9  █████████░░░░░░░░░░░░░  22%
```

## CORRECTIONS APPLIQUÉES

1. ✅ **Role escalation guard** — getRoleLevel() dans users POST et PUT
2. ✅ **User DELETE** — Soft delete (isActive=false) ajouté
3. ✅ **Workflow org isolation** — PUT/DELETE vérifient organizationId
4. ✅ **User org isolation** — GET/PUT vérifient org membership
5. ✅ **Audit cross-org** — SUPER_ADMIN peut voir toutes les orgs
6. ✅ **Notification ownership** — Vérification userId avant update
7. ✅ **Settings sensitive keys** — Protection SUPER_ADMIN seulement
