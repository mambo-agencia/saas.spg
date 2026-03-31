# SPG Juridico — Arquitectura del Sistema

## Estructura del Monorepo

```
saas.spg/
├── apps/
│   ├── api/                    # Express API (Node.js 20 + TypeScript)
│   │   ├── prisma/             # Schema + migraciones + seed
│   │   └── src/
│   │       ├── index.ts        # Entry point
│   │       ├── app.ts          # Express app, middleware, rutas
│   │       ├── lib/            # prisma, redis, logger, encrypt
│   │       ├── middleware/     # auth (JWT), errorHandler, audit
│   │       ├── routes/         # auth, casos, usuarios, eventos, analisis, ...
│   │       ├── services/       # casos.service (numeroCaso), whatsapp.service
│   │       ├── jobs/           # Bull queues + workers (sync, notificaciones, mantenimiento)
│   │       └── scrapers/       # mev.scraper (Cheerio), pjn-ba.scraper (Puppeteer)
│   └── web/                    # Next.js 14 frontend (App Router)
│       └── src/
│           ├── app/            # Routes (auth, dashboard, casos, agenda, análisis, conexiones, usuarios)
│           ├── components/     # Por sección (dashboard, casos, agenda, analisis, conexiones, usuarios)
│           ├── lib/            # api (axios), auth (localStorage), utils
│           └── globals.css     # Design system (paleta SPG, tipografía Bebas Neue + DM Sans)
└── packages/
    └── shared/                 # TypeScript types compartidos (enums, interfaces)
        └── src/types/          # enums.ts, caso.ts, usuario.ts, api.ts
```

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Drag & Drop | @hello-pangea/dnd (fork de react-beautiful-dnd) |
| Charts | Recharts |
| State | TanStack Query v5 |
| Backend | Node.js 20, Express 4, TypeScript |
| ORM | Prisma 5 + PostgreSQL 15 |
| Jobs | Bull + Redis 7 |
| Scrapers | Cheerio (MEV public), Puppeteer (PJN auth) |
| Auth | JWT (bcrypt + jsonwebtoken) |
| Notifications | Twilio WhatsApp API |
| Encryption | crypto-js AES-256 (para credenciales) |

## Flujo de Datos

```
Usuario → Next.js (SSR/CSR)
    ↓ Axios + JWT Bearer token
Express API (/api/*)
    ↓ Prisma ORM
PostgreSQL (casos, usuarios, movimientos, ...)

Bull Queue (Redis)
    ├─ syncQueue → scrapers/mev, pjn-ba, pjn-neuquen, pjn-rio-negro, srt
    │   └─ cada 3h automático + manual via API
    ├─ notificacionesQueue → whatsapp.service (Twilio)
    │   └─ cada 30min
    └─ mantenimientoQueue → deduplicar, limpiarLogs, backup
        └─ diario (3-5am)
```

## Seguridad

- **JWT** en `Authorization: Bearer <token>` header
- **Roles**: `admin > abogado > captadora` — middleware `requireRole()`
- **Credenciales externas** (PJN/SRT) encriptadas con AES-256 en BD
- **Audit log** en tabla `audit_log` para todos los cambios
- **Rate limiting**: 300 req / 15 min por IP
- **Helmet** + CORS restrictivo

## Variables de Entorno Críticas

```env
DATABASE_URL         # PostgreSQL connection string
REDIS_URL            # Redis connection string
JWT_SECRET           # >= 32 chars random string
ENCRYPTION_KEY       # = 32 chars para AES-256
TWILIO_ACCOUNT_SID   # Para WhatsApp
TWILIO_AUTH_TOKEN
```

## Setup Local (Desarrollo)

```bash
# 1. Infraestructura
docker-compose up -d   # PostgreSQL + Redis

# 2. Instalar dependencias
npm install

# 3. Variables de entorno
cp .env.example apps/api/.env
# Editar con tus valores

# 4. Migraciones y seed
npm run db:migrate
npm run db:seed

# 5. Dev
npm run dev   # API en :4000, Web en :3000
```

## Convenciones

- **Numeración de casos**: `SPG-YYYY-NNNN` (auto-generado)
- **Etapas**: `SRT → LITIGIOS_EXTRAJUDICIAL → NEGOCIACIONES → LITIGIOS_JUDICIAL → SENTENCIADO`
  o `NEGOCIACIONES → ACUERDO_CERRADO`
- **CONGELADO**: cualquier caso sin movimiento por 30+ días (detectado por job diario)
- **Captación**: es un campo del caso, NO una etapa del flujo
- **Scrapers**: stub con estructura real — selectores CSS deben ajustarse al HTML real de cada sitio
