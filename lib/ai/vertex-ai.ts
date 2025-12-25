/**
 * Vertex AI Client for Imagen 3 Editing
 *
 * This client handles authentication with Google Cloud service accounts
 * and provides access to Imagen 3's editing capabilities (inpainting, outpainting)
 *
 * Required env vars:
 * - GOOGLE_VERTEX_AI_PROJECT_ID: Google Cloud project ID
 * - GOOGLE_VERTEX_AI_CREDENTIALS: Base64-encoded service account JSON
 */

import { GoogleAuth } from 'google-auth-library'

// Vertex AI configuration
const VERTEX_AI_REGION = 'us-central1'
const IMAGEN_EDIT_MODEL = 'imagen-3.0-capability-001'

interface VertexAICredentials {
  type: string
  project_id: string
  private_key_id: string
  private_key: string
  client_email: string
  client_id: string
  auth_uri: string
  token_uri: string
  auth_provider_x509_cert_url: string
  client_x509_cert_url: string
}

// Reference image entry for raw image
interface RawReferenceImage {
  referenceType: 'REFERENCE_TYPE_RAW'
  referenceId: number
  referenceImage: {
    bytesBase64Encoded: string
  }
}

// Reference image entry for mask (auto-generated - no image data)
interface MaskReferenceImage {
  referenceType: 'REFERENCE_TYPE_MASK'
  referenceId: number
  maskImageConfig: {
    maskMode: string
    dilation?: number
  }
}

interface ImagenEditRequest {
  instances: {
    prompt: string
    referenceImages: (RawReferenceImage | MaskReferenceImage)[]
  }[]
  parameters: {
    editMode: string
    editConfig?: {
      baseSteps: number
    }
    sampleCount: number
    aspectRatio?: string
    personGeneration?: string
    outputOptions?: {
      mimeType: string
    }
  }
}

interface ImagenEditResponse {
  predictions: {
    bytesBase64Encoded?: string
    mimeType?: string
  }[]
}

// Lazy-initialized auth client
let authClient: GoogleAuth | null = null

/**
 * Get authenticated Google Auth client using service account credentials
 */
function getAuthClient(): GoogleAuth {
  if (authClient) return authClient

  console.log('[Vertex AI] Initializing auth client...')

  // Get credentials from environment variable
  const credentialsBase64 = process.env.GOOGLE_VERTEX_AI_CREDENTIALS

  if (!credentialsBase64) {
    console.error('[Vertex AI] GOOGLE_VERTEX_AI_CREDENTIALS not set')
    throw new Error('GOOGLE_VERTEX_AI_CREDENTIALS environment variable is not set')
  }

  console.log('[Vertex AI] Credentials base64 length:', credentialsBase64.length)

  // Decode base64 credentials
  let credentials: VertexAICredentials
  try {
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
    credentials = JSON.parse(credentialsJson)
    console.log('[Vertex AI] Credentials parsed successfully', {
      project_id: credentials.project_id,
      client_email: credentials.client_email?.substring(0, 20) + '...',
      has_private_key: !!credentials.private_key,
      private_key_length: credentials.private_key?.length || 0,
    })
  } catch (error) {
    console.error('[Vertex AI] Failed to parse credentials:', error)
    throw new Error('Failed to parse GOOGLE_VERTEX_AI_CREDENTIALS: Invalid base64 or JSON')
  }

  // Create auth client with service account
  authClient = new GoogleAuth({
    credentials: {
      client_email: credentials.client_email,
      private_key: credentials.private_key,
    },
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    projectId: credentials.project_id,
  })

  console.log('[Vertex AI] Auth client created successfully')
  return authClient
}

/**
 * Get access token for Vertex AI API
 */
