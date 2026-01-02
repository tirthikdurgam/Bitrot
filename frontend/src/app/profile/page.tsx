"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon, Mail, Shield, Loader2, X } from "lucide-react"
import Link from "next/link"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // 1. SAFE Initial Check
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          setUser(session.user)
          setLoading(false)
        } else {
          router.push("/login")
        }
      } catch (err) {
        console.error("Session check failed:", err)
        router.push("/login")
      }
    }

    checkUser()

    // 2. Real-time Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user)
        setLoading(false)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        router.refresh()
        router.push("/") 
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [router, supabase])

  // Email Masking Utility
  const maskEmail = (email: string) => {
    if (!email) return "Unknown"
    const [name, domain] = email.split("@")
    if (!name || !domain) return email
    const visiblePart = name.slice(0, 3)
    return `${visiblePart}*****@${domain}`
  }

  // ROBUST LOGOUT HANDLER
  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Logout network error (ignoring):", error)
    } finally {
      router.refresh()
      router.push("/") 
    }
  }

  if (loading) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
            <Loader2 className="animate-spin text-white/50" size={32} />
        </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] pt-20 p-6 font-montserrat">
        
        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        {/* Profile Card */}
        <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300">
            
            {/* NEW: Back / Close Button */}
            <Link 
                href="/" 
                className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                aria-label="Back to Feed"
            >
                <X size={20} />
            </Link>

            {/* Header / Avatar */}
            <div className="flex flex-col items-center mb-8 mt-2">
                <div className="w-24 h-24 rounded-full border-2 border-white/10 p-1 mb-4 relative overflow-hidden group shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {user?.user_metadata?.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full">
                            <UserIcon size={40} className="text-white/50" />
                        </div>
                    )}
                </div>
                <h1 className="text-2xl font-bold text-white text-center font-montserrat">{user?.user_metadata?.full_name || "Anonymous Observer"}</h1>
                
                <p className="text-[10px] text-green-500/80 font-montserrat font-bold mt-2 tracking-[0.2em] uppercase border border-green-900/30 bg-green-900/10 px-3 py-1 rounded-full">
                    Identity Verified
                </p>
            </div>

            {/* Details List */}
            <div className="space-y-4 mb-8">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                        <Mail size={18} className="text-white/60" />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-0.5 font-montserrat">Signal Source</span>
                        <span className="text-sm text-white/90 font-inter truncate" title={user?.email}>
                            {maskEmail(user?.email)}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                    <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                         <Shield size={18} className="text-white/60" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-0.5 font-montserrat">Clearance Level</span>
                        <span className="text-sm text-white/90 font-inter">Standard Observer</span>
                    </div>
                </div>
            </div>

            {/* Sign Out Button */}
            <button 
                onClick={handleSignOut}
                className="w-full py-4 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest font-montserrat"
            >
                <LogOut size={16} />
                <span>Terminate Session</span>
            </button>

        </div>
    </div>
  )
}