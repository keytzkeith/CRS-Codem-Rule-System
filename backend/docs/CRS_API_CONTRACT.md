# CRS API Contract

This document defines the target contract between the CRS frontend store and the existing backend APIs.

The goal is to reuse existing backend entities where possible:

- `trades`
- `diary_entries`
- `user_accounts`
- `tags`
- `user_settings`

## Scope

This contract is for the current CRS frontend model used in:

- `frontend/src/stores/crs.js`
- `frontend/src/views/trades/TradeFormView.vue`
- `frontend/src/views/SettingsView.vue`

It is intentionally pragmatic:

- map directly where possible
- serialize where needed
- defer schema expansion until the frontend is wired and validated

## Entity Mapping

### 1. TradeRecord -> `POST /api/trades`

CRS frontend source shape:

```js
{
  id,
  date,
  pair,
  direction,
  setupType,
  setupStack,
  session,
  accountId,
  accountName,
  entry,
  stopLoss,
  takeProfit,
  resultR,
  resultAmount,
  tags,
  screenshot,
  journal,
  checklist
}
```

Backend trade payload to send:

```json
{
  "symbol": "EURUSD",
  "entryTime": "2026-03-15T09:30:00.000Z",
  "exitTime": "2026-03-15T09:30:00.000Z",
  "entryPrice": 1.0824,
  "exitPrice": 1.086,
  "quantity": 1,
  "side": "long",
  "instrumentType": "forex",
  "commission": 0,
  "fees": 0,
  "notes": "CRS compact summary note",
  "broker": "CRS",
  "account_identifier": "crs-demo-main",
  "strategy": "London",
  "setup": "OB retest",
  "tags": [
    "OB retest",
    "Liquidity sweep",
    "London",
    "A+ setup"
  ],
  "stopLoss": 1.0806,
  "takeProfit": 1.0872,
  "chartUrl": "https://...",
  "pnl": 180,
  "tradeDate": "2026-03-15"
}
```

### Field rules

| CRS field | Backend field | Rule |
|---|---|---|
| `pair` | `symbol` | uppercase |
| `date` | `tradeDate` | send exact date string |
| `date` | `entryTime` | derive as `${date}T09:30:00.000Z` for v1 |
| `date` | `exitTime` | derive same timestamp for closed/manual CRS v1 trades |
| `entry` | `entryPrice` | direct |
| `takeProfit` | `exitPrice` | use as synthetic exit for v1 if no real execution prices exist |
| `direction` | `side` | `Long -> long`, `Short -> short` |
| `setupType` | `setup` | direct |
| `session` | `strategy` | temporary v1 mapping |
| `setupStack[1..]` | `tags` | append extra setup chips to tags |
| `tags` | `tags` | merge with extra setup chips, dedupe |
| `screenshot` | `chartUrl` | temporary best fit |
| `accountId` | `account_identifier` | map from account record identifier, not frontend id |
| `resultAmount` | `pnl` | send frontend-computed value |
| `resultR` | none in request | backend computes `r_value` if stop/entry/exit exist |
| `journal.notes` | `notes` | combine into compact trade note for quick table rendering |

### Important constraints

- Existing validation requires `quantity`, so CRS v1 should send `1`.
- Existing validation only allows `instrumentType` values `stock|option|future|crypto`.
- CRS instruments like forex and indices do not fit cleanly yet.
- For v1 adapter, use:
  - `instrumentType: "crypto"` for FX/indices if we must fit current validation, or
  - extend validation to allow `forex` and `index` before wiring.

Recommended fix before implementation:

- extend backend validation to allow `forex` and `index`

### Trade update

Use `PUT /api/trades/:id` with the same mapped payload.

## 2. TradeJournal -> `POST /api/diary`

CRS journal shape:

```js
{
  whyTaken,
  htfBias,
  entryModel,
  followedPlan,
  emotionBefore,
  emotionAfter,
  mistakeMade,
  lessonLearned,
  notes
}
```

Backend diary payload to send:

```json
{
  "entryDate": "2026-03-15",
  "entryType": "diary",
  "title": "EURUSD Long",
  "marketBias": "bullish",
  "content": "JSON or structured markdown payload",
  "keyLevels": "Entry: 1.0824 | SL: 1.0806 | TP: 1.0872",
  "watchlist": ["EURUSD"],
  "linkedTrades": ["trade-uuid"],
  "tags": ["OB retest", "London"],
  "followedPlan": true,
  "lessonsLearned": "Wait for confirmation before moving to breakeven."
}
```

### Journal storage rule

For v1, store the richer CRS journal fields inside `content` as serialized JSON:

