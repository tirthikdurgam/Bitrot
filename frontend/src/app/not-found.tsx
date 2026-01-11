"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { AlertTriangle, Home, RefreshCw, Terminal } from "lucide-react"

export default function NotFound() {
  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white font-montserrat flex flex-col items-center justify-center p-6 overflow-hidden selection:bg-red-500 selection:text-white">
      
      {/* 1. ATMOSPHERE LAYERS */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_50%,rgba(0,0,0,0.4)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-20" />
      
      {/* 2. MAIN CONTENT CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 max-w-2xl w-full flex flex-col items-center text-center"
      >
        
        {/* ICON & TITLE */}
        <div className="mb-6 relative">
             <div className="absolute inset-0 bg-blue-500 blur-[80px] opacity-20 animate-pulse" />
             <AlertTriangle size={64} className="text-[#0066FF] mb-6 mx-auto drop-shadow-[0_0_15px_rgba(0,102,255,0.5)]" />
             
             <h1 className="text-[120px] md:text-[180px] font-black leading-none tracking-tighter glitch-404" data-text="404">
                404
             </h1>
        </div>

        {/* SUBTITLE */}
        <div className="space-y-4 mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-[0.2em] text-white uppercase">
                <span className="text-red-500">///</span> SIGNAL_LOST
            </h2>
            <p className="text-white/50 max-w-md mx-auto font-medium">
                The requested data segment has been lost to entropy or does not exist in this timeline.
            </p>
        </div>

        {/* FAKE TERMINAL LOGS */}
        <div className="w-full bg-black/50 border border-white/10 rounded-xl p-6 mb-10 backdrop-blur-md text-left relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0066FF] to-transparent opacity-50" />
            
            <div className="font-mono text-[10px] md:text-xs space-y-2 text-white/40">
                <p><span className="text-[#0066FF] mr-2">➜</span> SYSTEM_DIAGNOSTIC: <span className="text-red-500">FAIL</span></p>
                <p><span className="text-[#0066FF] mr-2">➜</span> TARGET_SECTOR: <span className="text-white">UNKNOWN</span></p>
                <p><span className="text-[#0066FF] mr-2">➜</span> ERROR_CODE: <span className="text-white">ERR_NULL_POINTER_EXCEPTION</span></p>
                <p className="animate-pulse"><span className="text-[#0066FF] mr-2">➜</span> ATTEMPTING_RECOVERY...</p>
            </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <Link 
                href="/"
                className="group relative px-8 py-4 bg-white text-black font-black uppercase tracking-widest rounded-lg hover:bg-[#0066FF] hover:text-white transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden"
            >
                <Home size={18} />
                <span>Return to Feed</span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Link>

            <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 border border-white/10 bg-white/5 text-white font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-3 backdrop-blur-sm"
            >
                <RefreshCw size={18} />
                <span>Retry Signal</span>
            </button>
        </div>

      </motion.div>

      {/* FOOTER DECORATION */}
      <div className="absolute bottom-8 left-0 w-full text-center">
        <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.5em]">
            System_Integrity: Compromised
        </p>
      </div>

      {/* GLITCH ANIMATION STYLES */}
      <style jsx>{`
        .glitch-404 {
          position: relative;
          color: white;
        }
        .glitch-404::before,
        .glitch-404::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.8;
        }
        .glitch-404::before {
          color: #0066FF;
          z-index: -1;
          animation: glitch-anim-1 2.5s infinite linear alternate-reverse;
        }
        .glitch-404::after {
          color: #ff0055;
          z-index: -2;
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-4px, 0); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(4px, 0); }
          40% { clip-path: inset(10% 0 50% 0); transform: translate(-4px, 0); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(4px, 0); }
          80% { clip-path: inset(30% 0 20% 0); transform: translate(-4px, 0); }
          100% { clip-path: inset(10% 0 60% 0); transform: translate(4px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(4px, 0); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(-4px, 0); }
          40% { clip-path: inset(30% 0 20% 0); transform: translate(4px, 0); }
          60% { clip-path: inset(10% 0 50% 0); transform: translate(-4px, 0); }
          80% { clip-path: inset(60% 0 10% 0); transform: translate(4px, 0); }
          100% { clip-path: inset(20% 0 80% 0); transform: translate(-4px, 0); }
        }
      `}</style>
    </div>
  )
}