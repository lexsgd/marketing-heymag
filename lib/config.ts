export const config = {
  // Version tracking
  version: '0.44.7',
  internalBuild: '2.38',

  // App info
  appName: 'Zazzles',
  appDescription: 'AI Food Photography Studio',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://marketing.heymag.app',

  // Pricing tiers (SEA market pricing)
  pricing: {
    lite: {
      name: 'Lite',
      price: 15,
      annualPrice: 150,
      credits: 15,
      stripePriceId: process.env.STRIPE_LITE_PRICE_ID,
      stripeAnnualPriceId: process.env.STRIPE_LITE_ANNUAL_PRICE_ID,
      features: [
        'AI Photo Enhancement',
        'AI Caption Generator',
        '30+ Style Presets',
        'Batch Processing',
        'Social Media Integration',
        'AI Support',
      ],
    },
    starter: {
      name: 'Starter',
      price: 25,
      annualPrice: 250,
      credits: 30,
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
      stripeAnnualPriceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID,
      features: [
        'AI Photo Enhancement',
        'AI Caption Generator',
        '30+ Style Presets',
        'Batch Processing',
        'Social Media Integration',
        'AI Support',
      ],
    },
    pro: {
      name: 'Pro',
      price: 80,
      annualPrice: 800,
      credits: 100,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
      stripeAnnualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
      popular: true,
      features: [
        'AI Photo Enhancement',
        'AI Caption Generator',
        '30+ Style Presets',
        'Batch Processing',
        'Social Media Integration',
        'Priority Support',
      ],
    },
  },

  // Annual savings (2 months free)
  annualSavings: '2 months free',

  // Credit pricing
  creditPrice: 0.50, // Per additional credit

  // AI costs (for internal tracking)
  // Updated Dec 2025: Gemini 3 Pro Image generation pricing
  aiCosts: {
    generation2K: 0.134, // Gemini 3 Pro Image (2K resolution) - $120/1M tokens, 1120 tokens/image
    generation4K: 0.24,  // Gemini 3 Pro Image (4K resolution) - 2000 tokens/image
    caption: 0.003, // Claude
    backgroundRemoval: 0.09, // Remove.bg
  },

  // Style presets - 30+ presets with SEA market focus
  stylePresets: [
    // SEA Delivery Platforms (Primary)
    { id: 'grab', name: 'GrabFood', description: 'Optimized for GrabFood listings', category: 'delivery' },
    { id: 'foodpanda', name: 'Foodpanda', description: 'Perfect for Foodpanda menus', category: 'delivery' },
    { id: 'deliveroo', name: 'Deliveroo', description: 'Deliveroo SEA style', category: 'delivery' },
    { id: 'gojek', name: 'GoFood', description: 'Optimized for Gojek GoFood', category: 'delivery' },
    { id: 'shopee', name: 'ShopeeFood', description: 'ShopeeFood marketplace style', category: 'delivery' },
    { id: 'delivery', name: 'Delivery Generic', description: 'Works for any delivery app', category: 'delivery' },

    // Social Media Platforms
    { id: 'instagram', name: 'Instagram Feed', description: 'Square format, vibrant colors', category: 'social' },
    { id: 'instagram-stories', name: 'Instagram Stories', description: '9:16 vertical, trendy', category: 'social' },
    { id: 'instagram-reels', name: 'Instagram Reels', description: 'Eye-catching for reels', category: 'social' },
    { id: 'tiktok', name: 'TikTok', description: 'Scroll-stopping visuals', category: 'social' },
    { id: 'facebook', name: 'Facebook', description: 'Optimized for FB feed', category: 'social' },
    { id: 'xiaohongshu', name: 'Xiaohongshu', description: 'Trendy, lifestyle-focused', category: 'social' },
    { id: 'wechat', name: 'WeChat Moments', description: 'Clean, shareable format', category: 'social' },

    // Restaurant Styles
    { id: 'fine-dining', name: 'Fine Dining', description: 'Elegant, dark backgrounds', category: 'style' },
    { id: 'casual', name: 'Casual Dining', description: 'Warm, inviting atmosphere', category: 'style' },
    { id: 'fast-food', name: 'Fast Food', description: 'Bold, appetizing, high energy', category: 'style' },
    { id: 'cafe', name: 'Cafe Style', description: 'Cozy, artisan aesthetic', category: 'style' },
    { id: 'street-food', name: 'Street Food', description: 'Authentic hawker vibes', category: 'style' },
    { id: 'menu', name: 'Menu Card', description: 'Clean, professional menu', category: 'style' },
    { id: 'kopitiam', name: 'Kopitiam', description: 'Local coffee shop feel', category: 'style' },
    { id: 'hawker', name: 'Hawker Centre', description: 'SEA hawker stall vibes', category: 'style' },

    // Background Styles
    { id: 'minimal', name: 'Minimal White', description: 'Clean white background', category: 'background' },
    { id: 'rustic', name: 'Rustic Wood', description: 'Wooden table backdrop', category: 'background' },
    { id: 'marble', name: 'Marble Surface', description: 'Elegant marble backdrop', category: 'background' },
    { id: 'dark-moody', name: 'Dark Moody', description: 'Dramatic dark lighting', category: 'background' },
    { id: 'bright-airy', name: 'Bright & Airy', description: 'Light and fresh feel', category: 'background' },
    { id: 'tropical', name: 'Tropical', description: 'Bright tropical colors', category: 'background' },
    { id: 'concrete', name: 'Industrial', description: 'Modern concrete look', category: 'background' },
    { id: 'botanical', name: 'Botanical', description: 'Green plants backdrop', category: 'background' },

    // Photography Styles
    { id: 'overhead', name: 'Flat Lay', description: 'Top-down perspective', category: 'technique' },
    { id: 'natural-light', name: 'Natural Light', description: 'Window-lit natural feel', category: 'technique' },
    { id: 'neon', name: 'Neon Night', description: 'Vibrant night market style', category: 'technique' },
    { id: 'vintage', name: 'Vintage', description: 'Nostalgic warm tones', category: 'technique' },
    { id: 'hdr', name: 'HDR Enhanced', description: 'High dynamic range pop', category: 'technique' },
    { id: 'bokeh', name: 'Bokeh Background', description: 'Blurred background effect', category: 'technique' },
  ],

  // Preset categories
  presetCategories: [
    { id: 'delivery', name: 'Delivery Apps', icon: 'truck' },
    { id: 'social', name: 'Social Media', icon: 'share' },
    { id: 'style', name: 'Restaurant Style', icon: 'utensils' },
    { id: 'background', name: 'Backgrounds', icon: 'image' },
    { id: 'technique', name: 'Techniques', icon: 'camera' },
  ],

  // Supported platforms for social posting
  platforms: [
    { id: 'instagram', name: 'Instagram', icon: 'instagram' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'tiktok', name: 'TikTok', icon: 'video' },
    { id: 'xiaohongshu', name: 'Xiaohongshu', icon: 'book-open' },
    { id: 'wechat', name: 'WeChat', icon: 'message-circle' },
  ],

  // SEA delivery platform badges
  seaPlatforms: [
    { id: 'grab', name: 'Grab', logo: '/badges/grab.svg', color: '#00B14F' },
    { id: 'foodpanda', name: 'Foodpanda', logo: '/badges/foodpanda.svg', color: '#D70F64' },
    { id: 'deliveroo', name: 'Deliveroo', logo: '/badges/deliveroo.svg', color: '#00CCBC' },
    { id: 'gojek', name: 'Gojek', logo: '/badges/gojek.svg', color: '#00AA13' },
    { id: 'shopee', name: 'ShopeeFood', logo: '/badges/shopee.svg', color: '#EE4D2D' },
  ],

  // Free trial credits
  freeTrialCredits: 2,
}
