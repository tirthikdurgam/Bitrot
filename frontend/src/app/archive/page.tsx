"use client"

import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, AlertTriangle, FileX, Database, Search } from "lucide-react"

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // 1. ANIMATION VARIANTS
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.1 } 
    }
  }

  const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: { type: "spring", damping: 20 } 
    }
  }

  // 2. DATA FETCHING
  useEffect(() => {
    const fetchArchive = async () => {
      try {
        const res = await fetch("/api/archive", { 
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        
        const rawData = await res.json()
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        const formattedData = rawData.map((item: any) => ({
          ...item,
          image: item.storage_path 
            ? `${supabaseUrl}/storage/v1/object/public/bitloss-images/${item.storage_path}`
            : item.image 
        }))

        setArchiveItems(formattedData)
      } catch (err) {
        console.error("Archive fetch error:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchArchive()
  }, [])

  return (
    <main className="min-h-screen bg-[#050505] text-white font-montserrat relative overflow-hidden selection:bg-red-500 selection:text-white pb-20 pt-16 md:pt-0">
      
      {/* 3. BACKGROUND LAYERS */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-200 pointer-events-none fixed" />
      <div className="absolute top-0 left-0 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-red-900/10 rounded-full blur-[100px] md:blur-[150px] pointer-events-none" />

      {/* 4. TICKER - Hidden on very small screens to save space, or scaled down */}
      <div className="w-full h-8 bg-[#050505] border-b border-white/10 flex items-center overflow-hidden whitespace-nowrap z-20 relative">
        <motion.div 
            animate={{ x: ["0%", "-50%"] }} 
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
            className="flex items-center gap-12 text-[10px] text-white/30 tracking-[0.2em] uppercase font-bold px-4"
        >
            <span className="text-red-500">/// WARNING: DATA_CORRUPTION_DETECTED</span>
            <span>/// ARCHIVE_MODE: READ_ONLY</span>
            <span>/// RECOVERY_CHANCE: 0%</span>
            <span>/// {archiveItems.length}_FILES_LOST</span>
            <span className="text-[#0066FF]">/// SYSTEM_INTEGRITY: STABLE</span>
            {/* Duplicate for loop */}
            <span className="text-red-500">/// WARNING: DATA_CORRUPTION_DETECTED</span>
            <span>/// ARCHIVE_MODE: READ_ONLY</span>
            <span>/// RECOVERY_CHANCE: 0%</span>
            <span>/// {archiveItems.length}_FILES_LOST</span>
            <span className="text-[#0066FF]">/// SYSTEM_INTEGRITY: STABLE</span>
        </motion.div>
      </div>

      {/* 5. MAIN CONTENT */}
      {/* MOBILE OPTIMIZATION: px-4 on mobile, px-6 on desktop */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-8 md:pt-12 relative z-10">
        
        {/* HEADER */}
        {/* MOBILE OPTIMIZATION: Flex-col on mobile to stack elements */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 md:mb-16 gap-8">
            <div className="w-full">
                <Link href="/" className="inline-flex items-center gap-2 text-white/40 hover:text-[#0066FF] transition-colors mb-6 group">
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs tracking-widest uppercase font-bold">Return to Feed</span>
                </Link>
                
                {/* Responsive Text: text-4xl mobile -> text-7xl desktop */}
                <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase mb-4 glitch-text" data-text="SYSTEM ARCHIVE">
                    SYSTEM <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-red-600">ARCHIVE</span>
                </h1>
                <p className="text-white/50 text-sm font-medium max-w-lg leading-relaxed">
                    A permanent collection of data lost to entropy. These files have reached <span className="text-red-500 font-bold">0% Integrity</span> and are unrecoverable.
                </p>
            </div>

            {/* STAT BLOCK */}
            {/* MOBILE OPTIMIZATION: Remove left border/padding on mobile for better stacking */}
            <div className="flex gap-8 border-l-0 pl-0 md:border-l md:border-white/10 md:pl-8 w-full md:w-auto">
                <div>
                    <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-1">Total_Casualties</div>
                    <div className="text-3xl font-black text-white">{archiveItems.length}</div>
                </div>
                <div>
                    <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mb-1">Storage_Used</div>
                    <div className="text-3xl font-black text-white">128<span className="text-sm text-white/50">TB</span></div>
                </div>
            </div>
        </div>

        {/* SEARCH BAR */}
        <div className="w-full h-12 border-y border-white/10 flex items-center justify-between mb-12 bg-white/[0.02]">
            <div className="flex items-center gap-3 px-4 h-full border-r-0 md:border-r border-white/10 w-full md:w-auto">
                <Search size={14} className="text-white/30" />
                <span className="text-xs font-bold text-white/30 tracking-widest uppercase">SEARCH HASH ID</span>
            </div>
            {/* Hidden on mobile to save space */}
            <div className="hidden md:flex items-center gap-6 px-6 h-full text-[10px] font-bold tracking-widest text-white/30 uppercase">
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/> TERMINATED</span>
                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-white/20 rounded-full"/> ARCHIVED</span>
            </div>
        </div>

        {/* 6. THE GRID */}
        {loading ? (
             <div className="w-full h-64 flex flex-col items-center justify-center gap-4">
                 <div className="w-8 h-8 border-2 border-white/10 border-t-[#0066FF] rounded-full animate-spin" />
                 <div className="text-xs font-bold tracking-widest text-[#0066FF] animate-pulse">RETRIEVING CORRUPTED SECTORS</div>
             </div>
        ) : archiveItems.length === 0 ? (
             <div className="w-full h-64 border border-white/10 bg-white/[0.02] flex flex-col items-center justify-center text-white/30">
                 <Database size={32} className="mb-4 opacity-50" />
                 <span className="text-xs font-bold tracking-widest uppercase">NO_CASUALTIES_FOUND</span>
             </div>
        ) : (
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                // MOBILE OPTIMIZATION: grid-cols-2 (Mobile) -> grid-cols-4 (Desktop)
                className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-8"
            >
                {archiveItems.map((post) => (
                    <motion.div 
                        key={post.id} 
                        variants={cardVariants}
                        className="group relative aspect-[4/5] bg-black border border-white/10 overflow-hidden hover:border-red-500/50 transition-colors duration-500 rounded-lg md:rounded-none"
                    >
                        
                        {/* IMAGE */}
                        <Image 
                            src={post.image} 
                            alt="Dead File" 
                            fill
                            unoptimized={true}
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 25vw"
                            className="object-cover grayscale contrast-125 brightness-75 group-hover:scale-105 group-hover:grayscale-0 group-hover:contrast-100 group-hover:brightness-100 transition-all duration-700"
                        />
                        
                        {/* NOISE OVERLAY */}
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 pointer-events-none" />

                        {/* BADGE */}
                        <div className="absolute top-2 right-2 md:top-3 md:right-3 bg-red-500/10 border border-red-500/30 backdrop-blur-md px-1.5 py-0.5 md:px-2 md:py-1 flex items-center gap-2 rounded-sm">
                             <FileX size={10} className="text-red-500" />
                             {/* Hide text on very small screens if needed, mostly fine though */}
                             <span className="text-[8px] font-black text-red-500 tracking-widest uppercase">CORRUPT</span>
                        </div>

                        {/* HOVER DETAILS (Always visible on mobile bottom, or appearing on tap) */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-0 md:translate-y-2 md:group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/90 to-transparent">
                            <div className="text-[9px] md:text-[10px] text-red-500 mb-1 flex items-center gap-2 font-bold tracking-wider">
                                <AlertTriangle size={10} />
                                INTEGRITY: 0%
                            </div>
                            <div className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider mb-2 line-clamp-1">
                                {post.caption || "UNKNOWN DATA"}
                            </div>
                            <div className="hidden md:block h-[1px] w-full bg-white/20 mb-2 group-hover:bg-red-500/50 transition-colors" />
                            <div className="flex justify-between text-[8px] font-bold tracking-wider text-white/40 uppercase">
                                <span>@{post.username || "ANON"}</span>
                                <span>GEN: {post.generations}</span>
                            </div>
                        </div>

                    </motion.div>
                ))}
            </motion.div>
        )}

        {/* GLITCH ANIMATION STYLES */}
        <style jsx>{`
            .glitch-text { position: relative; }
            .glitch-text::before, .glitch-text::after {
              content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
            }
            .glitch-text::before {
              color: #ff0000; z-index: -1; animation: glitch-anim-1 3s infinite linear alternate-reverse;
            }
            .glitch-text::after {
              color: #0066FF; z-index: -2; animation: glitch-anim-2 2s infinite linear alternate-reverse;
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