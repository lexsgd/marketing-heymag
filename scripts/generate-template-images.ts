/**
 * Template Image Generation Script
 *
 * Generates AI food photos for all template categories using:
 * - Gemini 3 Pro Image (Nano Banana Pro)
 * - Real-ESRGAN 2x upscaling to 2048x2048
 * - Supabase Storage
 *
 * Usage: npx ts-node scripts/generate-template-images.ts
 * Or: npm run generate-templates
 */

import * as fs from 'fs'
import * as path from 'path'

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'https://marketing.heymag.app'
const DELAY_BETWEEN_IMAGES = 5000 // 5 seconds between generations to avoid rate limits

// Categories and their specific food items for variety
const CATEGORY_CONFIGS = {
  'delivery': {
    count: 8,
    items: [
      'Fresh poke bowl with salmon, avocado, edamame, and sesame',
      'Colorful acai bowl with granola and fresh berries',
      'Asian grain bowl with teriyaki chicken and vegetables',
      'Mediterranean wrap bowl with hummus and falafel',
      'Sushi burrito with fresh tuna and crispy tempura',
      'Buddha bowl with quinoa, roasted chickpeas, and tahini',
      'Thai basil chicken rice bowl with fried egg',
      'Korean bibimbap with beef and gochujang sauce'
    ]
  },
  'restaurant': {
    count: 8,
    items: [
      'Pan-seared salmon with crispy skin and lemon butter sauce',
      'Avocado toast with poached egg and microgreens',
      'Wagyu beef burger with truffle aioli and brioche bun',
      'Grilled lobster tail with garlic herb butter',
      'Mushroom risotto with parmesan and truffle oil',
      'Lamb chops with rosemary and mint sauce',
      'Duck breast with orange glaze and roasted vegetables',
      'Seafood linguine with fresh clams and white wine sauce'
    ]
  },
  'fine-dining': {
    count: 8,
    items: [
      'Seared duck breast with cherry reduction and micro herbs',
      'Beef tenderloin medallion with foie gras and truffle',
      'Scallop with cauliflower puree and caviar',
      'Venison loin with blackberry jus and root vegetables',
      'Lobster tail with champagne foam and gold leaf',
      'Wagyu tataki with ponzu pearls and shiso',
      'Turbot fillet with saffron beurre blanc',
      'Deconstructed tiramisu with espresso gel'
    ]
  },
  'cafe': {
    count: 8,
    items: [
      'Artisan croissant with visible flaky golden layers',
      'Matcha latte with beautiful foam art in ceramic cup',
      'French éclair with chocolate glaze and gold dust',
      'Avocado toast with cherry tomatoes on sourdough',
      'Berry tart with vanilla custard and fresh fruits',
      'Cinnamon roll with cream cheese frosting',
      'Cappuccino with rosetta latte art',
      'Eggs Benedict with hollandaise on English muffin'
    ]
  },
  'christmas': {
    count: 4,
    items: [
      'Glazed Christmas ham with honey and cloves',
      'Decorated gingerbread cookies with royal icing',
      'Yule log cake (Bûche de Noël) with chocolate ganache',
      'Hot chocolate with whipped cream and cinnamon sticks'
    ]
  },
  'chinese-new-year': {
    count: 4,
    items: [
      'Yu Sheng prosperity toss salad with salmon',
      'Steamed whole fish with ginger and scallion',
      'Golden pineapple tarts (nastar cookies)',
      'Chinese dumplings arranged in lucky pattern'
    ]
  }
}

interface GeneratedImage {
  category: string
  index: number
  item: string
  imageId: string
  originalUrl: string
  webUrl: string
  thumbUrl: string
  timestamp: string
}

interface GenerationResult {
  success: boolean
  category: string
  images?: {
    original: { url: string }
    web: { url: string }
    thumb: { url: string }
    imageId: string
  }
  error?: string
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateImage(category: string, customPrompt: string): Promise<GenerationResult> {
  try {
    console.log(`  → Calling API for: ${customPrompt.substring(0, 50)}...`)

    const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        category,
        customPrompt: `Generate this specific food item: ${customPrompt}. Make it look absolutely stunning and appetizing.`
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()

    if (result.success && result.images) {
      console.log(`  ✓ Generated: ${result.images.imageId}`)
      return {
        success: true,
        category,
        images: result.images
      }
    } else {
      throw new Error(result.error || 'No image generated')
    }
  } catch (error) {
    console.error(`  ✗ Failed:`, (error as Error).message)
    return {
      success: false,
      category,
      error: (error as Error).message
    }
  }
}

async function generateCategoryImages(
  category: string,
  config: { count: number; items: string[] }
): Promise<GeneratedImage[]> {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`Generating ${config.count} images for: ${category.toUpperCase()}`)
  console.log(`${'═'.repeat(60)}`)

