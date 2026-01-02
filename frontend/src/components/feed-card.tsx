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
  
  // --- LOGIC FIX: CRITICAL INTEGRITY CHECK ---
  // If integrity drops below 80%, the secret is lost forever.
  const isSecretActive = has_secret && bitIntegrity >= 80
  
  // We pass 'isSecretActive' instead of 'has_secret' to the hook.
  // This physically disables the "open" keyword.
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
      className="relative group bg-white/5 border border-white/10 rounded-lg overflow-hidden hover:border-white/20 transition-all duration-300 backdrop-blur-sm"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* HEADER */}
      <div className="p-4 border-b border-white/10 flex items-start justify-between">
        <div className="flex-1 pr-4"> 
          <div className="font-montserrat text-sm text-white break-words">
            <span className="font-bold mr-2">@{username}</span>
            {caption && (
              <span className="font-normal text-white/60">
                {caption}
              </span>
            )}
          </div>
          <p className="text-xs text-white/40 mt-1">Generations: {generations}</p>
        </div>
      </div>
      
      {/* IMAGE CONTAINER */}
      <div className="relative w-full aspect-square bg-black/50 overflow-hidden group cursor-crosshair">
        <Image 
          src={image} 
          alt={username} 
          fill 
          className="object-cover transition-transform duration-300" 
          unoptimized 
          // Only attach handlers if the secret is actually active
          {...(isSecretActive ? secretHandlers : {})}
        /> 

        {/* --- UI LOGIC: ONLY SHOW IF ACTIVE --- */}
        {isSecretActive && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-[#00FF41]/30 text-[#00FF41]">
                    <Lock size={10} />
                    <span className="text-[9px] font-mono tracking-widest uppercase">Encrypted</span>
                </div>
            </div>
        )}

        {/* --- OPTIONAL: SHOW BROKEN LOCK IF DATA LOST --- */}
        {has_secret && !isSecretActive && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-red-500/30 text-red-500">
                    <AlertTriangle size={10} />
                    <span className="text-[9px] font-mono tracking-widest uppercase">Data Corrupted</span>
                </div>
            </div>
        )}

      </div>

      {/* INTEGRITY BAR */}
      <div className="p-4 bg-black/20 border-t border-white/10">
        <DecayProgressBar current={bitIntegrity} />
      </div>

      {/* FOOTER */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          
          <div className="flex gap-4">
            <button className="flex items-center gap-2 text-xs text-white/50 hover:text-[#00FF41] transition-colors group cursor-default">
              <Eye size={14} /> <span className="font-montserrat font-medium">{witnesses} Witnesses</span>
            </button>

            <button 
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 text-xs transition-colors group ${showComments ? "text-[#00FF41]" : "text-white/50 hover:text-[#00FF41]"}`}
            >
              <MessageSquare size={14} /> 
              <span className="font-montserrat font-medium">
                {comments.length} Comments
              </span>
            </button>
          </div>
          
          <span className="text-[9px] font-bold tracking-[0.2em] text-white/30 uppercase">
            OBSERVATION CAUSES DECAY
          </span>
        </div>
      </div>

      {showComments && (
        <CommentSection 
          postId={id} 
          comments={comments} 
          onPostComment={handlePostComment} 
        />
      )}
    </motion.div>
  )
}