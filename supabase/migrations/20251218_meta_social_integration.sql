-- Meta Social Integration Migration
-- Adds tables and columns for direct Facebook/Instagram integration

-- 1. Create oauth_states table for CSRF protection during OAuth flow
CREATE TABLE IF NOT EXISTS oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'meta',
  redirect_url TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for cleanup of expired states
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_oauth_states_state ON oauth_states(state);

-- 2. Update social_accounts table with Meta-specific fields
ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS platform_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW();

-- Create unique constraint for business + platform + platform_id
-- Drop existing constraint if it exists (from Ayrshare implementation)
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_business_id_platform_key;
ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS unique_business_platform_account;

-- Add new unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_business_platform_account'
  ) THEN
    ALTER TABLE social_accounts
      ADD CONSTRAINT unique_business_platform_account
      UNIQUE (business_id, platform, platform_id);
  END IF;
END $$;

-- 3. Create social_posts table for tracking posted content
CREATE TABLE IF NOT EXISTS social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  image_id UUID REFERENCES images(id) ON DELETE SET NULL,
  caption TEXT,
  image_url TEXT,
  platforms TEXT[] DEFAULT '{}',
  results JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'posted', 'partial', 'failed', 'scheduled')),
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for social_posts
CREATE INDEX IF NOT EXISTS idx_social_posts_business ON social_posts(business_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_scheduled ON social_posts(scheduled_at) WHERE status = 'scheduled';

-- 4. Enable RLS on new tables
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for oauth_states
DROP POLICY IF EXISTS "Users can manage own oauth states" ON oauth_states;
CREATE POLICY "Users can manage own oauth states"
  ON oauth_states
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 6. RLS Policies for social_posts
DROP POLICY IF EXISTS "Users can view own posts" ON social_posts;
CREATE POLICY "Users can view own posts"
  ON social_posts FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can create posts" ON social_posts;
CREATE POLICY "Users can create posts"
  ON social_posts FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can update own posts" ON social_posts;
CREATE POLICY "Users can update own posts"
  ON social_posts FOR UPDATE
  USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can delete own posts" ON social_posts;
CREATE POLICY "Users can delete own posts"
  ON social_posts FOR DELETE
  USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

-- 7. Function to clean up expired oauth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM oauth_states WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Update trigger for social_posts updated_at
CREATE OR REPLACE FUNCTION update_social_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_social_posts_updated_at ON social_posts;
CREATE TRIGGER trigger_social_posts_updated_at
  BEFORE UPDATE ON social_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_social_posts_updated_at();
