export const config = {
  // Version tracking
  version: '0.3.0',
  internalBuild: '0.18',

  // App info
  appName: 'FoodSnap AI',
  appDescription: 'AI Food Photography Enhancement',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://marketing.heymag.app',

  // Pricing tiers
  pricing: {
    starter: {
      name: 'Starter',
      price: 25,
      credits: 30,
      stripePriceId: process.env.STRIPE_STARTER_PRICE_ID,
    },
    pro: {
      name: 'Pro',
      price: 80,
      credits: 100,
      stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    },
    business: {
      name: 'Business',
      price: 180,
      credits: 300,
      stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    },
  },

  // Credit pricing
  creditPrice: 0.50, // Per additional credit

  // AI costs (for internal tracking)
  aiCosts: {
    enhancement: 0.039, // Google Nano Banana Pro
    caption: 0.003, // Claude
    backgroundRemoval: 0.09, // Remove.bg
  },

  // Style presets
  stylePresets: [
    { id: 'delivery', name: 'Delivery App', description: 'Optimized for DoorDash, Uber Eats' },
    { id: 'instagram', name: 'Instagram Feed', description: 'Square format, vibrant colors' },
    { id: 'stories', name: 'Stories/Reels', description: '9:16 vertical format' },
    { id: 'menu', name: 'Menu Card', description: 'Clean, professional menu style' },
    { id: 'fine-dining', name: 'Fine Dining', description: 'Elegant, dark backgrounds' },
    { id: 'casual', name: 'Casual Dining', description: 'Warm, inviting atmosphere' },
    { id: 'fast-food', name: 'Fast Food', description: 'Bold, appetizing, high energy' },
    { id: 'cafe', name: 'Cafe Style', description: 'Cozy, artisan aesthetic' },
    { id: 'xiaohongshu', name: 'Xiaohongshu', description: 'Trendy, lifestyle-focused' },
    { id: 'wechat', name: 'WeChat Moments', description: 'Clean, shareable format' },
  ],

  // Supported platforms
  platforms: [
    { id: 'instagram', name: 'Instagram', icon: 'instagram' },
    { id: 'facebook', name: 'Facebook', icon: 'facebook' },
    { id: 'tiktok', name: 'TikTok', icon: 'video' },
    { id: 'xiaohongshu', name: 'Xiaohongshu', icon: 'book-open' },
    { id: 'wechat', name: 'WeChat', icon: 'message-circle' },
  ],
}
