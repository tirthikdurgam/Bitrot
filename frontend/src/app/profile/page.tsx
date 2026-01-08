"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { LogOut, User as UserIcon, Mail, Shield, Loader2, X, Grid, Fingerprint, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { logout } from "../auth/logout/actions"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

// UTILITY: Hides scrollbar but allows scrolling
const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"identity" | "artifacts">("identity")
  
  // Artifacts State
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [loadingArtifacts, setLoadingArtifacts] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // 1. Initial User Check
  useEffect(() => {
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
  }, [router, supabase])

  // 2. Fetch Artifacts when Tab Changes
  useEffect(() => {
    if (activeTab === "artifacts" && user) {
        const fetchArtifacts = async () => {
            setLoadingArtifacts(true)
            
            let username = user.user_metadata?.full_name || user.email?.split('@')[0] || "Anonymous_User"
            username = username.replace(/\s+/g, '_')

            const { data, error } = await supabase
                .from('images')
                .select('*')
                .eq('killed_by', username)
                .order('created_at', { ascending: false })
                .limit(50)

            if (!error && data) {
                setArtifacts(data)
            }
            setLoadingArtifacts(false)
        }
        fetchArtifacts()
    }
  }, [activeTab, user, supabase])

  const maskEmail = (email: string) => {
    if (!email) return "Unknown"
    const [name, domain] = email.split("@")
    if (!name || !domain) return email
    const visiblePart = name.slice(0, 3)
    return `${visiblePart}*****@${domain}`
  }

  // 3. UPDATED: Robust URL Generator
  const getImageUrl = (path: string) => {
    if (!path) return ""
    // Ensure no double slashes if path starts with /
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    const baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/bitloss-images/${cleanPath}`
    
    // Cache buster to force reload if previous 403 was cached
    return `${baseUrl}?t=${Date.now()}`
  }

  if (loading) {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-[#050505]">
            <Loader2 className="animate-spin text-[#0066FF]" size={32} />
        </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] pt-20 p-6 font-montserrat">
        
        {/* Background Glow (Updated to System Blue) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#0066FF]/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

        {/* Profile Card Container */}
        <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 flex flex-col min-h-[600px] max-h-[85vh]">
            
            {/* Close Button */}
            <Link 
                href="/" 
                className="absolute top-5 right-5 text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full z-20"
            >
                <X size={20} />
            </Link>

            {/* Header / Avatar */}
            <div className="flex flex-col items-center mb-6 mt-2 shrink-0">
                <div className="w-20 h-20 rounded-full border-2 border-white/10 p-1 mb-3 relative overflow-hidden shadow-[0_0_30px_rgba(0,102,255,0.2)]">
                    {user?.user_metadata?.avatar_url ? (
                        <Image 
                            src={user.user_metadata.avatar_url} 
                            alt="Avatar" 
                            fill
                            className="rounded-full object-cover" 
                            unoptimized
                            priority
                            referrerPolicy="no-referrer" // <--- FIX FOR GOOGLE IMAGES
                        />
                    ) : (
                        <div className="w-full h-full bg-white/5 flex items-center justify-center rounded-full">
                            <UserIcon size={32} className="text-white/50" />
                        </div>
                    )}
                </div>
                <h1 className="text-xl font-bold text-white text-center font-montserrat uppercase tracking-wide">
                    {user?.user_metadata?.full_name || "Anonymous Observer"}
                </h1>
                <p className="text-[10px] text-[#0066FF] font-montserrat font-bold mt-2 tracking-[0.2em] uppercase border border-[#0066FF]/30 bg-[#0066FF]/10 px-3 py-1 rounded-full">
                    Identity Verified
                </p>
            </div>

            {/* --- TAB SWITCHER --- */}
            <div className="flex p-1 bg-white/5 rounded-xl border border-white/5 mb-6 shrink-0">
                <button 
                    onClick={() => setActiveTab("identity")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === "identity" ? "bg-[#0066FF]/20 text-white shadow-[0_0_10px_rgba(0,102,255,0.2)] border border-[#0066FF]/50" : "text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent"
                    }`}
                >
                    <Fingerprint size={14} /> Identity
                </button>
                <button 
                    onClick={() => setActiveTab("artifacts")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                        activeTab === "artifacts" ? "bg-[#0066FF]/20 text-white shadow-[0_0_10px_rgba(0,102,255,0.2)] border border-[#0066FF]/50" : "text-white/30 hover:text-white/60 hover:bg-white/5 border border-transparent"
                    }`}
                >
                    <Grid size={14} /> Artifacts
                </button>
            </div>

            {/* --- CONTENT AREA --- */}
            <div className="flex-1 relative overflow-hidden flex flex-col">
                <AnimatePresence mode="wait">
                    
                    {/* TAB 1: IDENTITY */}
                    {activeTab === "identity" ? (
                        <motion.div 
                            key="identity"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#0066FF]/20 transition-colors">
                                    <Mail size={18} className="text-white/60 group-hover:text-[#0066FF]" />
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-0.5 font-montserrat">Signal Source</span>
                                    <span className="text-sm text-white/90 font-inter truncate" title={user?.email}>
                                        {maskEmail(user?.email)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-[#0066FF]/20 transition-colors">
                                     <Shield size={18} className="text-white/60 group-hover:text-[#0066FF]" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[9px] text-white/30 uppercase tracking-widest font-bold mb-0.5 font-montserrat">Clearance Level</span>
                                    <span className="text-sm text-white/90 font-inter">Standard Observer</span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* TAB 2: ARTIFACTS */
                        <motion.div 
                            key="artifacts"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                            className="h-full flex flex-col"
                        >
                            <div className={`flex-1 overflow-y-auto ${scrollbarHiddenClass}`}>
                                
                                {loadingArtifacts ? (
                                     <div className="h-full flex items-center justify-center">
                                         <Loader2 className="animate-spin text-[#0066FF]" size={24} />
                                     </div>
                                ) : artifacts.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2 pb-2">
                                        {artifacts.map((art) => (
                                            <div 
                                                key={art.id} 
                                                className="aspect-square relative group rounded-lg overflow-hidden border border-white/5 hover:border-red-500/50 transition-all cursor-pointer bg-black/20"
                                            >
                                                <Image 
                                                    src={getImageUrl(art.storage_path)} 
                                                    alt="Artifact" 
                                                    fill
                                                    className="object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 grayscale group-hover:grayscale-0"
                                                    unoptimized
                                                    priority={true} 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                                                    <span className="text-[8px] font-mono text-red-500 uppercase tracking-widest">
                                                        Decayed
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                                        <div className="p-4 bg-white/5 rounded-full mb-3">
                                            <AlertTriangle size={24} className="text-white/20" />
                                        </div>
                                        <h3 className="text-white text-sm font-bold mb-1">No Decayed Signals</h3>
                                        <p className="text-xs text-white/30 max-w-[200px]">
                                            You have not witnessed the total destruction of any artifact yet.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>

            {/* --- FOOTER --- */}
            <div className="mt-6 pt-6 border-t border-white/5 shrink-0">
                <form action={logout}>
                    <button 
                        type="submit"
                        className="w-full py-3 flex items-center justify-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 rounded-xl transition-all font-bold text-xs uppercase tracking-widest font-montserrat"
                    >
                        <LogOut size={16} />
                        <span>Terminate Session</span>
                    </button>
                </form>
            </div>

        </div>
    </div>
  )
}