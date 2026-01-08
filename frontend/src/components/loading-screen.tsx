"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

// System logs (Blue/System Theme)
const SYSTEM_LOGS = [
  "INITIALIZING_KERNEL...",
  "BYPASSING_FIREWALL_LAYER_4...",
  "DECRYPTING_USER_DATAGRAMS...",
  "MOUNTING_VIRTUAL_DRIVE...",
  "SYNCING_ENTROPY_NODES...",
  "OPTIMIZING_NEURAL_PATHWAYS...",
  "ESTABLISHING_SECURE_UPLINK...",
  "ALLOCATING_MEMORY_BLOCKS...",
  "VERIFYING_BIT_INTEGRITY...",
  "LOADING_ASSETS_MANIFEST...",
  "COMPILING_SHADERS...",
  "PURGING_CACHE_FRAGMENTS...",
  "SYSTEM_HANDSHAKE_ACCEPTED.",
  "WELCOME_USER."
]

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [isOverclocking, setIsOverclocking] = useState(false)

  // 1. TIMER LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        const boostMultiplier = isOverclocking ? 8 : 1
        const baseIncrement = 0.15 * boostMultiplier
        const noise = (Math.random() * 0.05) * boostMultiplier
        const next = prev + baseIncrement + noise

        if (next >= 100) {
          clearInterval(timer)
          return 100
        }
        return next
      })
    }, 100)
    return () => clearInterval(timer)
  }, [isOverclocking])

  // 2. LOG GENERATOR
  useEffect(() => {
    const logTimer = setInterval(() => {
      const randomLog = SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)]
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })
      
      setLogs(prev => {
        const newLogs = [...prev, `[${timestamp}] ${randomLog}`]
        if (newLogs.length > 8) return newLogs.slice(1) 
        return newLogs
      })
    }, 800)
    return () => clearInterval(logTimer)
  }, [])

  // 3. FINISH HANDLER (With Session Save)
  useEffect(() => {
    if (progress >= 100) {
      // --- SESSION LOGIC START ---
      // Save the current timestamp when loading finishes.
      // The parent page will check this timestamp next time to decide if we skip loading.
      localStorage.setItem("bitloss_session_timestamp", Date.now().toString())
      // --- SESSION LOGIC END ---

      // Wait a moment for the "100%" visual to land, then unmount
      setTimeout(onComplete, 500)
    }
  }, [progress, onComplete])

  // 4. INTERACTION
  const startOverclock = () => setIsOverclocking(true)
  const stopOverclock = () => setIsOverclocking(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === "Space") setIsOverclocking(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
        if (e.code === "Space") setIsOverclocking(false)
    }
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)
    return () => {
        window.removeEventListener("keydown", handleKeyDown)
        window.removeEventListener("keyup", handleKeyUp)
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#050505] text-white font-montserrat overflow-hidden select-none cursor-crosshair"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
      onMouseDown={startOverclock}
      onMouseUp={stopOverclock}
      onTouchStart={startOverclock}
      onTouchEnd={stopOverclock}
    >
      
      {/* --- LAYER 1: GRID & SCANLINES --- */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,0,255,0.06),rgba(0,100,255,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
         <div className="w-full h-full bg-[radial-gradient(circle_800px_at_50%_50%,#0066FF_0%,transparent_100%)] opacity-5" />
      </div>

      {/* --- LAYER 2: CONTENT --- */}
      <div className="relative z-20 h-full flex flex-col justify-between p-8 md:p-12">
        
        {/* HEADER */}
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black tracking-tighter glitch-text" data-text="BITLOSS">BITLOSS</h1>
                <p className="text-[10px] text-[#0066FF] tracking-[0.3em] mt-1 font-bold animate-pulse">
                    {isOverclocking ? ">> OVERCLOCKING SYSTEM <<" : "SYSTEM INITIALIZATION"}
                </p>
            </div>
            <div className="hidden md:block text-right">
                <div className="text-[10px] text-white/40 tracking-widest font-bold">MEM_ALLOC: 64TB</div>
                <div className="text-[10px] text-white/40 tracking-widest font-bold">SECURE_BOOT: TRUE</div>
            </div>
        </div>

        {/* CENTER: MASSIVE COUNTER */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
            
            {/* The Number */}
            <div className="relative">
                <span className={`text-[8rem] md:text-[14rem] font-black tracking-tighter leading-none transition-colors duration-100 ${isOverclocking ? 'text-[#0066FF] drop-shadow-[0_0_25px_rgba(0,102,255,0.6)]' : 'text-white'}`}>
                    {Math.floor(progress)}
                </span>
                <span className="text-4xl md:text-6xl text-white/20 absolute top-4 -right-12 md:-right-20 font-bold">%</span>
            </div>

            {/* The Glitch Bar */}
            <div className="w-64 h-2 bg-white/10 mt-8 relative overflow-hidden rounded-full">
                <motion.div 
                    className={`absolute top-0 left-0 h-full ${isOverclocking ? 'bg-[#0066FF]' : 'bg-white'}`}
                    style={{ width: `${progress}%` }}
                    animate={{ opacity: [1, 0.5, 1] }} 
                    transition={{ duration: 0.2, repeat: Infinity }}
                />
            </div>

            {/* Interactive Prompt */}
            <div className={`mt-8 text-xs font-bold tracking-[0.2em] transition-all duration-300 ${isOverclocking ? 'text-[#0066FF] scale-110' : 'text-white/30 animate-pulse'}`}>
                {isOverclocking ? "/// SYSTEM OVERDRIVE ACTIVE ///" : "[ HOLD SPACE TO ACCELERATE ]"}
            </div>

        </div>

        {/* FOOTER: SYSTEM LOGS */}
        <div className="h-32 w-full max-w-lg border-l-2 border-[#0066FF]/30 pl-4 flex flex-col justify-end overflow-hidden relative">
             <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
             
             <div className="font-montserrat text-[10px] md:text-xs space-y-1 text-white/60 tabular-nums tracking-wider uppercase font-medium">
                {logs.map((log, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className={i === logs.length - 1 ? "text-[#0066FF] font-bold" : "text-white/40"}
                    >
                        {log}
                    </motion.div>
                ))}
             </div>
        </div>

      </div>

      <style jsx global>{`
        .glitch-text {
            position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
            content: attr(data-text);
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }
        .glitch-text::before {
            left: 2px;
            text-shadow: -1px 0 #0066FF; 
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim 5s infinite linear alternate-reverse;
        }
        .glitch-text::after {
            left: -2px;
            text-shadow: -1px 0 #00FFFF;
            clip: rect(44px, 450px, 56px, 0);
            animation: glitch-anim2 5s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim {
            0% { clip: rect(12px, 9999px, 32px, 0); }
            20% { clip: rect(65px, 9999px, 86px, 0); }
            40% { clip: rect(23px, 9999px, 5px, 0); }
            60% { clip: rect(89px, 9999px, 12px, 0); }
            80% { clip: rect(45px, 9999px, 67px, 0); }
            100% { clip: rect(1px, 9999px, 9px, 0); }
        }
        @keyframes glitch-anim2 {
            0% { clip: rect(54px, 9999px, 12px, 0); }
            20% { clip: rect(12px, 9999px, 65px, 0); }
            40% { clip: rect(87px, 9999px, 23px, 0); }
            60% { clip: rect(2px, 9999px, 45px, 0); }
            80% { clip: rect(32px, 9999px, 89px, 0); }
            100% { clip: rect(76px, 9999px, 4px, 0); }
        }
      `}</style>

    </motion.div>
  )
}