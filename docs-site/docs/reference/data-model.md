---
title: Data model
sidebar_position: 1
---

# CRS data model

CRS uses the existing backend tables where practical, while storing CRS-specific trade fields directly on `trades`.

## Core entities

- `trades`
- `diary_entries`
- `user_accounts`
- `user_settings`
- `tags`

## CRS trade fields

Current CRS-specific persistence includes fields such as:

- `setup_stack`
- `journal_payload`
- `checklist_payload`
- `contract_multiplier`
- `pip_size`
- `swap`
- `actual_risk_amount`
- `risk_percent_of_account`
- `pips`

## Why this matters

Earlier CRS iterations packed part of this data into notes metadata. The current direction is to keep those values first-class in the database so imports, exports, analytics, and edits are more reliable.

## Related repo docs

- `backend/docs/CRS_API_CONTRACT.md`
- `backend/docs/CRS_DATA_MODEL.md`
- `backend/docs/R_VALUE_CALCULATIONS.md`
