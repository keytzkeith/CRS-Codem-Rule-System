# CRS Codem System Rule

CRS is a personal trading dashboard built around one workflow: record trades, review execution, measure discipline, and refine a rule-based system without the extra platform clutter.

This repo is currently being refactored from the original TradeTally codebase into a narrower CRS product.

## Current Product Direction

The active CRS experience is focused on five authenticated surfaces:

- Dashboard
- Trades
- Journal
- Analytics
- Settings

Current implementation status:

- frontend-first CRS shell and branding
- mock-first CRS trade store and analytics
- add/edit trade flow in the frontend
- local auth and backend running again
- backend prepared for gradual CRS persistence wiring

## Stack

- Frontend: Vue 3, Vite, Pinia, Vue Router, Tailwind
- Backend: Node.js, Express
- Database: PostgreSQL
- Local database workflow: Docker Postgres

## Local Development

The clean local setup for this repo is:

- frontend running natively on `5173`
- backend running natively on `3000`
- Postgres running in Docker on `5433`

### 1. Start Postgres

```bash
docker compose -f docker-compose.dev.yaml up -d postgres
```

### 2. Start the backend

```bash
cd backend
npm run dev
```

The local backend environment is expected at:

- [backend/.env](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/.env)

### 3. Start the frontend

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

Then open:

- `http://localhost:5173`

## Local Ports

- Frontend: `5173`
- Backend API: `3000`
- Postgres: `5433`

If you hit `address already in use`, it usually means an old dev process is still running. Clean up with:

```bash
pkill -f 'nodemon src/server.js'
pkill -f 'vite'
```

Then start one backend and one frontend only.

## Authentication

Registration is enabled in local development.

Notes:

- the first registered user becomes admin
- email verification is currently off in the lean local setup
- auth errors are now isolated per form so login and signup do not leak stale messages into each other

## Environment Files

There are multiple `.env.example` files in the repo, but they serve different scopes:

- [backend/.env.example](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/.env.example): backend/API/database template
- [frontend/.env.example](/home/kodemtrader/Keith/extracted/CODES/CRS/frontend/.env.example): frontend/Vite template
- [.env.example](/home/kodemtrader/Keith/extracted/CODES/CRS/.env.example): broader deployment or Docker-oriented template

For day-to-day local CRS work, the important one is `backend/.env`.

## Docker

Docker files are kept because they are useful for:

- local Postgres
- future deployment
- reproducible environments

Current recommendation:

- use Docker for Postgres only during development
- keep frontend/backend native for easier debugging
- use Docker more fully later when preparing the live deployment

Relevant files:

- [docker-compose.dev.yaml](/home/kodemtrader/Keith/extracted/CODES/CRS/docker-compose.dev.yaml)
- [docker-compose.yaml](/home/kodemtrader/Keith/extracted/CODES/CRS/docker-compose.yaml)
- [Dockerfile](/home/kodemtrader/Keith/extracted/CODES/CRS/Dockerfile)

## CRS Backend Wiring

CRS persistence is being wired incrementally onto the existing backend rather than creating a second backend.

Reference:

- [CRS_API_CONTRACT.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/CRS_API_CONTRACT.md)
- [CRS_DATA_MODEL.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/CRS_DATA_MODEL.md)
- [LOCAL_SETUP.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/LOCAL_SETUP.md)

Current backend direction:

- reuse `trades`
- reuse `diary_entries`
- reuse `user_accounts`
- extend settings for CRS preferences where needed

## What Still Needs Work

- deeper removal of legacy TradeTally public/marketing/community surfaces
- full CRS persistence from frontend store to backend APIs
- broader README/docs updates in backend docs where legacy naming still exists
- tests for analytics calculations, filters, and persistence flows
- final deployment documentation for the live CRS site

## Documentation Notes

The repo documentation is now being updated alongside implementation work.

Current useful documents:

- [README.md](/home/kodemtrader/Keith/extracted/CODES/CRS/README.md)
- [LOCAL_SETUP.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/LOCAL_SETUP.md)
- [CRS_DATA_MODEL.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/CRS_DATA_MODEL.md)
- [CRS_API_CONTRACT.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/CRS_API_CONTRACT.md)

## Project Intent

The target product is not a broad social trading platform. It is a personal rule-based journaling and analytics system centered on:

- execution quality
- discipline tracking
- setup review
- account-aware risk
- clean trade logging

That direction should guide further refactors.
