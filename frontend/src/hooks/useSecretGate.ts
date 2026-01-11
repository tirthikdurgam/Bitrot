"use client"

import { useState, useEffect, useCallback } from "react"

export function useSecretGate(postId: string, hasSecret: boolean = false, isHovered: boolean = false) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [buffer, setBuffer] = useState("")
  
  // Keywords to trigger unlock
  const KEYWORDS = ["open", "read", "unlock", "access"] 

  const triggerUnlock = useCallback(() => {
    console.log("ACCESS GRANTED:", postId)
    setIsUnlocked(true)
    
    // Haptic Feedback only (Navigation moved to parent)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
    }
  }, [postId])

  useEffect(() => {
    // Reset buffer if conditions aren't met
    if (!hasSecret || !isHovered || isUnlocked) {
        setBuffer("")
        return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Basic filter for single chars
      if (e.key.length !== 1) return

      const char = e.key.toLowerCase()
      
      setBuffer((prev) => {
        const next = (prev + char).slice(-10) // Keep last 10 chars
        
        if (KEYWORDS.some(word => next.endsWith(word))) {
            triggerUnlock()
        }
        return next
      })
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [hasSecret, isHovered, isUnlocked, KEYWORDS, triggerUnlock])

  return {
    isUnlocked,
    unlock: triggerUnlock
  }
}