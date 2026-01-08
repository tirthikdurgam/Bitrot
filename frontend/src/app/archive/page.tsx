"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Image from "next/image"
import Navbar from "@/components/navbar"

export default function ArchivePage() {
  const [archiveItems, setArchiveItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // FIX 1: REMOVE THE MANUAL URL SELECTION
  // We don't need API_BASE anymore because we will use the internal "/api" route.
  
  useEffect(() => {
    const fetchArchive = async () => {
      try {
        console.log(`Fetching archive from internal proxy...`) 
        
        // FIX 2: USE THE RELATIVE PATH
        // This hits "https://bitloss.vercel.app/api/archive"
        // Next.js then invisibly forwards this to Render.
        // No CORS errors!
        const res = await fetch("/api/archive", { 
            cache: 'no-store',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
        
        const rawData = await res.json()
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

        // Transform data to use Supabase URLs directly
        const formattedData = rawData.map((item: any) => ({
          ...item,
          fullUrl: item.storage_path 
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
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-6 pt-24 pb-12">
        <div className="mb-12 border-b border-white/10 pb-6">
            <h1 className="font-courier text-3xl font-bold tracking-widest text-white mb-2">
                SYSTEM ARCHIVE
            </h1>
            <p className="font-montserrat text-white/50 text-sm">
                A permanent collection of data lost to entropy. These files are unrecoverable.
            </p>
        </div>

        {loading ? (
            <div className="text-center py-20 font-courier text-[#00FF41] animate-pulse">
                LOADING DELETED_DATA...
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {archiveItems.map((item, index) => (
                <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-[#FF0000] transition-all cursor-pointer group relative bg-black shadow-lg"
                >
                <Image
                    src={item.fullUrl}
                    alt={`Archived artifact ${item.id}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500 filter grayscale contrast-150 brightness-50 hover:grayscale-0 hover:contrast-100 hover:brightness-100"
                    // FIX 3: REMOVED unoptimized={true}
                    // This allows Vercel to compress the images for you = FASTER LOADING
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />

                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <span className="text-sm font-courier font-bold text-[#FF0000] opacity-0 group-hover:opacity-100 transition-opacity tracking-[0.2em] bg-black/80 px-2 py-1 border border-red-500/50">
                    CORRUPTED
                    </span>
                    <span className="text-[10px] font-montserrat text-white/50 opacity-0 group-hover:opacity-100 mt-2">
                        User: @{item.username}
                    </span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-black/90 p-2 text-center border-t border-white/10 group-hover:border-[#FF0000]/50 transition-colors">
                    <div className="flex justify-between items-center px-2">
                        <span className="text-[10px] font-courier font-bold text-[#FF0000]">INTEGRITY: 0%</span>
                        <span className="text-[10px] font-courier text-white/30">GEN: {item.generations}</span>
                    </div>
                </div>
                </motion.div>
            ))}
            </div>
        )}

        {!loading && archiveItems.length === 0 && (
            <div className="text-center py-20 text-white/30 font-courier border border-dashed border-white/10 rounded-lg">
                NO ARTIFACTS FOUND. SYSTEM CLEAN.
            </div>
        )}
      </div>
    </main>
  )
}