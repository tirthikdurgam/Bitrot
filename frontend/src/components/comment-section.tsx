"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Send, CornerDownRight, X } from "lucide-react"

// Reuse the interface to keep types consistent
import { Comment } from "./feed-card"

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  onPostComment: (text: string, parentId?: string) => void
}

export default function CommentSection({ postId, comments, onPostComment }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  // Track who we are replying to: { id: commentId, username: string }
  const [replyingTo, setReplyingTo] = useState<{id: string, username: string} | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    // Pass the parentId if we are replying, otherwise undefined
    onPostComment(newComment, replyingTo?.id)
    
    // Reset form
    setNewComment("")
    setReplyingTo(null)
  }

  // --- RECURSIVE RENDERER ---
  const renderComments = (parentId: string | null = null, depth = 0) => {
    const relevantComments = comments.filter(c => 
        parentId === null ? !c.parent_id : c.parent_id === parentId
    )

    if (relevantComments.length === 0) return null

    return (
      <div className={`space-y-4 ${depth > 0 ? 'ml-6 border-l border-white/10 pl-4 mt-3' : ''}`}>
        {relevantComments.map(comment => (
          <div key={comment.id} className="group animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 mt-1 shrink-0" />
                
                <div className="flex-1">
                    {/* Header: Username + Time */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-white tracking-wide">@{comment.username}</span>
                        <span className="text-[10px] text-white/40 font-medium">
                           {!isNaN(new Date(comment.created_at).getTime()) 
                              ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                              : 'just now'}
                        </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-white/90 leading-relaxed mt-0.5 font-normal tracking-wide">{comment.content}</p>

                    {/* Reply Button */}
                    <button 
                        onClick={() => setReplyingTo({ id: comment.id, username: comment.username })}
                        className="text-[10px] font-bold text-white/30 hover:text-[#00FF41] mt-1.5 transition-colors uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                        <CornerDownRight size={10} /> Reply
                    </button>
                </div>
            </div>

            {/* RECURSION: Render children of this comment */}
            {renderComments(comment.id, depth + 1)}
          </div>
        ))}
      </div>
    )
  }

  return (
    // We add 'font-montserrat' class here to enforce the font from layout.tsx
    <div className="flex flex-col gap-4 font-montserrat">
      
      {/* 1. SCROLLABLE COMMENT LIST */}
      <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
         {comments.length === 0 ? (
            <div className="text-center py-8 text-white/20 italic text-sm font-light">
               No comments yet.
            </div>
         ) : (
            renderComments(null) // Start rendering from top-level
         )}
      </div>

      {/* 2. INPUT AREA */}
      <form onSubmit={handleSubmit} className="relative pt-2 border-t border-white/5">
         {/* Reply Indicator */}
         {replyingTo && (
             <div className="flex items-center justify-between text-xs text-[#00FF41] mb-2 bg-[#00FF41]/10 px-3 py-1.5 rounded-lg border border-[#00FF41]/20 animate-in slide-in-from-bottom-2">
                 <span className="flex items-center gap-1.5 font-bold tracking-wide">
                     <CornerDownRight size={12} />
                     Replying to @{replyingTo.username}
                 </span>
                 <button 
                    type="button" 
                    onClick={() => setReplyingTo(null)} 
                    className="hover:bg-[#00FF41]/20 p-1 rounded-md transition-colors"
                 >
                     <X size={12} />
                 </button>
             </div>
         )}
         
         <div className="relative group focus-within:ring-1 focus-within:ring-[#00FF41]/50 rounded-full transition-all">
            <input 
                type="text" 
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyingTo ? "Transmit reply..." : ""}
                className="w-full bg-white/5 hover:bg-white/10 focus:bg-black/40 text-white placeholder-white/30 text-sm px-5 py-3 rounded-full border border-white/10 outline-none transition-all pr-12 backdrop-blur-md font-medium tracking-wide"
            />
            <button 
                type="submit"
                disabled={!newComment.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00FF41] text-black rounded-full hover:scale-105 active:scale-95 disabled:opacity-0 disabled:scale-50 transition-all duration-200 shadow-[0_0_10px_rgba(0,255,65,0.4)]"
            >
                <Send size={14} className="ml-0.5" />
            </button>
         </div>
      </form>
    </div>
  )
}