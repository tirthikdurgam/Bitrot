"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Trash2, Activity, AlertTriangle, Hash, Zap, ChevronRight } from "lucide-react"

// UTILITY: Hides scrollbar but allows scrolling
const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

export default function Sidebar() {
  const [graveyard, setGraveyard] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        // 1. Get Dead Posts
        const graveRes = await fetch("/api/graveyard")
        if (graveRes.ok) {
            const graveData = await graveRes.json()
            if (Array.isArray(graveData)) {
                const formattedGraveyard = graveData.map((item: any) => ({
                    ...item,
                    fullUrl: `${supabaseUrl}/storage/v1/object/public/bitloss-images/${item.storage_path}`
                }))
                setGraveyard(formattedGraveyard)
            }
        }

        // 2. Get Trending Posts
        const trendRes = await fetch("/api/trending")
        if (trendRes.ok) {
            const trendData = await trendRes.json()
            if (Array.isArray(trendData)) {
                setTrends(trendData)
            }
        }
      } catch (err) {
        console.error("Sidebar fetch error:", err)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatIntegrity = (value: any) => {
    if (value === null || value === undefined || isNaN(value)) {
        return 100
    }
    return Math.floor(value)
  }

  return (
    <aside className={`hidden lg:flex flex-col w-80 sticky top-24 h-[calc(100vh-6rem)] ml-8 space-y-8 font-montserrat overflow-y-auto ${scrollbarHiddenClass}`}>
      
      {/* --- SECTION 1: THE RECYCLE BIN (Quarantine Zone) --- */}
      <div className="border border-white/10 bg-[#050505] relative overflow-hidden group">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-red-500">
                <Trash2 size={14} />
                <h3 className="text-xs font-black tracking-widest uppercase">Recycle Bin</h3>
            </div>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_red]" />
        </div>

        {/* Content (Grid of Dead Images) */}
        <div className="p-4">
            {(!graveyard || graveyard.length === 0) ? (
                <div className="h-32 border border-dashed border-white/10 flex flex-col items-center justify-center text-white/20">
                    <span className="text-[10px] font-bold tracking-widest">SYSTEM CLEAN</span>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 mb-4">
                    {graveyard.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="relative aspect-square bg-black border border-white/10 overflow-hidden group/item cursor-not-allowed"
                        >
                             <Image 
                                src={item.fullUrl} 
                                alt={item.username || "Dead file"} 
                                fill 
                                sizes="150px"
                                className="object-cover grayscale contrast-150 brightness-50 group-hover/item:scale-110 transition-transform duration-500"
                                unoptimized
                             />
                             <div className="absolute inset-0 bg-red-900/20 mix-blend-overlay pointer-events-none" />
                             
                             {/* Hover Warning Icon */}
                             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                                <AlertTriangle size={16} className="text-red-500 drop-shadow-[0_0_5px_black]" />
                             </div>
                             
                             {/* Bottom Label */}
                             <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-center border-t border-red-500/30">
                                <span className="text-[8px] font-bold text-red-500 block tracking-widest">CORRUPTED</span>
                             </div>
                        </motion.div>
                    ))}
                </div>
            )}
            
            {/* Footer Link */}
            <Link href="/archive" className="flex items-center justify-between text-[10px] font-bold text-white/40 hover:text-red-500 transition-colors uppercase tracking-wider border-t border-white/5 pt-3">
                <span>View_Full_Manifest</span>
                <ChevronRight size={12} />
            </Link>
        </div>
      </div>

      {/* --- SECTION 2: DECAYING TRENDS (System Monitor) --- */}
      <div className="border border-white/10 bg-[#050505] relative">
         
         {/* Header */}
         <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2 text-[#0066FF]">
                <Activity size={14} />
                <h3 className="text-xs font-black tracking-widest uppercase">Decay Metrics</h3>
            </div>
            <span className="text-[9px] font-bold text-white/30 border border-white/10 px-1 tracking-wider">REALTIME</span>
        </div>

        {/* Trend List */}
        <div className="p-4 space-y-4">
            
            {(!trends || trends.length === 0) ? (
                <div className="text-[10px] text-white/30 font-medium italic p-2">System stable. No active decay.</div>
            ) : (
                trends.map((trend, index) => {
                    const integrity = formatIntegrity(trend.current_quality || trend.bitIntegrity);
                    const isCritical = integrity < 40;

                    return (
                        <motion.div
                            key={trend.id}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            className="group cursor-pointer"
                        >
                            <div className="flex justify-between items-center mb-1">
                                <div className="flex items-center gap-2 text-white group-hover:text-[#0066FF] transition-colors">
                                    <Hash size={10} className="text-white/30" />
                                    <span className="text-xs font-bold uppercase tracking-wide truncate max-w-[120px]">
                                        @{trend.username}
                                    </span>
                                </div>
                                <span className={`text-[9px] font-bold tracking-wider ${isCritical ? 'text-red-500 animate-pulse' : 'text-[#0066FF]'}`}>
                                    {integrity}%
                                </span>
                            </div>
                            
                            {/* Technical Progress Bar */}
                            <div className="w-full h-1 bg-white/5 flex gap-[1px]">
                                {/* Width represents generations/activity instead of integrity for this visual */}
                                <div 
                                    className={`h-full ${isCritical ? 'bg-red-500 shadow-[0_0_8px_red]' : 'bg-[#0066FF] shadow-[0_0_8px_#0066FF]'}`} 
                                    style={{ width: `${Math.min(trend.generations * 2, 100)}%` }}
                                />
                            </div>
                            
                            <div className="flex justify-between mt-1 text-[8px] font-medium text-white/30 tracking-wider">
                                <span>GEN: {trend.generations}</span>
                                <span>RATE: {trend.decay_rate}</span>
                            </div>
                        </motion.div>
                    )
                })
            )}

        </div>
      </div>

      {/* --- SECTION 3: QUICK ACTIONS (Visual Only - Matches Style) --- */}
      <div className="border border-[#0066FF]/30 bg-[#0066FF]/5 p-4 flex items-center gap-4 relative overflow-hidden group hover:bg-[#0066FF]/10 transition-colors cursor-pointer select-none">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
         <div className="p-2 bg-[#0066FF]/20 rounded-full text-[#0066FF] group-hover:scale-110 transition-transform">
            <Zap size={16} />
         </div>
         <div>
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-1 group-hover:text-[#0066FF] transition-colors">Boost Signal</h4>
            <p className="text-[9px] text-[#0066FF] font-bold tracking-wider">Cost: 50 Credits</p>
         </div>
      </div>

    </aside>
  )
}