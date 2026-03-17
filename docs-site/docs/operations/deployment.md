---
title: Deployment
sidebar_position: 1
---

# Deployment

CRS already works well as a local-first project. Going live should feel like a change of environment, not a rewrite.

This page covers the practical deployment path for the repo as it exists today.

## Recommended live layout

For the current stack, the cleanest live setup is:

- frontend app on Vercel
- Docusaurus docs on Vercel as a second project
- backend and Postgres on a VPS or another Node-friendly host

The backend in this repo is not a good match for Vercel serverless. It expects a long-running Express process, background work, imports, backups, and a persistent Postgres connection.

Recommended domain split later:

- app: `https://crs.yourdomain.com`
- docs: `https://docs.yourdomain.com`
- api: `https://api.yourdomain.com` or `https://crs.yourdomain.com/api`

If you do not have the custom domain yet, launch on the default Vercel URLs first and swap the real domains in later.

## Recommended order

1. finish local QA with native frontend, native backend, and Docker Postgres
2. prepare production env files and secrets
3. deploy the backend stack on a VPS using Docker Compose or a direct Node + Postgres setup
4. deploy the frontend app to Vercel
5. deploy the docs site to Vercel
6. add custom domains later when ready
7. verify backups, imports, auth, and admin access

## Useful repo assets

- `Dockerfile`
- `docker-compose.yaml`
- `docker-compose.example.yaml`
- `backend/.env.production.example`
- `config/siteIdentity.json`
- CRS docs in this Docusaurus site

## Preferred production shape

The most practical setup for this repo is:

- backend and database on a VPS or similar host
- frontend app deployed on Vercel
- docs site deployed on Vercel
- Postgres data stored on a persistent volume

That gives you:

- easier backups
- simpler frontend and docs deployment
- cleaner separation between app and docs

## Production environment basics

Before going live, make sure these are set correctly:

- `NODE_ENV=production`
- strong `JWT_SECRET`
- correct `FRONTEND_URL`
- correct `CORS_ORIGINS`
- correct `API_BASE_URL`
- persistent Postgres host, user, password, and database
- `BILLING_ENABLED=false` unless you are intentionally enabling subscriptions
- background feature flags set deliberately, not left random

Reference files in the repo:

```text
backend/.env.production.example
config/siteIdentity.json
```

## What to update once your real domain is ready

Update these together:

- `config/siteIdentity.json`
- `PUBLIC_APP_URL`
- `DOCS_SITE_URL`
- `FRONTEND_URL`
- `PRIVACY_URL`
- `TERMS_URL`
- `CORS_ORIGINS`

## Vercel setup

### Frontend app

- project root: `frontend`
- build command: `npm run build`
- output directory: `dist`

### Docs site

- project root: `docs-site`
- build command: `npm run build`
- output directory: `build`

Once both projects are live:

1. copy the generated Vercel URLs
2. put them into `config/siteIdentity.json`
3. update the backend env values listed above
4. redeploy app, docs, and backend so the public links line up

## Reverse proxy expectations

If you host the backend on a VPS, your proxy should:

- terminate HTTPS
- serve the built frontend
- forward `/api` to the Node backend
- optionally serve docs from a second host or static root

At minimum:

- `https://api.yourdomain.com` -> backend `localhost:3000`
- or `https://crs.yourdomain.com/api` -> backend `localhost:3000`

## Backend startup choices

Use one of these:

### Option 1. Docker Compose

Use this when you want a reproducible server setup and easier rebuilds.

### Option 2. Native Node + Postgres

Use this when you want direct control and simpler debugging on the server.

For production, use a real process manager such as:

- `systemd`
- `pm2`
- Docker restart policies

## Docs deployment

The docs site is static. Build it with:

```bash
cd docs-site
npm install
npm run build
```

Then create a Vercel project with `docs-site` as the root directory. Vercel will handle the static output automatically.

## Backups and restore

Do not go live without a restore path.

At minimum:

- database backups must run on a schedule
- backups should live off the server as well, not only on the same disk
- restore should be tested once before launch

If you are using the built-in backup tools, also verify:

- admin backup page loads
- create backup works
- download works
- restore path is documented internally

## Suggested production sequence

1. provision VPS
2. install Docker and Docker Compose, or Node + Postgres + Nginx
3. create production env file
4. deploy backend
5. deploy frontend on Vercel
6. deploy docs on Vercel
7. configure HTTPS and custom domains when ready
8. create admin user
9. run import/export QA
10. take first verified backup

## Before opening to real users

Do not skip:

- login and registration checks
- admin route checks
- import preview and import commit checks
- create/edit/delete trade checks
- account and settings persistence checks
- backup creation and download checks

Use the dedicated checklist here:

- [Go-Live Checklist](/operations/go-live-checklist)
