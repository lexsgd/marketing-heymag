import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET - Get platform interest for current business and aggregate counts
export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get business ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Get user's own interests
  const { data: userInterests } = await supabase
    .from('platform_interest')
    .select('platform')
    .eq('business_id', business.id)

  // Get aggregate counts for each platform (using service role for count)
  const { data: counts } = await supabase
    .from('platform_interest')
    .select('platform')

  // Calculate counts per platform
  const platformCounts: Record<string, number> = {
    tiktok: 0,
    xiaohongshu: 0,
    wechat: 0,
  }

  counts?.forEach((record) => {
    if (record.platform in platformCounts) {
      platformCounts[record.platform]++
    }
  })

  return NextResponse.json({
    userInterests: userInterests?.map((i) => i.platform) || [],
    counts: platformCounts,
  })
}

// POST - Add interest for a platform
export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { platform } = await request.json()

  // Validate platform
  const validPlatforms = ['tiktok', 'xiaohongshu', 'wechat']
  if (!validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  // Get business ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Insert interest (upsert to handle duplicates gracefully)
  const { error } = await supabase.from('platform_interest').upsert(
    {
      business_id: business.id,
      platform,
    },
    {
      onConflict: 'business_id,platform',
    }
  )

  if (error) {
    console.error('Error adding platform interest:', error)
    return NextResponse.json({ error: 'Failed to add interest' }, { status: 500 })
  }

  return NextResponse.json({ success: true, platform })
}

// DELETE - Remove interest for a platform
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform')

  // Validate platform
  const validPlatforms = ['tiktok', 'xiaohongshu', 'wechat']
  if (!platform || !validPlatforms.includes(platform)) {
    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
  }

  // Get business ID
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!business) {
    return NextResponse.json({ error: 'Business not found' }, { status: 404 })
  }

  // Delete interest
  const { error } = await supabase
    .from('platform_interest')
    .delete()
    .eq('business_id', business.id)
    .eq('platform', platform)

  if (error) {
    console.error('Error removing platform interest:', error)
    return NextResponse.json({ error: 'Failed to remove interest' }, { status: 500 })
  }

  return NextResponse.json({ success: true, platform })
}
