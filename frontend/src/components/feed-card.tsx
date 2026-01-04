"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Eye, MessageSquare, Lock, Activity, Maximize2, Hash, AlertTriangle } from "lucide-react"
import { useSecretGate } from "@/hooks/useSecretGate"
import CommentSection from "./comment-section"
import DecayProgressBar from "./decay-progress-bar"

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
  parent_id?: string | null
}

interface FeedCardProps {
  id: string
  username: string
  image: string
  bitIntegrity: number
  generations: number
  witnesses: number
  caption?: string
  comments?: Comment[]
  has_secret?: boolean
}

export default function FeedCard({
  id,
  username,
  image,
  bitIntegrity,
  generations,
  witnesses,
  caption,
  comments = [],
  has_secret = false
}: FeedCardProps) {
  
  const [showComments, setShowComments] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  // Logic: If integrity drops below 80%, the secret is lost forever.
  const isSecretActive = has_secret && bitIntegrity >= 80
  
  // Secret Gate Hook
  const secretHandlers = useSecretGate(id, isSecretActive, isHovered)

  const handlePostComment = async (text: string, parentId?: string) => {
    try {
      await fetch("http://127.0.0.1:8000/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            post_id: id, 
            content: text,
            parent_id: parentId
        })
      })
      window.location.reload()
    } catch (error) {
      console.error("Transmission Error:", error)
    }
  }

  return (
    <motion.div
      // UPDATED UI: Matching the Profile Page "Glassy" Look
      // - bg-black/40 & backdrop-blur-2xl: Deep glass effect
      // - rounded-3xl: Soft, modern corners
      // - shadow-2xl: Floating depth
      className="relative group bg-black/40 border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-500 backdrop-blur-2xl shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* HEADER */}
      <div className="p-5 border-b border-white/5 flex items-start justify-between">
        <div className="flex-1 pr-4"> 
          <div className="font-montserrat text-sm text-white break-words flex flex-col gap-1">
            <span className="font-bold text-base">@{username}</span>
            {caption && (
              <span className="font-normal text-white/70 text-xs leading-relaxed">
                {caption}
              </span>
            )}
          </div>
          <p className="text-[10px] text-white/30 mt-2 font-mono uppercase tracking-widest">
            Gen: {generations}
          </p>
        </div>
      </div>
      
      {/* IMAGE CONTAINER */}
      {/* Added slight side margins/rounding to separate image from glass edge if desired, 
          but full-bleed looks best with glass. Keeping full-bleed. */}
      <div className="relative w-full aspect-square bg-black/50 overflow-hidden group cursor-crosshair border-y border-white/5">
        <Image 
          src={image} 
          alt={username} 
          fill 
          className="object-cover transition-transform duration-700 group-hover:scale-105" 
          unoptimized 
          {...(isSecretActive ? secretHandlers : {})}
        /> 

        {/* LOCKED INDICATOR */}
        {isSecretActive && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#00FF41]/30 text-[#00FF41] shadow-lg">
                    <Lock size={12} />
                    <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Encrypted</span>
                </div>
            </div>
        )}

        {/* CORRUPTED INDICATOR */}
        {has_secret && !isSecretActive && (
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 shadow-lg">
                    <AlertTriangle size={12} />
                    <span className="text-[10px] font-mono tracking-widest uppercase font-bold">Data Corrupted</span>
                </div>
            </div>
        )}

      </div>

      {/* FOOTER */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between pt-2">
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-xs text-white/50 hover:text-[#00FF41] transition-colors group cursor-default">
              <Eye size={16} /> <span className="font-montserrat font-medium">{witnesses}</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 text-xs transition-colors group ${showComments ? "text-[#00FF41]" : "text-white/50 hover:text-[#00FF41]"}`}
            >
              <MessageSquare size={16} /> 
              <span className="font-montserrat font-medium">
                {comments.length}
              </span>
            </button>
          </div>
          
          <span className="text-[9px] font-bold tracking-[0.2em] text-white/20 uppercase">
            OBSERVATION CAUSES DECAY
          </span>
        </div>
      </div>

      {showComments && (
        <div className="border-t border-white/5 bg-black/20">
            <CommentSection 
            postId={id} 
            comments={comments} 
            onPostComment={handlePostComment} 
            />
        </div>
      )}
    </motion.div>
  )
}