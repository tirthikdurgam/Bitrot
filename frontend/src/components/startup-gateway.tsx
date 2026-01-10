"use client"

import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import LoadingScreen from "./loading-screen" // Imports your visual component

export default function StartupGateway({ children }: { children: React.ReactNode }) {
  const [isBackendReady, setIsBackendReady] = useState(false)
  const [isVisualsComplete, setIsVisualsComplete] = useState(false)
  const [showGate, setShowGate] = useState(true)

  // 1. WAKE UP THE BACKEND
  useEffect(() => {
    const wakeUpServer = async () => {
      try {
        console.log("SYSTEM: Pinging Render Backend...")
        
        // This hits your backend. Render sees the traffic and wakes up.
        // We use 'no-cache' to ensure it actually hits the server.
        const res = await fetch("https://bitrot.onrender.com/me", { 
            method: "GET",
            headers: { "Cache-Control": "no-cache" }
        })

        if (res.ok) {
            console.log("SYSTEM: Connection Established.")
            setIsBackendReady(true)
        }
      } catch (error) {
        // If it fails (e.g. timeout), we still let them in eventually 
        // so they aren't stuck forever, but we log the error.
        console.warn("SYSTEM: Backend Handshake Failed (Offline Mode?)", error)
        setIsBackendReady(true) 
      }
    }

    wakeUpServer()
  }, [])

  // 2. CHECK IF WE CAN ENTER
  // We only close the gate when BOTH visuals are done AND backend is ready.
  useEffect(() => {
    if (isBackendReady && isVisualsComplete) {
        setShowGate(false)
    }
  }, [isBackendReady, isVisualsComplete])

  return (
    <>
      <AnimatePresence mode="wait">
        {showGate && (
           // We render YOUR LoadingScreen here.
           // When it finishes its 0-100% count, it triggers 'setIsVisualsComplete'
           <LoadingScreen onComplete={() => setIsVisualsComplete(true)} />
        )}
      </AnimatePresence>
      
      {/* While the gate is closed, we don't render children to prevent un-styled flashes */}
      {!showGate && children}
    </>
  )
}