import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${process.env.META_APP_ID}&client_secret=${process.env.META_APP_SECRET}&redirect_uri=${process.env.META_REDIRECT_URI}&code=${code}`
    )

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || tokenData.error) {
      throw new Error(tokenData.error?.message || 'Failed to exchange code')
    }

    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/v19.0/access_token?grant_type=ig_exchange_token&client_secret=${process.env.META_APP_SECRET}&access_token=${tokenData.access_token}`
    )

    const longLivedTokenData = await longLivedTokenResponse.json()

    if (!longLivedTokenResponse.ok || longLivedTokenData.error) {
      throw new Error('Failed to get long-lived token')
    }

    const profileResponse = await fetch(
      `https://graph.instagram.com/v19.0/me?fields=id,username&access_token=${longLivedTokenData.access_token}`
    )

    const profileData = await profileResponse.json()

    return NextResponse.json({
      accessToken: longLivedTokenData.access_token,
      expiresIn: longLivedTokenData.expires_in,
      user: profileData,
    })
  } catch (error) {
    console.error('Meta callback error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Authentication failed'
    }, { status: 500 })
  }
}
