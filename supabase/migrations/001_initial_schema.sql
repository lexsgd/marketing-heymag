-- FoodSnap AI - Initial Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- BUSINESSES TABLE
-- Core table for storing business accounts
-- ============================================
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE, -- Links to Supabase auth.users
  email TEXT UNIQUE NOT NULL,
  business_name TEXT NOT NULL,
  name TEXT, -- Contact name
  phone TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'America/Los_Angeles',

  -- Subscription fields
  stripe_customer_id TEXT UNIQUE,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled', 'expired')),
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'business')),
  subscription_ends_at TIMESTAMPTZ,

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS TABLE
-- Tracks Stripe subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  status TEXT DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired')),

  -- Period dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,

  -- Cancellation
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDITS TABLE
-- Tracks image processing credits
-- ============================================
CREATE TABLE IF NOT EXISTS credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Credit balances
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  credits_purchased INTEGER NOT NULL DEFAULT 0, -- Extra credits bought

  -- Period tracking (for monthly resets)
  period_start TIMESTAMPTZ DEFAULT NOW(),
  period_end TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(business_id)
);

-- ============================================
-- IMAGES TABLE
-- Stores original and enhanced images
-- ============================================
CREATE TABLE IF NOT EXISTS images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Image URLs (Supabase Storage)
  original_url TEXT NOT NULL,
  enhanced_url TEXT,
  thumbnail_url TEXT,

  -- Enhancement details
  style_preset TEXT, -- 'delivery', 'instagram', 'menu', etc.
  enhancement_settings JSONB DEFAULT '{}', -- Brightness, contrast, etc.
  ai_model TEXT DEFAULT 'gemini-3-pro-image',

  -- Metadata
  original_filename TEXT,
  file_size_bytes INTEGER,
  width INTEGER,
  height INTEGER,
  mime_type TEXT,

  -- Processing status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  processed_at TIMESTAMPTZ,

  -- Credits
  credits_used INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TEMPLATES TABLE
-- Marketing templates (posters, banners, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'thematic', 'poster', 'banner', 'social'
  subcategory TEXT, -- 'cny', 'christmas', 'valentines', etc.

  -- Template assets
  thumbnail_url TEXT,
  preview_url TEXT,
  config_json JSONB DEFAULT '{}', -- Template configuration

  -- Access control
  is_premium BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,

  -- Usage stats
  usage_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL_ACCOUNTS TABLE
-- Connected social media accounts
-- ============================================
CREATE TABLE IF NOT EXISTS social_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook', 'tiktok', 'xiaohongshu', 'wechat')),
  platform_user_id TEXT,
  platform_username TEXT,
  platform_display_name TEXT,

  -- OAuth tokens (encrypted in production)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Account metadata
  account_info JSONB DEFAULT '{}',

  -- Status
  is_connected BOOLEAN DEFAULT TRUE,
  last_sync_at TIMESTAMPTZ,

  -- Timestamps
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One account per platform per business
  UNIQUE(business_id, platform)
);

