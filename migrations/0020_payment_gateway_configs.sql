-- Migration: Multi-Gateway Payment Infrastructure
-- Adds dedicated payment_gateway_configs table and normalizes payment transaction columns.
-- All ALTER TABLE statements use exception handling for idempotency on existing DBs.

-- ─── 1. Dedicated gateway config table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_gateway_configs (
  id SERIAL PRIMARY KEY,
  gateway_name VARCHAR(50) NOT NULL UNIQUE,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  sandbox_mode BOOLEAN NOT NULL DEFAULT true,
  encrypted_credentials JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add is_active if table already existed without it
DO $$ BEGIN
  BEGIN ALTER TABLE payment_gateway_configs ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_name ON payment_gateway_configs (gateway_name);
CREATE INDEX IF NOT EXISTS idx_payment_gateway_configs_active ON payment_gateway_configs (is_active) WHERE is_active = true;

-- Seed default rows for all supported gateways (shetab starts as active)
INSERT INTO payment_gateway_configs (gateway_name, is_active, is_enabled, sandbox_mode)
VALUES
  ('shetab',   true,  false, false),
  ('zarinpal', false, false, true),
  ('idpay',    false, false, true),
  ('zibal',    false, false, true),
  ('mellat',   false, false, true)
ON CONFLICT (gateway_name) DO NOTHING;

-- ─── 2. admin_settings: multi-gateway preference columns ─────────────────────
DO $$ BEGIN
  BEGIN ALTER TABLE admin_settings ADD COLUMN active_payment_gateway VARCHAR(50) DEFAULT 'shetab'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zarinpal_merchant_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zarinpal_enabled BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zarinpal_sandbox BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN idpay_api_key VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN idpay_enabled BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN idpay_sandbox BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zibal_merchant_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zibal_enabled BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN zibal_sandbox BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN mellat_terminal_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN mellat_username VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN mellat_password TEXT; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN mellat_enabled BOOLEAN DEFAULT false; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE admin_settings ADD COLUMN mellat_sandbox BOOLEAN DEFAULT true; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ─── 3. wallet_transactions: gateway tracking columns ────────────────────────
DO $$ BEGIN
  BEGIN ALTER TABLE wallet_transactions ADD COLUMN gateway_name VARCHAR(50) DEFAULT 'shetab'; EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE wallet_transactions ADD COLUMN gateway_transaction_id VARCHAR(512); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE wallet_transactions ADD COLUMN merchant_transaction_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE wallet_transactions ADD COLUMN card_number VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;

-- ─── 4. course_payments: gateway tracking columns ────────────────────────────
DO $$ BEGIN
  BEGIN ALTER TABLE course_payments ADD COLUMN gateway_name VARCHAR(50); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN gateway_transaction_id VARCHAR(512); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN gateway_reference_number VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN merchant_transaction_id VARCHAR(255); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN card_number VARCHAR(20); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN original_price DECIMAL(12,2); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN discount_percentage DECIMAL(5,2); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN final_price DECIMAL(12,2); EXCEPTION WHEN duplicate_column THEN NULL; END;
  BEGIN ALTER TABLE course_payments ADD COLUMN credits_awarded INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN NULL; END;
END $$;
