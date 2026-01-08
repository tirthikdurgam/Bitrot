"use client"

import { motion } from "framer-motion"
import { Disc3, AlertTriangle } from "lucide-react"

export default function EmptyFeedState() {
  return (
    // CHANGED: h-full ensures it takes the parent's calculated height (100vh - 4rem)
    <div className="w-full h-full relative bg-black overflow-hidden flex flex-col items-center justify-center group select-none">
      
      {/* 1. BACKGROUND NOISE */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-200 pointer-events-none" />

      {/* 2. THE SCANNER LINE */}
      <motion.div 
        className="absolute left-0 right-0 h-[2px] bg-[#0066FF] shadow-[0_0_20px_#0066FF] z-10"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 6, ease: "linear", repeat: Infinity }}
      />
      
      {/* 3. CORNER BRACKETS (Flush with edges) */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-white/20 group-hover:border-[#0066FF] transition-colors duration-500" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-white/20 group-hover:border-[#0066FF] transition-colors duration-500" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-white/20 group-hover:border-[#0066FF] transition-colors duration-500" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-white/20 group-hover:border-[#0066FF] transition-colors duration-500" />

      {/* 4. CENTER CONTENT */}
      <div className="relative z-20 flex flex-col items-center gap-8">
        <div className="relative">
            <div className="absolute inset-0 bg-[#0066FF] blur-[50px] opacity-20 animate-pulse" />
            <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, ease: "linear", repeat: Infinity }}
            >
                <Disc3 size={64} className="text-white/20" />
            </motion.div>
            <AlertTriangle size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#0066FF] animate-pulse" />
        </div>

        <div className="text-center space-y-2">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase glitch-text" data-text="NO_SIGNAL">
                NO SIGNAL
            </h2>
            <p className="text-xs font-mono text-[#0066FF] tracking-[0.4em] uppercase animate-pulse">
                feed connection lost
            </p>
        </div>
      </div>

      <style jsx>{`
        .glitch-text { position: relative; }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
        }
        .glitch-text::before {
          color: #0066FF; z-index: -1; animation: glitch-anim-1 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          color: #ff0055; z-index: -2; animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 0); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
          40% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 0); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, 0); }
          80% { clip-path: inset(30% 0 20% 0); transform: translate(-2px, 0); }
          100% { clip-path: inset(10% 0 60% 0); transform: translate(2px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, 0); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 0); }
          40% { clip-path: inset(30% 0 20% 0); transform: translate(2px, 0); }
          60% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 0); }
          80% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
          100% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 0); }
        }
      `}</style>
    </div>
  )
}