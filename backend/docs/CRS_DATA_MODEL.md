# CRS Data Model

This document summarizes the frontend-first CRS model currently driving the app.

## Core Types

The mock-first CRS flow is centered on these shapes:

- `TradeRecord`
- `TradeJournal`
- `TradeChecklist`
- `DashboardMetrics`
- `CrsSettings`

Reference mock definitions:

- [crsMockData.js](/home/kodemtrader/Keith/extracted/CODES/CRS/frontend/src/data/crsMockData.js)

## TradeRecord

Current CRS trade records include:

- `id`
- `date`
- `pair`
- `direction`
- `setupType`
- `setupStack`
- `session`
- `entry`
- `stopLoss`
- `takeProfit`
- `status`
- `resultR`
- `resultAmount`
- `tags`
- `accountId`
- `notes`
- `imageUrl`
- `journal`
- `checklist`

Important behavior:

- `status` is derived from `resultR`
- `resultAmount` is derived from `resultR` and current risk settings in the form flow
- `setupStack` allows multiple setup conditions, not just one primary setup

## TradeJournal

Current journal payload includes fields such as:

- `followedPlan`
- `summary`
- `whatWentWell`
- `whatNeedsWork`
- `mistakes`
- `emotions`

The CRS direction is to keep journaling compact and execution-focused.

## TradeChecklist

Checklist fields capture rule compliance, for example:

- higher-timeframe alignment
- session validity
- confirmation present
- minimum reward-to-risk
- bias alignment

Exact prompts can evolve, but the intent remains the same:

- make discipline visible
- make rule-following measurable

## DashboardMetrics

Current dashboard metrics include:

- total trades
- win rate
- net PnL
- average win
- average loss
- profit factor
- average RR
- current streak
- best day
- worst day
- rule-followed rate
- outside-plan rate

These are derived from the same shared CRS trade store.

## CrsSettings

Current CRS settings include:

- currency
- risk mode
- risk per trade
- preferred period
- review cadence
- reusable setup types
- reusable tags
- account list
- active account
- empty-state preview toggle

## Accounts

CRS now supports multiple accounts in the frontend with a practical cap of 10.

Account-aware behavior currently affects:

- active risk calculations
- trade account selection
- settings management

## Persistence Direction

CRS is not meant to create a parallel backend product.

The backend direction remains:

- store core trades in `trades`
- store journal/checklist data through linked diary records
- store accounts through `user_accounts`
- store CRS preferences via settings extensions

Reference:

- [CRS_API_CONTRACT.md](/home/kodemtrader/Keith/extracted/CODES/CRS/backend/docs/CRS_API_CONTRACT.md)

## Design Constraint

The CRS data model should stay optimized for:

- personal use
- rule-based review
- fast manual entry
- readable analytics

It should not drift back toward broad platform complexity unless explicitly intended.
