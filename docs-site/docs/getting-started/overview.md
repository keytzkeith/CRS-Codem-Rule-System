---
title: Overview
sidebar_position: 1
---

# Overview

CRS is a focused personal trading journal. The active product surface is intentionally narrow:

- dashboard
- trades
- journal
- analytics
- settings

These docs follow that product shape. They are not trying to preserve every feature from the broader legacy codebase.

## What these docs cover

- local setup with frontend, backend, Postgres, and Adminer
- CRS import and export workflows
- the current CRS data model and API contract
- deployment guidance for moving from local development to a live environment
- troubleshooting around imports, backend processes, and environment setup

## Product assumptions

- CRS is self-hostable
- PostgreSQL remains the database
- the backend is Node/Express
- the frontend is Vue/Vite
- the import pipeline is CRS-native first, while still supporting broker-style CSV formats

## Repo layout

```text
frontend/       Vue app
backend/        Express API, models, migrations, scripts
docs-site/      Docusaurus docs app
documentation/  older markdown and migration notes
```

## Visual states

<div className="crs-shot-grid">
  <figure className="crs-shot-card">
    <img src="/shots/data/data-state-01.png" alt="CRS populated state example" />
    <figcaption>Populated CRS state with real trade data loaded.</figcaption>
  </figure>
  <figure className="crs-shot-card">
    <img src="/shots/data/data-state-04.png" alt="CRS analytics state example" />
    <figcaption>Analytics and review surfaces with data-driven panels populated.</figcaption>
  </figure>
  <figure className="crs-shot-card">
    <img src="/shots/empty/empty-state-01.png" alt="CRS empty state example" />
    <figcaption>Empty-state treatment when a user has not loaded any trade data yet.</figcaption>
  </figure>
  <figure className="crs-shot-card">
    <img src="/shots/empty/empty-state-11.png" alt="CRS no-data view example" />
    <figcaption>No-data UI still keeps layout and guidance intact instead of collapsing into blanks.</figcaption>
  </figure>
</div>

## Recommendation

Use this docs site as the primary day-to-day reference. The markdown files in `backend/docs/` and `documentation/` still matter, but they are better treated as supporting material.

:::tip
If you are just getting started, go straight to [Local setup](/getting-started/local-setup).
:::
