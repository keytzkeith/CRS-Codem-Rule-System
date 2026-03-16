---
title: Trade capture
sidebar_position: 2
---

# Trade capture workflow

CRS trade capture is built around execution review, not just storing a broker fill.

## Manual entry

The current form supports:

- account
- pair / symbol
- direction
- entry
- stop loss
- take profit
- close price
- volume
- commission
- swap
- setup stack
- checklist items
- journal notes

## Derived values

CRS calculates and persists:

- result amount
- result in `R`
- actual risk amount
- risk percent of account
- pips / points
- holding time
- session

## Session derivation

Session is derived automatically from trade time and the configured timezone.

Default timezone:

- `Africa/Nairobi`

## Checklist customization

Checklist items are not hardcoded to one trading style. Users can customize their own validation items in settings.
