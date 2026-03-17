---
title: Go-Live Checklist
sidebar_position: 2
---

# Go-Live Checklist

Use this before opening CRS on a real domain. It is meant to be worked through, not skimmed.

Current release context:

- Version: `2.2.0`
- Stage: `Beta`
- Billing: deferred to a later v2 release

## Infrastructure

- VPS or production host is provisioned
- Postgres storage is persistent
- reverse proxy is configured
- HTTPS is active
- DNS resolves correctly

## Environment

- production env file created from `backend/.env.production.example`
- shared identity reviewed in `config/siteIdentity.json`
- `JWT_SECRET` replaced with a real secure value
- `FRONTEND_URL` points to the real app domain
- `PUBLIC_APP_URL` points to the real app domain
- `DOCS_SITE_URL` points to the real docs domain
- `PRIVACY_URL` and `TERMS_URL` point to the public legal pages
- `CORS_ORIGINS` matches the real frontend origins
- `API_BASE_URL` matches the public API address
- `SUPPORT_EMAIL` is correct
- `BILLING_ENABLED` is set intentionally
  For the current beta release, leave billing disabled unless you are explicitly testing future billing work.
- unused feature flags are disabled

## App checks

- login works
- registration mode behaves as expected
- admin can access `/admin`
- dashboard loads with real persisted data
- create trade works
- edit trade works
- delete trade works
- import preview works
- import commit works
- export produces CRS-native CSV

## Admin checks

- registration mode control works from the admin center
- manage users page loads
- backup page loads
- create backup works
- download backup works
- pending approvals work if registration mode uses approval

## Data checks

- duplicate import protection works
- imported trades map correctly
- sessions derive correctly for the active timezone
- calendar, equity curve, and summary metrics reflect stored data
- no stale mock data remains

## Docs checks

- docs site builds successfully
- docs site is deployed to its own Vercel project or other static host
- docs links resolve correctly
- docs branding matches the app
- screenshots load
- portfolio and repo links are correct

## Final release checks

- browser console has no major runtime errors
- backend logs show no crashing routes
- backups exist before launch
- one restore path is documented and tested
- founder/contact information is correct sitewide
- privacy and terms pages have been reviewed before public launch

## Immediate post-launch checks

- sign in from the live domain
- import one real CSV
- create one manual trade
- verify admin center still loads
- take a fresh backup after first live data write
