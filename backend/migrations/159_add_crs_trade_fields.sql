-- Migration: Add first-class CRS trade fields

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS contract_multiplier NUMERIC(20,8);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS pip_size NUMERIC(20,8);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS swap NUMERIC(20,8) DEFAULT 0;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS actual_risk_amount NUMERIC(20,8);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS risk_percent_of_account NUMERIC(10,4);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS pips NUMERIC(20,8);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS setup_stack JSONB DEFAULT '[]'::jsonb;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS journal_payload JSONB DEFAULT '{}'::jsonb;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS checklist_payload JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN trades.contract_multiplier IS 'CRS contract or lot multiplier used for net PnL calculations.';
COMMENT ON COLUMN trades.pip_size IS 'CRS pip or point size override for the traded instrument.';
COMMENT ON COLUMN trades.swap IS 'CRS swap or overnight financing amount applied to the trade.';
COMMENT ON COLUMN trades.actual_risk_amount IS 'Actual currency amount risked on the trade based on stop, size, and multiplier.';
COMMENT ON COLUMN trades.risk_percent_of_account IS 'Actual percentage of account balance risked on the trade.';
COMMENT ON COLUMN trades.pips IS 'Signed pips or points moved on the trade.';
COMMENT ON COLUMN trades.setup_stack IS 'CRS setup stack as an ordered JSON array.';
COMMENT ON COLUMN trades.journal_payload IS 'Structured CRS trade journal payload.';
COMMENT ON COLUMN trades.checklist_payload IS 'Structured CRS trade checklist payload.';
