/**
 * Ayrshare Social Media API Integration
 *
 * This service handles social media posting via Ayrshare's unified API.
 * Supports: Instagram, Facebook, TikTok (via Ayrshare)
 * Coming soon: Xiaohongshu, WeChat (via KAWO/Just One API)
 */

const AYRSHARE_API_URL = 'https://api.ayrshare.com/api'
const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY
const AYRSHARE_PRIVATE_KEY = process.env.AYRSHARE_PRIVATE_KEY

interface AyrshareProfile {
  id: string
  profileKey: string
  title: string
  activeSocialAccounts?: string[]
}

interface AyrshareJwtResponse {
  status: string
  title: string
  token: string
  url: string
}

interface AyrshareUser {
  activeSocialAccounts?: string[]
  displayNames?: Record<string, string>
  usernames?: Record<string, string>
  profiles?: Record<string, { id: string; username?: string; displayName?: string }>
}

interface AyrsharePostResult {
  status: string
  id?: string
  postIds?: Record<string, string>
  errors?: Array<{ platform: string; message: string }>
}

/**
 * Create a new Ayrshare profile for a business
 */
export async function createAyrshareProfile(
  businessName: string,
  businessId: string
): Promise<{ profileKey: string } | null> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return null
  }

  try {
    const response = await fetch(`${AYRSHARE_API_URL}/profiles/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify({
        title: businessName,
        refId: businessId, // Reference to our business ID
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Ayrshare] Failed to create profile:', error)
      return null
    }

    const data = await response.json()
    console.log('[Ayrshare] Profile created:', data)

    return {
      profileKey: data.profileKey,
    }
  } catch (error) {
    console.error('[Ayrshare] Error creating profile:', error)
    return null
  }
}

/**
 * Generate a JWT URL for social account linking
 * This URL opens Ayrshare's social linking page for the user
 */
export async function generateSocialLinkingUrl(
  profileKey: string,
  redirectUrl?: string
): Promise<{ url: string } | null> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return null
  }

  try {
    const body: Record<string, unknown> = {
      profileKey,
      domain: process.env.NEXT_PUBLIC_APP_URL || 'https://marketing.heymag.app',
    }

    // Add private key if available (required for JWT signing)
    if (AYRSHARE_PRIVATE_KEY) {
      body.privateKey = AYRSHARE_PRIVATE_KEY
    }

    // Add redirect URL if provided
    if (redirectUrl) {
      body.redirect = redirectUrl
    }

    const response = await fetch(`${AYRSHARE_API_URL}/profiles/generateJWT`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Ayrshare] Failed to generate JWT:', error)
      return null
    }

    const data: AyrshareJwtResponse = await response.json()
    console.log('[Ayrshare] JWT URL generated:', data.url?.substring(0, 100) + '...')

    return {
      url: data.url,
    }
  } catch (error) {
    console.error('[Ayrshare] Error generating JWT URL:', error)
    return null
  }
}

/**
 * Get connected social accounts for a profile
 */
export async function getConnectedAccounts(profileKey: string): Promise<AyrshareUser | null> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return null
  }

  try {
    const response = await fetch(`${AYRSHARE_API_URL}/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
        'Profile-Key': profileKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Ayrshare] Failed to get user info:', error)
      return null
    }

    const data: AyrshareUser = await response.json()
    console.log('[Ayrshare] Connected accounts:', data.activeSocialAccounts)

    return data
  } catch (error) {
    console.error('[Ayrshare] Error getting connected accounts:', error)
    return null
  }
}

/**
 * Post content to social media platforms
 */
export async function postToSocial(
  profileKey: string,
  options: {
    post: string // Caption text
    platforms: string[] // ['instagram', 'facebook', 'tiktok']
    mediaUrls?: string[] // Image URLs
    scheduleDate?: string // ISO date string for scheduling
    hashtags?: string[]
  }
): Promise<AyrsharePostResult | null> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return null
  }

  try {
    const body: Record<string, unknown> = {
      post: options.post,
      platforms: options.platforms,
    }

    if (options.mediaUrls?.length) {
      body.mediaUrls = options.mediaUrls
    }

    if (options.scheduleDate) {
      body.scheduleDate = options.scheduleDate
    }

    // Add hashtags if provided
    if (options.hashtags?.length) {
      // Ayrshare automatically adds hashtags to the post
      body.post = options.post + '\n\n' + options.hashtags.map((h) => `#${h.replace('#', '')}`).join(' ')
    }

    const response = await fetch(`${AYRSHARE_API_URL}/post`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
        'Profile-Key': profileKey,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('[Ayrshare] Failed to post:', error)
      return {
        status: 'error',
        errors: [{ platform: 'all', message: error.message || 'Failed to post' }],
      }
    }

    const data: AyrsharePostResult = await response.json()
    console.log('[Ayrshare] Post result:', data)

    return data
  } catch (error) {
    console.error('[Ayrshare] Error posting:', error)
    return null
  }
}

/**
 * Delete a post from social media
 */
export async function deletePost(
  profileKey: string,
  postId: string,
  platforms: string[]
): Promise<boolean> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return false
  }

  try {
    const response = await fetch(`${AYRSHARE_API_URL}/post`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
        'Profile-Key': profileKey,
      },
      body: JSON.stringify({
        id: postId,
        bulk: platforms,
      }),
    })

    return response.ok
  } catch (error) {
    console.error('[Ayrshare] Error deleting post:', error)
    return false
  }
}

/**
 * Unlink a social account from the profile
 */
export async function unlinkSocialAccount(
  profileKey: string,
  platform: string
): Promise<boolean> {
  if (!AYRSHARE_API_KEY) {
    console.error('[Ayrshare] API key not configured')
    return false
  }

  try {
    const response = await fetch(`${AYRSHARE_API_URL}/profiles/social/${platform}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AYRSHARE_API_KEY}`,
        'Profile-Key': profileKey,
      },
    })

    return response.ok
  } catch (error) {
    console.error('[Ayrshare] Error unlinking account:', error)
    return false
  }
}

/**
 * Map Ayrshare platform names to our platform IDs
 */
export function mapAyrsharePlatform(ayrsharePlatform: string): string {
  const mapping: Record<string, string> = {
    instagram: 'instagram',
    facebook: 'facebook',
    tiktok: 'tiktok',
    twitter: 'twitter',
    linkedin: 'linkedin',
    youtube: 'youtube',
    pinterest: 'pinterest',
    threads: 'threads',
  }
  return mapping[ayrsharePlatform.toLowerCase()] || ayrsharePlatform.toLowerCase()
}
