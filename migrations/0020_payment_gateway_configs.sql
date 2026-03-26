-- Migration: Add dedicated payment_gateway_configs table
-- This replaces the ad-hoc columns added to admin_settings for multi-gateway config.
-- Credentials are stored encrypted (AES-256-GCM) in the encrypted_credentials JSONB column.

CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id SERIAL PRIMARY KEY,
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  sandbox_mode BOOLEAN NOT NULL DEFAULT true,
  encrypted_credentials JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index for fast lookup by gateway name
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_name ON payment_gateway_configs (gateway_name);
