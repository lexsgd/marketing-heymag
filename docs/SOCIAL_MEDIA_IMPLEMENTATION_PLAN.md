# Social Media Integration Implementation Plan

**Document Version**: 1.0
**Date**: 2025-12-18
**Project**: Zazzles/FoodSnap - AI Food Photography SaaS

---

## Table of Contents

1. [Strategy Overview](#1-strategy-overview)
2. [Phase 1: Instagram + Facebook (Meta Graph API)](#2-phase-1-instagram--facebook-meta-graph-api)
3. [Phase 2: Xiaohongshu + WeChat (China Platforms)](#3-phase-2-xiaohongshu--wechat-china-platforms)
4. [Cost Analysis](#4-cost-analysis)
5. [Technical Architecture](#5-technical-architecture)
6. [Risk Assessment](#6-risk-assessment)
7. [Timeline](#7-timeline)
8. [Decision: Build vs Buy](#8-decision-build-vs-buy)

---

## 1. Strategy Overview

### Phased Approach

| Phase | Platforms | Approach | Timeline | Cost |
|-------|-----------|----------|----------|------|
| **Phase 1** | Instagram + Facebook | Direct Meta Graph API | 4-6 weeks | Free |
| **Phase 2** | Xiaohongshu + WeChat | KAWO or Partnership | 8-12 weeks | $3,000+/year |

### Why This Makes Sense

**Phase 1 (Instagram + Facebook):**
- Both platforms use the **same API** (Meta Graph API)
- One integration covers both platforms
- **Free** - no API costs
- Most F&B businesses prioritize these platforms
- 90% of our target customers need just these two

**Phase 2 (Xiaohongshu + WeChat):**
- Required for China market expansion
- Complex - requires Chinese entity or partner
- Can defer until we have paying customers requesting it

---

## 2. Phase 1: Instagram + Facebook (Meta Graph API)

### 2.1 Overview

Since Instagram and Facebook are both owned by Meta, they share the same API infrastructure:

```
┌─────────────────────────────────────────────────────────────┐
│                    META GRAPH API                            │
│                    (One Integration)                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────────┐         ┌─────────────────┐           │
│   │    Facebook     │         │    Instagram    │           │
│   │    Pages API    │         │   Graph API     │           │
│   └────────┬────────┘         └────────┬────────┘           │
│            │                           │                     │
│            └───────────┬───────────────┘                     │
│                        │                                     │
│                        ▼                                     │
│            ┌───────────────────────┐                        │
│            │   Facebook Login      │                        │
│            │   for Business        │                        │
│            │   (OAuth 2.0)         │                        │
│            └───────────────────────┘                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Requirements

#### Account Requirements (For Our Customers)

| Requirement | Instagram | Facebook |
|-------------|-----------|----------|
| Account Type | Business or Creator | Facebook Page |
| Link Required | Must be linked to Facebook Page | - |
| Verification | Not required | Not required |

#### Our App Requirements

| Requirement | Details |
|-------------|---------|
| Meta Developer Account | Free to create |
| App Type | Business |
| App Review | Required for live mode |
| Business Verification | Required for advanced access |
| Privacy Policy URL | Must be publicly accessible |
| Terms of Service URL | Must be publicly accessible |

### 2.3 Permissions Needed

| Permission | Purpose | Review Required |
|------------|---------|-----------------|
| `pages_show_list` | List user's Facebook Pages | Yes |
| `pages_read_engagement` | Read Page content | Yes |
| `pages_manage_posts` | Post to Facebook Pages | Yes |
| `instagram_basic` | Access Instagram account info | Yes |
| `instagram_content_publish` | Post to Instagram | Yes |
| `business_management` | Manage business assets | Yes |

### 2.4 Step-by-Step Implementation

#### Step 1: Create Meta App (Day 1)

1. Go to [developers.facebook.com](https://developers.facebook.com)
2. Create a new app → Select "Business" type
3. Fill in app details:
   - App Name: "Zazzles Social Publisher"
   - Contact Email: Your business email
   - Business Account: Link your Meta Business Account

4. Configure app settings:
   ```
   Settings → Basic:
   - App Domains: marketing.heymag.app
   - Privacy Policy URL: https://marketing.heymag.app/privacy
   - Terms of Service URL: https://marketing.heymag.app/terms
   ```

#### Step 2: Set Up Facebook Login for Business (Day 1-2)

1. Add "Facebook Login for Business" product to your app
2. Configure OAuth settings:
   ```
   Valid OAuth Redirect URIs:
   - https://marketing.heymag.app/api/auth/facebook/callback
   - https://marketing.heymag.app/api/auth/instagram/callback
   ```

3. Note your credentials:
   - App ID: `FACEBOOK_APP_ID`
   - App Secret: `FACEBOOK_APP_SECRET`

#### Step 3: Build OAuth Flow (Day 2-5)

**3a. Create OAuth Initiation Endpoint**

```typescript
// /app/api/auth/meta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

// Scopes for Facebook Pages + Instagram
const SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'pages_manage_posts',
  'instagram_basic',
  'instagram_content_publish',
  'business_management'
].join(',')

export async function GET(request: NextRequest) {
  const supabase = await createClient()

  // Verify user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect('/auth/login')
  }

  // Generate state token for CSRF protection
  const state = crypto.randomUUID()

  // Store state in session/database for verification
  await supabase
    .from('oauth_states')
    .insert({
      user_id: user.id,
      state,
      provider: 'meta',
      expires_at: new Date(Date.now() + 10 * 60 * 1000) // 10 min
    })

  // Build OAuth URL
  const authUrl = new URL('https://www.facebook.com/v22.0/dialog/oauth')
  authUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  authUrl.searchParams.set('scope', SCOPES)
  authUrl.searchParams.set('state', state)
  authUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(authUrl.toString())
}
```

**3b. Create OAuth Callback Handler**

```typescript
// /app/api/auth/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID!
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET!
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/meta/callback`

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const searchParams = request.nextUrl.searchParams

  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    console.error('[Meta OAuth] Error:', error)
    return NextResponse.redirect('/social?error=oauth_denied')
  }

  // Verify state token
  const { data: stateRecord } = await supabase
    .from('oauth_states')
    .select('*')
    .eq('state', state)
    .eq('provider', 'meta')
    .single()

  if (!stateRecord) {
    return NextResponse.redirect('/social?error=invalid_state')
  }

  // Delete used state
  await supabase.from('oauth_states').delete().eq('id', stateRecord.id)

  // Exchange code for access token
  const tokenUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token')
  tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
  tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET)
  tokenUrl.searchParams.set('redirect_uri', REDIRECT_URI)
  tokenUrl.searchParams.set('code', code!)

  const tokenResponse = await fetch(tokenUrl.toString())
  const tokenData = await tokenResponse.json()

  if (tokenData.error) {
    console.error('[Meta OAuth] Token error:', tokenData.error)
    return NextResponse.redirect('/social?error=token_exchange_failed')
  }

  const shortLivedToken = tokenData.access_token

  // Exchange for long-lived token (60 days)
  const longLivedUrl = new URL('https://graph.facebook.com/v22.0/oauth/access_token')
  longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token')
  longLivedUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
  longLivedUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET)
  longLivedUrl.searchParams.set('fb_exchange_token', shortLivedToken)

  const longLivedResponse = await fetch(longLivedUrl.toString())
  const longLivedData = await longLivedResponse.json()

  const longLivedToken = longLivedData.access_token
  const expiresIn = longLivedData.expires_in // seconds

  // Get user's Facebook Pages
  const pagesResponse = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?access_token=${longLivedToken}`
  )
  const pagesData = await pagesResponse.json()

  // Get user's business
  const { data: { user } } = await supabase.auth.getUser()
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user!.id)
    .single()

  // Store each connected page
  for (const page of pagesData.data || []) {
    // Get page's Instagram account if connected
    const igResponse = await fetch(
      `https://graph.facebook.com/v22.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
    )
    const igData = await igResponse.json()

    // Store Facebook Page
    await supabase.from('social_accounts').upsert({
      business_id: business!.id,
      platform: 'facebook',
      platform_id: page.id,
      platform_display_name: page.name,
      access_token: page.access_token, // Page access token (never expires)
      is_connected: true,
      account_info: { category: page.category },
      connected_at: new Date().toISOString()
    }, { onConflict: 'business_id,platform,platform_id' })

    // Store Instagram account if connected
    if (igData.instagram_business_account) {
      // Get Instagram account details
      const igDetailsResponse = await fetch(
        `https://graph.facebook.com/v22.0/${igData.instagram_business_account.id}?fields=username,name,profile_picture_url&access_token=${page.access_token}`
      )
      const igDetails = await igDetailsResponse.json()

      await supabase.from('social_accounts').upsert({
        business_id: business!.id,
        platform: 'instagram',
        platform_id: igData.instagram_business_account.id,
        platform_display_name: igDetails.name,
        platform_username: igDetails.username,
        access_token: page.access_token, // Use page token for IG too
        facebook_page_id: page.id, // Link to Facebook Page
        is_connected: true,
        account_info: {
          profile_picture: igDetails.profile_picture_url
        },
        connected_at: new Date().toISOString()
      }, { onConflict: 'business_id,platform,platform_id' })
    }
  }

  return NextResponse.redirect('/social?connected=true')
}
```

#### Step 4: Build Posting API (Day 5-8)

**4a. Facebook Posting**

```typescript
// /lib/social/facebook.ts
export async function postToFacebookPage(
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrl?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    let endpoint = `https://graph.facebook.com/v22.0/${pageId}/feed`
    const body: Record<string, string> = {
      message,
      access_token: pageAccessToken
    }

    // If posting with image, use /photos endpoint
    if (imageUrl) {
      endpoint = `https://graph.facebook.com/v22.0/${pageId}/photos`
      body.url = imageUrl
      body.caption = message
      delete body.message
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body)
    })

    const data = await response.json()

    if (data.error) {
      return { success: false, error: data.error.message }
    }

    return { success: true, postId: data.id || data.post_id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
```

**4b. Instagram Posting (Two-Step Process)**

```typescript
// /lib/social/instagram.ts
export async function postToInstagram(
  igUserId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(
      `https://graph.facebook.com/v22.0/${igUserId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          image_url: imageUrl,
          caption,
          access_token: pageAccessToken
        })
      }
    )

    const containerData = await containerResponse.json()

    if (containerData.error) {
      return { success: false, error: containerData.error.message }
    }

    const containerId = containerData.id

    // Step 2: Wait for container to be ready (poll status)
    let status = 'IN_PROGRESS'
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const statusResponse = await fetch(
        `https://graph.facebook.com/v22.0/${containerId}?fields=status_code&access_token=${pageAccessToken}`
      )
      const statusData = await statusResponse.json()
      status = statusData.status_code
      attempts++
    }

    if (status !== 'FINISHED') {
      return { success: false, error: `Media processing failed: ${status}` }
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/v22.0/${igUserId}/media_publish`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          creation_id: containerId,
          access_token: pageAccessToken
        })
      }
    )

    const publishData = await publishResponse.json()

    if (publishData.error) {
      return { success: false, error: publishData.error.message }
    }

    return { success: true, postId: publishData.id }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}
```

**4c. Unified Posting API Endpoint**

```typescript
// /app/api/social/post/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToFacebookPage } from '@/lib/social/facebook'
import { postToInstagram } from '@/lib/social/instagram'

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { caption, imageUrl, platforms } = body

  if (!caption || !platforms?.length) {
    return NextResponse.json(
      { error: 'Caption and platforms are required' },
      { status: 400 }
    )
  }

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Get connected accounts for requested platforms
  const { data: accounts } = await supabase
    .from('social_accounts')
    .select('*')
    .eq('business_id', business.id)
    .in('platform', platforms)
    .eq('is_connected', true)

  if (!accounts?.length) {
    return NextResponse.json(
      { error: 'No connected accounts for requested platforms' },
      { status: 400 }
    )
  }

  const results: Record<string, { success: boolean; postId?: string; error?: string }> = {}

  // Post to each platform
  for (const account of accounts) {
    if (account.platform === 'facebook') {
      results.facebook = await postToFacebookPage(
        account.platform_id,
        account.access_token,
        caption,
        imageUrl
      )
    }

    if (account.platform === 'instagram') {
      if (!imageUrl) {
        results.instagram = { success: false, error: 'Instagram requires an image' }
      } else {
        results.instagram = await postToInstagram(
          account.platform_id,
          account.access_token,
          caption,
          imageUrl
        )
      }
    }
  }

  // Log the post
  await supabase.from('social_posts').insert({
    business_id: business.id,
    caption,
    image_url: imageUrl,
    platforms,
    results,
    status: Object.values(results).every(r => r.success) ? 'posted' : 'partial',
    posted_at: new Date().toISOString()
  })

  return NextResponse.json({ success: true, results })
}
```

#### Step 5: App Review Submission (Day 8-14)

**What You Need:**

1. **Screencast Video** (2-5 minutes)
   - Show the OAuth login flow
   - Demonstrate connecting a Facebook Page
   - Show posting to Facebook
   - Show Instagram connection and posting
   - Explain your business use case

2. **Privacy Policy** (already have at /privacy)

3. **Terms of Service** (already have at /terms)

4. **Detailed Permission Justifications:**

   | Permission | Justification |
   |------------|---------------|
   | `pages_show_list` | "Our app allows food businesses to connect their Facebook Pages to post AI-enhanced food photos. We need to show them a list of their Pages to select which one to connect." |
   | `pages_manage_posts` | "Our core feature is posting food photos with AI-generated captions to Facebook Pages. We need this permission to publish content on behalf of the business." |
   | `instagram_content_publish` | "We enable food businesses to post their enhanced food photos to Instagram. This permission allows us to publish their content." |

5. **Business Verification**
   - Business documents (registration certificate)
   - Domain verification
   - Takes 1-3 business days

**Timeline:**
- Initial submission → 1-2 business days for first review
- Rejections common → Budget 2-3 attempts
- Total: 1-3 weeks

#### Step 6: Database Schema Updates

```sql
-- Add table for OAuth states
CREATE TABLE oauth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  state TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index for cleanup
CREATE INDEX idx_oauth_states_expires ON oauth_states(expires_at);

-- Update social_accounts table
ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS platform_id TEXT,
  ADD COLUMN IF NOT EXISTS facebook_page_id TEXT,
  ADD COLUMN IF NOT EXISTS connected_at TIMESTAMPTZ DEFAULT NOW();

-- Add unique constraint
ALTER TABLE social_accounts
  ADD CONSTRAINT unique_business_platform_account
  UNIQUE (business_id, platform, platform_id);

-- Add social_posts table
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID REFERENCES businesses(id),
  caption TEXT,
  image_url TEXT,
  platforms TEXT[],
  results JSONB,
  status TEXT DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts"
  ON social_posts FOR SELECT
  USING (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));

CREATE POLICY "Users can create posts"
  ON social_posts FOR INSERT
  WITH CHECK (business_id IN (
    SELECT id FROM businesses WHERE auth_user_id = auth.uid()
  ));
```

### 2.5 Rate Limits & Best Practices

| Limit | Value | How to Handle |
|-------|-------|---------------|
| Instagram API calls | 200/hour per account | Queue posts, batch requests |
| Instagram posts | 25/day per account | Warn users at limit |
| Facebook API calls | 200/hour per user | Implement rate limiting |
| Token expiration | Page tokens never expire | No refresh needed |
| Image requirements | JPEG, max 8MB | Compress before upload |

### 2.6 Environment Variables

```bash
# Add to .env.local and Vercel
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

---

## 3. Phase 2: Xiaohongshu + WeChat (China Platforms)

### 3.1 Reality Check

**Critical Limitations for Foreign Companies:**

| Platform | API Posting | Requirements | Difficulty |
|----------|-------------|--------------|------------|
| Xiaohongshu | Very Limited | Chinese business entity | Very Hard |
| WeChat | Limited | Chinese entity for full API | Hard |

### 3.2 Options Analysis

#### Option A: KAWO Integration ($3,000+/year)

**What KAWO Provides:**
- WeChat Official Account management
- Weibo posting
- Douyin (Chinese TikTok) posting
- Partial Xiaohongshu support
- Bilingual interface (English/Chinese)

**Process:**
1. Contact KAWO sales: [kawo.com](https://kawo.com)
2. Sign enterprise agreement (~$250/month)
3. Integrate their API
4. They handle Chinese platform complexity

**Pros:**
- Only viable option for true API access
- Handles compliance and regulations
- English interface for your team

**Cons:**
- Expensive ($3,000+/year minimum)
- Still limited Xiaohongshu posting
- Enterprise-focused, may be overkill

#### Option B: Partnership with Chinese Agency

**How It Works:**
1. Partner with local Chinese marketing agency
2. They register accounts on behalf of clients
3. They handle posting (manual or semi-automated)
4. You provide the content + captions

**Pros:**
- Lower upfront cost
- Local expertise
- Can handle compliance

**Cons:**
- Less control
- Manual processes
- Slower turnaround

#### Option C: Cross-Border Registration (DIY)

**Xiaohongshu Enterprise Account:**

1. **Requirements:**
   - Overseas business license (translated to Chinese)
   - Trademark registration
   - Passport of executive
   - Chinese phone number for verification
   - CNY 600/year verification fee

2. **What You Get:**
   - Official enterprise account
   - E-commerce capabilities
   - LIMITED posting API (product catalogs, not content)

3. **What You DON'T Get:**
   - Full content posting API
   - Automation capabilities

**WeChat Service Account:**

1. **Requirements:**
   - Overseas business license
   - $99/year verification fee
   - 2-4 weeks approval process

2. **What You Get:**
   - Account visible to Chinese users
   - Chatbot capabilities
   - WeChat advertising access
   - 4 push posts/month (not per day!)

3. **What You DON'T Get:**
   - WeChat Pay (requires Chinese entity)
   - Full API access
   - High-volume posting

### 3.3 Recommended Approach for Phase 2

**Short Term (Month 6-9):**
1. Register Xiaohongshu Enterprise Account under your company
2. Register WeChat Service Account
3. Build semi-manual workflow:
   - Generate content in app
   - Export optimized images + captions
   - Staff manually posts to platforms
   - Track posts in your system

**Long Term (Month 12+):**
- Evaluate KAWO if customer demand justifies cost
- Consider partnering with Chinese marketing agency
- Reassess as platforms open APIs

### 3.4 Implementation Timeline

```
Month 6:
├── Register Xiaohongshu Enterprise Account
├── Register WeChat Service Account
└── Build export functionality for Chinese platforms

Month 7-8:
├── Create Xiaohongshu-optimized templates
├── Create WeChat article templates
├── Build content export workflow
└── Train staff on manual posting

Month 9+:
├── Evaluate KAWO partnership
├── Assess customer demand
└── Decide on full automation investment
```

---

## 4. Cost Analysis

### Phase 1: Instagram + Facebook (DIY)

| Item | One-Time | Monthly | Annual |
|------|----------|---------|--------|
| Meta API | $0 | $0 | $0 |
| Development (4-6 weeks) | $8,000-12,000 | - | - |
| Maintenance | - | $500-1,000 | $6,000-12,000 |
| **Total Year 1** | | | **$14,000-24,000** |
| **Total Year 2+** | | | **$6,000-12,000** |

### Phase 1: Using Ayrshare (Current)

| Item | One-Time | Monthly | Annual |
|------|----------|---------|--------|
| Ayrshare Business | - | $499 | $5,988 |
| Development (2-3 weeks) | $4,000-6,000 | - | - |
| Maintenance | - | $200 | $2,400 |
| **Total Year 1** | | | **$12,388-14,388** |
| **Total Year 2+** | | | **$8,388** |

### Comparison: DIY vs Ayrshare

| Factor | DIY (Meta Direct) | Ayrshare |
|--------|-------------------|----------|
| Year 1 Cost | $14,000-24,000 | $12,388-14,388 |
| Year 2+ Cost | $6,000-12,000 | $8,388 |
| Development Time | 4-6 weeks | 2-3 weeks |
| App Review | You handle (1-3 weeks) | They handle |
| Maintenance | You handle API changes | They handle |
| Flexibility | Full control | Their features only |
| TikTok (future) | Separate integration | Already included |

**Recommendation:**
- If you plan to add TikTok later → Stay with Ayrshare
- If Instagram + Facebook only → DIY is slightly cheaper long-term

### Phase 2: China Platforms

| Option | One-Time | Monthly | Annual |
|--------|----------|---------|--------|
| KAWO | Setup fee | $250+ | $3,000+ |
| Self-registration | $200 | $50 | $800 |
| Agency partnership | Varies | $500-2,000 | $6,000-24,000 |

---

## 5. Technical Architecture

### Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     ZAZZLES/FOODSNAP                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    FRONTEND (Next.js)                     │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │   Gallery   │  │   Social    │  │   Posting   │       │   │
│  │  │   Select    │  │  Accounts   │  │   Dialog    │       │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │   │
│  └─────────┼────────────────┼────────────────┼──────────────┘   │
│            │                │                │                   │
│            ▼                ▼                ▼                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    API ROUTES                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │   │
│  │  │ /api/auth/  │  │/api/social/ │  │ /api/social │       │   │
│  │  │   meta/*    │  │  accounts   │  │   /post     │       │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘       │   │
│  └─────────┼────────────────┼────────────────┼──────────────┘   │
│            │                │                │                   │
│            ▼                ▼                ▼                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   SERVICE LAYER                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │              /lib/social/                            │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │  facebook.ts │  │ instagram.ts │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘                 │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│            │                                                     │
│            ▼                                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL APIS                          │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │            META GRAPH API (v22.0)                    │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │   Facebook   │  │  Instagram   │                 │ │   │
│  │  │  │  Pages API   │  │  Graph API   │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘                 │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  │                                                           │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │          PHASE 2: CHINA (Future)                     │ │   │
│  │  │  ┌──────────────┐  ┌──────────────┐                 │ │   │
│  │  │  │ Xiaohongshu  │  │   WeChat     │                 │ │   │
│  │  │  │  (Manual)    │  │  (Limited)   │                 │ │   │
│  │  │  └──────────────┘  └──────────────┘                 │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐     ┌─────────────────┐                    │
│  │    businesses   │     │  social_accounts │                    │
│  ├─────────────────┤     ├─────────────────┤                    │
│  │ id              │◄────│ business_id     │                    │
│  │ auth_user_id    │     │ platform        │                    │
│  │ name            │     │ platform_id     │                    │
│  │ ...             │     │ platform_name   │                    │
│  └─────────────────┘     │ access_token    │                    │
│                          │ facebook_page_id│                    │
│                          │ is_connected    │                    │
│                          └────────┬────────┘                    │
│                                   │                              │
│  ┌─────────────────┐              │                              │
│  │   social_posts  │◄─────────────┘                              │
│  ├─────────────────┤                                             │
│  │ id              │                                             │
│  │ business_id     │                                             │
│  │ caption         │                                             │
│  │ image_url       │                                             │
│  │ platforms[]     │                                             │
│  │ results (jsonb) │                                             │
│  │ status          │                                             │
│  │ posted_at       │                                             │
│  └─────────────────┘                                             │
│                                                                  │
│  ┌─────────────────┐                                             │
│  │  oauth_states   │                                             │
│  ├─────────────────┤                                             │
│  │ id              │                                             │
│  │ user_id         │                                             │
│  │ state           │                                             │
│  │ provider        │                                             │
│  │ expires_at      │                                             │
│  └─────────────────┘                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Risk Assessment

### Phase 1 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| App review rejection | High | Medium | Submit minimal permissions first, iterate |
| API changes | Medium | Medium | Monitor Meta changelog, abstract API layer |
| Token expiration issues | Low | High | Page tokens never expire; monitor user tokens |
| Rate limiting | Low | Medium | Implement queuing system |
| Image format issues | Medium | Low | Validate and compress before upload |

### Phase 2 Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| No API access | High | High | Accept manual workflow initially |
| Regulation changes | Medium | High | Monitor Chinese platform policies |
| Account suspension | Medium | High | Follow platform guidelines strictly |
| Language/cultural issues | Medium | Medium | Partner with local experts |

---

## 7. Timeline

### Phase 1: Instagram + Facebook

```
Week 1:
├── Day 1-2: Set up Meta Developer App
├── Day 3-5: Build OAuth flow
└── Day 5-7: Test in development mode

Week 2:
├── Day 8-10: Build posting APIs
├── Day 11-12: Build UI components
└── Day 13-14: Internal testing

Week 3:
├── Day 15-16: Prepare app review materials
├── Day 17: Submit for app review
└── Day 18-21: Wait for review / address feedback

Week 4:
├── Day 22-24: Address rejection feedback (if any)
├── Day 25-26: Re-submit if needed
└── Day 27-28: Final testing and launch

Week 5-6: Buffer for review iterations
```

**Total: 4-6 weeks**

### Phase 2: China Platforms

```
Month 6:
├── Week 1-2: Register Xiaohongshu account
├── Week 3-4: Register WeChat account

Month 7:
├── Week 1-2: Build content export workflow
├── Week 3-4: Create platform-specific templates

Month 8:
├── Week 1-2: Train team on manual posting
├── Week 3-4: Soft launch with select customers

Month 9+:
├── Evaluate KAWO if demand justifies
└── Iterate based on customer feedback
```

**Total: 3-4 months**

---

## 8. Decision: Build vs Buy

### For Phase 1 (Instagram + Facebook)

#### Option A: Keep Ayrshare (Current)
- **Pros:** Already working, includes TikTok, no app review
- **Cons:** $499/month, dependency on third-party
- **Best for:** If you want TikTok later, or don't have dev bandwidth

#### Option B: Build Direct Meta Integration
- **Pros:** No monthly fees, full control, slightly cheaper long-term
- **Cons:** 4-6 weeks dev, app review process, maintenance burden
- **Best for:** If Instagram + Facebook only, and have dev resources

#### Recommendation

**If TikTok is on your roadmap:** Stay with Ayrshare
- Adding TikTok DIY would require another complex integration
- Ayrshare already handles all three

**If Instagram + Facebook only:** Consider DIY
- Year 2+ savings of ~$2,000-4,000/year
- Full control over the integration
- But weigh against your dev team bandwidth

### For Phase 2 (China Platforms)

**Recommended:** Start with manual workflow + account registration

1. Register accounts (one-time $200-300)
2. Build export functionality (1-2 weeks dev)
3. Manual posting workflow initially
4. Evaluate KAWO after 6 months if demand is high

This de-risks the China expansion while you validate customer demand.

---

## Appendix A: Meta Graph API Quick Reference

### Key Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /me/accounts` | List user's Facebook Pages |
| `GET /{page-id}?fields=instagram_business_account` | Get connected Instagram |
| `POST /{page-id}/feed` | Post to Facebook Page |
| `POST /{page-id}/photos` | Post photo to Facebook |
| `POST /{ig-user-id}/media` | Create Instagram media container |
| `POST /{ig-user-id}/media_publish` | Publish Instagram media |

### Required Scopes

```
pages_show_list
pages_read_engagement
pages_manage_posts
instagram_basic
instagram_content_publish
business_management
```

### API Version
Current: v22.0 (as of December 2025)

---

## Appendix B: Environment Variables Checklist

```bash
# Phase 1: Meta Integration
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Phase 1 Alternative: Ayrshare
AYRSHARE_API_KEY=
AYRSHARE_PRIVATE_KEY=

# Phase 2: China (if using KAWO)
KAWO_API_KEY=
KAWO_API_SECRET=
```

---

## Appendix C: Useful Resources

### Meta Developer Resources
- [Meta Developer Portal](https://developers.facebook.com/)
- [Instagram Graph API Docs](https://developers.facebook.com/docs/instagram-api)
- [Facebook Pages API Docs](https://developers.facebook.com/docs/pages)
- [App Review Guidelines](https://developers.facebook.com/docs/app-review)

### China Platform Resources
- [Xiaohongshu Open Platform](https://school.xiaohongshu.com/en/open/quick-start/workflow.html)
- [WeChat Official Account Guide](https://wechatwiki.com/wechat-resources/wechat-overseas-official-account-registration-fees/)
- [KAWO Platform](https://kawo.com/en)

### Research Sources
- [Instagram Graph API Guide 2025](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)
- [Facebook Graph API Guide](https://getlate.dev/blog/facebook-graph-api)
- [Instagram API for SaaS](https://worldbusinessoutlook.com/instagram-api-integration-for-saas-simplify-messaging-posting-outreach/)
- [Xiaohongshu Account Types Guide](https://www.alluatech.com/post/xiaohongshu-rednote-account-guide-types-application-features-adventages-restrictions)
- [WeChat for Overseas Businesses](https://qpsoftware.net/blog/setting-wechat-official-account-overseas-businesses)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-18 | Claude (AI) | Initial implementation plan |

---

*This document provides a comprehensive implementation plan. Actual timelines may vary based on Meta's app review process and team capacity.*
