"use client"

import { useState } from "react"
import { Send, CornerDownRight } from "lucide-react"

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
  parent_id?: string | null
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  onPostComment?: (text: string, parentId?: string) => void
  variant?: "default" | "paper" // Keeping prop for compatibility, though we default to 'glass' style
}

export default function CommentSection({ 
  postId, 
  comments, 
  onPostComment 
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !onPostComment) return
    onPostComment(newComment, replyTo || undefined)
    setNewComment("")
    setReplyTo(null)
  }

  // Filter root comments vs replies
  const rootComments = comments.filter(c => !c.parent_id)
  const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

  return (
    <div className="flex flex-col gap-4">
      
      {/* 1. COMMENT LIST */}
      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {rootComments.length === 0 ? (
           <div className="text-center py-8 text-white/20 italic text-sm">
              No signals yet. Be the first to transmit.
           </div>
        ) : (
          rootComments.map(comment => (
            <div key={comment.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex-shrink-0" />
                
                <div className="flex-1">
                   <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-white tracking-wide">@{comment.username}</span>
                      <span className="text-[10px] text-white/30">{new Date(comment.created_at).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm text-white/80 leading-relaxed font-light">{comment.content}</p>
                   
                   <button 
                      onClick={() => setReplyTo(comment.id)} 
                      className="text-[10px] font-bold text-white/30 mt-1 hover:text-[#00FF41] transition-colors uppercase tracking-wider"
                   >
                      Reply
                   </button>
                </div>
              </div>

              {/* Replies */}
              {getReplies(comment.id).map(reply => (
                <div key={reply.id} className="flex gap-3 mt-3 pl-8 relative">
                   <CornerDownRight size={12} className="absolute left-3 top-2 text-white/20" />
                   <div className="w-6 h-6 rounded-full bg-white/5 border border-white/5 flex-shrink-0" />
                   <div className="flex-1">
                      <span className="text-xs font-bold text-white/90 mr-2">@{reply.username}</span>
                      <span className="text-xs text-white/60">{reply.content}</span>
                   </div>
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* 2. GLASS INPUT CAPSULE */}
      <form onSubmit={handleSubmit} className="relative mt-2">
        {replyTo && (
           <div className="flex items-center justify-between px-4 py-1 text-xs text-[#00FF41] bg-[#00FF41]/5 rounded-t-lg mx-2 border-x border-t border-[#00FF41]/20">
              <span>Replying to thread...</span>
              <button onClick={() => setReplyTo(null)} className="hover:text-white font-bold">✕</button>
           </div>
        )}
        
        <div className="relative group focus-within:ring-1 focus-within:ring-[#00FF41]/50 rounded-full transition-all">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Transmit signal..."
              className="w-full bg-white/5 hover:bg-white/10 focus:bg-black/40 text-white placeholder-white/30 text-sm px-5 py-3 rounded-full border border-white/10 outline-none transition-all pr-12 backdrop-blur-md"
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