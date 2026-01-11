"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import LoadingScreen from "./loading-screen"

export default function StartupGateway({ children }: { children: React.ReactNode }) {
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [isVisualsComplete, setIsVisualsComplete] = useState(false)
  const [showGate, setShowGate] = useState(true)

  // 1. SESSION CHECK & WAKE UP
  useEffect(() => {
    const checkSessionAndWakeUp = async () => {
      // --- CHECK LOCAL STORAGE ---
      const lastSession = localStorage.getItem("bitloss_session_timestamp")
      const ONE_HOUR = 60 * 60 * 1000
      
      const isSessionValid = lastSession && (Date.now() - parseInt(lastSession) < ONE_HOUR)

      if (isSessionValid) {
        // SKIP LOADING SCREEN IMMEDIATELY
        console.log("SYSTEM: Valid session detected. Bypassing boot sequence.")
        setShowGate(false)
        setIsBackendReady(true) 
      } 
      
      // --- WAKE UP BACKEND (Always do this, even if skipping visuals) ---
      try {
        console.log("SYSTEM: Pinging Render Backend...")
        const res = await fetch("https://bitrot.onrender.com/me", { 
            method: "GET",
            headers: { "Cache-Control": "no-cache" }
        })
        if (res.ok) {
            console.log("SYSTEM: Connection Established.")
            setIsBackendReady(true)
        }
      } catch (error) {
        console.warn("SYSTEM: Backend Handshake Failed (Offline Mode?)", error)
        setIsBackendReady(true) 
      }
    }

    checkSessionAndWakeUp()
  }, [])

  // 2. CHECK IF WE CAN OPEN THE GATE
  useEffect(() => {
    // Only run this logic if the gate is currently closed
    if (showGate) {
        if (isBackendReady && isVisualsComplete) {
            setShowGate(false)
        }
    }
  }, [isBackendReady, isVisualsComplete, showGate])

  return (
    <>
      <AnimatePresence mode="wait">
        {showGate && (
           <LoadingScreen onComplete={() => setIsVisualsComplete(true)} />
        )}
      </AnimatePresence>
      
      {/* If showGate is false, we show children immediately.
          This prevents the "Flicker" on reload because React 
          will paint the children as soon as the useEffect above sets showGate(false).
      */}
      {!showGate && children}
    </>
  )
}