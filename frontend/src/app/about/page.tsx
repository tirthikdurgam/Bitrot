"use client"

import Link from "next/link"
import { motion, Variants } from "framer-motion"
import { ArrowLeft, Upload, Activity, Archive, Terminal, Cpu, Database, Network } from "lucide-react"

export default function AboutPage() {
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  }

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { type: "spring", damping: 20 } 
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white font-montserrat relative overflow-hidden selection:bg-[#0066FF] selection:text-white pb-20">
      
      {/* 1. BACKGROUND LAYER */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-200 pointer-events-none fixed" />
      <div className="absolute top-0 right-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-[#0066FF]/5 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />

      {/* 2. LIVE DATA TICKER (Top Bar) */}
      {/* MOBILE OPTIMIZATION: Hidden on very small screens if needed, or scaled down */}
      <div className="w-full h-8 bg-[#0066FF]/10 border-b border-[#0066FF]/20 flex items-center overflow-hidden whitespace-nowrap mt-16 md:mt-16">
        <motion.div 
            animate={{ x: ["0%", "-50%"] }} 
            transition={{ duration: 20, ease: "linear", repeat: Infinity }}
            className="flex items-center gap-12 text-[10px] text-[#0066FF] tracking-[0.2em] uppercase font-bold px-4"
        >
            <span>/// SYSTEM_STATUS: ONLINE</span>
            <span>/// ENTROPY_LEVEL: 84%</span>
            <span>/// NODES_ACTIVE: 4,092</span>
            <span>/// LAST_PURGE: 12m AGO</span>
            <span>/// PROTOCOL_V2.0_ENGAGED</span>
            <span>/// SECURE_CONNECTION_ESTABLISHED</span>
             {/* Duplicate for seamless loop */}
            <span>/// SYSTEM_STATUS: ONLINE</span>
            <span>/// ENTROPY_LEVEL: 84%</span>
            <span>/// NODES_ACTIVE: 4,092</span>
            <span>/// LAST_PURGE: 12m AGO</span>
            <span>/// PROTOCOL_V2.0_ENGAGED</span>
            <span>/// SECURE_CONNECTION_ESTABLISHED</span>
        </motion.div>
      </div>

      {/* 3. MAIN CONTENT CONTAINER */}
      {/* MOBILE OPTIMIZATION: Increased top padding (pt-12 -> pt-20) to clear Navbar */}
      <div className="max-w-6xl mx-auto px-6 pt-12 md:pt-20 relative z-10">
        
        {/* NAV BACK */}
        <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[#0066FF] transition-colors mb-8 group">
             <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-xs tracking-widest uppercase font-bold">Return to Feed</span>
        </Link>

        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-16 md:space-y-20"
        >

            {/* --- HERO: MANIFESTO --- */}
            <motion.div variants={itemVariants} className="relative">
                {/* Decorative brackets - Hidden on mobile to reduce clutter */}
                <div className="hidden md:block absolute -top-6 -left-6 w-12 h-12 border-t-2 border-l-2 border-white/10" />
                <div className="hidden md:block absolute -bottom-6 -right-6 w-12 h-12 border-b-2 border-r-2 border-white/10" />
                
                {/* MOBILE OPTIMIZATION: Scaled text text-5xl -> text-8xl */}
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-8 leading-[0.9] glitch-text" data-text="DIGITAL ENTROPY">
                    DIGITAL <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#0066FF]">ENTROPY</span>
                </h1>
                
                <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start border-l-2 border-[#0066FF] pl-6 md:pl-8">
                    <p className="text-lg md:text-2xl text-white/80 font-medium max-w-2xl leading-relaxed">
                        The internet promised permanence. <span className="text-white bg-[#0066FF]/20 px-1">It was a lie.</span>
                        <br />
                        BitLoss introduces biological decay to digital files.
                    </p>
                    
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center gap-4 text-xs font-bold tracking-wider text-white/40 uppercase">
                            <Cpu size={14} className="text-[#0066FF]" />
                            <span>PROCESSING_CORE: ACTIVE</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold tracking-wider text-white/40 uppercase">
                            <Database size={14} className="text-[#0066FF]" />
                            <span>DATABASE_SHARDS: OPTIMIZED</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold tracking-wider text-white/40 uppercase">
                            <Network size={14} className="text-[#0066FF]" />
                            <span>P2P_MESH: SYNCED</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* --- THE PIPELINE (Visual Logic) --- */}
            <motion.div variants={itemVariants} className="relative bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
                
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                        <Terminal size={20} className="text-[#0066FF]" />
                        Operational_Logic
                    </h3>
                    <span className="text-[9px] md:text-[10px] text-[#0066FF] border border-[#0066FF]/30 px-2 py-1 rounded font-bold tracking-wider">
                        SYS_EXEC_MODE
                    </span>
                </div>

                {/* The Flowchart */}
                <div className="p-6 md:p-16 relative">
                    {/* The Connecting Line (Hidden on Mobile) */}
                    <div className="hidden md:block absolute top-[50%] left-0 right-0 h-[2px] bg-white/10 -translate-y-1/2 z-0">
                        {/* Animated Signal Packet */}
                        <motion.div 
                            className="w-32 h-[2px] bg-gradient-to-r from-transparent via-[#0066FF] to-transparent shadow-[0_0_20px_#0066FF]"
                            animate={{ x: ["-100%", "500%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    {/* MOBILE OPTIMIZATION: grid-cols-1 (Mobile) -> grid-cols-3 (Desktop) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 relative z-10">
                        
                        {/* STEP 1 */}
                        <div className="group bg-[#050505] border border-white/10 p-6 hover:border-[#0066FF] transition-colors duration-300 relative">
                             <div className="absolute -top-3 left-6 bg-[#050505] px-2 text-[#0066FF] text-xs font-black tracking-widest">01 // INPUT</div>
                             <div className="w-12 h-12 bg-[#0066FF]/10 flex items-center justify-center rounded-full mb-4 group-hover:scale-110 transition-transform">
                                 <Upload size={20} className="text-[#0066FF]" />
                             </div>
                             <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Ingest</h4>
                             <p className="text-white/40 text-xs font-medium leading-relaxed">
                                Artifacts enter the system at 100% integrity. Pristine, but vulnerable.
                             </p>
                        </div>

                        {/* STEP 2 */}
                        <div className="group bg-[#050505] border border-white/10 p-6 hover:border-white transition-colors duration-300 relative">
                             <div className="absolute -top-3 left-6 bg-[#050505] px-2 text-white/50 text-xs font-black tracking-widest">02 // PROCESS</div>
                             <div className="w-12 h-12 bg-white/5 flex items-center justify-center rounded-full mb-4 group-hover:scale-110 transition-transform">
                                 <Activity size={20} className="text-white" />
                             </div>
                             <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Decay</h4>
                             <p className="text-white/40 text-xs font-medium leading-relaxed">
                                Each view triggers a compression algorithm. Popularity equals destruction.
                             </p>
                        </div>

                        {/* STEP 3 */}
                        <div className="group bg-[#050505] border border-white/10 p-6 hover:border-red-500 transition-colors duration-300 relative">
                             <div className="absolute -top-3 left-6 bg-[#050505] px-2 text-red-500 text-xs font-black tracking-widest">03 // TERMINATE</div>
                             <div className="w-12 h-12 bg-red-900/10 flex items-center justify-center rounded-full mb-4 group-hover:scale-110 transition-transform">
                                 <Archive size={20} className="text-red-500" />
                             </div>
                             <h4 className="text-white font-bold text-lg mb-2 uppercase tracking-wide">Purge</h4>
                             <p className="text-white/40 text-xs font-medium leading-relaxed">
                                At 0% integrity, the file is corrupted beyond recognition and archived forever.
                             </p>
                        </div>

                    </div>
                </div>
            </motion.div>

        </motion.div>

        {/* GLITCH CSS */}
        <style jsx>{`
            .glitch-text { position: relative; }
            .glitch-text::before, .glitch-text::after {
              content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
            }
            .glitch-text::before {
              color: #0066FF; z-index: -1; animation: glitch-anim-1 3s infinite linear alternate-reverse;
            }
            .glitch-text::after {
              color: #ffffff; z-index: -2; animation: glitch-anim-2 2s infinite linear alternate-reverse;
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
    </main>
  )
}