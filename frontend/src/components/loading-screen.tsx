"use client"

import { useEffect, useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

const SYSTEM_LOGS = [
  "INITIALIZING_KERNEL...", "BYPASSING_FIREWALL_LAYER_4...", "DECRYPTING_USER_DATAGRAMS...",
  "MOUNTING_VIRTUAL_DRIVE...", "SYNCING_ENTROPY_NODES...", "OPTIMIZING_NEURAL_PATHWAYS...",
  "ESTABLISHING_SECURE_UPLINK...", "ALLOCATING_MEMORY_BLOCKS...", "VERIFYING_BIT_INTEGRITY...",
  "LOADING_ASSETS_MANIFEST...", "COMPILING_SHADERS...", "PURGING_CACHE_FRAGMENTS...",
  "SYSTEM_HANDSHAKE_ACCEPTED.", "WELCOME_USER."
]

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [logs, setLogs] = useState<string[]>([])
  const [isOverclocking, setIsOverclocking] = useState(false)
  
  // Use Refs to keep track of values without restarting the useEffect timer
  const progressRef = useRef(0)
  const overclockRef = useRef(false)
  const isFinished = useRef(false)

  // Sync the ref with the state so the timer can see it
  useEffect(() => {
    overclockRef.current = isOverclocking
  }, [isOverclocking])

  // 1. STABLE TIMER (Mounted only once)
  useEffect(() => {
    const timer = setInterval(() => {
      if (isFinished.current) return

      const multiplier = overclockRef.current ? 8 : 1
      const baseIncrement = 0.15 * multiplier
      const noise = (Math.random() * 0.05) * multiplier
      
      const nextProgress = Math.min(100, progressRef.current + baseIncrement + noise)
      progressRef.current = nextProgress
      setProgress(nextProgress)

      if (nextProgress >= 100 && !isFinished.current) {
        isFinished.current = true
        clearInterval(timer)
        // Save session and finish
        localStorage.setItem("bitloss_session_timestamp", Date.now().toString())
        setTimeout(onComplete, 500)
      }
    }, 100)

    return () => clearInterval(timer)
  }, [onComplete])

  // 2. LOG GENERATOR
  useEffect(() => {
    const logTimer = setInterval(() => {
      if (progressRef.current >= 100) return
      const randomLog = SYSTEM_LOGS[Math.floor(Math.random() * SYSTEM_LOGS.length)]
      const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false, fractionalSecondDigits: 3 })
      
      setLogs(prev => [...prev, `[${timestamp}] ${randomLog}`].slice(-8))
    }, 800)
    return () => clearInterval(logTimer)
  }, [])

  // 3. INPUT HANDLERS
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        setIsOverclocking(e.type === "keydown")
      }
    }
    window.addEventListener("keydown", handleKey)
    window.addEventListener("keyup", handleKey)
    return () => {
      window.removeEventListener("keydown", handleKey)
      window.removeEventListener("keyup", handleKey)
    }
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-[9999] bg-[#050505] text-white font-montserrat overflow-hidden select-none"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(20px)", transition: { duration: 0.8 } }}
    >
      <div className="absolute inset-0 pointer-events-none opacity-20">
         <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,0,255,0.06),rgba(0,100,255,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_2px,3px_100%]" />
         <div className="w-full h-full bg-[radial-gradient(circle_800px_at_50%_50%,#0066FF_0%,transparent_100%)] opacity-5" />
      </div>

      <div className="relative z-20 h-full flex flex-col justify-between p-8 md:p-12">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-3xl font-black tracking-tighter glitch-text" data-text="BITLOSS">BITLOSS</h1>
                <p className={`text-[10px] tracking-[0.4em] mt-1 font-bold transition-colors ${isOverclocking ? 'text-white' : 'text-[#0066FF] animate-pulse'}`}>
                    {isOverclocking ? ">> OVERCLOCKING SYSTEM <<" : "SYSTEM INITIALIZATION"}
                </p>
            </div>
            <div className="hidden md:block text-right opacity-30 font-bold text-[9px] tracking-[0.2em]">
                <div>MEM_ALLOC: 64TB</div>
                <div>SECURE_BOOT: TRUE</div>
            </div>
        </div>

        <div 
          className="flex-1 flex flex-col items-center justify-center cursor-crosshair"
          onMouseDown={() => setIsOverclocking(true)}
          onMouseUp={() => setIsOverclocking(false)}
          onMouseLeave={() => setIsOverclocking(false)}
          onTouchStart={() => setIsOverclocking(true)}
          onTouchEnd={() => setIsOverclocking(false)}
        >
            <div className="relative pointer-events-none">
                <span className={`text-[8.5rem] md:text-[15rem] font-black tracking-tighter leading-none transition-all duration-150 ${isOverclocking ? 'text-[#0066FF] drop-shadow-[0_0_35px_rgba(0,102,255,0.6)]' : 'text-white'}`}>
                    {Math.floor(progress)}
                </span>
                <span className="text-4xl md:text-6xl text-white/10 absolute top-4 -right-12 md:-right-20 font-black">%</span>
            </div>

            <div className="w-64 h-1.5 bg-white/10 mt-10 relative overflow-hidden rounded-full">
                <motion.div 
                    className={`absolute top-0 left-0 h-full ${isOverclocking ? 'bg-[#0066FF]' : 'bg-white'}`}
                    style={{ width: `${progress}%` }}
                />
            </div>

            <div className={`mt-10 text-[10px] font-black tracking-[0.5em] transition-all duration-500 uppercase ${isOverclocking ? 'text-[#0066FF] translate-y-[-5px]' : 'text-white/20'}`}>
                {isOverclocking ? "Turbo_Mode_Engaged" : "Hold_Space_To_Accelerate"}
            </div>
        </div>

        <div className="w-full flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="h-32 w-full max-w-md border-l-2 border-[#0066FF]/20 pl-6 flex flex-col justify-end overflow-hidden relative">
               <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10" />
               <div className="font-mono text-[9px] md:text-[11px] space-y-1.5 text-white/30 tracking-wider uppercase">
                  {logs.map((log, i) => (
                      <div key={i} className={i === logs.length - 1 ? "text-[#0066FF] font-bold" : ""}>
                          {log}
                      </div>
                  ))}
               </div>
          </div>

          <button 
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            className="group relative bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 px-10 py-5 rounded-sm backdrop-blur-xl transition-all active:scale-95 shrink-0 z-50 mb-2"
          >
            <div className="text-[10px] font-black tracking-[0.4em] text-white/30 group-hover:text-[#0066FF] transition-colors">
              BYPASS_PROTOCOL [SKIP]
            </div>
            <div className="absolute bottom-0 left-0 h-[2px] bg-[#0066FF] w-0 group-hover:w-full transition-all duration-500" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}