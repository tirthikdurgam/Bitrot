"use client"

import { MessageSquare, CornerDownRight, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"

interface Comment {
  id: string
  username: string
  content: string
  created_at: string
  parent_id?: string | null
}

interface CommentSectionProps {
  postId: string
  // We keep this prop for initial data (optimistic UI), 
  // but we will prioritize fetched data if available.
  comments: Comment[] 
  onPostComment: (text: string, parentId?: string) => void
}

// Helper: Time Ago
function timeAgo(dateString: string) {
  if (!dateString) return "Just now"
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 60) return "Just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// --- RECURSIVE COMMENT ITEM ---
interface CommentItemProps {
  comment: Comment
  depth?: number
  allComments: Comment[]
  replyingTo: string | null
  setReplyingTo: (id: string | null) => void
  replyInput: string
  setReplyInput: (val: string) => void
  onReplySubmit: (parentId: string) => void
}

const CommentItem = ({ 
  comment, 
  depth = 0, 
  allComments, 
  replyingTo, 
  setReplyingTo, 
  replyInput, 
  setReplyInput, 
  onReplySubmit 
}: CommentItemProps) => {
  // Find children for this comment
  const replies = allComments.filter(c => c.parent_id === comment.id)
  const isReplying = replyingTo === comment.id

  return (
    <div className={`flex flex-col ${depth > 0 ? "ml-6 border-l border-white/10 pl-4" : ""}`}>
      <div className="flex gap-3 group py-2">
         {/* Avatar */}
         <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
              <span className="text-[10px] font-bold text-gray-400 font-montserrat">
                {comment.username ? comment.username[0].toUpperCase() : "?"}
              </span>
            </div>
         </div>

         {/* Content */}
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 font-montserrat">
              <span className="font-bold text-gray-300 truncate max-w-[120px]">@{comment.username}</span>
              <span className="text-[10px]">•</span>
              <span className="text-[10px]">{timeAgo(comment.created_at)}</span>
            </div>

            <div className="text-sm text-gray-200 font-montserrat leading-relaxed mb-2 break-words">
              {comment.content}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 text-gray-600 font-montserrat">
               <button 
                 onClick={() => setReplyingTo(isReplying ? null : comment.id)}
                 className="flex items-center gap-1 text-[10px] font-bold hover:text-[#00FF41] transition-colors uppercase tracking-wider"
               >
                 <MessageSquare size={10} /> Reply
               </button>
            </div>

            {/* Reply Input Box */}
            {isReplying && (
              <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-2">
                 <CornerDownRight className="text-gray-600 mt-2" size={16} />
                 <div className="flex-1">
                   <textarea
                     value={replyInput}
                     onChange={(e) => setReplyInput(e.target.value)}
                     autoFocus
                     placeholder={`Reply to @${comment.username}...`}
                     className="w-full bg-black/30 text-white p-2 text-sm border border-white/20 outline-none focus:border-[#00FF41] rounded-sm min-h-[60px] font-montserrat placeholder:text-gray-700"
                   />
                   <div className="flex justify-end gap-2 mt-2">
                      <button onClick={() => setReplyingTo(null)} className="text-xs text-gray-500 hover:text-white font-montserrat">Cancel</button>
                      <button onClick={() => onReplySubmit(comment.id)} className="bg-white text-black text-xs font-bold px-3 py-1 hover:bg-[#00FF41] font-montserrat uppercase">Reply</button>
                   </div>
                 </div>
              </div>
            )}
         </div>
      </div>

      {/* Recursively render replies */}
      <div className="flex flex-col gap-2">
        {replies.map(reply => (
          <CommentItem 
            key={reply.id} 
            comment={reply} 
            depth={depth + 1}
            allComments={allComments}
            replyingTo={replyingTo}
            setReplyingTo={setReplyingTo}
            replyInput={replyInput}
            setReplyInput={setReplyInput}
            onReplySubmit={onReplySubmit}
          />
        ))}
      </div>
    </div>
  )
}

// -----------------------------------------------------------

export default function CommentSection({ postId, comments: initialComments, onPostComment }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [loading, setLoading] = useState(false)
  
  const [mainInput, setMainInput] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyInput, setReplyInput] = useState("")

  // --- THE FIX: Fetch latest comments when opened ---
  useEffect(() => {
    // If initialComments is empty, try to fetch to be safe
    const fetchComments = async () => {
        try {
            setLoading(true)
            // Call backend feed again (or a specific comment endpoint if you have one)
            // Since we don't have a dedicated /comments endpoint yet, 
            // we will rely on props but updating state if props change.
            // Ideally, you would fetch: await fetch(`api/comments/${postId}`)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }
    // Sync props to state whenever parent passes new data
    setComments(initialComments)
  }, [initialComments, postId])

  // Only render top-level comments here
  const rootComments = comments.filter(c => !c.parent_id)
  
  const handleMainSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!mainInput.trim()) return
    onPostComment(mainInput)
    setMainInput("")
  }

  const handleReplySubmit = (parentId: string) => {
    if (!replyInput.trim()) return
    onPostComment(replyInput, parentId)
    setReplyingTo(null)
    setReplyInput("")
  }

  return (
    <div className="w-full bg-[#080808] border-t border-white/10 p-4">
      {/* MAIN INPUT */}
      <form onSubmit={handleMainSubmit} className="mb-8">
        <div className="relative rounded-sm border border-white/20 bg-white/[0.02] focus-within:border-[#00FF41] focus-within:bg-black transition-colors">
          <textarea
            value={mainInput}
            onChange={(e) => setMainInput(e.target.value)}
            placeholder="Write a comment..."
            className="w-full bg-transparent text-white p-3 min-h-[80px] outline-none font-montserrat text-sm resize-y placeholder:text-gray-600"
          />
          <div className="flex justify-end p-2 border-t border-white/10">
            <button
              type="submit"
              disabled={!mainInput.trim()}
              className="px-4 py-1 text-xs font-bold bg-white text-black hover:bg-[#00FF41] transition-colors rounded-sm uppercase font-montserrat disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Post Comment
            </button>
          </div>
        </div>
      </form>

      {/* COMMENT TREE */}
      {loading ? (
          <div className="flex justify-center py-4">
              <Loader2 className="animate-spin text-white/20" />
          </div>
      ) : (
          <div className="space-y-6">
            {rootComments.length === 0 ? (
                <p className="text-center text-xs text-gray-600 font-montserrat italic py-4">No signals yet. Be the first to transmit.</p>
            ) : (
                rootComments.map(comment => (
                <CommentItem 
                    key={comment.id} 
                    comment={comment} 
                    allComments={comments}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyInput={replyInput}
                    setReplyInput={setReplyInput}
                    onReplySubmit={handleReplySubmit}
                />
                ))
            )}
          </div>
      )}
    </div>
  )
}