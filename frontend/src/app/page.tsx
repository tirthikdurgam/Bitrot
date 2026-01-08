"use client"

import { useState, useEffect } from "react"
import LoadingScreen from "@/components/loading-screen"
import Navbar from "@/components/navbar"
import Feed from "@/components/feed"
import Sidebar from "@/components/sidebar"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true) // Default to true so it doesn't flash content

  useEffect(() => {
    // 1. CHECK LOCAL STORAGE ON MOUNT
    const checkSession = () => {
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

    checkSession()
  }, [])

  // 2. FUNCTION TO CALL WHEN LOADING FINISHES
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