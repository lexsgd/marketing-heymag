import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get request body
    const { code } = await request.json()
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    const normalizedCode = code.trim().toUpperCase()

    // Get business for this user
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (businessError || !business) {
      return NextResponse.json(
        { error: 'Business not found' },
        { status: 404 }
      )
    }

    // Get the promo code
    const { data: promoCode, error: promoError } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single()

    if (promoError || !promoCode) {
      return NextResponse.json(
        { error: 'Invalid or inactive promo code' },
        { status: 400 }
      )
    }

    // Check if code has expired
    if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    // Check if code hasn't started yet
    if (promoCode.starts_at && new Date(promoCode.starts_at) > new Date()) {
      return NextResponse.json(
        { error: 'This promo code is not yet active' },
        { status: 400 }
      )
    }

    // Check if max uses reached
    if (promoCode.max_uses !== null && promoCode.current_uses >= promoCode.max_uses) {
      return NextResponse.json(
        { error: 'This promo code has reached its usage limit' },
        { status: 400 }
      )
    }

    // Check if user already redeemed this code
    const { data: existingRedemption } = await supabase
      .from('promo_redemptions')
      .select('id')
      .eq('promo_code_id', promoCode.id)
      .eq('business_id', business.id)
      .single()

    if (existingRedemption) {
      return NextResponse.json(
        { error: 'You have already redeemed this promo code' },
        { status: 400 }
      )
    }

    // Get current credits
    const { data: credits, error: creditsError } = await supabase
      .from('credits')
      .select('credits_remaining')
      .eq('business_id', business.id)
      .single()

    const currentCredits = credits?.credits_remaining || 0
    const newCredits = currentCredits + promoCode.credits

    // Start transaction: update credits, create redemption, update promo code usage
    // Update credits
    const { error: updateCreditsError } = await supabase
      .from('credits')
      .upsert({
        business_id: business.id,
        credits_remaining: newCredits,
      }, {
        onConflict: 'business_id',
      })

    if (updateCreditsError) {
      console.error('[Promo Redeem] Credits update error:', updateCreditsError)
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      )
    }

    // Create redemption record
    const { error: redemptionError } = await supabase
      .from('promo_redemptions')
      .insert({
        promo_code_id: promoCode.id,
        business_id: business.id,
        credits_awarded: promoCode.credits,
      })

    if (redemptionError) {
      console.error('[Promo Redeem] Redemption insert error:', redemptionError)
      // Rollback credits update
      await supabase
        .from('credits')
        .update({ credits_remaining: currentCredits })
        .eq('business_id', business.id)

      return NextResponse.json(
        { error: 'Failed to record redemption' },
        { status: 500 }
      )
    }

    // Update promo code usage count
    const { error: updatePromoError } = await supabase
      .from('promo_codes')
      .update({ current_uses: promoCode.current_uses + 1 })
      .eq('id', promoCode.id)

    if (updatePromoError) {
      console.error('[Promo Redeem] Promo update error:', updatePromoError)
      // Non-critical error, continue
    }

    // Log credit transaction
    await supabase
      .from('credit_transactions')
      .insert({
        business_id: business.id,
        amount: promoCode.credits,
        transaction_type: 'promo_credit',
        description: `Promo code: ${normalizedCode}`,
        balance_after: newCredits,
      })

    console.log(`[Promo Redeem] Success: ${normalizedCode} redeemed by business ${business.id}, +${promoCode.credits} credits`)

    return NextResponse.json({
      success: true,
      credits_awarded: promoCode.credits,
      new_balance: newCredits,
      message: `Successfully redeemed! ${promoCode.credits} credits added to your account.`,
    })
  } catch (error) {
    console.error('[Promo Redeem] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
