/**
 * Changelog Data for Zazzles (marketing.heymag.app)
 * AI Food Photography Studio
 *
 * This file contains the public changelog entries displayed on /changelog
 */

export type ChangeType = 'feature' | 'improvement' | 'fix' | 'security'

export interface Change {
  type: ChangeType
  title: string
  description: string
}

export interface ChangelogEntry {
  version: string
  date: string
  title: string
  description: string
  major?: boolean
  internalBuild?: string
  changes: Change[]
}

export const changelogData: ChangelogEntry[] = [
  {
    version: '0.29.0',
    date: '2025-12-19',
    title: 'Security & Stability Update',
    description: 'Major security updates and code quality improvements across the platform.',
    major: true,
    internalBuild: '1.83',
    changes: [
      {
        type: 'security',
        title: 'Next.js Security Update',
        description: 'Upgraded to Next.js 14.2.35 to address 12 security vulnerabilities.',
      },
      {
        type: 'fix',
        title: 'React Hook Optimizations',
        description: 'Fixed dependency warnings in billing, editor, and settings pages for better performance.',
      },
      {
        type: 'improvement',
        title: 'Code Quality Improvements',
        description: 'Resolved all ESLint warnings and TypeScript errors for a cleaner codebase.',
      },
    ],
  },
  {
    version: '0.28.0',
    date: '2025-12-18',
    title: 'Vercel Edge Runtime Compatibility',
    description: 'Improved deployment stability for Vercel Edge runtime.',
    internalBuild: '1.80',
    changes: [
      {
        type: 'fix',
        title: 'Edge Runtime Compatibility',
        description: 'Fixed Vercel Edge runtime validation issues for stable deployments.',
      },
      {
        type: 'improvement',
        title: 'Build Configuration',
        description: 'Optimized TypeScript build configuration for Vercel deployment.',
      },
    ],
  },
  {
    version: '0.25.0',
    date: '2025-12-15',
    title: 'Social Media Integration',
    description: 'Direct posting to Facebook and Instagram with AI-generated captions.',
    major: true,
    internalBuild: '1.70',
    changes: [
      {
        type: 'feature',
        title: 'Facebook & Instagram Posting',
        description: 'Post enhanced food photos directly to your Facebook Page and Instagram Business account.',
      },
      {
        type: 'feature',
        title: 'Meta OAuth Integration',
        description: 'Secure connection to Meta accounts using Facebook Login for Business.',
      },
      {
        type: 'feature',
        title: 'Caption Auto-Posting',
        description: 'AI-generated captions are automatically included when posting to social media.',
      },
    ],
  },
  {
    version: '0.20.0',
    date: '2025-12-10',
    title: 'AI Caption Generator',
    description: 'Generate engaging, platform-optimized captions for your food photos.',
    major: true,
    internalBuild: '1.50',
    changes: [
      {
        type: 'feature',
        title: 'Multilingual Captions',
        description: 'Generate captions in English or Chinese, perfect for the SEA market.',
      },
      {
        type: 'feature',
        title: 'Platform-Specific Styles',
        description: 'Captions optimized for Instagram, TikTok, Facebook, Xiaohongshu, and delivery apps.',
      },
      {
        type: 'feature',
        title: 'Hashtag Generation',
        description: 'Automatically generate relevant hashtags based on your food photo.',
      },
      {
        type: 'improvement',
        title: 'Claude AI Integration',
        description: 'Powered by Anthropic Claude for high-quality, context-aware captions.',
      },
    ],
  },
  {
    version: '0.15.0',
    date: '2025-12-05',
    title: 'Background Removal & Replacement',
    description: 'Remove or replace photo backgrounds with professional results.',
    major: true,
    internalBuild: '1.30',
    changes: [
      {
        type: 'feature',
        title: 'AI Background Removal',
        description: 'Remove backgrounds from food photos with one click using Remove.bg technology.',
      },
      {
        type: 'feature',
        title: 'Background Replacement',
        description: 'Replace backgrounds with professional surfaces like marble, wood, or minimal white.',
      },
      {
        type: 'feature',
        title: 'Transparent PNG Export',
        description: 'Export images with transparent backgrounds for maximum flexibility.',
      },
    ],
  },
  {
    version: '0.10.0',
    date: '2025-12-01',
    title: 'Style Presets & Templates',
    description: '30+ style presets optimized for SEA delivery platforms and social media.',
    major: true,
    internalBuild: '1.10',
    changes: [
      {
        type: 'feature',
        title: 'SEA Delivery Platform Presets',
        description: 'Optimized presets for GrabFood, Foodpanda, Deliveroo, GoFood, and ShopeeFood.',
      },
      {
        type: 'feature',
        title: 'Social Media Presets',
        description: 'Perfect styles for Instagram Feed, Stories, Reels, TikTok, and Xiaohongshu.',
      },
      {
        type: 'feature',
        title: 'Restaurant Style Templates',
        description: 'Fine dining, casual, street food, cafe, kopitiam, and hawker centre styles.',
      },
      {
        type: 'feature',
        title: 'Background & Technique Presets',
        description: 'Minimal white, rustic wood, marble, dark moody, flat lay, and natural light options.',
      },
    ],
  },
  {
    version: '0.5.0',
    date: '2025-11-25',
    title: 'Credit System & Billing',
    description: 'Flexible credit-based pricing with Stripe subscription management.',
    major: true,
    internalBuild: '0.80',
    changes: [
      {
        type: 'feature',
        title: 'Credit-Based Pricing',
        description: 'Pay per image with credits - Lite (15), Starter (30), or Pro (100) credits per month.',
      },
      {
        type: 'feature',
        title: 'Stripe Integration',
        description: 'Secure payment processing with Stripe for subscriptions and additional credits.',
      },
      {
        type: 'feature',
        title: 'Annual Savings',
        description: 'Save 2 months with annual billing plans.',
      },
      {
        type: 'feature',
        title: 'Free Trial',
        description: 'Get 5 free credits to try the platform before subscribing.',
      },
    ],
  },
  {
    version: '0.1.0',
    date: '2025-11-20',
    title: 'Initial Release',
    description: 'Launch of Zazzles - AI Food Photography Studio for F&B businesses.',
    major: true,
    internalBuild: '0.50',
    changes: [
      {
        type: 'feature',
        title: 'AI Photo Enhancement',
        description: 'Transform amateur phone photos into professional food photography with Google Nano Banana Pro.',
      },
      {
        type: 'feature',
        title: 'Image Editor',
        description: 'Full-featured editor with cropping, adjustments, and enhancement controls.',
      },
      {
        type: 'feature',
        title: 'Batch Processing',
        description: 'Process multiple images at once for efficient workflow.',
      },
      {
        type: 'feature',
        title: 'Supabase Authentication',
        description: 'Secure business accounts with Supabase Auth and Row Level Security.',
      },
      {
        type: 'feature',
        title: 'Dashboard',
        description: 'Central hub to manage your images, credits, and account settings.',
      },
    ],
  },
]

export const getChangeTypeIcon = (type: ChangeType): string => {
  switch (type) {
    case 'feature':
      return '✨'
    case 'improvement':
      return '🚀'
    case 'fix':
      return '🔧'
    case 'security':
      return '🔒'
    default:
      return '📝'
  }
}

export const getChangeTypeColor = (type: ChangeType): string => {
  switch (type) {
    case 'feature':
      return 'text-green-500'
    case 'improvement':
      return 'text-blue-500'
    case 'fix':
      return 'text-yellow-500'
    case 'security':
      return 'text-red-500'
    default:
      return 'text-muted-foreground'
  }
}
