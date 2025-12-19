/**
 * Camera Angle Detection for Food Photography
 *
 * Detects the camera angle of food photos to enable angle-aware style enhancements.
 * This ensures physically realistic enhancements (e.g., no vertical backgrounds for overhead shots).
 *
 * Angles:
 * - overhead (80-90°): Only table surface visible, no vertical elements
 * - hero (30-60°): Table surface + soft background blur
 * - eye-level (0-30°): Full vertical background visible
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

export type CameraAngle = 'overhead' | 'hero' | 'eye-level' | 'unknown'

// Fast timeout for angle detection (6 seconds max)
// This ensures the main enhancement flow isn't blocked
const ANGLE_DETECTION_TIMEOUT_MS = 6000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`TIMEOUT: ${errorMessage}`)), timeoutMs)
    )
  ])
}

export interface AngleAnalysis {
  detectedAngle: CameraAngle
  confidence: number // 0-1
  reasoning: string
  characteristics: string[]
}

// Lazy initialization of Google AI client
let genAI: GoogleGenerativeAI | null = null

function getGoogleAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      throw new Error('Google AI API key is not configured')
    }
    genAI = new GoogleGenerativeAI(apiKey)
  }
  return genAI
}

/**
 * Detect the camera angle of a food photograph
 * Uses Gemini Flash for fast, cost-effective vision analysis
 *
 * @param imageBase64 - Base64 encoded image data
 * @param mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns AngleAnalysis with detected angle and confidence
 */
export async function detectCameraAngle(
  imageBase64: string,
  mimeType: string = 'image/jpeg'
): Promise<AngleAnalysis> {
  try {
    // Use Gemini 2.0 Flash (stable GA) for fast, cheap vision analysis
    // Note: Changed from 'gemini-2.0-flash-exp' (experimental) to stable version
    const model = getGoogleAI().getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.1, // Low temperature for consistent analysis
        maxOutputTokens: 256,
      }
    })

    const analysisPrompt = `Analyze this food photograph's camera angle. Respond in JSON format ONLY (no markdown):

{
  "angle": "overhead" | "hero" | "eye-level",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation",
  "characteristics": ["list", "of", "visual", "cues"]
}

ANGLE DEFINITIONS:

OVERHEAD (80-90 degrees - looking straight down):
- Camera is directly above the food, pointing down
- Only the TABLE SURFACE is visible
- Plates appear as circles (not ellipses)
- NO vertical background elements visible (no walls, stalls, shelves)
- Common for flat lays, pizzas, spreads

HERO (30-60 degrees - the "hero" angle):
- Camera is at roughly 45 degrees
- Shows food depth/height
- Table surface visible + soft blurred background
- Plates appear as ellipses
- Most common food photography angle

EYE-LEVEL (0-30 degrees - straight on):
- Camera is at food level, pointing horizontally
- Full vertical background visible behind food
- Shows the "face" of stacked items (burgers, cakes)
- Table edge may not be visible
- Background environment clearly visible

Analyze the geometry (plate shape, visible surfaces, background presence) and respond with JSON only.`

    // Wrap API call with fast timeout to prevent blocking main enhancement
    const result = await withTimeout(
      model.generateContent([
        {
          inlineData: {
            mimeType,
            data: imageBase64
          }
        },
        { text: analysisPrompt }
      ]),
      ANGLE_DETECTION_TIMEOUT_MS,
      `Angle detection exceeded ${ANGLE_DETECTION_TIMEOUT_MS / 1000}s limit`
    )

    const response = await result.response
    const text = response.text()

    // Parse JSON response (handle potential markdown wrapping)
    let jsonText = text.trim()
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7)
    }
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3)
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3)
    }
    jsonText = jsonText.trim()

    const analysis = JSON.parse(jsonText)

    return {
      detectedAngle: validateAngle(analysis.angle),
      confidence: Math.min(1, Math.max(0, parseFloat(analysis.confidence) || 0.5)),
      reasoning: analysis.reasoning || 'Analysis completed',
      characteristics: Array.isArray(analysis.characteristics) ? analysis.characteristics : []
    }
  } catch (error) {
    console.error('[AngleDetector] Detection failed:', error)

    // Return safe default - 'hero' is the most versatile angle
    return {
      detectedAngle: 'hero',
      confidence: 0.3,
      reasoning: 'Detection failed, using default hero angle',
      characteristics: ['fallback']
    }
  }
}

/**
 * Validate and normalize angle value
 */
function validateAngle(angle: string): CameraAngle {
  const normalized = String(angle).toLowerCase().trim()

  if (normalized === 'overhead' || normalized === 'flat-lay' || normalized === 'top-down') {
    return 'overhead'
  }
  if (normalized === 'hero' || normalized === '45-degree' || normalized === '45' || normalized === 'three-quarter') {
    return 'hero'
  }
  if (normalized === 'eye-level' || normalized === 'straight-on' || normalized === 'eye level') {
    return 'eye-level'
  }

  return 'hero' // Default to most versatile angle
}

/**
 * Get human-readable description of angle
 */
export function getAngleDescription(angle: CameraAngle): string {
  switch (angle) {
    case 'overhead':
      return 'Overhead (90°) - flat lay, table surface only'
    case 'hero':
      return 'Hero angle (45°) - shows depth with soft background'
    case 'eye-level':
      return 'Eye level (0°) - full background visible'
    default:
      return 'Unknown angle'
  }
}

/**
 * Get physical constraints for angle (what can/cannot be visible)
 */
export function getAngleConstraints(angle: CameraAngle): {
  canShow: string[]
  cannotShow: string[]
} {
  switch (angle) {
    case 'overhead':
      return {
        canShow: [
          'Table/surface texture',
          'Props laid flat on table',
          'Plate from above (circular)',
          'Napkins, cutlery on surface',
          'Scattered ingredients',
          'Sauce dishes on table'
        ],
        cannotShow: [
          'Vertical backgrounds (walls, stalls, shelves)',
          'Standing people or crowds',
          'Signage or menus on walls',
          'Environment behind the dish',
          'Anything requiring vertical height'
        ]
      }
    case 'hero':
      return {
        canShow: [
          'Table surface',
          'Soft blurred background',
          'Food height and depth',
          'Props on and near table',
          'Gentle bokeh hints of environment'
        ],
        cannotShow: [
          'Sharp detailed backgrounds',
          'Readable text/signage',
          'Clear environmental features',
          'Detailed people or crowds'
        ]
      }
    case 'eye-level':
      return {
        canShow: [
          'Full vertical background',
          'Environment/venue details',
          'Stalls, walls, decor',
          'Atmospheric elements',
          'Steam rising vertically',
          'Standing props'
        ],
        cannotShow: [
          'Elements that contradict the existing background',
          'Physics-defying placements'
        ]
      }
    default:
      return {
        canShow: ['Standard food photography elements'],
        cannotShow: ['Physics-breaking elements']
      }
  }
}