  const results: GeneratedImage[] = []

  for (let i = 0; i < config.count; i++) {
    const item = config.items[i] || config.items[i % config.items.length]
    console.log(`\n[${i + 1}/${config.count}] ${item}`)

    const result = await generateImage(category, item)

    if (result.success && result.images) {
      results.push({
        category,
        index: i,
        item,
        imageId: result.images.imageId,
        originalUrl: result.images.original.url,
        webUrl: result.images.web.url,
        thumbUrl: result.images.thumb.url,
        timestamp: new Date().toISOString()
      })
    }

    // Wait between generations to avoid rate limits
    if (i < config.count - 1) {
      console.log(`  ⏳ Waiting ${DELAY_BETWEEN_IMAGES / 1000}s before next...`)
      await sleep(DELAY_BETWEEN_IMAGES)
    }
  }

  console.log(`\n✓ Completed ${category}: ${results.length}/${config.count} successful`)
  return results
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║     TEMPLATE IMAGE GENERATION SCRIPT                         ║')
  console.log('║     Using Gemini 3 Pro Image + Real-ESRGAN                   ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')
  console.log(`\nAPI Base URL: ${API_BASE_URL}`)
  console.log(`Start Time: ${new Date().toISOString()}\n`)

  const allResults: Record<string, GeneratedImage[]> = {}

  // Generate images for each category
  for (const [category, config] of Object.entries(CATEGORY_CONFIGS)) {
    allResults[category] = await generateCategoryImages(category, config)
  }

  // Summary
  console.log('\n\n')
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║                    GENERATION SUMMARY                        ║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  let totalGenerated = 0
  let totalExpected = 0

  for (const [category, images] of Object.entries(allResults)) {
    const config = CATEGORY_CONFIGS[category as keyof typeof CATEGORY_CONFIGS]
    console.log(`\n${category.toUpperCase()}: ${images.length}/${config.count}`)
    totalGenerated += images.length
    totalExpected += config.count

    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.imageId} - ${img.item.substring(0, 40)}...`)
    })
  }

  console.log(`\n${'─'.repeat(60)}`)
  console.log(`TOTAL: ${totalGenerated}/${totalExpected} images generated`)
  console.log(`End Time: ${new Date().toISOString()}`)

  // Save results to JSON file
  const outputPath = path.join(process.cwd(), 'data', 'generated-templates.json')
  const outputDir = path.dirname(outputPath)

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(outputPath, JSON.stringify(allResults, null, 2))
  console.log(`\n✓ Results saved to: ${outputPath}`)

  // Generate TypeScript data file for import
  const tsOutputPath = path.join(process.cwd(), 'lib', 'generated-template-data.ts')
  const tsContent = `/**
 * Auto-generated template image data
 * Generated: ${new Date().toISOString()}
 *
 * DO NOT EDIT MANUALLY - Run 'npm run generate-templates' to regenerate
 */

export interface TemplateImage {
  id: string
  category: string
  name: string
  thumbUrl: string
  webUrl: string
  originalUrl: string
}

${Object.entries(allResults).map(([category, images]) => `
export const ${category.replace(/-/g, '')}Templates: TemplateImage[] = [
${images.map((img, i) => `  {
    id: '${img.imageId}',
    category: '${category}',
    name: '${img.item.replace(/'/g, "\\'")}',
    thumbUrl: '${img.thumbUrl}',
    webUrl: '${img.webUrl}',
    originalUrl: '${img.originalUrl}'
  }`).join(',\n')}
]`).join('\n')}

export const allGeneratedTemplates = {
${Object.keys(allResults).map(cat => `  '${cat}': ${cat.replace(/-/g, '')}Templates`).join(',\n')}
}

export const templateStats = {
  generatedAt: '${new Date().toISOString()}',
  totalImages: ${totalGenerated},
  categories: ${JSON.stringify(Object.keys(allResults))}
}
`

  fs.writeFileSync(tsOutputPath, tsContent)
  console.log(`✓ TypeScript data saved to: ${tsOutputPath}`)
}

// Run the script
main().catch(console.error)