```json
{
  "whyTaken": "...",
  "htfBias": "...",
  "entryModel": "...",
  "emotionBefore": "...",
  "emotionAfter": "...",
  "mistakeMade": "...",
  "notes": "...",
  "checklist": {
    "htfBosConfirmed": true,
    "pullbackToOb": true,
    "m15Confirmation": true,
    "tradedWithBias": true,
    "validSession": true,
    "minimumRRMet": true
  }
}
```

Why this approach:

- no schema migration required for the first persistence pass
- linked trade support already exists
- diary attachments can later support screenshots

Recommended longer-term improvement:

- add `journal_payload JSONB` to `diary_entries`
- add `checklist_payload JSONB` to `diary_entries` or `trades`

## 3. TradeChecklist -> serialized within diary content

CRS checklist does not currently map to dedicated backend fields.

V1 storage:

- embed checklist JSON inside diary `content`

V2 preferred storage:

- `diary_entries.checklist_payload JSONB`

## 4. Accounts -> `GET/POST/PUT /api/accounts`

CRS settings account shape:

```js
{
  id,
  name,
  size
}
```

Backend account payload:

```json
{
  "accountName": "Main account",
  "accountIdentifier": "crs-main",
  "broker": "CRS",
  "initialBalance": 10000,
  "initialBalanceDate": "2026-03-15",
  "isPrimary": true,
  "notes": "CRS account"
}
```

### Mapping rules

| CRS field | Backend field | Rule |
|---|---|---|
| `name` | `accountName` | direct |
| generated slug | `accountIdentifier` | create once and persist |
| `size` | `initialBalance` | direct |
| active account | `isPrimary` | direct |

Important note:

- frontend `accountId` should eventually store backend account `id`
- trade writes still need `account_identifier` until backend trade payload supports real account foreign key input

## 5. Tags -> `GET/POST /api/settings/tags`

CRS custom tags and setup chips can reuse the existing tag API.

V1 behavior:

- custom tags -> create in `tags`
- custom setup types -> either:
  - also create as tags, or
  - remain frontend-only until CRS preferences are added

Recommended v1:

- create both custom tags and setup types as tags
- distinguish in frontend by store grouping, not backend schema

## 6. CRS Settings -> `PUT /api/settings`

Current backend settings support:

- `defaultStopLossType`
- `defaultStopLossPercent`
- `defaultStopLossDollars`

CRS settings needing support:

```js
{
  currency,
  riskMode,
  riskPerTrade,
  preferredPeriod,
  reviewCadence,
  previewEmptyState,
  customTags,
  customSetupTypes,
  activeAccountId
}
```

### V1 recommendation

Add a single new settings field:

- `crsPreferences JSONB`

Example:

```json
{
  "currency": "USD",
  "riskMode": "amount",
  "riskPerTrade": 125,
  "preferredPeriod": "monthly",
  "reviewCadence": "weekend",
  "activeAccountId": "uuid",
  "customTags": ["A+ setup", "execution grade"],
  "customSetupTypes": ["Liquidity sweep", "BOS entry"]
}
```

Do not persist:

- `previewEmptyState`

That should remain frontend-only dev state.

## Adapter Functions Needed In Frontend

### `toBackendTradePayload(tradeRecord, accountMap, settings)`

Outputs:

- valid `/api/trades` create/update payload

Responsibilities:

- map direction enum
- derive timestamps
- merge tags with setup stack
- map account id to account identifier
- project screenshot into `chartUrl`
- project session into `strategy`

### `toBackendDiaryPayload(tradeRecord, tradeId)`

Outputs:

- valid `/api/diary` payload

Responsibilities:

- create title
- serialize journal + checklist into content
- set `linkedTrades`
- infer `marketBias` from direction or HTF bias text

### `toBackendAccountPayload(account, isPrimary)`

Outputs:

- valid `/api/accounts` payload

### `toBackendSettingsPayload(crsSettings)`

Outputs:

- valid `/api/settings` payload

Responsibilities:

- write only supported generic fields today
- later include `crsPreferences`

## Minimum Backend Changes Recommended Before Wiring

1. Allow `instrumentType` values for CRS instruments:
   - `forex`
   - `index`

2. Add `crs_preferences JSONB` to `user_settings`

3. Optionally add one of:
   - `setup_stack JSONB` on `trades`
   - `journal_payload JSONB` on `diary_entries`
   - `checklist_payload JSONB` on `diary_entries`

If we want the fastest free-route implementation:

- do `1`
- do `2`
- defer `3`
- serialize journal/checklist into diary `content`

## Recommended Order For Step 4

1. Wire accounts API
2. Wire tags API
3. Wire settings API with partial CRS settings support
4. Wire trade create/update
5. Wire linked diary create/update after trade save
6. Replace mock reads with API reads once save/load is stable

## Infrastructure Note

When we reach the backend wiring step, we should also set up:

- local Postgres
- backend env vars
- migrations
- seed or test user flow

We can keep that entirely on the free route using local Postgres and the current Express backend.
