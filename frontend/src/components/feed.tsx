"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
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
    <div className={`flex-1 ${containerClass} border-x border-white/10 min-h-[calc(100vh-4rem)] ${scrollbarHiddenClass} flex flex-col transition-all duration-500`}>
      
      {posts.length === 0 ? (
           // CHANGE: Added 'pt-2' here to push the top border down slightly into frame
           <motion.div 
             className="flex-1 w-full h-full relative pt-2" 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             transition={{ duration: 0.5 }}
           >
             <EmptyFeedState />
           </motion.div>
      ) : (
           <div className="p-6 space-y-6 w-full">
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