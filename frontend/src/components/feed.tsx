"use client"

import { useEffect, useState } from "react"
import { motion, Variants } from "framer-motion"
import FeedCard from "./feed-card"
import { createClient } from "@/utils/supabase/client"
import EmptyFeedState from "@/components/empty-feed-state"

const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const supabase = createClient()

  const fetchFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      let currentUserName = "Anonymous_Observer"
      if (user) {
         const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous"
         currentUserName = fullName.replace(/\s+/g, '_')
      }

      const res = await fetch("/api/feed", { 
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'x-user-name': currentUserName
        }
      })
      
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)

      const rawData = await res.json()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      const formattedData = rawData.map((row: any) => {
        const imageUrl = row.storage_path 
            ? `${supabaseUrl}/storage/v1/object/public/bitloss-images/${row.storage_path}`
            : row.image

        return {
          id: row.id,
          username: row.username,
          image: `${imageUrl}?t=${row.generations}`,
          bitIntegrity: row.bitIntegrity, 
          generations: row.generations,
          witnesses: row.witnesses,
          caption: row.caption,
          comments: row.comments || [], 
          has_secret: row.has_secret 
        }
      })
      
      setPosts(formattedData)
    } catch (err) {
      console.error("Backend offline or blocked:", err)
    } finally {
      setIsInitialLoad(false)
    }
  }

  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 4000)
    return () => clearInterval(interval)
  }, [])

  const containerClass = posts.length === 0 ? "w-full" : "max-w-2xl mx-auto"

  return (
    <div className={`flex-1 ${containerClass} border-x border-white/10 min-h-[calc(100vh-4rem)] ${scrollbarHiddenClass} flex flex-col transition-all duration-500 relative font-montserrat`}>
      
      {/* 1. BACKGROUND LAYERS (Matches Archive) */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-200 pointer-events-none fixed" />
      
      {/* 2. LIVE FEED TICKER (Only shows when there are posts) */}
      {posts.length > 0 && (
        <div className="w-full h-6 bg-[#0066FF]/5 border-b border-[#0066FF]/20 flex items-center overflow-hidden whitespace-nowrap z-20 mb-6">
            <motion.div 
                animate={{ x: ["0%", "-50%"] }} 
                transition={{ duration: 25, ease: "linear", repeat: Infinity }}
                className="flex items-center gap-12 text-[9px] text-[#0066FF] tracking-[0.2em] uppercase font-bold px-4"
            >
                <span>/// LIVE_FEED_CONNECTION: ACTIVE</span>
                <span>/// DECAY_RATE: NORMAL</span>
                <span>/// NEW_ARTIFACTS_DETECTED</span>
                <span>/// SYSTEM_MODE: OBSERVATION</span>
                {/* Duplicate */}
                <span>/// LIVE_FEED_CONNECTION: ACTIVE</span>
                <span>/// DECAY_RATE: NORMAL</span>
                <span>/// NEW_ARTIFACTS_DETECTED</span>
                <span>/// SYSTEM_MODE: OBSERVATION</span>
            </motion.div>
        </div>
      )}

      {posts.length === 0 ? (
           <motion.div 
             className="flex-1 w-full h-full relative pt-2"
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ duration: 0.5 }}
           >
             <EmptyFeedState />
           </motion.div>
      ) : (
           <div className="px-6 pb-6 space-y-8 w-full relative z-10">
             {posts.map((post, index) => (
               <motion.div
                 key={post.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
               >
                 <FeedCard {...post} />
               </motion.div>
             ))}
           </div>
      )}

    </div>
  )
}