-- ============================================
-- SOCIAL_POSTS TABLE
-- Scheduled and published social media posts
-- ============================================
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,

  -- Post content
  caption TEXT,
  caption_language TEXT DEFAULT 'en', -- 'en', 'zh', etc.
  hashtags TEXT[],

  -- Platforms to post to
  platforms TEXT[] NOT NULL, -- ['instagram', 'facebook']

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'posting', 'posted', 'failed', 'canceled')),

  -- Post results (per platform)
  post_results JSONB DEFAULT '{}', -- { instagram: { post_id: '...', url: '...' }, ... }
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREDIT_TRANSACTIONS TABLE
-- Audit log for credit usage
-- ============================================
CREATE TABLE IF NOT EXISTS credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

  -- Transaction details
  amount INTEGER NOT NULL, -- Positive for additions, negative for usage
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription_credit', 'purchase', 'usage', 'refund', 'adjustment')),
  description TEXT,

  -- Related records
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  stripe_payment_id TEXT,

  -- Balance after transaction
  balance_after INTEGER NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_businesses_auth_user_id ON businesses(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_businesses_email ON businesses(email);
CREATE INDEX IF NOT EXISTS idx_businesses_stripe_customer ON businesses(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_credits_business ON credits(business_id);

CREATE INDEX IF NOT EXISTS idx_images_business ON images(business_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_active ON templates(is_active);

CREATE INDEX IF NOT EXISTS idx_social_accounts_business ON social_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_accounts_platform ON social_accounts(platform);

CREATE INDEX IF NOT EXISTS idx_social_posts_business ON social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_business ON credit_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Templates are public (read-only for all)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Businesses: Users can only see their own business
CREATE POLICY "Users can view own business" ON businesses
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own business" ON businesses
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Subscriptions: Users can only view their business's subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Credits: Users can only view/update their business's credits
CREATE POLICY "Users can view own credits" ON credits
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own credits" ON credits
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Images: Users can CRUD their own images
CREATE POLICY "Users can view own images" ON images
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own images" ON images
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own images" ON images
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own images" ON images
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Templates: Anyone can read active templates
CREATE POLICY "Anyone can view active templates" ON templates
  FOR SELECT USING (is_active = TRUE);

-- Social accounts: Users can CRUD their own accounts
CREATE POLICY "Users can view own social accounts" ON social_accounts
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own social accounts" ON social_accounts
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own social accounts" ON social_accounts
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own social accounts" ON social_accounts
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Social posts: Users can CRUD their own posts
CREATE POLICY "Users can view own social posts" ON social_posts
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can insert own social posts" ON social_posts
  FOR INSERT WITH CHECK (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can update own social posts" ON social_posts
  FOR UPDATE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Users can delete own social posts" ON social_posts
  FOR DELETE USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- Credit transactions: Users can only view their own transactions
CREATE POLICY "Users can view own credit transactions" ON credit_transactions
  FOR SELECT USING (
    business_id IN (SELECT id FROM businesses WHERE auth_user_id = auth.uid())
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_businesses_updated_at
  BEFORE UPDATE ON businesses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON credits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_accounts_updated_at
  BEFORE UPDATE ON social_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKETS
-- ============================================
-- Note: Run these in Supabase Dashboard > Storage

-- Create buckets (if not exists - run manually in dashboard):
-- 1. images - for original and enhanced food images
-- 2. templates - for template thumbnails and assets

-- Storage policies (run in SQL editor):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', false);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', true);

-- ============================================
-- SEED DATA - TEMPLATES
-- ============================================

INSERT INTO templates (name, description, category, subcategory, is_premium) VALUES
  -- Delivery presets
  ('Delivery App Optimized', 'Clean, bright style optimized for DoorDash and Uber Eats', 'style', 'delivery', FALSE),
  ('GrabFood Style', 'High contrast style for GrabFood listings', 'style', 'delivery', FALSE),

  -- Social presets
  ('Instagram Feed', 'Square format with vibrant colors for feed posts', 'style', 'social', FALSE),
  ('Instagram Stories', 'Vertical 9:16 format for Stories and Reels', 'style', 'social', FALSE),
  ('TikTok Ready', 'Eye-catching style optimized for TikTok', 'style', 'social', FALSE),

  -- Menu presets
  ('Menu Card Clean', 'Professional, clean style for menu displays', 'style', 'menu', FALSE),
  ('Menu Dark Elegant', 'Dark background with elegant lighting', 'style', 'menu', TRUE),

  -- Restaurant styles
  ('Fine Dining', 'Sophisticated, dark backgrounds with studio lighting', 'style', 'restaurant', TRUE),
  ('Casual Dining', 'Warm, inviting atmosphere with natural tones', 'style', 'restaurant', FALSE),
  ('Fast Food Pop', 'Bold, energetic style with high saturation', 'style', 'restaurant', FALSE),
  ('Cafe Aesthetic', 'Cozy, artisan aesthetic with warm tones', 'style', 'restaurant', FALSE),

  -- China platforms
  ('Xiaohongshu', 'Trendy, lifestyle-focused style for RED/Xiaohongshu', 'style', 'china', FALSE),
  ('WeChat Moments', 'Clean, shareable format for WeChat', 'style', 'china', FALSE),

  -- Thematic templates
  ('Chinese New Year', 'Red and gold festive theme for CNY', 'thematic', 'cny', FALSE),
  ('Christmas Holiday', 'Festive holiday theme with seasonal elements', 'thematic', 'christmas', FALSE),
  ('Valentines Day', 'Romantic pink and red theme', 'thematic', 'valentines', FALSE),
  ('Summer Fresh', 'Bright, fresh summer vibes', 'thematic', 'seasonal', FALSE),
  ('Autumn Harvest', 'Warm autumn colors and cozy feel', 'thematic', 'seasonal', FALSE),
  ('Hari Raya', 'Festive green and gold for Hari Raya', 'thematic', 'cultural', FALSE),
  ('Diwali Lights', 'Vibrant colors with festive lighting', 'thematic', 'cultural', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- DONE!
-- ============================================
-- After running this migration:
-- 1. Create storage buckets in Supabase Dashboard
-- 2. Set up storage policies for the buckets
-- 3. Update .env with Supabase credentials
