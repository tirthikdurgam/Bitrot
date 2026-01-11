import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // 1. Initialize Response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. SECURITY HEADERS (CSP)
  // ADDED: https://grainy-gradients.vercel.app to img-src
  // ADDED: https://bitloss.vercel.app to img-src (Good practice for production)
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data: https://*.googleusercontent.com https://avatars.githubusercontent.com https://*.supabase.co https://bitrot.onrender.com https://grainy-gradients.vercel.app https://bitloss.vercel.app;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
    connect-src 'self' http://127.0.0.1:8000 https://*.supabase.co https://*.google.com https://bitrot.onrender.com;
  `
  
  response.headers.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim())
  response.headers.set('X-Frame-Options', 'DENY') 
  response.headers.set('X-Content-Type-Options', 'nosniff') 
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()') 

  // 3. INIT SUPABASE CLIENT
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 4. CHECK AUTH SESSION
  const { data: { user } } = await supabase.auth.getUser()

  // 5. USERNAME ENFORCEMENT LOGIC
  if (user) {
    const path = request.nextUrl.pathname
    
    const isExcludedRoute = 
      path.startsWith('/onboarding') || 
      path.startsWith('/auth') || 
      path.startsWith('/login')

    // CHECK 1: If user is inside the app, check if they have a username
    if (!isExcludedRoute) {
      const { data: dbUser } = await supabase
        .from('users') 
        .select('username')
        .eq('id', user.id)
        .single()

      if (!dbUser?.username) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }
    }

    // CHECK 2: If user IS on onboarding but ALREADY has a username, kick them out to home
    if (path.startsWith('/onboarding')) {
      const { data: dbUser } = await supabase
        .from('users')
        .select('username')
        .eq('id', user.id)
        .single()

      if (dbUser?.username) {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}