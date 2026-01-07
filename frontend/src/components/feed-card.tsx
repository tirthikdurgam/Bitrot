"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, MessageSquare, Lock, Crosshair, ShieldAlert } from "lucide-react"
import { useSecretGate } from "@/hooks/useSecretGate"
import CommentSection from "./comment-section"

// --- AESTHETIC COMPONENTS ---

const HazardStrip = () => (
  <div className="h-3 w-full border-b border-white/20 overflow-hidden relative bg-[#0a0a0a]">
    <div className="absolute inset-0 opacity-30"
      style={{
        backgroundImage: `repeating-linear-gradient(
          -45deg,
          transparent,
          transparent 4px,
          #fff 4px,
          #fff 8px
        )`
      }}
    />
  </div>
)

const BarcodeVertical = () => (
  <div className="h-full w-6 flex flex-col justify-between opacity-60 mix-blend-screen border-l border-white/10 ml-2 pl-2">
     {Array.from({ length: 16 }).map((_, i) => (
        <div key={i} className="w-full bg-white" style={{ height: Math.random() * 2 + 1 }} />
     ))}
  </div>
)

const GlobeGrid = () => (
    <div className="w-6 h-6 rounded-full border border-white/40 relative flex items-center justify-center overflow-hidden opacity-80">
        <div className="absolute inset-0 border border-white/20 rounded-full scale-125" />
        <div className="absolute w-full h-[1px] bg-white/30 top-1/2 -translate-y-1/2" />
        <div className="absolute h-full w-[1px] bg-white/30 left-1/2 -translate-x-1/2" />
    </div>
)

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
  
  const isDead = bitIntegrity <= 0
  const isSecretActive = has_secret && bitIntegrity >= 80
  const secretHandlers = useSecretGate(id, isSecretActive, isHovered)
  
  const integrityColor = isDead ? "text-red-500" : bitIntegrity < 50 ? "text-yellow-400" : "text-white"

  const handlePostComment = async (text: string, parentId?: string) => {
    try {
      await fetch("/api/comment", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: id, content: text, parent_id: parentId })
      })
      window.location.reload()
    } catch (error) {
      console.error("Transmission Error:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full bg-[#030303] border border-white/15 relative group hover:border-white/40 transition-all duration-300 font-rajdhani"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      
      {/* ROW 1: HEADER STRIP */}
      <div className="flex flex-col">
        <HazardStrip />
        <div className="flex border-b border-white/20 h-10">
            
            {/* Box 1: ASSET LABEL */}
            <div className="flex-1 px-3 flex items-center justify-between bg-white/[0.02] border-r border-white/20">
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white/50 rounded-sm" />
                    <span className="text-[11px] font-bold text-white tracking-[0.15em] uppercase">
                          {isSecretActive ? "ENCRYPTED_PAYLOAD" : "STANDARD_ASSET"}
                    </span>
                </div>
                {isSecretActive && <Lock size={12} className="text-[#00FF41]" />}
            </div>

            {/* Box 2: GLOBE ICON */}
            <div className="w-12 flex items-center justify-center bg-black">
                <GlobeGrid />
            </div>
        </div>
      </div>

      {/* ROW 2: IMAGE VIEWPORT (OPTIMIZED) */}
      <div className="relative aspect-square w-full bg-[#050505] border-b border-white/20 overflow-hidden cursor-crosshair group">
        
        {/* Crosshairs */}
        <div className="absolute top-2 left-2 text-white/40 z-20"><Crosshair size={10}/></div>
        <div className="absolute top-2 right-2 text-white/40 z-20"><Crosshair size={10}/></div>
        <div className="absolute bottom-2 left-2 text-white/40 z-20"><Crosshair size={10}/></div>
        <div className="absolute bottom-2 right-2 text-white/40 z-20"><Crosshair size={10}/></div>

        <Image 
          src={image} 
          alt={username} 
          fill 
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={`object-cover transition-all duration-700 ${isDead ? 'grayscale contrast-150 brightness-50' : 'group-hover:scale-[1.02] grayscale hover:grayscale-0'}`}
          {...(isSecretActive ? secretHandlers : {})}
          // REMOVED: unoptimized={true} -> This enables automatic optimization
        />

        {isDead && (
           <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/90 backdrop-blur-sm">
              <div className="border border-red-500/50 p-6 bg-red-900/10 text-center">
                 <ShieldAlert className="mx-auto text-red-500 mb-2" size={32} />
                 <h2 className="text-red-500 font-share-tech text-3xl tracking-widest uppercase">Nullified</h2>
              </div>
           </div>
        )}
      </div>

      {/* ROW 3: TECHNICAL DATA GRID */}
      <div className="grid grid-cols-12 border-b border-white/20">
         
         {/* CELL 1: INTEGRITY */}
         <div className="col-span-4 p-2 border-r border-white/20 flex flex-col justify-between bg-white/[0.02]">
             <span className="text-[9px] text-white/40 font-semibold tracking-widest uppercase">Integrity</span>
             <div className="flex items-baseline gap-0.5">
                 <span className={`text-2xl font-share-tech ${integrityColor}`}>{Math.floor(bitIntegrity)}</span>
                 <span className="text-[10px] text-white/40 font-share-tech">.{bitIntegrity.toFixed(1).split('.')[1]}%</span>
             </div>
             {/* Tiny progress bar */}
             <div className="w-full bg-white/10 h-0.5 mt-1">
                 <div className="h-full bg-white/80" style={{ width: `${bitIntegrity}%` }} />
             </div>
         </div>

         {/* CELL 2: USER INFO */}
         <div className="col-span-6 p-2 border-r border-white/20 flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <span className="text-[9px] text-white/40 font-semibold tracking-widest uppercase">Operator</span>
                <span className="text-[9px] text-white/30 font-share-tech">GEN:{generations}</span>
             </div>
             <span className="text-sm font-bold text-white truncate w-full">@{username}</span>
         </div>

         {/* CELL 3: VERTICAL BARCODE */}
         <div className="col-span-2 flex items-center justify-center bg-black overflow-hidden">
             <BarcodeVertical />
         </div>
      </div>

      {/* ROW 4: FOOTER & ACTIONS */}
      <div className="p-2 flex items-center justify-between bg-[#080808] h-10">
         <div className="flex items-center gap-4">
             <button 
                onClick={() => setShowComments(!showComments)}
                className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-2 py-1 transition-all ${
                    showComments ? "text-[#00FF41] bg-[#00FF41]/10" : "text-white/40 hover:text-white"
                }`}
             >
                <MessageSquare size={10} /> 
                LOGS [{comments.length}]
             </button>
             <div className="flex items-center gap-1 text-[10px] text-white/40 font-bold uppercase tracking-widest">
                 <Eye size={10} /> {witnesses}
             </div>
         </div>
         
         {/* ID HASH */}
         <div className="text-[9px] text-white/20 font-share-tech tracking-wider">
             ID_{id.slice(0,6).toUpperCase()}
         </div>
      </div>

      {/* COMMENTS DRAWER */}
      <AnimatePresence>
        {showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/20 bg-black font-share-tech"
          >
             <div className="py-1 bg-white/5 border-b border-white/10 text-[8px] text-center text-white/30 tracking-[0.3em] uppercase">
                 /// SECURE_CONNECTION_ESTABLISHED ///
             </div>
             <CommentSection 
                postId={id} 
                comments={comments} 
                onPostComment={handlePostComment} 
             />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}