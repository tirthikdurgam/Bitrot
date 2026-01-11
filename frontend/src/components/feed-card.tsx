"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Lock, ShieldAlert, Wrench, Hammer, Send } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useSecretGate } from "@/hooks/useSecretGate"
import CommentSection from "./comment-section"

export interface Comment {
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
  userCredits?: number 
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
  has_secret = false,
  userCredits = 100
}: FeedCardProps) {
  
  const router = useRouter()
  const [localComments, setLocalComments] = useState<Comment[]>(comments)
  const [showComments, setShowComments] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isHealing, setIsHealing] = useState(false)
  const [isCorrupting, setIsCorrupting] = useState(false)
  
  const isDead = bitIntegrity <= 0
  const isSecretActive = has_secret && bitIntegrity >= 80
  const secretHandlers = useSecretGate(id, isSecretActive, isHovered)
  
  const integrityBg = isDead ? "bg-red-500" : bitIntegrity < 50 ? "bg-amber-400" : "bg-[#00FF41]"
  const latestComments = localComments.filter(c => !c.parent_id).slice(-2);

  const checkAuth = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        router.push("/login")
        return false
    }
    return true
  }

  const handlePostComment = async (text: string, parentId?: string) => {
    if (!(await checkAuth())) return

    try {
      const newTempComment: Comment = {
        id: Math.random().toString(),
        username: "You",
        content: text,
        created_at: new Date().toISOString(),
        parent_id: parentId || null
      }

      setLocalComments(prev => [...prev, newTempComment])

      await fetch("https://bitrot.onrender.com/comment", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            post_id: id, 
            content: text, 
            parent_id: parentId 
        })
      })
      
    } catch (error) {
      console.error("Transmission Error:", error)
      alert("Signal lost. Comment may not have saved.")
    }
  }

  const handleHeal = async () => {
    if (!(await checkAuth())) return
    
    if(userCredits < 10) return alert("Not enough credits!")
    setIsHealing(true)
    setTimeout(() => setIsHealing(false), 1000)
  }

  const handleCorrupt = async () => {
    if (!(await checkAuth())) return

    if(userCredits < 10) return alert("Not enough credits!")
    setIsCorrupting(true)
    setTimeout(() => setIsCorrupting(false), 1000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl mb-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between relative z-10 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00FF41]/20 to-purple-500/20 border border-white/10 p-[2px]">
                <div className="w-full h-full rounded-full bg-black/50"></div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">@{username}</span>
                {isSecretActive && <Lock size={12} className="text-[#00FF41] drop-shadow-[0_0_5px_#00FF41]" />}
              </div>
          </div>
      </div>

      {/* IMAGE */}
      <div className="relative w-full aspect-square bg-black/50 z-10 overflow-hidden">
        <Image 
          src={image} 
          alt={username} 
          fill 
          sizes="(max-width: 768px) 100vw, 600px"
          unoptimized={true} 
          className={`object-cover transition-all duration-700 ${isDead ? 'grayscale contrast-150 brightness-75 sepia-[.3]' : 'group-hover:scale-[1.02]'}`}
          {...(isSecretActive ? secretHandlers : {})}
        />

        {isDead && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm">
                 <ShieldAlert className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" size={64} />
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 relative z-10 bg-black/20">
         
         {/* ACTION BAR */}
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
                
                {!isDead && (
                <button 
                  onClick={handleHeal} 
                  disabled={isHealing || userCredits < 10} 
                  className={`group/btn relative flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isHealing ? 'animate-pulse text-[#00FF41]' : ''}`}
                  title="-10 Credits to Heal"
                >
                    <Wrench size={22} className={isHealing ? 'scale-110' : ''} />
                </button>
                )}

                {!isDead && (
                <button 
                  onClick={handleCorrupt} 
                  disabled={isCorrupting || userCredits < 10} 
                  className={`group/btn relative flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isCorrupting ? 'animate-shake text-red-500' : ''}`}
                  title="-10 Credits to Corrupt"
                >
                    <Hammer size={22} className={isCorrupting ? 'scale-110' : ''} />
                </button>
                )}

                <button onClick={() => setShowComments(!showComments)} className="text-white/70 hover:text-white transition-colors -mt-0.5">
                   <MessageCircle size={24} />
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${bitIntegrity}%` }} className={`h-full ${integrityBg} relative`}>
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </motion.div>
                </div>
            </div>
         </div>

         {/* CAPTION */}
         {caption && (
           <div className="mb-2 text-[15px] text-white/90 leading-tight">
             <span className="font-bold mr-2">@{username}</span>
             {caption}
           </div>
         )}

         {/* VIEW COMMENTS LINK */}
         {localComments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="text-white/50 text-sm mb-2 hover:text-white/70 transition-colors">
               View all {localComments.length} comments
            </button>
         )}

         {/* PREVIEW LATEST COMMENTS */}
         <div className="space-y-1 mb-3">
            {latestComments.map(comment => (
                <div key={comment.id} className="text-sm text-white/80 truncate">
                    <span className="font-bold mr-2">@{comment.username}</span>
                    <span>{comment.content}</span>
                </div>
            ))}
         </div>

         {/* INPUT TRIGGER */}
         <div onClick={() => setShowComments(true)} className="flex items-center gap-3 pt-4 border-t border-white/10 cursor-pointer group/input">
             <div className="w-7 h-7 rounded-full bg-white/10 border border-white/5"></div>
             <div className="flex-1 text-white/30 text-sm group-hover/input:text-white/50 transition-colors">Add a comment...</div>
             <Send size={16} className="text-white/30 group-hover/input:text-[#00FF41] transition-colors" />
         </div>
      </div>

      {/* COMMENT DRAWER */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-black/80 backdrop-blur-2xl relative z-20 shadow-[inset_0_10px_20px_rgba(0,0,0,0.5)]"
          >
             <div className="p-5">
               <CommentSection 
                 postId={id} 
                 comments={localComments} 
                 onPostComment={handlePostComment}
               />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}