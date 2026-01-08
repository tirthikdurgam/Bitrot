"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        // Randomize speed for a more "computational" feel
        const increment = Math.random() * 2 + 0.5
        const next = prev + increment
        if (next >= 100) {
          clearInterval(timer)
          return 100
        }
        return next
      })
    }, 40) // Faster tick for a snappier feel

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress >= 100) {
      setTimeout(onComplete, 500) // Snappier exit
    }
  }, [progress, onComplete])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#050505] flex flex-col justify-between p-8 md:p-12"
      initial={{ opacity: 1 }}
      exit={{ y: "-100%", transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } }} // "Curtain up" exit animation
    >
      
      {/* TOP: Header Information */}
      <div className="flex justify-between items-start border-b border-white/10 pb-4">
        <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tighter text-white">BITLOSS</h1>
            <span className="text-[10px] text-white/40 font-mono uppercase tracking-widest mt-1">
                Digital Decay Experiment
            </span>
        </div>
        <div className="text-right hidden md:block">
             <span className="text-[10px] text-white/40 font-mono block">EST. 2025</span>
             <span className="text-[10px] text-[#00FF41] font-mono block animate-pulse">● SYSTEM ACTIVE</span>
        </div>
      </div>

      {/* CENTER: The Big Counter */}
      <div className="flex-1 flex flex-col justify-center">
         <div className="relative">
             {/* Huge typographic percentage */}
             <span className="text-[8rem] md:text-[12rem] leading-none font-bold tracking-tighter text-white block">
                {Math.floor(progress)}
                <span className="text-4xl md:text-6xl text-white/30 ml-2 align-top">%</span>
             </span>
             
             {/* The thin progress bar running through or below the text */}
             <div className="w-full h-[1px] bg-white/10 mt-8 relative overflow-hidden">
                <motion.div 
                    className="absolute top-0 left-0 h-full bg-[#00FF41]"
                    style={{ width: `${progress}%` }}
                />
             </div>
         </div>
      </div>

      {/* BOTTOM: Footer Details */}
      <div className="flex justify-between items-end text-[10px] font-mono text-white/40 uppercase tracking-wide">
         <div className="flex gap-8">
             <span>Loading Assets...</span>
             <span className="hidden md:inline">Verifying Integrity...</span>
         </div>
         <div>
            ID_8820-X
         </div>
      </div>

    </motion.div>
  )
}