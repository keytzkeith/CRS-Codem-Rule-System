---
title: Local setup
sidebar_position: 2
---

# Local setup

Use this as the clean local CRS layout:

- frontend on `5173`
- backend on `3000`
- Postgres in Docker on `5433`
- Adminer on `8080`

## 1. Start Postgres

```bash
docker compose -f docker-compose.dev.yaml up -d postgres
```

If you also want a database browser:

```bash
docker compose -f docker-compose.dev.yaml up -d postgres adminer
```

## 2. Configure the backend

Create `backend/.env` from `backend/.env.example`.

The critical fields are:

```env
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=crs_db
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=replace_with_a_real_secret
```

## 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

## 4. Start the frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## 5. Open the app and docs

- app: `http://localhost:5173`
- docs: `http://localhost:3001`
- database browser: `http://localhost:8080`

## First-user behavior

- registration is enabled locally
- the first registered user becomes admin

## Common issues

### Port already in use

Stop old processes and restart only one backend and one frontend.

```bash
pkill -f 'node src/server.js'
pkill -f 'vite'
```

### Backend import gets stuck

This was previously tied to dev-watch restarts interrupting long-running imports. The current backend dev flow avoids that by using a simpler default server start.

### Finnhub warnings during import

CRS does not require Finnhub for forex, metals, or index-style imports. If `FINNHUB_API_KEY` is missing, the current build skips those enrichment calls cleanly.
