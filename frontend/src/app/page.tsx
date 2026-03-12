"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import LoadingScreen from "@/components/loading-screen"
import Navbar from "@/components/navbar"
import Feed from "@/components/feed"
import Sidebar from "@/components/sidebar"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true) // Default to true so it doesn't flash content
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializePage = async () => {
      // 1. THE BOUNCER: Check auth and username first
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('username')
          .eq('id', user.id)
          .single()

        // If they don't have a valid username, kick them to Onboarding immediately
        if (!profile || !profile.username || profile.username.startsWith('user_')) {
          router.push('/onboarding')
          return // Stop execution here so the feed doesn't load
        }
      }

      // 2. CHECK LOCAL STORAGE ON MOUNT (Only runs if they passed the Bouncer)
      const lastVisit = localStorage.getItem("bitloss_session_timestamp")
      const now = Date.now()
      
      // CHANGED: 10 minutes instead of 15
      const tenMinutes = 10 * 60 * 1000 

      if (lastVisit) {
        const timeDiff = now - parseInt(lastVisit)
        
        // If it's been LESS than 10 mins, SKIP loading
        if (timeDiff < tenMinutes) {
          setIsLoading(false)
        }
      }
    }

    initializePage()
  }, [router, supabase])

  // 3. FUNCTION TO CALL WHEN LOADING FINISHES
  const handleLoadingComplete = () => {
    setIsLoading(false)
    // Save current time
    localStorage.setItem("bitloss_session_timestamp", Date.now().toString())
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-[#0066FF] selection:text-white font-montserrat">
      
      {isLoading ? (
        // Pass the completion handler to the Loading Screen
        <LoadingScreen onComplete={handleLoadingComplete} />
      ) : (
        <>
          <Navbar />
          <div className="flex max-w-[1400px] mx-auto pt-24 px-6 relative">
            {/* Feed Section (Center) */}
            <Feed />

            {/* Sidebar (Right - Hidden on Mobile) */}
            <Sidebar />
          </div>
        </>
      )}
    </main>
  )
}