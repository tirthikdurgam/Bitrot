"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import FeedCard from "./feed-card"
import { createClient } from "@/utils/supabase/client" // <--- IMPORTED SUPABASE

// UTILITY: Hides scrollbar but allows scrolling
const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])
  const supabase = createClient() // <--- INITIALIZED CLIENT

  const fetchFeed = async () => {
    try {
      // 1. CRITICAL: Get the real logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      
      // 2. Determine the username to send
      let currentUserName = "Anonymous_Observer"
      
      if (user) {
         // Priority: Metadata Name -> Email -> "Anonymous"
         // Also replacing spaces with underscores to match your DB style
         const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous"
         currentUserName = fullName.replace(/\s+/g, '_')
      }

      // 3. Send the request with the REAL user name in headers
      const res = await fetch("/api/feed", { 
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'x-user-name': currentUserName // <--- The Backend looks for this
        }
      })
      
      if (!res.ok) {
        throw new Error(`Feed fetch failed: ${res.status}`)
      }

      const rawData = await res.json()
      
      const timestamp = Date.now()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      // 4. Format Data
      const formattedData = rawData.map((row: any) => {
        const imageUrl = row.storage_path 
            ? `${supabaseUrl}/storage/v1/object/public/bitloss-images/${row.storage_path}`
            : row.image

        return {
          id: row.id,
          username: row.username,
          // Append timestamp to force browser to re-fetch the decayed image
          image: `${imageUrl}?t=${timestamp}`,
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
    }
  }

  // 5. Live Polling
  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    // UPDATED: Added scrollbarHiddenClass
    <div className={`flex-1 max-w-2xl mx-auto border-x border-white/10 min-h-screen ${scrollbarHiddenClass}`}>
      <div className="p-6 space-y-6">
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
    </div>
  )
}