async function getAccessToken(): Promise<string> {
  console.log('[Vertex AI] Getting access token...')

  try {
    const auth = getAuthClient()
    console.log('[Vertex AI] Got auth client, getting OAuth client...')

    const client = await auth.getClient()
    console.log('[Vertex AI] Got OAuth client, requesting access token...')

    const tokenResponse = await client.getAccessToken()
    console.log('[Vertex AI] Token response received:', {
      hasToken: !!tokenResponse.token,
      tokenLength: tokenResponse.token?.length || 0,
    })

    if (!tokenResponse.token) {
      throw new Error('Failed to get access token from Google Auth - token is empty')
    }

    console.log('[Vertex AI] Access token acquired successfully')
    return tokenResponse.token
  } catch (error) {
    console.error('[Vertex AI] Failed to get access token:', error)
    throw error
  }
}

/**
 * Get project ID from credentials
 */
function getProjectId(): string {
  const credentialsBase64 = process.env.GOOGLE_VERTEX_AI_CREDENTIALS

  if (!credentialsBase64) {
    throw new Error('GOOGLE_VERTEX_AI_CREDENTIALS environment variable is not set')
  }

  try {
    const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8')
    const credentials = JSON.parse(credentialsJson) as VertexAICredentials
    return credentials.project_id
  } catch {
    throw new Error('Failed to extract project_id from credentials')
  }
}

/**
 * Edit an image using Vertex AI Imagen 3 with mask-based inpainting
 *
 * @param imageBase64 - Base64 encoded image to edit
 * @param prompt - What to add/change in the image
 * @param options - Edit options
 * @returns Base64 encoded edited image
 */
export async function editImageWithVertexAI(
  imageBase64: string,
  prompt: string,
  options: {
    editMode?: 'inpaint_insertion' | 'inpaint_removal' | 'outpaint'
    maskMode?: 'background' | 'foreground' | 'semantic'
    aspectRatio?: string
    baseSteps?: number
  } = {}
): Promise<{ imageBase64: string; mimeType: string }> {
  const projectId = getProjectId()
  const accessToken = await getAccessToken()

  // Build the API endpoint
  const endpoint = `https://${VERTEX_AI_REGION}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${VERTEX_AI_REGION}/publishers/google/models/${IMAGEN_EDIT_MODEL}:predict`

  // Map edit mode to API format
  const editModeMap: Record<string, string> = {
    'inpaint_insertion': 'EDIT_MODE_INPAINT_INSERTION',
    'inpaint_removal': 'EDIT_MODE_INPAINT_REMOVAL',
    'outpaint': 'EDIT_MODE_OUTPAINT',
  }

  // Map mask mode to API format
  const maskModeMap: Record<string, string> = {
    'background': 'MASK_MODE_BACKGROUND',
    'foreground': 'MASK_MODE_FOREGROUND',
    'semantic': 'MASK_MODE_SEMANTIC',
  }

  const editMode = editModeMap[options.editMode || 'inpaint_insertion'] || 'EDIT_MODE_INPAINT_INSERTION'
  const maskMode = maskModeMap[options.maskMode || 'background'] || 'MASK_MODE_BACKGROUND'

  // Default baseSteps: 35 for insertion, 12 for removal (per Google docs)
  const baseSteps = options.baseSteps || (options.editMode === 'inpaint_removal' ? 12 : 35)

  // Build reference images array per Google documentation:
  // 1. Raw image with REFERENCE_TYPE_RAW
  // 2. Mask config with REFERENCE_TYPE_MASK (auto-generated mask, no image data)
  const referenceImages: (RawReferenceImage | MaskReferenceImage)[] = [
    {
      referenceType: 'REFERENCE_TYPE_RAW',
      referenceId: 1,
      referenceImage: {
        bytesBase64Encoded: imageBase64,
      },
    },
    {
      referenceType: 'REFERENCE_TYPE_MASK',
      referenceId: 2,
      maskImageConfig: {
        maskMode: maskMode,
        dilation: 0.01, // Recommended value for insertion
      },
    },
  ]

  // Build the request body per Google Vertex AI documentation
  const requestBody: ImagenEditRequest = {
    instances: [{
      prompt: prompt,
      referenceImages: referenceImages,
    }],
    parameters: {
      editMode: editMode,
      editConfig: {
        baseSteps: baseSteps,
      },
      sampleCount: 1,
      outputOptions: {
        mimeType: 'image/png',
      },
    },
  }

  console.log('[Vertex AI] Calling Imagen edit API', {
    projectId,
    editMode,
    maskMode,
    baseSteps,
    promptPreview: prompt.substring(0, 100),
    requestStructure: JSON.stringify(requestBody, null, 2).substring(0, 500),
  })

  // Make the API call
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[Vertex AI] API error', { status: response.status, error: errorText })

    // Parse error for user-friendly messages
    if (response.status === 403 && errorText.includes('BILLING_DISABLED')) {
      throw new Error('Google Cloud billing not enabled. Please enable billing in Google Cloud Console for project "zazzles" to use this feature.')
    }

    throw new Error(`Vertex AI API error: ${response.status} - ${errorText}`)
  }

  const result = await response.json() as ImagenEditResponse

  if (!result.predictions || result.predictions.length === 0) {
    throw new Error('No predictions returned from Vertex AI')
  }

  const prediction = result.predictions[0]

  if (!prediction.bytesBase64Encoded) {
    throw new Error('No image data in Vertex AI response')
  }

  console.log('[Vertex AI] Edit successful', {
    mimeType: prediction.mimeType || 'image/png',
  })

  return {
    imageBase64: prediction.bytesBase64Encoded,
    mimeType: prediction.mimeType || 'image/png',
  }
}

