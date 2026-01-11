"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Lock, ShieldAlert, Wrench, Hammer, Send, Unlock, Fingerprint, User as UserIcon, ArrowRight } from "lucide-react"
import { createClient } from "@/utils/supabase/client"
import { useSecretGate } from "@/hooks/useSecretGate"
import CommentSection from "./comment-section"

export interface Comment {
  id: string
  username: string
  avatar_url?: string | null
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
  userCredits = 0 
}: FeedCardProps) {
  
  const router = useRouter()
  const supabase = createClient()
  
  // --- CONFIG ---
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://bitrot.onrender.com"

  // State
  const [localComments, setLocalComments] = useState<Comment[]>(comments)
  const [showComments, setShowComments] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isHealing, setIsHealing] = useState(false)
  const [isCorrupting, setIsCorrupting] = useState(false)
  
  // Optimistic UI
  const [currentCredits, setCurrentCredits] = useState(userCredits) 
  const [localIntegrity, setLocalIntegrity] = useState(bitIntegrity)
  
  // Avatars
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null)

  // Mobile Tap State
  const lastTapTime = useRef<number>(0)
  const tapCount = useRef<number>(0)
  
  const isDead = localIntegrity <= 0
  const isSecretActive = has_secret && localIntegrity >= 80
  
  // --- 1. SECRET GATE LOGIC (DESKTOP) ---
  const { isUnlocked } = useSecretGate(id, isSecretActive, isHovered)

  // Redirect immediately when unlocked via typing
  useEffect(() => {
      if (isUnlocked) {
          router.push(`/decipher/${id}`)
      }
  }, [isUnlocked, id, router])

  // --- 2. TRIPLE TAP LOGIC (MOBILE) ---
  const handleImageTap = () => {
      if (!isSecretActive) return

      const now = Date.now()
      const timeDiff = now - lastTapTime.current

      if (timeDiff < 300) { 
          tapCount.current += 1
      } else {
          tapCount.current = 1
      }

      lastTapTime.current = now

      if (tapCount.current === 3) {
          // Trigger Redirect
          router.push(`/decipher/${id}`)
          tapCount.current = 0 // Reset
      }
  }

  // --- STYLING ---
  const integrityBg = isDead ? "bg-red-500" : "bg-white"
  const latestComments = localComments.filter(c => !c.parent_id).slice(-2);

  // --- SYNC CREDITS ---
  useEffect(() => {
      setCurrentCredits(userCredits)
  }, [userCredits])

  // --- FETCH AVATARS ---
  useEffect(() => {
    const getData = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.avatar_url) {
            setCurrentUserAvatar(user.user_metadata.avatar_url)
        }

        const { data: authorData } = await supabase
            .from('users')
            .select('avatar_url')
            .eq('username', username)
            .single()
        
        if (authorData?.avatar_url) {
            setAuthorAvatar(authorData.avatar_url)
        } 
        else if (user?.user_metadata?.avatar_url && 
                (user.user_metadata.full_name === username || username.includes(user.email?.split('@')[0] || ''))) {
             setAuthorAvatar(user.user_metadata.avatar_url)
        }
    }
    getData()
  }, [username, supabase])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        router.push("/login")
        return false
    }
    return true
  }

  // --- INTERACT ACTION ---
  const handleInteract = async (action: "heal" | "corrupt") => {
    if (!(await checkAuth())) return
    
    if (currentCredits < 10) {
        alert("INSUFFICIENT FUNDS: Need 10 Credits")
        return
    }

    if (action === "heal") setIsHealing(true)
    else setIsCorrupting(true)

    try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return
        
        const res = await fetch(`${API_URL}/interact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ post_id: id, action })
        })

        if (!res.ok) {
            const err = await res.json()
            throw new Error(err.detail || "Transaction Failed")
        }

        const data = await res.json()
        setLocalIntegrity(data.new_integrity)
        setCurrentCredits(data.remaining_credits)

    } catch (error: any) {
        console.error("Interaction Error:", error)
        alert(error.message || "Action Failed")
    } finally {
        setTimeout(() => {
            setIsHealing(false)
            setIsCorrupting(false)
        }, 500)
    }
  }

  // --- COMMENT ACTION ---
  const handlePostComment = async (text: string, parentId?: string) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        router.push("/login")
        return
    }

    try {
      const newTempComment: Comment = {
        id: Math.random().toString(),
        username: "You", 
        avatar_url: currentUserAvatar, 
        content: text,
        created_at: new Date().toISOString(),
        parent_id: parentId || null
      }

      setLocalComments(prev => [...prev, newTempComment])

      await fetch(`${API_URL}/comment`, { 
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ post_id: id, content: text, parent_id: parentId })
      })
      
    } catch (error) {
      console.error("Transmission Error:", error)
      alert("Signal lost. Comment may not have saved.")
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      className="relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-md shadow-2xl mb-6 font-montserrat"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between relative z-10 border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full border border-white/20 p-[2px] relative overflow-hidden bg-white/5">
                <div className="w-full h-full rounded-full bg-black/50 overflow-hidden relative">
                    {authorAvatar ? (
                        <Image 
                            src={authorAvatar} 
                            alt={username} 
                            fill 
                            className="object-cover" 
                            unoptimized={true} 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <UserIcon size={14} className="text-white/50" />
                        </div>
                    )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white tracking-wide">@{username}</span>
                
                {/* --- SECRET INDICATOR --- */}
                {isSecretActive && (
                    <div className="flex items-center gap-1 group/lock px-2 py-1 rounded-full transition-colors animate-pulse">
                        <Lock size={12} className="text-white drop-shadow-[0_0_5px_white]" />
                        <span className="text-[9px] text-white/70 font-montserrat font-bold hidden md:inline">
                            ENCRYPTED
                        </span>
                    </div>
                )}
              </div>
          </div>
      </div>

      {/* IMAGE CONTAINER */}
      <div 
        className={`relative w-full aspect-square bg-black/50 z-10 overflow-hidden 
            ${isSecretActive ? 'cursor-crosshair' : ''} 
        `}
        onClick={handleImageTap} // Triggers triple tap check
        onContextMenu={(e) => e.preventDefault()}
      >
        <Image 
          src={image} 
          alt={username} 
          fill 
          sizes="(max-width: 768px) 100vw, 600px"
          unoptimized={true} 
          className={`object-cover transition-all duration-700 
            ${isDead ? 'grayscale contrast-150 brightness-75 sepia-[.3]' : 'group-hover:scale-[1.02]'}
          `}
        />

        {/* Mobile Hint */}
        {isSecretActive && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:hidden opacity-0 group-active:opacity-100 transition-opacity flex flex-col items-center">
                 <Fingerprint size={48} className="text-white animate-pulse mb-2" />
                 <p className="text-[10px] font-montserrat font-bold text-white tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">TRIPLE TAP</p>
             </div>
        )}

        {/* Desktop Hint */}
        {isSecretActive && isHovered && (
            <div className="absolute bottom-4 right-4 pointer-events-none hidden md:flex items-center gap-2 bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] text-white font-montserrat font-bold tracking-widest">TYPE "OPEN"</span>
            </div>
        )}

        {isDead && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-sm">
                 <ShieldAlert className="text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" size={64} />
            </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="p-4 relative z-10 bg-black/20">
         <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
                {/* --- MONOCHROME ACTIONS --- */}
                {!isDead && (
                <button 
                    onClick={() => handleInteract("heal")} 
                    disabled={isHealing || currentCredits < 10} 
                    className={`group/btn relative flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isHealing ? 'animate-pulse text-white' : ''}`}
                    title="-10 Credits to Heal"
                >
                    <Wrench size={22} className={isHealing ? 'scale-110' : ''} />
                </button>
                )}
                
                {!isDead && (
                <button 
                    onClick={() => handleInteract("corrupt")} 
                    disabled={isCorrupting || currentCredits < 10} 
                    className={`group/btn relative flex items-center justify-center text-white/50 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isCorrupting ? 'animate-shake text-white' : ''}`}
                    title="-10 Credits to Corrupt"
                >
                    <Hammer size={22} className={isCorrupting ? 'scale-110' : ''} />
                </button>
                )}
                
                <button onClick={() => setShowComments(!showComments)} className="text-white/50 hover:text-white transition-colors -mt-0.5">
                   <MessageCircle size={24} />
                </button>
            </div>
            
            <div className="flex items-center gap-2">
                {/* --- WHITE PROGRESS BAR --- */}
                <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${localIntegrity}%` }} className={`h-full ${integrityBg} relative shadow-[0_0_10px_rgba(255,255,255,0.3)]`}>
                       <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                    </motion.div>
                </div>
            </div>
         </div>

         {caption && (
           <div className="mb-2 text-[15px] text-white/90 leading-tight">
             <span className="font-bold mr-2">@{username}</span>
             {caption}
           </div>
         )}

         {localComments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="text-white/40 text-sm mb-2 hover:text-white/70 transition-colors">
               View all {localComments.length} comments
            </button>
         )}

         <div className="space-y-1 mb-3">
            {latestComments.map(comment => (
                <div key={comment.id} className="text-sm text-white/80 truncate">
                    <span className="font-bold mr-2">@{comment.username}</span>
                    <span>{comment.content}</span>
                </div>
            ))}
         </div>

         {/* --- MONOCHROME INPUT --- */}
         <div onClick={() => setShowComments(true)} className="flex items-center gap-3 pt-4 border-t border-white/10 cursor-pointer group/input">
             <div className="w-7 h-7 rounded-full bg-white/10 border border-white/5 overflow-hidden relative">
                {currentUserAvatar ? (
                    <Image 
                        src={currentUserAvatar} 
                        alt="Me" 
                        fill 
                        className="object-cover" 
                        unoptimized={true}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <UserIcon size={12} className="text-white/50" />
                    </div>
                )}
             </div>
             <div className="flex-1 text-white/30 text-sm group-hover/input:text-white/60 transition-colors">Add a comment...</div>
             <Send size={16} className="text-white/30 group-hover/input:text-white transition-colors" />
         </div>
      </div>

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