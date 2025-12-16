'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Sparkles,
  Upload,
  Wand2,
  Check,
  ArrowRight,
  Download,
  Share2,
  Lock,
  Camera,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  ImageIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Sample food images for demo
const sampleImages = [
  {
    id: 'noodles',
    name: 'Ramen Bowl',
    original: '/samples/ramen-original.jpg',
    enhanced: '/samples/ramen-enhanced.jpg',
    category: 'Asian',
  },
  {
    id: 'burger',
    name: 'Gourmet Burger',
    original: '/samples/burger-original.jpg',
    enhanced: '/samples/burger-enhanced.jpg',
    category: 'Western',
  },
  {
    id: 'dessert',
    name: 'Chocolate Cake',
    original: '/samples/cake-original.jpg',
    enhanced: '/samples/cake-enhanced.jpg',
    category: 'Dessert',
  },
  {
    id: 'coffee',
    name: 'Latte Art',
    original: '/samples/coffee-original.jpg',
    enhanced: '/samples/coffee-enhanced.jpg',
    category: 'Drinks',
  },
  {
    id: 'sushi',
    name: 'Sushi Platter',
    original: '/samples/sushi-original.jpg',
    enhanced: '/samples/sushi-enhanced.jpg',
    category: 'Asian',
  },
  {
    id: 'pizza',
    name: 'Margherita Pizza',
    original: '/samples/pizza-original.jpg',
    enhanced: '/samples/pizza-enhanced.jpg',
    category: 'Western',
  },
]

// Style presets - expanded for SEA market
const stylePresets = [
  // Delivery Platforms (SEA Focus)
  { id: 'grab', name: 'GrabFood', description: 'Optimized for GrabFood listings', category: 'Delivery' },
  { id: 'foodpanda', name: 'Foodpanda', description: 'Perfect for Foodpanda menus', category: 'Delivery' },
  { id: 'deliveroo', name: 'Deliveroo', description: 'Deliveroo SEA style', category: 'Delivery' },
  { id: 'gojek', name: 'GoFood', description: 'Optimized for Gojek GoFood', category: 'Delivery' },
  { id: 'shopee', name: 'ShopeeFood', description: 'ShopeeFood marketplace style', category: 'Delivery' },

  // Social Media
  { id: 'instagram', name: 'Instagram Feed', description: 'Square format, vibrant colors', category: 'Social' },
  { id: 'stories', name: 'Stories/Reels', description: '9:16 vertical format', category: 'Social' },
  { id: 'xiaohongshu', name: 'Xiaohongshu', description: 'Trendy, lifestyle-focused', category: 'Social' },
  { id: 'wechat', name: 'WeChat Moments', description: 'Clean, shareable format', category: 'Social' },
  { id: 'tiktok', name: 'TikTok', description: 'Eye-catching, scroll-stopping', category: 'Social' },

  // Restaurant Types
  { id: 'fine-dining', name: 'Fine Dining', description: 'Elegant, dark backgrounds', category: 'Style' },
  { id: 'casual', name: 'Casual Dining', description: 'Warm, inviting atmosphere', category: 'Style' },
  { id: 'fast-food', name: 'Fast Food', description: 'Bold, appetizing, high energy', category: 'Style' },
  { id: 'cafe', name: 'Cafe Style', description: 'Cozy, artisan aesthetic', category: 'Style' },
  { id: 'street-food', name: 'Street Food', description: 'Authentic hawker vibes', category: 'Style' },
  { id: 'menu', name: 'Menu Card', description: 'Clean, professional menu style', category: 'Style' },

  // Visual Styles
  { id: 'minimal', name: 'Minimal White', description: 'Clean white background', category: 'Background' },
  { id: 'rustic', name: 'Rustic Wood', description: 'Wooden table backdrop', category: 'Background' },
  { id: 'marble', name: 'Marble Surface', description: 'Elegant marble backdrop', category: 'Background' },
  { id: 'dark-moody', name: 'Dark Moody', description: 'Dramatic dark lighting', category: 'Background' },
  { id: 'bright-airy', name: 'Bright & Airy', description: 'Light and fresh feel', category: 'Background' },
  { id: 'tropical', name: 'Tropical', description: 'Bright tropical colors', category: 'Background' },
]

