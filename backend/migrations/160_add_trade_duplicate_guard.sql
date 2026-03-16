-- Migration: Prevent duplicate trade rows for identical execution signatures

CREATE UNIQUE INDEX IF NOT EXISTS trades_duplicate_signature_idx
ON trades (
  user_id,
  UPPER(symbol),
  side,
  COALESCE(account_identifier, ''),
  entry_time,
  entry_price,
  exit_price,
  quantity
)
WHERE entry_time IS NOT NULL
  AND entry_price IS NOT NULL
  AND exit_price IS NOT NULL
  AND quantity IS NOT NULL;
