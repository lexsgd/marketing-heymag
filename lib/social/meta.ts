/**
 * Meta Graph API Client
 *
 * Handles Facebook and Instagram integration via Meta's Graph API.
 * Both platforms use the same API, making this a unified integration.
 */

const GRAPH_API_VERSION = 'v22.0'
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// Required OAuth scopes for Facebook Pages + Instagram publishing
export const META_OAUTH_SCOPES = [
  'pages_show_list', // List user's Facebook Pages
  'pages_read_engagement', // Read Page content
  'pages_manage_posts', // Post to Facebook Pages
  'instagram_basic', // Access Instagram account info
  'instagram_content_publish', // Post to Instagram
  'business_management', // Manage business assets
].join(',')

export interface MetaTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
  error?: {
    message: string
    type: string
    code: number
  }
}

export interface FacebookPage {
  id: string
  name: string
  access_token: string
  category?: string
  instagram_business_account?: {
    id: string
  }
}

export interface InstagramAccount {
  id: string
  username: string
  name?: string
  profile_picture_url?: string
}

export interface PostResult {
  success: boolean
  postId?: string
  error?: string
}

/**
 * Generate the Meta OAuth authorization URL
 */
export function getMetaAuthUrl(
  appId: string,
  redirectUri: string,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: META_OAUTH_SCOPES,
    state,
    response_type: 'code',
  })

  return `https://www.facebook.com/${GRAPH_API_VERSION}/dialog/oauth?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  appId: string,
  appSecret: string,
  redirectUri: string
): Promise<MetaTokenResponse> {
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)
  return response.json()
}

/**
 * Exchange short-lived token for long-lived token (60 days)
 */
export async function getLongLivedToken(
  shortLivedToken: string,
  appId: string,
  appSecret: string
): Promise<MetaTokenResponse> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortLivedToken,
  })

  const response = await fetch(`${GRAPH_API_BASE}/oauth/access_token?${params.toString()}`)
  return response.json()
}

/**
 * Get user's Facebook Pages
 */
export async function getUserPages(accessToken: string): Promise<FacebookPage[]> {
  const response = await fetch(
    `${GRAPH_API_BASE}/me/accounts?fields=id,name,access_token,category,instagram_business_account&access_token=${accessToken}`
  )
  const data = await response.json()

  if (data.error) {
    console.error('[Meta API] Error fetching pages:', data.error)
    return []
  }

  return data.data || []
}

/**
 * Get Instagram account details
 */
export async function getInstagramAccount(
  igUserId: string,
  pageAccessToken: string
): Promise<InstagramAccount | null> {
  const response = await fetch(
    `${GRAPH_API_BASE}/${igUserId}?fields=username,name,profile_picture_url&access_token=${pageAccessToken}`
  )
  const data = await response.json()

  if (data.error) {
    console.error('[Meta API] Error fetching Instagram account:', data.error)
    return null
  }

  return data
}

/**
 * Post to a Facebook Page
 */
export async function postToFacebook(
  pageId: string,
  pageAccessToken: string,
  message: string,
  imageUrl?: string
): Promise<PostResult> {
  try {
    let endpoint = `${GRAPH_API_BASE}/${pageId}/feed`
    const body: Record<string, string> = {
      message,
      access_token: pageAccessToken,
    }

    // If posting with image, use /photos endpoint
    if (imageUrl) {
      endpoint = `${GRAPH_API_BASE}/${pageId}/photos`
      body.url = imageUrl
      body.caption = message
      delete body.message
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(body),
    })

    const data = await response.json()

    if (data.error) {
      console.error('[Meta API] Facebook post error:', data.error)
      return { success: false, error: data.error.message }
    }

    return { success: true, postId: data.id || data.post_id }
  } catch (error) {
    console.error('[Meta API] Facebook post exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Post to Instagram (two-step process: create container, then publish)
 */
export async function postToInstagram(
  igUserId: string,
  pageAccessToken: string,
  caption: string,
  imageUrl: string
): Promise<PostResult> {
  try {
    // Step 1: Create media container
    const containerResponse = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: pageAccessToken,
      }),
    })

    const containerData = await containerResponse.json()

    if (containerData.error) {
      console.error('[Meta API] Instagram container error:', containerData.error)
      return { success: false, error: containerData.error.message }
    }

    const containerId = containerData.id

    // Step 2: Wait for container to be ready (poll status)
    let status = 'IN_PROGRESS'
    let attempts = 0
    const maxAttempts = 30 // 30 seconds max wait

    while (status === 'IN_PROGRESS' && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const statusResponse = await fetch(
        `${GRAPH_API_BASE}/${containerId}?fields=status_code&access_token=${pageAccessToken}`
      )
      const statusData = await statusResponse.json()

      if (statusData.error) {
        return { success: false, error: statusData.error.message }
      }

      status = statusData.status_code || 'FINISHED'
      attempts++
    }

    if (status === 'ERROR') {
      return { success: false, error: 'Media processing failed' }
    }

    if (status === 'IN_PROGRESS') {
      return { success: false, error: 'Media processing timed out' }
    }

    // Step 3: Publish the container
    const publishResponse = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: pageAccessToken,
      }),
    })

    const publishData = await publishResponse.json()

    if (publishData.error) {
      console.error('[Meta API] Instagram publish error:', publishData.error)
      return { success: false, error: publishData.error.message }
    }

    return { success: true, postId: publishData.id }
  } catch (error) {
    console.error('[Meta API] Instagram post exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Post a carousel to Instagram (multiple images)
 */
export async function postCarouselToInstagram(
  igUserId: string,
  pageAccessToken: string,
  caption: string,
  imageUrls: string[]
): Promise<PostResult> {
  try {
    if (imageUrls.length < 2 || imageUrls.length > 10) {
      return { success: false, error: 'Carousel requires 2-10 images' }
    }

    // Step 1: Create containers for each image
    const containerIds: string[] = []

    for (const imageUrl of imageUrls) {
      const response = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          image_url: imageUrl,
          is_carousel_item: 'true',
          access_token: pageAccessToken,
        }),
      })

      const data = await response.json()
      if (data.error) {
        return { success: false, error: `Failed to create carousel item: ${data.error.message}` }
      }
      containerIds.push(data.id)
    }

    // Wait for all containers to be ready
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Step 2: Create carousel container
    const carouselResponse = await fetch(`${GRAPH_API_BASE}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        media_type: 'CAROUSEL',
        children: containerIds.join(','),
        caption,
        access_token: pageAccessToken,
      }),
    })

    const carouselData = await carouselResponse.json()
    if (carouselData.error) {
      return { success: false, error: carouselData.error.message }
    }

    // Wait for carousel to be ready
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Step 3: Publish carousel
    const publishResponse = await fetch(`${GRAPH_API_BASE}/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: carouselData.id,
        access_token: pageAccessToken,
      }),
    })

    const publishData = await publishResponse.json()
    if (publishData.error) {
      return { success: false, error: publishData.error.message }
    }

    return { success: true, postId: publishData.id }
  } catch (error) {
    console.error('[Meta API] Carousel post exception:', error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Validate image URL meets Meta requirements
 */
export function validateImageUrl(url: string): { valid: boolean; error?: string } {
  // Must be HTTPS
  if (!url.startsWith('https://')) {
    return { valid: false, error: 'Image URL must use HTTPS' }
  }

  // Must be accessible (we can't check file size here, but we can check format)
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif']
  const hasValidFormat = supportedFormats.some((ext) => url.toLowerCase().includes(ext))

  if (!hasValidFormat) {
    return { valid: false, error: 'Image must be JPEG, PNG, or GIF format' }
  }

  return { valid: true }
}

/**
 * Get rate limit info from response headers
 */
export function getRateLimitInfo(headers: Headers): {
  callCount: number
  totalTime: number
  cpuTime: number
} | null {
  const usage = headers.get('x-app-usage')
  if (!usage) return null

  try {
    return JSON.parse(usage)
  } catch {
    return null
  }
}
