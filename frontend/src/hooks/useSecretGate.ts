"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

export function useSecretGate(postId: string, hasSecret: boolean = false, isHovered: boolean = false) {
  const router = useRouter()
  const [isUnlocked, setIsUnlocked] = useState(false)
  
  const [buffer, setBuffer] = useState("")
  const KEYWORDS = ["open", "read", "unlock"]

  useEffect(() => {
    if (!hasSecret || !isHovered || isUnlocked) {
        setBuffer("")
        return
    }

    const handleKeyDown = (e: KeyboardEvent) => {
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
  }, [hasSecret, isHovered, isUnlocked])


  const triggerUnlock = useCallback(() => {
    console.log("ACCESS GRANTED:", postId)
    setIsUnlocked(true)
    if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([50, 50, 50])
    }
  }, [postId])

  return {
    isUnlocked,
    unlock: triggerUnlock
  }
}