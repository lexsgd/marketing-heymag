'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  Camera,
  Sparkles,
  Share2,
  Zap,
  Check,
  Star,
  Upload,
  Wand2,
  Send
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg food-gradient flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">FoodSnap AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="food-gradient border-0">
              <Link href="/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Google Nano Banana Pro AI
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Transform Food Photos into{' '}
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
              Marketing Gold
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn amateur phone photos into stunning, professional food images.
            Generate captions and post to Instagram, Facebook, TikTok, and Xiaohongshu in just 3 clicks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" className="food-gradient border-0 h-14 px-8 text-lg">
              <Upload className="mr-2 h-5 w-5" />
              Upload Your First Photo
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg">
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-orange-500">95%</div>
              <div className="text-sm text-muted-foreground">Cost Savings vs Photographers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500">30s</div>
              <div className="text-sm text-muted-foreground">Average Enhancement Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-500">6</div>
              <div className="text-sm text-muted-foreground">Social Platforms Supported</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            3 Clicks. 3 Minutes. Done.
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            The simplest way to create professional food marketing content
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                icon: Upload,
                title: 'Upload',
                description: 'Take a photo with your phone and upload it. No professional camera needed.'
              },
              {
                step: '2',
                icon: Wand2,
                title: 'Enhance',
                description: 'AI transforms your photo into studio-quality. Choose from 10+ style presets.'
              },
              {
                step: '3',
                icon: Send,
                title: 'Publish',
                description: 'Generate captions and post to all your social platforms instantly.'
              }
            ].map((item) => (
              <div key={item.step} className="relative p-6 rounded-2xl border bg-card">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full food-gradient flex items-center justify-center text-white font-bold">
                  {item.step}
                </div>
                <item.icon className="w-10 h-10 text-orange-500 mb-4 mt-2" />
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need for Food Marketing
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built specifically for F&B businesses who want professional results without professional costs
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI Photo Enhancement',
                description: 'Google Nano Banana Pro transforms any photo into mouthwatering, studio-quality images.'
              },
              {
                icon: Camera,
                title: '10+ Style Presets',
                description: 'Delivery, Social, Menu, Fine Dining - choose the perfect look for any platform.'
              },
              {
                icon: Zap,
                title: 'Background Removal',
                description: 'Instantly remove or replace backgrounds. Add professional settings in one click.'
              },
              {
                icon: Star,
                title: 'AI Caption Generator',
                description: 'Multilingual captions in English and Chinese. Optimized for each platform.'
              },
              {
                icon: Share2,
                title: 'Multi-Platform Posting',
                description: 'Post to Instagram, Facebook, TikTok, Xiaohongshu, and WeChat from one place.'
              },
              {
                icon: Camera,
                title: 'Thematic Templates',
                description: 'CNY, Christmas, Valentine\'s - seasonal templates that drive engagement.'
              }
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow">
                <feature.icon className="w-8 h-8 text-orange-500 mb-4" />
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Save thousands compared to professional photography. Credits never expire.
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: '$25',
                credits: '30 images',
                popular: false,
                features: [
                  'AI Photo Enhancement',
                  '10 Style Presets',
                  'AI Caption Generator',
                  'Multi-format Export',
                  'No Watermark',
                  'Commercial License'
                ]
              },
              {
                name: 'Pro',
                price: '$80',
                credits: '100 images',
                popular: true,
                features: [
                  'Everything in Starter',
                  'Template Library (50+)',
                  'Batch Processing',
                  'Social Media Posting',
                  'Xiaohongshu & WeChat',
                  'Priority Support'
                ]
              },
              {
                name: 'Business',
                price: '$180',
                credits: '300 images',
                popular: false,
                features: [
                  'Everything in Pro',
                  'API Access',
                  'Team Seats (5)',
                  'White-label Export',
                  'Custom Templates',
                  'Dedicated Support'
                ]
              }
            ].map((plan) => (
              <div
                key={plan.name}
                className={`p-6 rounded-2xl border ${
                  plan.popular
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20 relative'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.credits}/month</p>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'food-gradient border-0' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Start Free Trial
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need more? Add credits anytime at $0.50/credit. Credits never expire.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-3xl food-gradient text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Food Marketing?
            </h2>
            <p className="mb-6 opacity-90">
              Join hundreds of F&B businesses creating stunning content in minutes.
            </p>
            <Button size="lg" variant="secondary" className="h-14 px-8">
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg food-gradient flex items-center justify-center">
                <Camera className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold">FoodSnap AI</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Part of the <a href="https://heymag.app" className="text-orange-500 hover:underline">Hey Mag</a> family
            </div>
            <div className="text-sm text-muted-foreground">
              © 2025 FoodSnap AI. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
