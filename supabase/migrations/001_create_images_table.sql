-- Migration: Create images table for FoodSnap AI
-- Run this in Supabase Dashboard > SQL Editor
-- Project: marketing.heymag.app

-- Create images table
CREATE TABLE IF NOT EXISTS images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  original_url text NOT NULL,
  enhanced_url text,
  original_filename text,
  file_size_bytes integer,
  mime_type text,
  style_preset text,
  status text DEFAULT 'pending',
  enhancement_settings jsonb DEFAULT '{}',
  ai_model text,
  ai_suggestions text[],
  error_message text,
  credits_used integer DEFAULT 1,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for business lookups
CREATE INDEX IF NOT EXISTS idx_images_business_id ON images(business_id);

-- Create index for status filtering
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- RLS policy: businesses can only see their own images
CREATE POLICY "Businesses can view own images" ON images
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- RLS policy: businesses can insert their own images
CREATE POLICY "Businesses can insert own images" ON images
  FOR INSERT WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- RLS policy: businesses can update their own images
CREATE POLICY "Businesses can update own images" ON images
  FOR UPDATE USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- RLS policy: businesses can delete their own images
CREATE POLICY "Businesses can delete own images" ON images
  FOR DELETE USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON images TO authenticated;

-- ============================================
-- Credit Transactions Table (for usage tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  transaction_type text NOT NULL, -- 'usage', 'purchase', 'refund', 'bonus'
  description text,
  image_id uuid REFERENCES images(id) ON DELETE SET NULL,
  balance_after integer,
  created_at timestamptz DEFAULT now()
);

-- Create index for business lookups
CREATE INDEX IF NOT EXISTS idx_credit_transactions_business_id ON credit_transactions(business_id);

-- Enable RLS
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policy: businesses can only see their own transactions
CREATE POLICY "Businesses can view own credit transactions" ON credit_transactions
  FOR SELECT USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- RLS policy: service role can insert transactions (via API)
CREATE POLICY "Service can insert credit transactions" ON credit_transactions
  FOR INSERT WITH CHECK (true);

-- Grant access
GRANT SELECT ON credit_transactions TO authenticated;
