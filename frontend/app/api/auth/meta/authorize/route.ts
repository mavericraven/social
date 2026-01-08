import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const metaAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${process.env.META_APP_ID}&redirect_uri=${process.env.META_REDIRECT_URI}&scope=instagram_basic,instagram_content_publish,pages_read_engagement&response_type=code`

  return NextResponse.json({ authUrl: metaAuthUrl })
}