// Preset categories for filtering
const presetCategories = ['All', 'Delivery', 'Social', 'Style', 'Background']

export default function ExplorePage() {
  const [selectedImage, setSelectedImage] = useState(sampleImages[0])
  const [selectedPreset, setSelectedPreset] = useState(stylePresets[0])
  const [activeCategory, setActiveCategory] = useState('All')
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showEnhanced, setShowEnhanced] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Filter presets by category
  const filteredPresets = activeCategory === 'All'
    ? stylePresets
    : stylePresets.filter(p => p.category === activeCategory)

  // Handle enhancement simulation
  const handleEnhance = () => {
    setIsEnhancing(true)
    setShowEnhanced(false)

    // Simulate AI processing
    setTimeout(() => {
      setIsEnhancing(false)
      setShowEnhanced(true)
    }, 2500)
  }

  // Handle file upload
  const handleFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return

    const reader = new FileReader()
    reader.onload = (e) => {
      setUploadedImage(e.target?.result as string)
      setShowEnhanced(false)
    }
    reader.readAsDataURL(file)
  }

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileUpload(files[0])
    }
  }

  // Handle download/share (trigger signup)
  const handleDownload = () => {
    setShowSignupModal(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl">FoodSnap AI</span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-orange-500 hover:bg-orange-600">
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Try AI Food Photography
          </h1>
          <p className="text-muted-foreground text-lg">
            See how FoodSnap AI transforms your food photos. No signup required!
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr,380px] gap-8">
          {/* Left Column - Image Preview */}
          <div className="space-y-6">
            {/* Main Preview */}
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                  {/* Original/Enhanced Toggle */}
                  {showEnhanced && !uploadedImage && (
                    <div className="absolute top-4 left-4 z-10 flex bg-black/50 rounded-lg p-1">
                      <button
                        onClick={() => setShowEnhanced(false)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          !showEnhanced ? 'bg-white text-black' : 'text-white hover:bg-white/20'
                        )}
                      >
                        Original
                      </button>
                      <button
                        onClick={() => setShowEnhanced(true)}
                        className={cn(
                          'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                          showEnhanced ? 'bg-white text-black' : 'text-white hover:bg-white/20'
                        )}
                      >
                        Enhanced
                      </button>
                    </div>
                  )}

                  {/* Style Badge */}
                  {showEnhanced && (
                    <div className="absolute top-4 right-4 z-10 bg-orange-500 text-white px-3 py-1.5 rounded-full text-sm font-medium">
                      {selectedPreset.name}
                    </div>
                  )}

                  {/* Image Display */}
                  {uploadedImage ? (
                    <div className="relative w-full h-full">
                      <img
                        src={uploadedImage}
                        alt="Uploaded food"
                        className="w-full h-full object-contain"
                      />
                      {/* Watermark overlay for uploaded images */}
                      {showEnhanced && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="rotate-[-30deg] text-white/30 text-4xl font-bold tracking-widest">
                            FOODSNAP AI
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setUploadedImage(null)
                          setShowEnhanced(false)
                        }}
                        className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 p-2 rounded-full text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full">
                      {/* Sample image with before/after effect */}
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-opacity duration-500"
                        style={{
                          backgroundImage: `url(${showEnhanced ? selectedImage.enhanced : selectedImage.original})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                      {/* Placeholder for actual images */}
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-100 to-orange-200 dark:from-gray-700 dark:to-gray-800">
                        <div className="text-center p-8">
                          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center">
                            <ImageIcon className="h-12 w-12 text-orange-500" />
                          </div>
                          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                            {selectedImage.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {showEnhanced ? `Enhanced with ${selectedPreset.name}` : 'Original Photo'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhancement Loading Overlay */}
                  {isEnhancing && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                      <div className="text-center text-white">
                        <div className="relative w-16 h-16 mx-auto mb-4">
                          <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full"></div>
                          <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                          <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-orange-500" />
                        </div>
                        <p className="font-medium text-lg">Enhancing with AI...</p>
                        <p className="text-sm text-gray-300 mt-1">Applying {selectedPreset.name} style</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="p-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showEnhanced && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                          className="gap-2"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Button>
                      </>
                    )}
                  </div>

                  <Button
                    onClick={handleEnhance}
                    disabled={isEnhancing}
                    className="bg-orange-500 hover:bg-orange-600 gap-2"
                  >
                    {isEnhancing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enhancing...
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        {showEnhanced ? 'Re-enhance' : 'Enhance Photo'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Sample Image Selector */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Or try with our sample photos:
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {sampleImages.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => {
                      setSelectedImage(image)
                      setUploadedImage(null)
                      setShowEnhanced(false)
                    }}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all',
                      selectedImage.id === image.id && !uploadedImage
                        ? 'border-orange-500 ring-2 ring-orange-500/30'
                        : 'border-transparent hover:border-gray-300'
                    )}
                  >
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                      <span className="text-xs text-center text-gray-600 dark:text-gray-400 px-1">
                        {image.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Your Own */}
            <div
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer',
                dragActive
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-upload')?.click()}
            >
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              />
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <p className="font-medium">Upload your own food photo</p>
              <p className="text-sm text-muted-foreground mt-1">
                Drag & drop or click to browse (JPEG, PNG up to 10MB)
              </p>
            </div>
          </div>

          {/* Right Column - Style Presets */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-4">Choose Enhancement Style</h3>

                {/* Category Tabs */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  {presetCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={cn(
                        'px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                        activeCategory === cat
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Preset Grid */}
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {filteredPresets.map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset)
                        setShowEnhanced(false)
                      }}
                      className={cn(
                        'p-3 rounded-lg border text-left transition-all',
                        selectedPreset.id === preset.id
                          ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-1 ring-orange-500'
                          : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                      )}
                    >
                      <p className="font-medium text-sm">{preset.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {preset.description}
                      </p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA Card */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5" />
                  <span className="font-semibold">Ready to get started?</span>
                </div>
                <p className="text-sm text-orange-100 mb-4">
                  Sign up now and get 5 free credits to enhance your food photos without watermarks!
                </p>
                <Link href="/signup">
                  <Button className="w-full bg-white text-orange-600 hover:bg-orange-50">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <p className="text-xs text-center text-orange-200 mt-3">
                  No credit card required
                </p>
              </CardContent>
            </Card>

            {/* Feature Highlights */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">20+ Style Presets</p>
                  <p className="text-xs text-muted-foreground">
                    SEA delivery apps, social media, restaurants
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">AI Caption Generator</p>
                  <p className="text-xs text-muted-foreground">
                    Generate engaging captions in English & Chinese
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Direct Social Posting</p>
                  <p className="text-xs text-muted-foreground">
                    Post to Instagram, Facebook, Xiaohongshu & more
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center py-8 border-t">
          <h2 className="text-2xl font-bold mb-3">
            Transform Your Food Photography Today
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join 5,000+ restaurants using FoodSnap AI to create stunning food photos
            in seconds. Save thousands on professional photography.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 gap-2">
                <Sparkles className="h-5 w-5" />
                Get 5 Free Credits
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline">
                View Pricing
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                  <Lock className="h-5 w-5 text-orange-600" />
                </div>
                <button
                  onClick={() => setShowSignupModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <h3 className="text-xl font-bold mb-2">
                Sign Up to Download
              </h3>
              <p className="text-muted-foreground mb-6">
                Create a free account to download your enhanced photos without watermarks
                and get 5 free credits to start!
              </p>

              <div className="space-y-3">
                <Link href="/signup" className="block">
                  <Button className="w-full bg-orange-500 hover:bg-orange-600">
                    Create Free Account
                  </Button>
                </Link>
                <Link href="/login" className="block">
                  <Button variant="outline" className="w-full">
                    Already have an account? Sign In
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground mt-4">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t py-8 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; 2024 FoodSnap AI. All rights reserved.</p>
          <div className="flex items-center justify-center gap-4 mt-2">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
