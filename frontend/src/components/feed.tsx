"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import FeedCard from "./feed-card"
import { createClient } from "@/utils/supabase/client"
import EmptyFeedState from "@/components/empty-feed-state"

const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const [userCredits, setUserCredits] = useState(0)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const supabase = createClient()

  // --- DYNAMIC API URL ---
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bitrot.onrender.com"

  const fetchFeed = async () => {
    try {
      // 1. Get Session & Token
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      
      // 2. Fetch User Credits (if logged in)
      if (session?.user) {
         const { data: userData } = await supabase
            .from('users')
            .select('credits')
            .eq('id', session.user.id)
            .single()
         
         if (userData) {
             setUserCredits(userData.credits || 0)
         }
      }

      // 3. Fetch Feed from Backend (With Auth Header)
      const res = await fetch(`${API_URL}/feed`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '' // <--- CRITICAL FIX
        }
      })
      
      if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)

      const rawData = await res.json()
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://iqtidkshavbicaecmxtd.supabase.co" 
      const renderBackendUrl = "https://bitrot.onrender.com"

      // 4. Robust URL Construction
      const formattedData = rawData.map((row: any) => {
        let imageUrl = ""

        if (row.storage_path) {
            imageUrl = `${supabaseUrl}/storage/v1/object/public/bitloss-images/${row.storage_path}`
        } else if (row.image) {
            if (row.image.startsWith("http")) {
                imageUrl = row.image
            } else {
                const cleanPath = row.image.startsWith("/") ? row.image.substring(1) : row.image
                imageUrl = `${renderBackendUrl}/${cleanPath}`
            }
        }

        return {
          id: row.id,
          username: row.username,
          image: `${imageUrl}?t=${row.generations}`, // Cache busting
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

  const containerClass = posts.length === 0 ? "w-full" : "w-full max-w-2xl mx-auto"

  return (
    <div className={`flex-1 ${containerClass} border-x-0 md:border-x border-white/10 min-h-[calc(100vh-4rem)] ${scrollbarHiddenClass} flex flex-col transition-all duration-500 relative font-montserrat pb-20`}>
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-150 contrast-200 pointer-events-none fixed" />
      
      {/* LIVE FEED TICKER */}
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
           <div className="px-0 md:px-6 pb-6 space-y-8 w-full relative z-10">
             {posts.map((post, index) => (
               <motion.div
                 key={post.id}
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.05 }}
               >
                 <FeedCard 
                    {...post} 
                    userCredits={userCredits} 
                 />
               </motion.div>
             ))}
           </div>
      )}

    </div>
  )
}