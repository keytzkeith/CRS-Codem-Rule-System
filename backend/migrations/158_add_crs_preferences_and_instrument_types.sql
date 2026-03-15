-- Migration: Add CRS preferences to user_settings and extend trade instrument types

ALTER TABLE user_settings
ADD COLUMN IF NOT EXISTS crs_preferences JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN user_settings.crs_preferences IS 'CRS-specific frontend preferences such as risk mode, review cadence, active account, and reusable setup/tag defaults';

ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_instrument_type_check;

ALTER TABLE trades
ADD CONSTRAINT trades_instrument_type_check
CHECK (instrument_type IN ('stock', 'option', 'future', 'crypto', 'forex', 'index'));

COMMENT ON COLUMN trades.instrument_type IS 'Type of instrument traded: stock, option, future, crypto, forex, or index';
