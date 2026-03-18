-- Extend broker sync to support Goat Funded Trader and multiple connections per broker

ALTER TABLE broker_connections
  DROP CONSTRAINT IF EXISTS broker_connections_broker_type_check;

ALTER TABLE broker_connections
  ADD CONSTRAINT broker_connections_broker_type_check
  CHECK (broker_type IN ('ibkr', 'schwab', 'gft'));

ALTER TABLE broker_connections
  DROP CONSTRAINT IF EXISTS broker_connections_user_id_broker_type_key;

ALTER TABLE broker_connections
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES user_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS connection_name VARCHAR(120),
  ADD COLUMN IF NOT EXISTS external_account_id VARCHAR(100),
  ADD COLUMN IF NOT EXISTS gft_api_token TEXT;

CREATE INDEX IF NOT EXISTS idx_broker_connections_account_id ON broker_connections(account_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_broker_connections_user_broker_account_external
ON broker_connections (
  user_id,
  broker_type,
  COALESCE(account_id::text, ''),
  COALESCE(external_account_id, '')
);

ALTER TABLE trades
  ADD COLUMN IF NOT EXISTS external_trade_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_trades_external_trade_id
ON trades(external_trade_id)
WHERE external_trade_id IS NOT NULL;

COMMENT ON COLUMN broker_connections.account_id IS 'Linked CRS account for this broker connection';
COMMENT ON COLUMN broker_connections.connection_name IS 'User-facing label for the broker connection';
COMMENT ON COLUMN broker_connections.external_account_id IS 'Broker-side account identifier used during sync';
COMMENT ON COLUMN broker_connections.gft_api_token IS 'Encrypted Goat Funded Trader API token';
COMMENT ON COLUMN trades.external_trade_id IS 'Stable broker-side trade identifier for sync upserts';
