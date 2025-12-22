-- Zazzles - Promo Codes System
-- Run this in your Supabase SQL Editor
-- Date: 2025-12-22

-- ============================================
-- PROMO_CODES TABLE
-- Stores promotional codes for extra credits
-- ============================================
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Promo code details
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  credits INTEGER NOT NULL DEFAULT 5,

  -- Usage limits
  max_uses INTEGER, -- NULL means unlimited
  current_uses INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1, -- How many times each user can use

  -- Validity period
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PROMO_REDEMPTIONS TABLE
-- Tracks which users have redeemed which codes
-- ============================================
CREATE TABLE IF NOT EXISTS promo_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Redemption details
  credits_awarded INTEGER NOT NULL,

  -- Timestamps
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate redemptions (per max_uses_per_user setting)
  UNIQUE(promo_code_id, business_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_business ON promo_redemptions(business_id);
CREATE INDEX IF NOT EXISTS idx_promo_redemptions_code ON promo_redemptions(promo_code_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_redemptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe for re-runs)
DROP POLICY IF EXISTS "Anyone can view active promo codes" ON promo_codes;
DROP POLICY IF EXISTS "Users can view own redemptions" ON promo_redemptions;
DROP POLICY IF EXISTS "Users can redeem promo codes" ON promo_redemptions;

-- Promo codes: Anyone can view active promo codes (for validation)
CREATE POLICY "Anyone can view active promo codes" ON promo_codes
  FOR SELECT USING (is_active = TRUE);

-- Promo redemptions: Users can only view their own redemptions
CREATE POLICY "Users can view own redemptions" ON promo_redemptions
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Promo redemptions: Users can insert their own redemptions
CREATE POLICY "Users can redeem promo codes" ON promo_redemptions
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ADD promo_credit TRANSACTION TYPE
-- ============================================
ALTER TABLE credit_transactions
DROP CONSTRAINT IF EXISTS credit_transactions_transaction_type_check;

ALTER TABLE credit_transactions
ADD CONSTRAINT credit_transactions_transaction_type_check
CHECK (transaction_type IN ('subscription_credit', 'purchase', 'usage', 'refund', 'adjustment', 'promo_credit'));

-- ============================================
-- SEED DATA - INITIAL PROMO CODES
-- ============================================
INSERT INTO promo_codes (code, description, credits, max_uses, expires_at) VALUES
  ('ZAZZLES5', 'Welcome bonus - 5 extra credits', 5, NULL, '2025-12-31 23:59:59+00'),
  ('FOODIE10', 'Food blogger special - 10 extra credits', 10, 100, '2025-12-31 23:59:59+00'),
  ('LAUNCH2025', 'Launch promotion - 5 extra credits', 5, 500, '2025-03-31 23:59:59+00')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
-- After running this migration:
-- 1. Users can redeem promo codes via API
-- 2. Credits are added to their account
-- 3. Promo codes have usage limits and expiry dates
