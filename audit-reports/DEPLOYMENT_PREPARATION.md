# DEPLOYMENT PREPARATION — GED-ISIPA

**Date**: 2026-07-08  
**Status**: ⚠️ Repository préparé, VPS deployment NOT STARTED  

---

## PRÉREQUIS DE DÉPLOIEMENT

### ✅ Éléments Prêts
- [x] **Dockerfile** — Multi-stage (deps → builder → runner), node:20-alpine
- [x] **.env.example** — Toutes les variables documentées
- [x] **Prisma migrations** — Baseline 0_init créée et marquée
- [x] **Build standalone** — `output: "standalone"` dans next.config.ts
- [x] **Security headers** — CSP, HSTS, X-Frame-Options, Permissions-Policy
- [x] **Health check** — GET /api/health vérifie DB + stockage
- [x] **.gitignore** — Exclut .env*, skills/, scripts/, node_modules

### ❌ Éléments Manquants (requis pour VPS)
- [ ] **docker-compose.production.yml** — PostgreSQL + Redis + App
- [ ] **Nginx reverse proxy config** — SSL, proxy_pass
- [ ] **Backup script** — pg_dump / sqlite3 .backup cron
- [ ] **SSL certificates** — Let's Encrypt / Cloudflare
- [ ] **CI/CD pipeline** — GitHub Actions pour build + test + deploy
- [ ] **Monitoring setup** — Prometheus + Grafana ou équivalent
- [ ] **Log aggregation** — Loki/ELSA ou journalctl

---

## ARCHITECTURE DE DÉPLOIEMENT RECOMMANDÉE

```
Internet → Nginx (SSL) → Next.js App (:3000)
                              ↓
                        PostgreSQL (:5432)
                              ↓
                        Redis (:6379)
                              ↓
                        MinIO/S3 (:9000)
```

### Configuration Docker Compose Production

```yaml
# docker-compose.production.yml (à créer)
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://ged:password@postgres:5432/ged_isipa
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=https://your-domain.com
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ged
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ged_isipa
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

---

## CHECKLIST PRÉ-DÉPLOIEMENT

### Sécurité
- [x] Mots de passe hashés (bcrypt)
- [x] NEXTAUTH_SECRET crypto-random
- [x] Role escalation guard
- [x] Security headers configurés
- [ ] CORS configuré pour le domaine de production
- [ ] Cookies sameSite=lax en production
- [ ] Rate limiting persistant (Redis)
- [ ] SSL/TLS configuré

### Fonctionnel
- [x] Build réussi (next build ✅)
- [x] Authentification fonctionnelle
- [x] CRUD documents, utilisateurs, organisations
- [x] Workflow engine opérationnel
- [ ] Stockage fichiers fonctionnel
- [ ] Email intégré
- [ ] Tests automatisés

### Infrastructure
- [x] Dockerfile créé
- [x] .env.example documenté
- [ ] Docker Compose production
- [ ] Nginx config
- [ ] Backup automatisé
- [ ] Monitoring

---

## COMMANDES DE DÉPLOIEMENT (RÉFÉRENCE)

```bash
# 1. Cloner le repository
git clone https://github.com/USERNAME/ged-isipa.git
cd ged-isipa

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec les valeurs de production

# 3. Installer les dépendances
npm ci

# 4. Générer le client Prisma
npx prisma generate

# 5. Exécuter les migrations
npx prisma migrate deploy

# 6. Seeder la base de données
npx prisma db seed

# 7. Builder l'application
npm run build

# 8. Démarrer en production
npm start
# OU avec Docker:
# docker compose -f docker-compose.production.yml up -d
```

---

⚠️ **VPS DEPLOYMENT NOT STARTED** — Ce document est une préparation uniquement.
