---
title: Troubleshooting
sidebar_position: 2
---

# Troubleshooting

## Backend dev process crashes

Older setups could fail because of `nodemon` and `minimatch` issues on newer Node versions. The current backend dev path avoids that by using a simpler server start flow.

## Import preview says it is taking too long

Check import history first. The backend now marks stale interrupted imports as failed instead of leaving them in `processing` forever.

## Duplicate CSV re-import

This should now skip rows as duplicates instead of crashing. If it does not, inspect:

- duplicate signature fields
- account mapping
- import history report

## Zero or incorrect calculated values

If older trades were saved before the current persistence fix, run the CRS repair script:

```bash
cd backend
npm run trades:repair -- --timezone Africa/Nairobi
```

## Finnhub API key warnings

CRS does not require Finnhub for forex, metals, or index-style imports. Missing Finnhub config should no longer block the import path.
