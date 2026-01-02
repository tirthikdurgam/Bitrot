"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import FeedCard from "./feed-card"

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([])

  const fetchFeed = async () => {
    try {
      // 1. UPDATED: Fetch via Proxy (bypasses CORS & AdBlockers)
      // Next.js will silently forward this to http://127.0.0.1:8000/feed
      const res = await fetch("/api/feed", { 
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache'
        }
      })
      
      if (!res.ok) {
        throw new Error(`Feed fetch failed: ${res.status}`)
      }

      const rawData = await res.json()
      
      const timestamp = Date.now()
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

      // 2. Format Data
      const formattedData = rawData.map((row: any) => {
        
        // We reconstruct the URL using the frontend env var to be 100% safe,
        // but row.image from the backend is also valid now.
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
          // CRITICAL: This passes the comments from DB to the Card
          comments: row.comments || [], 
          has_secret: row.has_secret 
        }
      })
      
      setPosts(formattedData)
    } catch (err) {
      console.error("Backend offline or blocked:", err)
    }
  }

  // 3. Live Polling
  // Refreshes every 4 seconds. This ensures new comments appear 
  // automatically without needing to refresh the page.
  useEffect(() => {
    fetchFeed()
    const interval = setInterval(fetchFeed, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex-1 max-w-2xl mx-auto border-x border-white/10 min-h-screen">
      <div className="p-6 space-y-6">
        {posts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            {/* ...post spreads all props, including 'comments' */}
            <FeedCard {...post} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}