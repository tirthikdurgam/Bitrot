"use client"

import { Upload, User, LogIn } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client" // Import Supabase
import UploadModal from "./upload-modal"
import KnixcsLogo from "./knixcs-logo"

export default function Navbar() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // CHECK LOGIN STATUS ON LOAD
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Real-time listener: Updates navbar instantly when you login/logout
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#050505]/80 border-b border-white/5">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          
          {/* 1. LOGO */}
          <div className="flex items-center hover:opacity-80 transition-opacity">
            <KnixcsLogo /> 
          </div>

          {/* 2. CENTER MENU */}
          <div className="hidden md:flex items-center gap-12">
            <Link 
                href="/archive"
                className="font-montserrat text-[12px] font-bold tracking-[0.2em] text-white/50 hover:text-white transition-colors uppercase"
            >
                Archive
            </Link>
            <Link 
                href="/about"
                className="font-montserrat text-[12px] font-bold tracking-[0.2em] text-white/50 hover:text-white transition-colors uppercase"
            >
                About
            </Link>
          </div>

          {/* 3. RIGHT ACTIONS */}
          <div className="flex items-center gap-4">
            
            {/* Upload Button */}
            <button 
              onClick={() => setIsUploadOpen(true)} 
              className="group flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-full hover:bg-white/90 transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Upload size={16} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" /> 
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest font-montserrat">Upload</span>
            </button>

            {/* DYNAMIC AUTH BUTTON */}
            {user ? (
                // LOGGED IN: Profile Button
                <Link 
                    href="/profile" 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 hover:border-white/50 transition-all overflow-hidden"
                >
                   {/* If Google provides an avatar, show it. Otherwise show Icon */}
                   {user.user_metadata.avatar_url ? (
                       <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover" />
                   ) : (
                       <User size={16} className="text-white" />
                   )}
                </Link>
            ) : (
                // LOGGED OUT: Login Button
                <Link 
                    href="/login"
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:border-white/30 hover:bg-white/10 transition-all group"
                    title="Sign In"
                >
                   <LogIn size={16} className="text-white/60 group-hover:text-white transition-colors" />
                </Link>
            )}

          </div>
        </div>
      </nav>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={() => window.location.reload()} 
      />
    </>
  )
}