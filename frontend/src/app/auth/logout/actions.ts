'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logout() {
  const supabase = await createClient()

  // 1. Tell Supabase to invalidate the session on the server
  await supabase.auth.signOut()

  // 2. Revalidate the layout so the UI updates (removes "Profile", shows "Login")
  revalidatePath('/', 'layout')

  // 3. Force redirect to login page
  redirect('/login')
}