---
title: Import and export
sidebar_position: 1
---

# Import and export workflow

CRS now has a dedicated import path instead of leaning on the older generic pipeline.

## Supported CSV styles

### CRS-native

Use this when you are exporting from CRS and importing back into CRS.

### Broker-style

Use this when your CSV looks closer to:

```text
id,symbol,direction,volume,open_price,close_price,open_time,close_time,profit,commission,swap,net_profit,sl,tp
```

That format is recognized directly by the backend CRS parser.

## Screenshot slots

If you want visual walkthroughs in these docs, place screenshots in:

```text
docs-site/static/shots/
```

Recommended examples:

- `/shots/trades-import-preview.png`
- `/shots/trades-import-report.png`

## Visual reference

<div className="crs-shot-grid">
  <figure className="crs-shot-card">
    <img src="/shots/data/data-state-05.png" alt="Import flow with populated CRS data" />
    <figcaption>Reference populated state for reviewing imports against an active dataset.</figcaption>
  </figure>
  <figure className="crs-shot-card">
    <img src="/shots/empty/empty-state-05.png" alt="Import flow with empty CRS state" />
    <figcaption>Reference empty state when the account has no trade data yet.</figcaption>
  </figure>
</div>

## Import flow

The current in-app flow is:

1. Select the CSV file.
2. Run a backend preview.
3. Review:
   - rows that would import
   - duplicates that would skip
   - invalid rows
4. Confirm the import.
5. Review import history and any skipped-row report.

## Duplicate handling

Duplicate protection is now enforced at three layers:

- frontend duplicate guard
- backend create/update duplicate guard
- database unique index

Re-importing the same file should skip duplicates instead of failing the backend job.

## Export behavior

Default CSV export now uses the CRS contract. Legacy export is still available only when explicitly requested.

## Notes on accounts

- active account can be used as the default target during import
- if no account exists, the user should create one before importing or recording trades

## JSON backup

Settings export/import is separate from the trade CSV flow. It is used for broader account data backup and restore.

:::note
The older markdown at `documentation/EXPORT_IMPORT_README.md` still contains useful history, but the active in-app and backend behavior follows the CRS-native path described here.
:::
