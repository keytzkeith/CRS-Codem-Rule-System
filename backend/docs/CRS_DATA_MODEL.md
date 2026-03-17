# CRS Data Model

This document summarizes the CRS model that currently drives the app.

## Core types

CRS is centered on these shapes:

- `TradeRecord`
- `TradeJournal`
- `TradeChecklist`
- `DashboardMetrics`
- `CrsSettings`

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
- `resultAmount` is derived from price movement, size, and costs in the current form flow
- `setupStack` allows multiple setup conditions, not just one primary setup

## TradeJournal

Current journal payload includes fields such as:

- `followedPlan`
- `summary`
- `whatWentWell`
- `whatNeedsWork`
- `mistakes`
- `emotions`

The journaling model is intentionally compact and execution-focused.

## TradeChecklist

Checklist fields capture rule compliance, for example:

- higher-timeframe alignment
- session validity
- confirmation present
- minimum reward-to-risk
- bias alignment

The exact prompts can evolve, but the intent remains the same:

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
## Accounts

CRS supports multiple accounts in the frontend with a practical cap of 10.

Account-aware behavior currently affects:

- active risk calculations
- trade account selection
- settings management

## Persistence direction

CRS is not meant to create a parallel backend product.

The backend direction remains:

- store core trades in `trades`
- store journal/checklist data through linked diary records
- store accounts through `user_accounts`
- store CRS preferences via settings extensions

Current backend trade table now has first-class CRS fields for:

- `setup_stack`
- `journal_payload`
- `checklist_payload`
- `contract_multiplier`
- `pip_size`
- `swap`
- `actual_risk_amount`
- `risk_percent_of_account`
- `pips`

Reference:

- [`CRS_API_CONTRACT.md`](CRS_API_CONTRACT.md)

## Design constraint

The CRS data model should stay optimized for:

- personal use
- rule-based review
- fast manual entry
- readable analytics

It should not drift back toward broad platform complexity unless explicitly intended.
