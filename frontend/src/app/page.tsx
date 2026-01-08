"use client"

import { useState, useEffect } from "react"
import Navbar from "@/components/navbar"
import Feed from "@/components/feed"
import Sidebar from "@/components/sidebar"
import LoadingScreen from "@/components/loading-screen"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // DEV MODE: I commented this out so you can see the loading screen every time you refresh.
    // Uncomment these lines when you launch the site for real users.
    
    /* const hasVisited = sessionStorage.getItem("bitloss_visited")
    if (hasVisited) {
      setIsLoading(false)
    }
    */
  }, [])

  const handleLoadingComplete = () => {
    setIsLoading(false)
    // sessionStorage.setItem("bitloss_visited", "true") // Commented out for dev
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white relative">
      
      {/* 1. LOADING SCREEN INTEGRATION */}
      {/* AnimatePresence is handled inside the component's exit prop */}
      {isLoading && <LoadingScreen onComplete={handleLoadingComplete} />}

      {/* 2. MAIN CONTENT (Wrapped in fade transition) */}
      <div className={`transition-opacity duration-1000 delay-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        <Navbar />
        <div className="flex pt-16">
          <Feed />
          <Sidebar />
        </div>
      </div>
      
    </main>
  )
}