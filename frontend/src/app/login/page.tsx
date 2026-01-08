"use client"

import { useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { Loader2, AlertCircle, Mail, X } from "lucide-react"
import Link from "next/link"
import { SocialButton } from "@/components/auth/social-button"

// Simple SVGs for logos
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)"><path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"/><path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"/><path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.734 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"/><path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.799 L -6.734 42.379 C -8.804 40.449 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"/></g></svg>
)

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill="white" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405 1.02 0 2.04.135 3 .405 2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
)

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  // 1. STRICT VALIDATION HELPER
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validation Check
    if (!validateEmail(email)) {
        setError("Invalid signal source. Please verify email format.")
        setLoading(false)
        return
    }

    try {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                // Ensure this points to your callback route
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        })

        if (error) throw error
        alert("Encrypted link sent to your signal source. Check your inbox.")
    } catch (err: any) {
        setError(err.message)
    } finally {
        setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: "google" | "github") => {
    setLoading(true)
    setError(null)
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
        if (error) throw error
    } catch (err: any) {
        setError(err.message)
        setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#050505] p-4 font-montserrat relative overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />

      {/* GLASS CONTAINER */}
      <div className="w-full max-w-[420px] bg-black/60 border border-white/10 rounded-2xl p-8 relative z-10 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
        
        {/* Close / Dismiss Button - Using Link to '/' with prefetch for speed */}
        <Link 
            href="/" 
            className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            aria-label="Close Login"
        >
            <X size={20} />
        </Link>

        {/* Header */}
        <div className="mb-8 text-center mt-2">
          <h1 className="text-3xl font-bold text-white mb-2 font-montserrat">
            Log in or Sign up
          </h1>
          <p className="text-sm text-white/50 font-inter">
            Access the BitRot Website.
          </p>
        </div>

        {/* Error Message */}
        {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <p className="text-xs text-red-300 font-inter">{error}</p>
            </div>
        )}

        {/* EMAIL FORM */}
        <form onSubmit={handleEmailLogin} className="space-y-4 mb-8">
          <div className="relative group">
            <span className="absolute left-4 top-3.5 text-white/40 group-focus-within:text-white transition-colors">
                <Mail size={18} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#111] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white text-sm font-inter focus:outline-none focus:border-white/30 focus:bg-[#151515] transition-all placeholder:text-white/20"
              placeholder="name@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0056D2] hover:bg-[#0046AB] text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed font-montserrat text-sm shadow-[0_0_15px_rgba(0,86,210,0.3)]"
          >
            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Continue"}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-4 bg-black text-white/40 font-inter uppercase tracking-widest">or</span>
          </div>
        </div>

        {/* SOCIAL STACK */}
        <div className="space-y-3">
          <SocialButton 
            icon={<GoogleIcon />} 
            label="Continue with Google" 
            onClick={() => handleSocialLogin('google')} 
            disabled={loading} 
          />
          <SocialButton 
            icon={<GithubIcon />} 
            label="Continue with GitHub" 
            onClick={() => handleSocialLogin('github')} 
            disabled={loading} 
          />
        </div>

        {/* FOOTER */}
        <p className="mt-8 text-[10px] text-center text-white/30 font-inter leading-relaxed">
            By continuing, you agree to the <Link href="/terms" className="underline hover:text-white">Knixcs Protocol</Link>. 
            <br/> This site is protected by reCAPTCHA Enterprise.
        </p>

      </div>
    </div>
  )
}