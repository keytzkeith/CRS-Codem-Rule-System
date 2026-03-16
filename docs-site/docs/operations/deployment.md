---
title: Deployment
sidebar_position: 1
---

# Deployment

CRS can be developed locally first and deployed later without changing the product shape.

## Practical deployment path

Recommended progression:

1. local frontend + local backend + Docker Postgres
2. stable VPS or server environment
3. production env values
4. reverse proxy and TLS
5. backups and update procedure

## Current repo assets that help

- `Dockerfile`
- `docker-compose.yaml`
- `docker-compose.example.yaml`
- deployment and migration notes in `documentation/`

## Production concerns

- strong `JWT_SECRET`
- correct `FRONTEND_URL` and API base URLs
- persistent Postgres volumes
- HTTPS
- backup plan
- restart policy and logs

## What still needs documenting further

- exact live server layout
- domain and Nginx or Caddy config
- CI/CD or image publishing steps
- restore process and upgrade checklist
