'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Send,
  ChevronLeft,
  ChevronRight,
  Quote,
  Plus,
  Minus,
  Truck,
  Megaphone,
  BookOpen,
  MessageCircle,
  Play,
  User
} from 'lucide-react'

// Animated rotating text hook
function useRotatingText(texts: string[], intervalMs = 2500) {
  const [index, setIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length)
        setIsAnimating(false)
      }, 300)
    }, intervalMs)
    return () => clearInterval(interval)
  }, [texts, intervalMs])

  return { text: texts[index], isAnimating }
}

// Theme-aware Logo component
function Logo({ className = '', width = 120 }: { className?: string; width?: number }) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div style={{ width, height: width * 0.4 }} className="bg-muted animate-pulse rounded" />
  }

  const logoSrc = resolvedTheme === 'dark'
    ? '/logos/Zazzles-White.png'
    : '/logos/Zazzles-Black.png'

  return (
    <Image
      src={logoSrc}
      alt="Zazzles"
      width={width}
      height={width * 0.4}
      className={`object-contain ${className}`}
      priority
    />
  )
}

// SEA Platform Badges
const platformBadges = [
  { name: 'Grab', color: '#00B14F' },
  { name: 'Foodpanda', color: '#D70F64' },
  { name: 'Deliveroo', color: '#00CCBC' },
  { name: 'Gojek', color: '#00AA13' },
  { name: 'ShopeeFood', color: '#EE4D2D' },
]

// Use Case Tabs Data
const useCases = [
  {
    id: 'delivery',
    icon: Truck,
    title: 'Food Delivery Apps',
    description: 'Optimized for Grab, Foodpanda, Deliveroo, and GoFood listings',
    benefits: [
      'High-contrast images that stand out in app feeds',
      'Optimized for small thumbnail displays',
      'Clean backgrounds for menu consistency',
      'Platform-specific size presets'
    ],
  },
  {
    id: 'marketing',
    icon: Megaphone,
    title: 'Marketing & Ads',
    description: 'Create scroll-stopping ads for Facebook, Instagram, and Google',
    benefits: [
      'Eye-catching promotional graphics',
      'AI-generated ad copy in EN/CN',
      'Multiple aspect ratios for all platforms',
      'A/B test different styles instantly'
    ],
  },
  {
    id: 'menu',
    icon: BookOpen,
    title: 'Restaurant Menus',
    description: 'Professional menu photos without the studio',
    benefits: [
      'Consistent lighting across all dishes',
      'Print-ready high resolution',
      'Menu card templates included',
      'Batch process entire menu'
    ],
  },
  {
    id: 'social',
    icon: MessageCircle,
    title: 'Xiaohongshu & WeChat',
    description: 'Tailored for Chinese social media platforms',
    benefits: [
      'Xiaohongshu-style aesthetics',
      'WeChat Moments optimization',
      'Bilingual caption generation',
      'Direct posting integration'
    ],
  },
]

// Testimonials Data
const testimonials = [
  {
    name: 'Sarah Chen',
    role: 'Owner, Ming\'s Kitchen Singapore',
    quote: 'Our GrabFood orders increased 40% after switching to Zazzles photos. The ROI is incredible compared to hiring a photographer.',
    rating: 5
  },
  {
    name: 'Raj Patel',
    role: 'Marketing Manager, Spice Route',
    quote: 'We used to spend $500/month on food photography. Now we get better results for $80/month with Zazzles.',
    rating: 5
  },
  {
    name: 'Lisa Tan',
    role: 'Cafe Owner, Kopi Culture',
    quote: 'The Xiaohongshu integration is a game-changer. My posts get 3x more engagement with the AI-enhanced photos.',
    rating: 5
  },
  {
    name: 'Michael Wong',
    role: 'F&B Entrepreneur, 3 Outlets',
    quote: 'Managing 3 restaurants means 100+ dishes to photograph. Zazzles batch processing saves me hours every week.',
    rating: 5
  },
]