/**
 * Add props/objects to a food photo while preserving the original
 * Uses MASK_MODE_BACKGROUND to auto-detect where to place new objects
 *
 * @param imageBase64 - Base64 encoded food photo
 * @param propsPrompt - Description of props to add (e.g., "chopsticks and red chilies")
 * @returns Edited image with props added
 */
export async function addPropsToFoodPhoto(
  imageBase64: string,
  propsPrompt: string,
  options: {
    aspectRatio?: string
  } = {}
): Promise<{ imageBase64: string; mimeType: string }> {
  // Build a specific prompt for adding props to food photography
  const enhancedPrompt = `Add ${propsPrompt} to this food photograph.

CRITICAL REQUIREMENTS:
- Place the new items naturally on the table/surface around the food
- Match the existing lighting, shadows, and color grading perfectly
- Do NOT modify the food itself - it must remain exactly as is
- New items should look like they belong in the same photo session
- Maintain professional food photography quality`

  return editImageWithVertexAI(imageBase64, enhancedPrompt, {
    editMode: 'inpaint_insertion',
    maskMode: 'background',
    aspectRatio: options.aspectRatio,
  })
}

/**
 * Expand the canvas/background of an image (outpainting)
 * Useful for tight crops that need more space for props
 *
 * @param imageBase64 - Base64 encoded image
 * @param prompt - Description of the expanded scene
 * @param targetAspectRatio - New aspect ratio (e.g., "16:9" to widen)
 * @returns Expanded image
 */
export async function expandImageCanvas(
  imageBase64: string,
  prompt: string,
  targetAspectRatio: string = '1:1'
): Promise<{ imageBase64: string; mimeType: string }> {
  const expandPrompt = `Expand this food photograph to show more of the scene.

REQUIREMENTS:
- Extend the background/table surface naturally
- Match the existing background color, texture, and lighting exactly
- The original food and any existing elements must remain unchanged
- The expansion should look seamless and natural
- Maintain the same studio/setting style

SCENE DESCRIPTION:
${prompt}`

  return editImageWithVertexAI(imageBase64, expandPrompt, {
    editMode: 'outpaint',
    aspectRatio: targetAspectRatio,
  })
}

/**
 * Check if Vertex AI credentials are properly configured
 */
export function isVertexAIConfigured(): boolean {
  try {
    const credentials = process.env.GOOGLE_VERTEX_AI_CREDENTIALS
    if (!credentials) return false

    // Try to parse credentials
    const json = Buffer.from(credentials, 'base64').toString('utf-8')
    const parsed = JSON.parse(json)

    return !!(parsed.project_id && parsed.private_key && parsed.client_email)
  } catch {
    return false
  }
}
