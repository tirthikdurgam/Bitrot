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
        // We return early here so we don't accidentally close the gate later if logic gets complex,
        // but we still want to ping the server below to wake it up.
      } 
      
      // --- WAKE UP BACKEND ---
      try {
        console.log("SYSTEM: Pinging Render Backend...")
        
        // Using Promise.race to force a timeout if the server hangs too long
        // If the server takes > 10 seconds, we just let the user in.
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Request Timeout")), 8000)
        );

        const fetchPromise = fetch("https://bitrot.onrender.com/me", { 
            method: "GET",
            headers: { "Cache-Control": "no-cache" }
        });

        await Promise.race([fetchPromise, timeoutPromise]);

        console.log("SYSTEM: Backend Handshake Complete.");

      } catch (error) {
        console.warn("SYSTEM: Backend Handshake Failed (Offline Mode Active)", error)
      } finally {
        // --- THE FIX: ALWAYS SET THIS TO TRUE ---
        // Whether it succeeded, failed, 404'd, or timed out... we let the user in.
        setIsBackendReady(true) 
      }
    }

    checkSessionAndWakeUp()
  }, [])

  // 2. CHECK IF WE CAN OPEN THE GATE
  useEffect(() => {
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
      
      {!showGate && children}
    </>
  )
}