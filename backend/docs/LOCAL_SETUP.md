# CRS Local Setup

This is the recommended local workflow for CRS.

## Ports

- Frontend: `5173`
- Backend: `3000`
- Postgres: `5433`
- Adminer: `8080`

## Runtime Shape

Use:

- Docker for Postgres only
- native backend process
- native frontend process

This keeps local debugging simple while still staying close to a deployable setup.

## Prerequisites

- Node.js installed
- npm installed
- Docker and Docker Compose installed

## Backend Environment

Create:

- `backend/.env`

The current local configuration usually looks like this:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=trader
DB_PASSWORD=trader_password
DB_NAME=crs_db

JWT_SECRET=crs_local_dev_jwt_secret_replace_before_production
JWT_EXPIRES_IN=7d
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=30d

NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://192.168.100.13:5173
API_BASE_URL=http://localhost:3000

RUN_MIGRATIONS=true
ENABLE_SWAGGER=true
REGISTRATION_MODE=open
DETAILED_AUTH_ERRORS=true
BILLING_ENABLED=false

ENABLE_PRICE_MONITORING=false
ENABLE_TRADE_ENRICHMENT=false
ENABLE_JOB_RECOVERY=false
ENABLE_GAMIFICATION=false
ENABLE_TRIAL_EMAILS=false
ENABLE_RETENTION_EMAILS=false
ENABLE_OPTIONS_SCHEDULER=false
ENABLE_BACKUP_SCHEDULER=false
ENABLE_ENRICHMENT_CACHE_CLEANUP=false
ENABLE_BROKER_SYNC_SCHEDULER=false
ENABLE_DIVIDEND_SCHEDULER=false
ENABLE_PUSH_NOTIFICATIONS=false

LOG_LEVEL=ERROR

VITE_API_URL=/api
```

## Start Sequence

### 1. Start Postgres

```bash
docker compose -f docker-compose.dev.yaml up -d postgres
```

### Optional: Start Adminer

```bash
docker compose -f docker-compose.dev.yaml up -d adminer
```

Open:

- `http://localhost:8080`

Suggested login values:

- System: `PostgreSQL`
- Server: `postgres`
- Username: value of `DB_USER`
- Password: value of `DB_PASSWORD`
- Database: value of `DB_NAME`

### 2. Start the backend

```bash
cd backend
npm run dev
```

Notes:

- migrations run automatically on startup
- the first registered user becomes admin

### 3. Start the frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Open:

- `http://localhost:5173`

## Verifying Auth

When the backend is healthy:

- `GET /api/auth/config` should return `200`
- `POST /api/auth/register` should return `201`
- `POST /api/auth/login` should return `200`

## Common Issues

### Address already in use

Old dev processes are still running.

Clean them up:

```bash
pkill -f 'nodemon src/server.js'
pkill -f 'vite'
```

Then restart one backend and one frontend only.

### Auth returns `500`

Usually one of these:

- backend is not running
- Postgres is not running
- `backend/.env` is missing
- database has not been initialized

### Docker Postgres is healthy but the app still fails

Check:

- backend is using `DB_PORT=5433`
- Docker container `crs-db-dev` is up
- backend startup logs completed migrations successfully

### I want to inspect the data visually

Use Adminer on `http://localhost:8080`. It is the fastest local way to:

- open the `trades` table
- confirm migrations applied
- inspect CRS trade fields such as `setup_stack`, `journal_payload`, and `checklist_payload`

## Recommendation

Stay with this local setup unless you have a specific reason to mirror production more closely.

Later, for live deployment:

- reuse the same app code
- use different production env values
- optionally move to a fuller Docker deployment
