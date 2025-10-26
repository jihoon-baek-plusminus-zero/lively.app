import { createClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  // Handle errors from Supabase
  if (error) {
    console.error('Auth callback error:', error, error_description)
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin))
  }

  if (code) {
    const supabase = createClient()

    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('Error exchanging code for session:', exchangeError)
      return NextResponse.redirect(new URL('/login?error=auth_error', requestUrl.origin))
    }

    // Successfully authenticated - redirect to signup success page
    return NextResponse.redirect(new URL('/signup-success', requestUrl.origin))
  }

  // No code provided, redirect to home
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}
