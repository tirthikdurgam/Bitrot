"use client"

import { Upload, User, LogIn, Terminal, Menu, X } from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { createClient } from "@/utils/supabase/client"
import UploadModal from "./upload-modal"
import KnixcsLogo from "./bitloss-logo"

export default function Navbar() {
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  // CHECK LOGIN STATUS ON LOAD
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    // Real-time listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
       setUser(session?.user ?? null)
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#050505]/90 border-b border-white/10 font-montserrat">
        
        {/* Top Decorative Line */}
        <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#0066FF]/50 to-transparent opacity-50" />

        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* 1. LOGO & VERSION */}
          <div className="flex items-center gap-4">
            <div className="hover:opacity-80 transition-opacity cursor-pointer relative z-50">
              <KnixcsLogo /> 
            </div>

            <div className="hidden sm:flex items-center gap-2 px-2 py-0.5 border border-white/10 bg-white/5 text-[9px] font-bold tracking-widest text-white/40 uppercase rounded-sm">
                <Terminal size={8} />
                <span>SYS_V.2.0</span>
            </div>
          </div>

          {/* 2. DESKTOP CENTER MENU (Hidden on Mobile) */}
          <div className="hidden md:flex items-center h-full">
            <NavLink href="/">FEED</NavLink>
            <NavSeparator />
            <NavLink href="/archive">ARCHIVE</NavLink>
            <NavSeparator />
            <NavLink href="/about">ABOUT</NavLink>
          </div>

          {/* 3. RIGHT ACTIONS */}
          <div className="flex items-center gap-3 md:gap-6">
            
            {/* System Status (Desktop Only) */}
            <div className="hidden lg:flex flex-col items-end">
                <span className="text-[8px] font-bold text-[#0066FF] tracking-widest uppercase flex items-center gap-1">
                    <div className="w-1 h-1 bg-[#0066FF] rounded-full animate-pulse" />
                    ONLINE
                </span>
                <span className="text-[8px] text-white/30 tracking-wider">LATENCY: 12ms</span>
            </div>

            <div className="h-8 w-[1px] bg-white/10 hidden lg:block" />

            {/* Upload Button - COMPACT ON MOBILE */}
            <button 
              onClick={() => setIsUploadOpen(true)} 
              className="group flex items-center gap-2 px-3 md:px-5 py-2 border border-[#0066FF]/50 text-[#0066FF] bg-[#0066FF]/5 hover:bg-[#0066FF] hover:text-white transition-all duration-300 rounded-full"
            >
              <Upload size={16} className="md:w-[14px] md:h-[14px] group-hover:-translate-y-0.5 transition-transform" /> 
              {/* Text hidden on mobile, visible on small screens and up */}
              <span className="hidden sm:inline text-[10px] font-bold uppercase tracking-widest">Upload Data</span>
            </button>

            {/* AUTH BUTTON */}
            {user ? (
                <Link 
                    href="/profile" 
                    className="w-8 h-8 md:w-9 md:h-9 border border-white/20 bg-white/5 flex items-center justify-center hover:border-[#0066FF] hover:shadow-[0_0_10px_#0066FF] transition-all overflow-hidden group rounded-full"
                >
                    {user.user_metadata.avatar_url ? (
                        <img src={user.user_metadata.avatar_url} alt="User" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                        <User size={14} className="text-white/60 group-hover:text-white" />
                    )}
                </Link>
            ) : (
                <Link 
                    href="/login"
                    className="hidden sm:flex items-center gap-2 text-[10px] font-bold text-white/50 hover:text-white uppercase tracking-widest transition-colors group"
                >
                    <span>LOGIN</span>
                    <LogIn size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            )}

            {/* MOBILE MENU TOGGLE */}
            <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white active:scale-95 transition-all"
            >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
        </div>

        {/* 4. MOBILE MENU DROPDOWN */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="md:hidden border-t border-white/10 bg-[#050505]/95 backdrop-blur-xl overflow-hidden"
                >
                    <div className="flex flex-col p-4 space-y-4">
                        <MobileNavLink href="/" onClick={() => setIsMobileMenuOpen(false)}>FEED</MobileNavLink>
                        <MobileNavLink href="/archive" onClick={() => setIsMobileMenuOpen(false)}>ARCHIVE</MobileNavLink>
                        <MobileNavLink href="/about" onClick={() => setIsMobileMenuOpen(false)}>ABOUT</MobileNavLink>
                        
                        {!user && (
                             <MobileNavLink href="/login" onClick={() => setIsMobileMenuOpen(false)} isHighlight>
                                LOGIN SYSTEM
                             </MobileNavLink>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </nav>

      <UploadModal 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onUploadSuccess={() => window.location.reload()} 
      />
    </>
  )
}

// HELPER: Desktop Link Component
function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
    return (
        <Link 
            href={href}
            className="relative px-6 py-2 group overflow-hidden"
        >
            <span className="relative z-10 text-[11px] font-bold tracking-[0.2em] text-white/50 group-hover:text-white transition-colors uppercase">
                {children}
            </span>
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-[#0066FF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
        </Link>
    )
}

// HELPER: Mobile Link Component
function MobileNavLink({ href, children, onClick, isHighlight }: { href: string, children: React.ReactNode, onClick: () => void, isHighlight?: boolean }) {
    return (
        <Link 
            href={href}
            onClick={onClick}
            className={`block w-full py-4 text-center text-xs font-bold tracking-[0.2em] uppercase transition-colors border border-white/5 rounded-lg
                ${isHighlight 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "text-white/60 hover:text-white hover:bg-white/5 hover:border-white/10"
                }`}
        >
            {children}
        </Link>
    )
}

// HELPER: Separator
function NavSeparator() {
    return <span className="text-white/10 text-[8px] font-mono">/</span>
}