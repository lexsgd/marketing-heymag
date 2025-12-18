-- Auto Top-Up Feature Migration
-- Adds fields to businesses table for automatic credit replenishment

-- Add auto top-up settings to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_threshold INTEGER DEFAULT 5;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS auto_topup_pack TEXT DEFAULT 'pack_9';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS stripe_default_payment_method TEXT;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_businesses_auto_topup ON businesses(auto_topup_enabled) WHERE auto_topup_enabled = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN businesses.auto_topup_enabled IS 'Whether automatic credit top-up is enabled';
COMMENT ON COLUMN businesses.auto_topup_threshold IS 'Credit balance threshold that triggers auto top-up';
COMMENT ON COLUMN businesses.auto_topup_pack IS 'Credit pack to purchase on auto top-up (pack_4, pack_9, pack_23, pack_48)';
COMMENT ON COLUMN businesses.stripe_default_payment_method IS 'Stripe PaymentMethod ID for auto top-up charges';

-- Create auto_topup_logs table to track automatic purchases
CREATE TABLE IF NOT EXISTS auto_topup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Transaction details
  pack_id TEXT NOT NULL,
  credits_added INTEGER NOT NULL,
  amount_charged DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',

  -- Stripe references
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed')),
  error_message TEXT,

  -- Balance info
  balance_before INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for business lookups
CREATE INDEX IF NOT EXISTS idx_auto_topup_logs_business ON auto_topup_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_auto_topup_logs_created ON auto_topup_logs(created_at DESC);

-- Enable RLS
ALTER TABLE auto_topup_logs ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only view their own auto top-up logs
CREATE POLICY "Users can view own auto topup logs" ON auto_topup_logs
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Done!
