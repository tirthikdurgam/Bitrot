"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export function useSecretGate(postId: string, hasSecret: boolean = false, isHovered: boolean = false) {
  const router = useRouter()
  
  const buffer = useRef("")
  const lastKeyTime = useRef(0)

  const KEYWORDS = ["open", "read", "unlock"]

  useEffect(() => {
    if (!hasSecret || !isHovered) return

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now()
      const char = e.key.toLowerCase()

      if (now - lastKeyTime.current > 1000) {
        buffer.current = ""
      }
      lastKeyTime.current = now

      buffer.current = (buffer.current + char).slice(-10)

      if (KEYWORDS.some(word => buffer.current.endsWith(word))) {
        triggerUnlock()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
    
  }, [hasSecret, postId, router, isHovered])

  const triggerUnlock = () => {
    console.log("ACCESS GRANTED:", postId)
    setTimeout(() => {
        router.push(`/decipher/${postId}`)
    }, 0)
  }

  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleTouchStart = () => {
    if (!hasSecret) return
    timerRef.current = setTimeout(() => {
        navigator.vibrate?.(200)
        triggerUnlock()
    }, 1000)
  }

  const handleTouchEnd = () => {
    if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
    }
  }

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleTouchStart,
    onMouseUp: handleTouchEnd,
    onMouseLeave: handleTouchEnd
  }
}