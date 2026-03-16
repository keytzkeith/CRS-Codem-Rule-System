---
title: API contract
sidebar_position: 2
---

# API contract

CRS is being wired incrementally onto the existing backend rather than replacing it with a parallel service.

## Current contract direction

- reuse `trades`
- reuse `diary_entries`
- reuse `user_accounts`
- extend settings for CRS-specific preferences

## Public areas that matter most to CRS

- authentication
- trades
- settings
- accounts
- import/export

## Important implementation detail

The frontend CRS store should now send real CRS fields directly to the backend instead of serializing hidden metadata into notes for new records.

For the full contract details, use:

- `backend/docs/CRS_API_CONTRACT.md`