// FAQ Data
const faqs = [
  {
    q: 'How does AI photo enhancement work?',
    a: 'Our AI analyzes your food photo and applies professional photography techniques including color correction, lighting adjustment, background optimization, and style matching. The entire process takes about 30 seconds per image.'
  },
  {
    q: 'What platforms can I post to directly?',
    a: 'Zazzles supports direct posting to Instagram, Facebook, TikTok, Xiaohongshu (小红书), and WeChat. We also provide optimized exports for all major food delivery apps like Grab, Foodpanda, and Deliveroo.'
  },
  {
    q: 'Do credits expire?',
    a: 'No, credits never expire! Unlike other platforms, your unused credits roll over month to month. Use them whenever you need them.'
  },
  {
    q: 'Can I try before buying?',
    a: 'Yes! Visit our Explore page to enhance a sample image for free without signing up. You can see the AI quality before committing.'
  },
  {
    q: 'What image formats are supported?',
    a: 'We support JPEG, PNG, WebP, and HEIC images up to 50MB. Output formats include all major sizes for social media, delivery apps, and print-ready menus.'
  },
  {
    q: 'Is there an API for developers?',
    a: 'Yes, our Business plan includes API access. You can integrate Zazzles directly into your POS, website, or app.'
  },
]

export default function HomePage() {
  const { text: rotatingText, isAnimating } = useRotatingText([
    'Menu Photos',
    'Delivery Apps',
    'Social Media',
    'Marketing Ads',
  ])

  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Logo width={100} />
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/explore"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 transition-colors font-medium text-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Explore
            </Link>
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">
              FAQ
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm" className="bg-orange-500 hover:bg-orange-600">
              <Link href="/auth/signup">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI-Powered Food Photography Studio
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
            Transform Food Photos for{' '}
            <span className="relative inline-block min-w-[280px] md:min-w-[400px]">
              <span
                className={`bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent transition-all duration-300 ${
                  isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
                }`}
              >
                {rotatingText}
              </span>
            </span>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn amateur phone photos into stunning, professional food images.
            Generate captions and post to Grab, Foodpanda, Instagram, and Xiaohongshu in just 3 clicks.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 h-14 px-8 text-lg">
              <Link href="/explore">
                <Play className="mr-2 h-5 w-5" />
                Try It Free
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-14 px-8 text-lg">
              <Link href="/auth/signup">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Platform Badges */}
          <div className="mb-12">
            <p className="text-sm text-muted-foreground mb-4">Optimized for leading SEA platforms</p>
            <div className="flex flex-wrap justify-center gap-4 items-center">
              {platformBadges.map((platform) => (
                <div
                  key={platform.name}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border"
                >
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: platform.color }}
                  >
                    {platform.name[0]}
                  </div>
                  <span className="text-sm font-medium">{platform.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { value: '10,000+', label: 'Photos Enhanced' },
              { value: '95%', label: 'Cost Savings' },
              { value: '30s', label: 'Per Enhancement' },
              { value: '6', label: 'Platforms' },
            ].map((stat) => (
              <div key={stat.label} className="p-4 rounded-xl bg-card border border-border">
                <div className="text-3xl font-bold text-orange-500">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Case Tabs */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perfect for Every Use Case
          </h2>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Whether you&apos;re selling on delivery apps or building your brand on social media
          </p>

          <Tabs defaultValue="delivery" className="max-w-5xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-8 bg-muted">
              {useCases.map((useCase) => (
                <TabsTrigger
                  key={useCase.id}
                  value={useCase.id}
                  className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  <useCase.icon className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{useCase.title.split(' ')[0]}</span>
                  <span className="sm:hidden">{useCase.title.split(' ')[0]}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {useCases.map((useCase) => (
              <TabsContent key={useCase.id} value={useCase.id}>
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{useCase.title}</h3>
                    <p className="text-muted-foreground mb-6">{useCase.description}</p>
                    <ul className="space-y-3">
                      {useCase.benefits.map((benefit, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="mt-6 bg-orange-500 hover:bg-orange-600">
                      <Link href="/explore">
                        Try {useCase.title.split(' ')[0]} Style
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border">
                    <useCase.icon className="h-24 w-24 text-orange-500/20" />
                    <div className="absolute bottom-4 left-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
                      <p className="text-sm font-medium">Before → After Preview</p>
                      <p className="text-xs text-muted-foreground">AI enhancement demo</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            3 Clicks. 30 Seconds. Done.
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            The simplest way to create professional food marketing content
          </p>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
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
                description: 'AI transforms your photo into studio-quality. Choose from 30+ style presets.'
              },
              {
                step: '3',
                icon: Send,
                title: 'Publish',
                description: 'Generate captions and post to all your social platforms instantly.'
              }
            ].map((item) => (
              <div key={item.step} className="relative p-6 rounded-2xl border border-border bg-card">
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold">
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
      <section id="features" className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Everything You Need for Food Marketing
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Built specifically for SEA F&B businesses who want professional results without professional costs
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: Sparkles,
                title: 'AI Photo Enhancement',
                description: 'Google AI transforms any photo into mouthwatering, studio-quality images in 30 seconds.'
              },
              {
                icon: Camera,
                title: '30+ Style Presets',
                description: 'GrabFood, Foodpanda, Instagram, Xiaohongshu - optimized styles for every platform.'
              },
              {
                icon: Zap,
                title: 'Background Removal',
                description: 'Instantly remove or replace backgrounds. Add professional settings in one click.'
              },
              {
                icon: Star,
                title: 'AI Caption Generator',
                description: 'Multilingual captions in English and Chinese. Optimized for each platform and tone.'
              },
              {
                icon: Share2,
                title: 'Multi-Platform Posting',
                description: 'Post to Instagram, Facebook, TikTok, Xiaohongshu, and WeChat from one place.'
              },
              {
                icon: Camera,
                title: 'Thematic Templates',
                description: 'CNY, Hari Raya, Christmas - seasonal templates that drive engagement.'
              }
            ].map((feature, i) => (
              <Card key={i} className="bg-card border-border hover:border-orange-500/50 transition-colors">
                <CardContent className="p-6">
                  <feature.icon className="w-8 h-8 text-orange-500 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Loved by F&B Businesses
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join hundreds of restaurants and cafes creating stunning content
          </p>

          <div className="max-w-3xl mx-auto relative">
            <Card className="overflow-hidden bg-card border-border">
              <CardContent className="p-8">
                <Quote className="h-10 w-10 text-orange-500/30 mb-4" />
                <p className="text-lg mb-6 min-h-[80px]">
                  &ldquo;{testimonials[activeTestimonial].quote}&rdquo;
                </p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="font-semibold">{testimonials[activeTestimonial].name}</p>
                    <p className="text-sm text-muted-foreground">{testimonials[activeTestimonial].role}</p>
                  </div>
                  <div className="ml-auto flex gap-1">
                    {Array.from({ length: testimonials[activeTestimonial].rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2">
                {testimonials.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveTestimonial(i)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === activeTestimonial ? 'bg-orange-500' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-center text-muted-foreground mb-4 max-w-2xl mx-auto">
            Save thousands compared to professional photography. Credits never expire.
          </p>
          <p className="text-center text-green-500 font-medium mb-12">
            Save 40% with annual billing
          </p>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: 'Lite',
                price: '$15',
                credits: '15 images',
                popular: false,
                features: [
                  'AI Photo Enhancement',
                  '10 Style Presets',
                  'Basic Export',
                  'Watermark on images',
                ]
              },
              {
                name: 'Starter',
                price: '$25',
                credits: '30 images',
                popular: false,
                features: [
                  'Everything in Lite',
                  'AI Caption Generator',
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
                className={`p-6 rounded-2xl border bg-card ${
                  plan.popular
                    ? 'border-orange-500 shadow-lg shadow-orange-500/20 relative scale-105'
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
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">{plan.credits}/month</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full ${plan.popular ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                  asChild
                >
                  <Link href="/auth/signup">Start Free Trial</Link>
                </Button>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            Need more? Add credits anytime at $0.50/credit. Credits never expire.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Everything you need to know about Zazzles
          </p>

          <div className="max-w-2xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-border rounded-xl overflow-hidden bg-card"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                >
                  <span className="font-medium">{faq.q}</span>
                  {openFaq === i ? (
                    <Minus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-muted-foreground">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto p-8 rounded-3xl bg-gradient-to-r from-orange-500 to-amber-500 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Food Marketing?
            </h2>
            <p className="mb-6 opacity-90">
              Join hundreds of SEA F&B businesses creating stunning content in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="h-14 px-8">
                <Link href="/explore">
                  <Play className="mr-2 h-5 w-5" />
                  Try It Free
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 bg-white/10 border-white/30 hover:bg-white/20 text-white">
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <Link href="/" className="flex items-center">
              <Logo width={140} />
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/explore" className="hover:text-foreground transition-colors">Explore</Link>
              <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
              <Link href="#faq" className="hover:text-foreground transition-colors">FAQ</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
            </div>
          </div>
          <div className="text-center text-sm text-muted-foreground mt-8">
            © 2025 Zazzles. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
