# Social Media API Providers Research

**Document Version**: 1.0
**Date**: 2025-12-18
**Project**: Zazzles/FoodSnap - AI Food Photography SaaS
**Use Case**: Multi-tenant social media posting for F&B business clients

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Our Requirements](#2-our-requirements)
3. [Option 1: Third-Party API Aggregators](#3-option-1-third-party-api-aggregators)
4. [Option 2: Build It Yourself (Direct API Integration)](#4-option-2-build-it-yourself-direct-api-integration)
5. [Option 3: Free & Low-Cost Options](#5-option-3-free--low-cost-options)
6. [Platform-Specific Requirements](#6-platform-specific-requirements)
7. [Chinese Platform Analysis](#7-chinese-platform-analysis)
8. [Cost Comparison](#8-cost-comparison)
9. [Recommendation](#9-recommendation)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Sources](#11-sources)

---

## 1. Executive Summary

### The Question
We need to build a "Hootsuite-like" feature that allows our F&B business clients to:
- Connect their own Instagram, Facebook, TikTok accounts
- Post AI-enhanced food photos with generated captions
- Optionally reach Chinese markets (Xiaohongshu, WeChat)

### Three Options

| Option | Monthly Cost | Dev Time | Maintenance | Best For |
|--------|-------------|----------|-------------|----------|
| **API Aggregator** (Ayrshare, Late) | $50-$700/mo | 2-3 weeks | Low | Most startups |
| **Build It Yourself** (Direct APIs) | $0 (API fees) | 8-12 weeks | High | Large teams with resources |
| **Free/Hybrid** | $0-$50/mo | 4-6 weeks | Medium | Bootstrapped startups |

### Quick Recommendation
**For our stage (early startup, limited dev resources):** Use **Ayrshare** or **Late** API aggregator. The $500-700/month cost is far cheaper than the developer time required to build and maintain direct integrations.

---

## 2. Our Requirements

### Must Have
- [ ] Instagram Business account posting (images + captions)
- [ ] Facebook Page posting
- [ ] TikTok posting
- [ ] Multi-tenant: Each business connects their own accounts
- [ ] OAuth flow for end-users
- [ ] Image upload support
- [ ] Post scheduling

### Nice to Have
- [ ] Xiaohongshu (RED) posting - Critical for China market
- [ ] WeChat Official Account posting
- [ ] Analytics/insights
- [ ] Comment management
- [ ] White-label UI

### Scale Requirements
- 100+ business customers (target)
- ~300 connected social accounts
- ~1,000-3,000 posts/month

---

## 3. Option 1: Third-Party API Aggregators

### What They Do
API aggregators handle the complexity of integrating with multiple social platforms. You make one API call, they handle:
- OAuth authentication with each platform
- Platform approval processes (TikTok, Instagram)
- API changes and maintenance
- Rate limiting and retries

### Provider Comparison

| Provider | Platforms | Free Tier | Starter Price | Multi-Tenant | Best For |
|----------|-----------|-----------|---------------|--------------|----------|
| **[Ayrshare](https://www.ayrshare.com/)** | 12 | 20 posts/mo | $49/mo | Yes ($499/mo Business) | Multi-tenant SaaS |
| **[Late](https://getlate.dev/)** | 11 | 10 posts/mo | $13/mo | Yes ($667/mo unlimited) | Budget-conscious |
| **[Buffer](https://buffer.com/)** | 8 | 3 channels | $5/channel/mo | Limited | Small teams |
| **[Publer](https://publer.com/)** | 13 | 3 accounts | $12/mo | No | Individuals |
| **[Sendible](https://www.sendible.com/)** | 8+ | None | $29/mo | Yes ($240/mo white-label) | Agencies |
| **[Hootsuite](https://www.hootsuite.com/)** | 10+ | None | $99/mo | Enterprise only | Large companies |
| **[Sprout Social](https://sproutsocial.com/)** | 8+ | None | $199/seat/mo | Enterprise | Enterprise |

### Detailed Analysis

#### Ayrshare (Currently Implemented)

**Pricing Tiers:**
- Free: 20 posts/month, single profile, Ayrshare branding
- Premium: $149/month - Multiple profiles, remove branding
- Business: $499/month - Multi-tenant API, unlimited profiles

**Pros:**
- Purpose-built for multi-tenant SaaS
- Each customer gets unique `profileKey`
- Handles TikTok/Instagram approval
- Excellent documentation
- Webhook support for post status
- 12 platforms supported

**Cons:**
- No Chinese platform support
- $499/mo minimum for multi-tenant
- Some users report high costs

**API Example:**
```javascript
// Post to multiple platforms with one API call
const response = await fetch('https://api.ayrshare.com/api/post', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    post: "Check out our new dish! #foodie",
    platforms: ["instagram", "facebook", "tiktok"],
    mediaUrls: ["https://example.com/food-photo.jpg"],
    profileKey: "CUSTOMER_PROFILE_KEY"
  })
});
```

#### Late (Best Value Alternative)

**Pricing Tiers:**
- Free: 10 posts/month
- Build: $13/month - 100 posts, 3 profiles
- Accelerate: $33/month - 500 posts, 10 profiles
- Scale: $99/month - 3,000 posts, 50 profiles
- Unlimited: $667/month - Unlimited everything

**Pros:**
- Best value for unlimited usage
- 99.97% uptime SLA
- Sub-50ms response times
- White-label ready
- API access on all plans (including free)

**Cons:**
- Newer company (less established)
- 11 platforms (vs Ayrshare's 12)
- No Chinese platforms

**API Example:**
```javascript
const response = await fetch('https://api.getlate.dev/v1/posts', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: "Delicious new menu item!",
    platforms: ["instagram", "facebook", "tiktok"],
    media: [{ url: "https://example.com/photo.jpg" }],
    workspace_id: "customer_workspace_id"
  })
});
```

---

## 4. Option 2: Build It Yourself (Direct API Integration)

### Overview
Instead of using an aggregator, you integrate directly with each platform's native API.

### Development Effort by Platform

| Platform | Difficulty | Approval Time | Maintenance | Notes |
|----------|------------|---------------|-------------|-------|
| **Facebook** | Medium | 1-2 weeks | Medium | Requires app review |
| **Instagram** | Hard | 2-4 weeks | High | Must link to Facebook Page |
| **TikTok** | Very Hard | 3-4 weeks | High | Strict approval, video demo required |
| **Twitter/X** | Easy | Instant | Low | Paid API ($100/mo basic) |
| **LinkedIn** | Medium | 1-2 weeks | Medium | Marketing API approval needed |

### Instagram Graph API (Direct Integration)

**Requirements:**
1. Meta Developer account
2. Facebook App with Instagram Graph API enabled
3. App review approval (video demo required)
4. Business or Creator Instagram account
5. Account linked to Facebook Page

**Limitations:**
- 25 posts per 24 hours per account
- Only Business/Creator accounts
- No Stories or Reels via API (as of 2025)
- Complex token refresh flow

**Effort:** 2-3 weeks development + 2-4 weeks approval

**Code Complexity:**
```javascript
// Step 1: Create media container
const containerResponse = await fetch(
  `https://graph.facebook.com/v22.0/${igUserId}/media`,
  {
    method: 'POST',
    body: new URLSearchParams({
      image_url: 'https://example.com/photo.jpg',
      caption: 'Delicious food! #restaurant',
      access_token: pageAccessToken
    })
  }
);
const { id: containerId } = await containerResponse.json();

// Step 2: Wait for container to be ready (polling required)
// Step 3: Publish the container
const publishResponse = await fetch(
  `https://graph.facebook.com/v22.0/${igUserId}/media_publish`,
  {
    method: 'POST',
    body: new URLSearchParams({
      creation_id: containerId,
      access_token: pageAccessToken
    })
  }
);
```

### TikTok Content Posting API (Direct Integration)

**Requirements:**
1. TikTok Developer account
2. App registration with detailed business info
3. App review with video demo showing integration
4. Live, fully-developed website (no landing pages)
5. Visible Privacy Policy and Terms of Service

**Limitations:**
- Unaudited apps: Only 5 users, private posts only
- Audited apps: ~15 posts/day per creator
- Video demo required for approval
- 3-4 days minimum approval time
- 2025: Stricter approval process

**Effort:** 3-4 weeks development + 3-4 weeks approval

### Facebook Graph API (Direct Integration)

**Requirements:**
1. Meta Developer account
2. Business-type app
3. Page Access Token with `pages_manage_posts` permission
4. App review for live mode

**Permissions Needed:**
- `pages_read_engagement`
- `pages_manage_posts`

**Effort:** 1-2 weeks development + 1-2 weeks approval

### Total DIY Cost Analysis

| Cost Type | Year 1 | Ongoing (Annual) |
|-----------|--------|------------------|
| Developer Time (setup) | $15,000-30,000 | - |
| Developer Time (maintenance) | - | $10,000-20,000 |
| API Fees (Twitter/X) | $1,200 | $1,200 |
| Infrastructure | $500-1,000 | $500-1,000 |
| **Total** | **$16,700-31,000** | **$11,700-21,200** |

### DIY Pros & Cons

**Pros:**
- No monthly aggregator fees
- Maximum flexibility
- No dependency on third-party
- Can customize everything

**Cons:**
- 8-12 weeks initial development
- Ongoing maintenance burden
- Must handle API changes
- Separate approval process per platform
- Token refresh complexity
- Rate limit handling
- Error handling across platforms

---

## 5. Option 3: Free & Low-Cost Options

### Fully Free Options

| Option | Platforms | Limit | Multi-Tenant | Notes |
|--------|-----------|-------|--------------|-------|
| **Ayrshare Free** | All 12 | 20 posts/mo | No | Single profile, branding |
| **Late Free** | All 11 | 10 posts/mo | No | API access included |
| **Buffer Free** | 3 | 3 channels | No | Manual connection |
| **DIY (Direct APIs)** | Varies | Unlimited* | Yes | High dev effort |

*Direct APIs are free except Twitter/X ($100/mo)

### Low-Cost Options (<$50/month)

| Option | Monthly Cost | What You Get |
|--------|-------------|--------------|
| **Late Build** | $13/mo | 100 posts, 3 profiles |
| **Late Accelerate** | $33/mo | 500 posts, 10 profiles |
| **Ayrshare Premium** | $49/mo | Multiple profiles, no branding |
| **Publer Pro** | $12/mo | 10 accounts |

### Hybrid Approach (Recommended for Bootstrap)

**Strategy:** Use free tier initially, upgrade as you grow

1. **0-10 customers:** Ayrshare Free (20 posts/mo)
2. **10-50 customers:** Late Build ($13/mo) or Ayrshare Premium ($49/mo)
3. **50-100 customers:** Late Scale ($99/mo) or Ayrshare Business ($499/mo)
4. **100+ customers:** Late Unlimited ($667/mo) or negotiate enterprise pricing

---

## 6. Platform-Specific Requirements

### Instagram

| Requirement | Details |
|-------------|---------|
| Account Type | Business or Creator (not Personal) |
| Facebook Link | Must be connected to Facebook Page |
| API | Instagram Graph API via Facebook |
| Approval | App review required |
| Post Types | Feed images, Carousels, Videos |
| Not Supported | Stories, Reels (via API) |
| Rate Limit | 25 posts/24 hours |
| Image Specs | JPEG, max 8MB, 1:1 or 4:5 ratio |

### Facebook

| Requirement | Details |
|-------------|---------|
| Account Type | Facebook Page (not Personal Profile) |
| API | Facebook Graph API v22.0 |
| Permissions | `pages_read_engagement`, `pages_manage_posts` |
| Approval | App review for live mode |
| Post Types | Text, Images, Videos, Links |
| Token Type | Page Access Token (long-lived) |

### TikTok

| Requirement | Details |
|-------------|---------|
| Account Type | TikTok Business account |
| API | TikTok Content Posting API |
| Approval | Video demo required, 3-4 days |
| Website | Fully developed, live website required |
| Audit Status | Unaudited: 5 users, private only |
| Rate Limit | ~15 posts/day per creator |
| 2025 Changes | Stricter approval process |

---

## 7. Chinese Platform Analysis

### Critical Finding
**No Western API aggregator supports Chinese platforms.**

### Platform Status

| Platform | API Status | Posting Support | Best Solution |
|----------|------------|-----------------|---------------|
| **Xiaohongshu (RED)** | Limited | E-commerce only | KAWO or manual |
| **WeChat** | Restricted | Service accounts only | KAWO |
| **Douyin** | Separate from TikTok | Via KAWO | KAWO |
| **Weibo** | Available | Via KAWO | KAWO |

### Xiaohongshu Reality

**Official API:**
- Exists but primarily for e-commerce partners
- Requires Chinese business entity for full approval
- Focus on product catalogs, not content posting

**Third-Party Options:**
- [KAWO](https://kawo.com/) - Partial support, expensive ($3,000+/year)
- [RapidAPI](https://rapidapi.com/dataapiman/api/xiaohongshu-all-api) - Data scraping only, not posting
- Direct integration - Requires Chinese entity

**Recommendation:** Exclude Xiaohongshu from MVP. Add later via KAWO or partnership.

### WeChat Official Account

**Limitations for Foreign Companies:**
- Can ONLY register Service Accounts (not Subscription)
- Maximum 4 push posts per month
- Many features unavailable
- Requires Chinese legal entity for full access

**Recommendation:** Partner with local agency or use KAWO.

### KAWO (China Solution)

| Aspect | Details |
|--------|---------|
| Platforms | WeChat, Weibo, Douyin, Kuaishou, Bilibili |
| Pricing | Starting $3,000/year |
| Target | Foreign companies entering China |
| API | Enterprise API available |
| Limitation | No Western platforms |

---

## 8. Cost Comparison

### Scenario: 100 Business Customers, 3 Platforms Each

| Solution | Monthly Cost | Annual Cost | Setup Cost |
|----------|-------------|-------------|------------|
| **Late Unlimited** | $667 | $8,004 | ~$2,000 (dev) |
| **Ayrshare Business** | $499+ | $6,000+ | ~$2,000 (dev) |
| **Late + KAWO** | $917 | $11,004 | ~$3,000 (dev) |
| **Ayrshare + KAWO** | $749+ | $9,000+ | ~$3,000 (dev) |
| **DIY (all platforms)** | ~$100 (X API) | ~$1,200 | ~$25,000 (dev) |
| **Buffer** | $1,500+ | $18,000+ | ~$1,000 (dev) |
| **Hootsuite Enterprise** | $1,250+ | $15,000+ | Included |

### Break-Even Analysis: DIY vs Aggregator

**Aggregator (Ayrshare Business):**
- Year 1: $6,000 + $2,000 dev = $8,000
- Year 2: $6,000
- Year 3: $6,000
- **3-Year Total: $20,000**

**DIY (Direct Integration):**
- Year 1: $25,000 dev + $1,200 APIs = $26,200
- Year 2: $15,000 maintenance + $1,200 = $16,200
- Year 3: $15,000 maintenance + $1,200 = $16,200
- **3-Year Total: $58,600**

**Verdict:** Aggregator saves ~$38,600 over 3 years

---

## 9. Recommendation

### For Zazzles/FoodSnap

#### Phase 1: Western Platforms (Now)

**Recommended: Keep Ayrshare** (already implemented)

Why:
- Already integrated and working
- Multi-tenant support with profileKey
- $499/mo is reasonable for 100+ customers
- Handles all approval processes
- Good documentation

Alternative: Switch to **Late** if unlimited usage needed ($667/mo)

#### Phase 2: Scale (3-6 months)

- Evaluate Late for cost savings at scale
- Consider enterprise pricing negotiation
- Add scheduling features
- Implement analytics

#### Phase 3: China Market (6-12 months)

- Evaluate KAWO partnership ($250/mo additional)
- Or partner with Chinese agency
- Keep Xiaohongshu as "coming soon"

### Decision Matrix

| If You... | Choose... | Reason |
|-----------|-----------|--------|
| Need it now, have budget | Ayrshare Business ($499/mo) | Already working, proven |
| Need unlimited at lower cost | Late Unlimited ($667/mo) | Best value |
| Are bootstrapping | Late Build ($13/mo) | Cheapest with API |
| Have dev team, long runway | DIY | Maximum control |
| Need China platforms | Ayrshare + KAWO | Only option |

---

## 10. Implementation Roadmap

### Current State
- Ayrshare integration implemented
- OAuth flow ready
- Connect/Disconnect working

### Next Steps

**Week 1-2: Production Ready**
- [ ] Add AYRSHARE_PRIVATE_KEY to Vercel
- [ ] Test OAuth flow end-to-end
- [ ] Add error handling and retry logic
- [ ] Implement webhook handlers

**Week 3-4: Feature Complete**
- [ ] Add post scheduling
- [ ] Implement post history
- [ ] Add platform-specific image optimization
- [ ] Create posting UI from gallery

**Month 2: Analytics & Polish**
- [ ] Add post analytics
- [ ] Implement best time to post
- [ ] Add A/B testing for captions
- [ ] User feedback and iteration

**Month 3+: China Expansion**
- [ ] Evaluate KAWO
- [ ] Partnership discussions
- [ ] WeChat/Douyin integration if viable

---

## 11. Sources

### API Provider Documentation
- [Ayrshare Pricing & Features](https://www.ayrshare.com/pricing/)
- [Late Social Media API](https://getlate.dev/)
- [Buffer Developers](https://buffer.com/developers/api)
- [Sendible White-Label](https://www.sendible.com/pricing)
- [Hootsuite Developer](https://developer.hootsuite.com/)

### Platform APIs
- [Instagram Graph API Guide](https://elfsight.com/blog/instagram-graph-api-complete-developer-guide-for-2025/)
- [TikTok Content Posting API](https://developers.tiktok.com/doc/content-posting-api-get-started)
- [Facebook Graph API Guide](https://getlate.dev/blog/facebook-graph-api)
- [TikTok Developer API Guide](https://getlate.dev/blog/tiktok-developer-api)

### Comparison & Reviews
- [Late vs Ayrshare Comparison](https://getlate.dev/ayrshare-vs-late)
- [Best Ayrshare Alternatives](https://data365.co/blog/best-ayrshare-alternative)
- [Top 10 Social Media APIs](https://www.ayrshare.com/top-10-social-media-apis-for-developers/)
- [Social Media API Pricing Guide](https://getlate.dev/blog/social-media-api-pricing)
- [Why You Don't Need a Social Media Posting API](https://www.cloudcampaign.com/blog/why-you-dont-need-a-social-media-posting-api)

### Chinese Platforms
- [KAWO Platform](https://kawo.com/en)
- [Xiaohongshu Developer](https://school.xiaohongshu.com/en/open/quick-start/workflow.html)
- [WeChat Official Account Guide](https://appinchina.co/blog/what-are-wechat-official-accounts-the-complete-guide-to-creating-and-using-wechat-official-accounts/)
- [Chinese Social Media Platforms 2025](https://sekkeidigitalgroup.com/most-popular-chinese-social-media-platforms/)

---

## Appendix A: Provider Contact Information

| Provider | Website | Sales Contact |
|----------|---------|---------------|
| Ayrshare | ayrshare.com | sales@ayrshare.com |
| Late | getlate.dev | Contact form on site |
| KAWO | kawo.com | Contact form on site |
| Sendible | sendible.com | Sales on pricing page |

---

## Appendix B: Quick Decision Flowchart

```
START
  |
  v
Do you have $500+/mo budget?
  |
  +-- YES --> Use Ayrshare Business (multi-tenant ready)
  |
  +-- NO --> Do you have a dev team?
              |
              +-- YES --> Consider DIY (8-12 weeks)
              |
              +-- NO --> Use Late Build ($13/mo) or Free tier
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-18 | Claude (AI) | Initial research compilation |

---

*This document was compiled from web research and should be verified with current provider pricing and features before making final decisions.*
