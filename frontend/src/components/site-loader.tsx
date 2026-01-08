"use client"

import { useState, useEffect } from "react"
import LoadingScreen from "@/components/loading-screen"

export default function SiteLoader() {
  const [showLoader, setShowLoader] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // 1. Check if we've already shown the loader this session
    const hasVisited = sessionStorage.getItem("bitloss_visited")
    
    // 2. If visited, hide immediately
    if (hasVisited) {
      setShowLoader(false)
    }
  }, [])

  const handleComplete = () => {
    // 3. Mark as visited so it doesn't show again on refresh or nav
    sessionStorage.setItem("bitloss_visited", "true")
    setShowLoader(false)
  }

  // Prevent hydration mismatch or flash
  if (!isMounted) return null

  // If we shouldn't show it, render nothing
  if (!showLoader) return null

  return <LoadingScreen onComplete={handleComplete} />
}