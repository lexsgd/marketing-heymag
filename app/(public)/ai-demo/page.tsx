'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, ChefHat, Truck, Utensils, Coffee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const categories = [
  {
    id: 'delivery',
    name: 'Delivery & Takeout',
    icon: Truck,
    description: 'Professional delivery app style photos',
    color: 'bg-green-500'
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: Utensils,
    description: 'Casual dining menu quality',
    color: 'bg-orange-500'
  },
  {
    id: 'fine-dining',
    name: 'Fine Dining',
    icon: ChefHat,
    description: 'Michelin-star editorial quality',
    color: 'bg-purple-500'
  },
  {
    id: 'cafe',
    name: 'Cafe & Coffee',
    icon: Coffee,
    description: 'Cozy cafe aesthetic',
    color: 'bg-amber-500'
  },
]

export default function AIDemoPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [textResponse, setTextResponse] = useState<string | null>(null)

  const generateImage = async (category: string) => {
    setIsGenerating(true)
    setSelectedCategory(category)
    setError(null)
    setGeneratedImage(null)
    setTextResponse(null)

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ category }),
      })

      const data = await response.json()

      if (data.success && data.imageDataUrl) {
        setGeneratedImage(data.imageDataUrl)
        setTextResponse(data.textResponse)
      } else {
        setError(data.message || data.error || 'Failed to generate image')
        setTextResponse(data.textResponse)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <Badge variant="secondary" className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            AI Demo
          </Badge>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                AI Food Photo Generator
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Generate professional food photography using AI. Select a category below to create a stunning food photo instantly.
            </p>
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {categories.map((cat) => (
              <Card
                key={cat.id}
                className={`cursor-pointer transition-all hover:scale-105 hover:shadow-lg ${
                  selectedCategory === cat.id ? 'ring-2 ring-orange-500' : ''
                } ${isGenerating ? 'opacity-50 pointer-events-none' : ''}`}
                onClick={() => generateImage(cat.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 rounded-full ${cat.color} mx-auto mb-3 flex items-center justify-center`}>
                    <cat.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{cat.name}</h3>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Result Area */}
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Generated Image</CardTitle>
              <CardDescription>
                {isGenerating
                  ? 'Generating your AI food photo...'
                  : generatedImage
                  ? `${categories.find(c => c.id === selectedCategory)?.name} style photo`
                  : 'Select a category above to generate a photo'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-square bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {isGenerating ? (
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-muted-foreground">Creating your masterpiece...</p>
                    <p className="text-sm text-muted-foreground mt-2">This may take 10-30 seconds</p>
                  </div>
                ) : generatedImage ? (
                  <Image
                    src={generatedImage}
                    alt="AI Generated Food Photo"
                    width={800}
                    height={800}
                    className="w-full h-full object-cover"
                  />
                ) : error ? (
                  <div className="text-center p-8">
                    <p className="text-red-500 mb-4">{error}</p>
                    {textResponse && (
                      <div className="bg-muted p-4 rounded-lg text-left text-sm max-h-48 overflow-y-auto">
                        <p className="font-medium mb-2">AI Response:</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{textResponse}</p>
                      </div>
                    )}
                    <Button
                      onClick={() => selectedCategory && generateImage(selectedCategory)}
                      className="mt-4 bg-orange-500 hover:bg-orange-600"
                    >
                      Try Again
                    </Button>
                  </div>
                ) : (
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Click a category to generate a food photo
                    </p>
                  </div>
                )}
              </div>

              {generatedImage && (
                <div className="mt-4 flex gap-2 justify-center">
                  <Button
                    variant="outline"
                    onClick={() => selectedCategory && generateImage(selectedCategory)}
                    disabled={isGenerating}
                  >
                    Regenerate
                  </Button>
                  <Button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = generatedImage
                      link.download = `zazzles-${selectedCategory}-${Date.now()}.png`
                      link.click()
                    }}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Download Image
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Note */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Images are generated using Google Gemini AI. Quality and style may vary.
            <br />
            For production use, we recommend using AI-enhanced photos of your actual food.
          </p>
        </div>
      </main>
    </div>
  )
}
