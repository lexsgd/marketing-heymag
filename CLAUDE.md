# Claude Code Development Guide - marketing.heymag.app

## Project Overview

**FoodSnap AI** - AI-powered food photography enhancement SaaS for F&B businesses.

**Domain**: marketing.heymag.app
**Working Directory**: `/Users/lexnaweiming/Test/marketing-heymag`

### Product Vision
Transform amateur phone photos into stunning, professional food marketing content with AI, then post to social media platforms with generated captions - all in 3 clicks.

### Target Market
F&B SMEs who need professional food photography but can't afford traditional photography ($750-7,750/shoot).

---

## Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React 18, TypeScript | App framework |
| **Styling** | Tailwind CSS, shadcn/ui | UI components |
| **Database** | Supabase (PostgreSQL + RLS) | Separate from heymag.app |
| **Auth** | Supabase Auth | Business login |
| **Payments** | Stripe | Subscriptions + credits |
| **AI (Images)** | Google Gemini API (Nano Banana Pro) | Photo enhancement |
| **AI (Captions)** | Anthropic Claude | Caption generation |
| **Background** | Remove.bg API | Background removal |
| **Social Posting** | Meta Graph API v22.0 | Facebook/Instagram (direct) |
| **China Platforms** | KAWO or Just One API | Xiaohongshu/WeChat (coming soon) |
| **Hosting** | Vercel | Deployment |
| **Storage** | Supabase Storage | Image uploads |

### Directory Structure

```
/Users/lexnaweiming/Test/marketing-heymag/
├── app/
│   ├── (authenticated)/        # Protected dashboard routes
│   ├── (public)/               # Landing, pricing, auth
│   └── api/
│       ├── ai/
│       │   ├── enhance/        # Google Gemini image enhancement
│       │   ├── caption/        # Claude caption generation
│       │   └── background/     # Remove.bg integration
│       ├── images/             # Image CRUD
│       ├── templates/          # Template management
│       ├── social/             # Social posting APIs
│       └── stripe/             # Billing webhooks
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── editor/                 # Image editor components
│   └── templates/              # Template components
├── lib/
│   ├── ai/                     # AI service integrations
│   ├── social/                 # Social media APIs
│   └── utils.ts                # Utilities
├── docs/                       # SOPs
└── .claude/agents/             # Claude Code agents
```

---

## Critical Rules

### ALWAYS Provide Full File Paths
- CORRECT: `/Users/lexnaweiming/Test/marketing-heymag/app/api/ai/enhance/route.ts`
- WRONG: `app/api/ai/enhance/route.ts`

### Deployment Rules

1. **Run Tests First**: `npm run test:unit`
2. **Deploy via Git**: `git push origin main` (Vercel auto-deploys)
3. **Version Updates**: Update `/lib/config.ts` for each deployment
4. **Never use localhost** for user preview - always deploy to Vercel

### Build Quality Standards

1. **No hardcoding** - Build proper systems from the start
2. **Long-term solutions** over quick fixes
3. **TypeScript strict mode** - No `any` types
4. **shadcn/ui patterns** - Use Button with `size="icon"` for icon buttons
5. **Test coverage** - Write tests for business logic

---

## Key Features

### Phase 1 (MVP)
1. AI Photo Enhancement (Google Nano Banana Pro)
2. Background Removal/Replacement
3. 10 Style Presets
4. AI Caption Generator (EN/CN)
5. Multi-format Export
6. Credit System
7. Social Posting (FB/IG/TikTok)
8. Xiaohongshu Integration
9. WeChat Integration
10. Thematic Templates

### Pricing Tiers

| Tier | Price | Credits |
|------|-------|---------|
| Starter | $25/mo | 30 images |
| Pro | $80/mo | 100 images |
| Business | $180/mo | 300 images |

---

## API Integrations

### Google Gemini (Nano Banana Pro)
- Endpoint: `generativelanguage.googleapis.com`
- Cost: $0.039/image (1024x1024)
- Used for: Image enhancement, style transformation

### Anthropic Claude
- Endpoint: `api.anthropic.com`
- Cost: ~$0.003/caption
- Used for: Multilingual caption generation

### Meta Graph API (Facebook + Instagram)
- Endpoint: `graph.facebook.com/v22.0`
- OAuth: Facebook Login for Business
- Used for: Facebook Page posts, Instagram Business posts
- Features: Feed posts, photo posts, carousel posts
- Token: Page access tokens (never expire)
- Note: Instagram requires linked Facebook Page

### KAWO/Just One API (Coming Soon)
- Used for: Xiaohongshu, WeChat posting
- Note: Xiaohongshu has strict external link policies
- Status: Phase 2 implementation

---

## Database Schema

### Core Tables

```sql
-- Images
images (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses(id),
  original_url text,
  enhanced_url text,
  style_preset text,
  metadata jsonb,
  credits_used integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
)

-- Templates
templates (
  id uuid PRIMARY KEY,
  name text,
  category text, -- 'thematic', 'delivery', 'social', etc.
  thumbnail_url text,
  config_json jsonb,
  is_premium boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
)

-- Social Posts
social_posts (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses(id),
  image_id uuid REFERENCES images(id),
  caption text,
  platforms text[], -- ['instagram', 'facebook', 'xiaohongshu']
  scheduled_at timestamptz,
  posted_at timestamptz,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now()
)

-- Social Accounts
social_accounts (
  id uuid PRIMARY KEY,
  business_id uuid REFERENCES businesses(id),
  platform text, -- 'instagram', 'facebook', 'tiktok', 'xiaohongshu', 'wechat'
  access_token text,
  refresh_token text,
  account_info jsonb,
  connected_at timestamptz DEFAULT now()
)
```

---

## Environment Variables

Required in `.env.local`:

```bash
# App
NEXT_PUBLIC_APP_URL=https://marketing.heymag.app

# Supabase (SEPARATE PROJECT)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (SEPARATE PRODUCTS)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# AI Services
GOOGLE_AI_API_KEY=
ANTHROPIC_API_KEY=
REMOVEBG_API_KEY=

# Social Posting - Meta (Facebook + Instagram)
# Create app at https://developers.facebook.com/apps
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=

# Social Posting - China Platforms (Coming Soon)
# KAWO_API_KEY=
```

---

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test:unit

# Type checking
npm run type-check
```

---

## Vercel Deployment

- **Project**: marketing-heymag
- **Domain**: marketing.heymag.app
- **Auto-deploy**: Push to `main` branch
- **Health check**: `GET /api/health`

### Deployment Verification

```bash
# Check deployment status
curl -s https://marketing.heymag.app/api/health | jq -r '.version'

# Check HTTP status
curl -s -o /dev/null -w "%{http_code}" https://marketing.heymag.app
```

---

## Related Projects

| Project | Domain | Purpose |
|---------|--------|---------|
| heymag.app | heymag.app | Main AI customer service platform |
| ops.heymag.app | ops.heymag.app | Internal operations dashboard |
| **marketing.heymag.app** | marketing.heymag.app | **Food photography SaaS (THIS)** |

---

## Version Tracking

Current version: v0.1.0 (Initial Setup)

Update version in `/Users/lexnaweiming/Test/marketing-heymag/lib/config.ts`:
- MAJOR: Breaking changes
- MINOR: New features
- PATCH: Bug fixes

Last updated: 2025-12-15
