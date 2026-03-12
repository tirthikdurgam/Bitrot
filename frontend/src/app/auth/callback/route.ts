import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // CHANGED: Default to '/' (Feed) so users land on the main app after login
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // We grab the `data` object here to get the user ID
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data?.user) {
      
      // --- THE INTERCEPTOR START ---
      // Fetch the user's profile from the public.users table
      const { data: profile } = await supabase
        .from('users')
        .select('username')
        .eq('id', data.user.id)
        .single()

      // If they don't have a profile yet, or their username is the default "user_..."
      // Send them to the onboarding screen to pick a name.
      if (!profile || !profile.username || profile.username.startsWith('user_')) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }
      // --- THE INTERCEPTOR END ---

      // Successful login & valid username -> Redirect to Feed (or the 'next' param)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Login failed -> Redirect to error page
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}