import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { postToFacebook, postToInstagram, validateImageUrl } from '@/lib/social/meta'

export const dynamic = 'force-dynamic'

interface PostRequest {
  caption: string
  imageUrl?: string
  platforms: ('facebook' | 'instagram')[]
  imageId?: string // Optional reference to image in our system
}

interface PostResults {
  [platform: string]: {
    success: boolean
    postId?: string
    error?: string
  }
}

/**
 * POST /api/social/post
 * Post content to connected Facebook and/or Instagram accounts
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: PostRequest = await request.json()
    const { caption, imageUrl, platforms, imageId } = body

    // Validate request
    if (!caption?.trim()) {
      return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
    }

    if (!platforms?.length) {
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      )
    }

    // Validate platforms
    const validPlatforms = ['facebook', 'instagram']
    const invalidPlatforms = platforms.filter((p) => !validPlatforms.includes(p))
    if (invalidPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Invalid platforms: ${invalidPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    // Instagram requires an image
    if (platforms.includes('instagram') && !imageUrl) {
      return NextResponse.json(
        { error: 'Instagram posts require an image' },
        { status: 400 }
      )
    }

    // Validate image URL if provided
    if (imageUrl) {
      const validation = validateImageUrl(imageUrl)
      if (!validation.valid) {
        return NextResponse.json({ error: validation.error }, { status: 400 })
      }
    }

    // Get business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get connected accounts for requested platforms
    const { data: accounts, error: accountsError } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('business_id', business.id)
      .in('platform', platforms)
      .eq('is_connected', true)

    if (accountsError) {
      console.error('[Social Post] Error fetching accounts:', accountsError)
      return NextResponse.json(
        { error: 'Failed to fetch connected accounts' },
        { status: 500 }
      )
    }

    if (!accounts?.length) {
      return NextResponse.json(
        { error: 'No connected accounts for the selected platforms. Please connect your accounts first.' },
        { status: 400 }
      )
    }

    // Check which requested platforms are actually connected
    const connectedPlatforms = accounts.map((a) => a.platform)
    const missingPlatforms = platforms.filter((p) => !connectedPlatforms.includes(p))

    if (missingPlatforms.length > 0) {
      return NextResponse.json(
        { error: `Not connected to: ${missingPlatforms.join(', ')}. Please connect these accounts first.` },
        { status: 400 }
      )
    }

    // Post to each platform
    const results: PostResults = {}
    let successCount = 0
    let failCount = 0

    for (const account of accounts) {
      const platform = account.platform as 'facebook' | 'instagram'

      if (platform === 'facebook') {
        const result = await postToFacebook(
          account.platform_id,
          account.access_token,
          caption,
          imageUrl
        )
        results.facebook = result
        if (result.success) successCount++
        else failCount++
      }

      if (platform === 'instagram') {
        // Instagram always requires an image (validated above)
        const result = await postToInstagram(
          account.platform_id,
          account.access_token,
          caption,
          imageUrl!
        )
        results.instagram = result
        if (result.success) successCount++
        else failCount++
      }
    }

    // Determine overall status
    let status: 'posted' | 'partial' | 'failed' = 'posted'
    if (failCount > 0 && successCount > 0) {
      status = 'partial'
    } else if (failCount > 0 && successCount === 0) {
      status = 'failed'
    }

    // Log the post to database
    const { data: post, error: postError } = await supabase
      .from('social_posts')
      .insert({
        business_id: business.id,
        image_id: imageId || null,
        caption,
        image_url: imageUrl || null,
        platforms,
        results,
        status,
        posted_at: status !== 'failed' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (postError) {
      console.error('[Social Post] Failed to log post:', postError)
      // Don't fail the request, the posts were already made
    }

    // Return results
    return NextResponse.json({
      success: status !== 'failed',
      status,
      results,
      postId: post?.id,
      message:
        status === 'posted'
          ? 'Posted successfully to all platforms'
          : status === 'partial'
            ? 'Posted to some platforms, but some failed'
            : 'Failed to post to any platform',
    })
  } catch (error) {
    console.error('[Social Post] Exception:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/social/post
 * Get recent posts for the current business
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get business
    const { data: business } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 })
    }

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')

    // Build query
    let query = supabase
      .from('social_posts')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (status) {
      query = query.eq('status', status)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('[Social Post] Error fetching posts:', error)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      posts: posts || [],
    })
  } catch (error) {
    console.error('[Social Post] Exception:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
