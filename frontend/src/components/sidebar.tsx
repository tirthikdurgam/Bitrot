"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useEffect, useState } from "react"

export default function Sidebar() {
  const [graveyard, setGraveyard] = useState<any[]>([])
  const [trends, setTrends] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        // 1. UPDATED: Get Dead Posts via Proxy
        // Calls /api/graveyard -> Next.js -> Python Backend
        const graveRes = await fetch("/api/graveyard")
        
        if (graveRes.ok) {
            const graveData = await graveRes.json()
            if (Array.isArray(graveData)) {
                // Transform the raw data into usable URLs
                const formattedGraveyard = graveData.map((item: any) => ({
                    ...item,
                    fullUrl: `${supabaseUrl}/storage/v1/object/public/bitloss-images/${item.storage_path}`
                }))
                setGraveyard(formattedGraveyard)
            }
        }

        // 2. UPDATED: Get Trending Posts via Proxy
        // Calls /api/trending -> Next.js -> Python Backend
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
    // Refresh every 5 seconds to keep sidebar alive
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  // Helper to safely format the percentage
  const formatIntegrity = (value: any) => {
    // If value is null, undefined, or not a number, return 100
    if (value === null || value === undefined || isNaN(value)) {
        return 100
    }
    return Math.floor(value)
  }

  return (
    <div className="hidden lg:block w-80 border-l border-white/10 bg-black/20 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-6 space-y-8">
        
        {/* --- RECYCLE BIN SECTION --- */}
        <div>
          <h3 className="font-courier text-xs font-bold tracking-widest text-white/70 mb-4">&gt; THE RECYCLE BIN</h3>
          
          {(!graveyard || graveyard.length === 0) ? (
            <div className="text-xs text-white/30 font-montserrat italic">No dead artifacts yet...</div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {graveyard.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#FF0000] transition-all cursor-pointer group relative bg-black"
                >
                  <Image
                    src={item.fullUrl} 
                    alt={item.username || "Dead file"}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-300 filter grayscale contrast-150 brightness-50 hover:grayscale-0 hover:contrast-100 hover:brightness-100"
                    unoptimized
                  />
                  
                  {/* Glitch Overlay Text */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-courier font-bold text-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity tracking-widest bg-black/80 px-1">
                      CORRUPTED
                    </span>
                  </div>

                  {/* Dead indicator */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-1 text-center">
                    <span className="text-[10px] font-courier font-bold text-[#FF0000]">INTEGRITY: 0%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* --- TRENDING SECTION --- */}
        <div>
          <h3 className="font-courier text-xs font-bold tracking-widest text-white/70 mb-4">&gt; DECAYING TRENDS</h3>
          <div className="space-y-3">
            {(!trends || trends.length === 0) ? (
              <div className="text-xs text-white/30 font-montserrat italic">System stable. No active decay.</div>
            ) : (
              trends.map((trend, index) => (
                <motion.div
                  key={trend.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 hover:border-[#00FF41] transition-all cursor-pointer"
                >
                  <p className="font-montserrat text-sm font-bold text-white hover:text-[#00FF41] transition-colors truncate">
                    @{trend.username}
                  </p>
                  <p className="text-xs text-white/40 font-montserrat">Generations: {trend.generations}</p>
                  <div className="mt-2 pt-2 border-t border-white/10 flex justify-between">
                    <span className="text-xs font-courier text-[#FF0000]">Rate: {trend.decay_rate}</span>
                    
                    {/* Uses helper function to avoid NaN */}
                    <span className="text-xs font-courier text-white/50">
                        {formatIntegrity(trend.current_quality || trend.bitIntegrity)}%
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}