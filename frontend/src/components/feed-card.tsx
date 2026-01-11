"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, Lock, ShieldAlert, Wrench, Hammer, Send, Unlock, Fingerprint, User as UserIcon } from "lucide-react"
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
  const supabase = createClient()
  
  // State
  const [localComments, setLocalComments] = useState<Comment[]>(comments)
  const [showComments, setShowComments] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isHealing, setIsHealing] = useState(false)
  const [isCorrupting, setIsCorrupting] = useState(false)
  
  // Avatars State
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | null>(null)
  const [authorAvatar, setAuthorAvatar] = useState<string | null>(null)

  // Mobile Decrypt State
  const [isPressing, setIsPressing] = useState(false)
  const pressTimer = useRef<NodeJS.Timeout | null>(null)
  
  const isDead = bitIntegrity <= 0
  const isSecretActive = has_secret && bitIntegrity >= 80
  
  const { isUnlocked, unlock } = useSecretGate(id, isSecretActive, isHovered)
  
  const integrityBg = isDead ? "bg-red-500" : bitIntegrity < 50 ? "bg-amber-400" : "bg-[#00FF41]"
  const latestComments = localComments.filter(c => !c.parent_id).slice(-2);

  // --- FETCH AVATARS ---
  useEffect(() => {
    const getData = async () => {
        // 1. Get Current User (for Comment Box)
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user_metadata?.avatar_url) {
            setCurrentUserAvatar(user.user_metadata.avatar_url)
        }

        // 2. Get Post Author (for Header)
        // We assume the 'username' prop matches the database username
        const { data: authorData } = await supabase
            .from('users')
            .select('raw_user_meta_data')
            .eq('username', username)
            .single()
        
        // Extract avatar from metadata json
        if (authorData?.raw_user_meta_data?.avatar_url) {
            setAuthorAvatar(authorData.raw_user_meta_data.avatar_url)
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

  // --- TOUCH HANDLERS ---
  const handleTouchStart = () => {
    if (!isSecretActive || isUnlocked) return
    setIsPressing(true)
    pressTimer.current = setTimeout(() => {
        unlock()
        setIsPressing(false)
    }, 1500)
  }

  const handleTouchEnd = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current)
    setIsPressing(false)
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
              {/* --- POST AUTHOR AVATAR --- */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00FF41]/20 to-purple-500/20 border border-white/10 p-[2px] relative overflow-hidden">
                <div className="w-full h-full rounded-full bg-black/50 overflow-hidden relative">
                    {authorAvatar ? (
                        <Image 
                            src={authorAvatar} 
                            alt={username} 
                            fill 
                            className="object-cover" 
                            unoptimized={true} // Bypass Vercel
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
                {isSecretActive && !isUnlocked && (
                    <div className="flex items-center gap-1">
                        <Lock size={12} className="text-[#00FF41] drop-shadow-[0_0_5px_#00FF41]" />
                        <span className="text-[9px] text-[#00FF41]/70 font-mono hidden md:inline">TYPE 'OPEN'</span>
                    </div>
                )}
                {isUnlocked && (
                    <div className="flex items-center gap-1">
                        <Unlock size={12} className="text-red-500 drop-shadow-[0_0_5px_red]" />
                        <span className="text-[9px] text-red-500 font-mono tracking-widest">DECRYPTED</span>
                    </div>
                )}
              </div>
          </div>
      </div>

      {/* IMAGE CONTAINER */}
      <div 
        className="relative w-full aspect-square bg-black/50 z-10 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
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
            ${isPressing ? 'scale-95 brightness-150 hue-rotate-90' : ''} 
          `}
        />

        {isSecretActive && !isUnlocked && !isPressing && (
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none md:hidden opacity-60 flex flex-col items-center">
                 <Fingerprint size={48} className="text-white animate-pulse mb-2" />
                 <p className="text-[10px] font-mono font-bold text-white tracking-widest bg-black/60 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm">HOLD TO DECRYPT</p>
             </div>
        )}

        <AnimatePresence>
            {isPressing && !isUnlocked && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                    <div className="w-48 h-1.5 bg-white/20 rounded-full overflow-hidden mb-4">
                        <motion.div 
                            className="h-full bg-[#00FF41] shadow-[0_0_10px_#00FF41]"
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 1.5, ease: "linear" }}
                        />
                    </div>
                    <div className="text-[#00FF41] font-mono text-xs font-black tracking-widest animate-pulse">
                        BYPASSING SECURITY...
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {isUnlocked && (
             <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="absolute inset-0 z-30 bg-black/80 flex flex-col items-center justify-center p-8 text-center border-4 border-[#00FF41] box-border"
             >
                 <div className="text-4xl mb-4">🔓</div>
                 <h3 className="text-[#00FF41] text-xl font-black uppercase tracking-widest mb-2">Payload Decrypted</h3>
                 <p className="text-white/80 font-mono text-sm">
                     "Access Granted. Hidden data layer exposed."
                 </p>
             </motion.div>
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
                {!isDead && (
                <button onClick={handleHeal} disabled={isHealing || userCredits < 10} className={`group/btn relative flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isHealing ? 'animate-pulse text-[#00FF41]' : ''}`}>
                    <Wrench size={22} className={isHealing ? 'scale-110' : ''} />
                </button>
                )}
                {!isDead && (
                <button onClick={handleCorrupt} disabled={isCorrupting || userCredits < 10} className={`group/btn relative flex items-center justify-center text-white/70 hover:text-white transition-all active:scale-95 disabled:opacity-30 ${isCorrupting ? 'animate-shake text-red-500' : ''}`}>
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

         {caption && (
           <div className="mb-2 text-[15px] text-white/90 leading-tight">
             <span className="font-bold mr-2">@{username}</span>
             {caption}
           </div>
         )}

         {localComments.length > 0 && (
            <button onClick={() => setShowComments(!showComments)} className="text-white/50 text-sm mb-2 hover:text-white/70 transition-colors">
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

         {/* --- COMMENT INPUT TRIGGER (Current User Avatar) --- */}
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
             <div className="flex-1 text-white/30 text-sm group-hover/input:text-white/50 transition-colors">Add a comment...</div>
             <Send size={16} className="text-white/30 group-hover/input:text-[#00FF41] transition-colors" />
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