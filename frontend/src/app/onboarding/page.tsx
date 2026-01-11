'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function Onboarding() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simple client-side validation
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_')
    if (cleanUsername.length < 3) {
        setError("Username must be at least 3 characters")
        setLoading(false)
        return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user found')

      const { error: updateError } = await supabase
        .from('users')
        .upsert({ 
          id: user.id, 
          username: cleanUsername,
        })

      if (updateError) {
        if (updateError.code === '23505') throw new Error('Username is already taken.')
        throw updateError
      }

      router.refresh()
      router.push('/')

    } catch (err: any) {
      console.error(err)
      setError(err.message || "Failed to set username")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex h-screen items-center justify-center bg-[#050505] text-white font-montserrat overflow-hidden">
      
      {/* 1. ATMOSPHERE BACKGROUND */}
      <div className="absolute inset-0 opacity-[0.05] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(0,0,255,0.06),rgba(0,100,255,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none opacity-20" />

      {/* 2. MAIN CARD */}
      <form 
        onSubmit={handleSubmit} 
        className="relative z-10 p-10 border border-white/10 bg-black/40 rounded-3xl shadow-[0_0_50px_rgba(0,102,255,0.15)] w-full max-w-md backdrop-blur-xl group"
      >
        {/* Animated Border Glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066FF] to-purple-600 rounded-3xl opacity-20 group-hover:opacity-40 transition duration-1000 blur-lg -z-10" />

        <div className="mb-8 text-center">
            <h1 className="text-4xl font-black tracking-tighter text-white mb-2 glitch-text" data-text="IDENTIFY YOURSELF">
                IDENTIFY YOURSELF
            </h1>
            <p className="text-white/60 text-sm font-medium tracking-wide">
                Choose a unique callsign for the network.
            </p>
        </div>
        
        <div className="space-y-6">
            <div className="group/input">
                <label className="text-xs font-bold text-[#0066FF] uppercase tracking-[0.2em] mb-2 block group-focus-within/input:text-white transition-colors">
                    Username
                </label>
                <div className="relative">
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. Neo_phyte"
                      className="w-full bg-white/5 border border-white/10 focus:border-[#0066FF] focus:bg-black/50 rounded-xl p-4 text-white placeholder:text-white/20 outline-none transition-all font-medium tracking-wider shadow-inner"
                      required
                    />
                    {/* Decorative Corner */}
                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/30 group-focus-within/input:border-[#0066FF] transition-colors" />
                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/30 group-focus-within/input:border-[#0066FF] transition-colors" />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                </div>
            )}
            
            <button 
                disabled={loading} 
                className="w-full relative overflow-hidden bg-white text-black font-black uppercase tracking-[0.15em] p-5 rounded-xl hover:bg-[#0066FF] hover:text-white hover:scale-[1.02] active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-[#0066FF]/50"
            >
              {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} /> 
                    <span>Syncing...</span>
                  </>
              ) : (
                  'INITIALIZE IDENTITY'
              )}
            </button>
        </div>
      </form>

      {/* 3. GLITCH CSS STYLES */}
      <style jsx>{`
        .glitch-text { position: relative; }
        .glitch-text::before, .glitch-text::after {
          content: attr(data-text); position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.8;
        }
        .glitch-text::before {
          color: #0066FF; z-index: -1; animation: glitch-anim-1 3s infinite linear alternate-reverse;
        }
        .glitch-text::after {
          color: #ff0055; z-index: -2; animation: glitch-anim-2 2s infinite linear alternate-reverse;
        }
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 0); }
          20% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
          40% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 0); }
          60% { clip-path: inset(80% 0 5% 0); transform: translate(2px, 0); }
          80% { clip-path: inset(30% 0 20% 0); transform: translate(-2px, 0); }
          100% { clip-path: inset(10% 0 60% 0); transform: translate(2px, 0); }
        }
        @keyframes glitch-anim-2 {
          0% { clip-path: inset(10% 0 60% 0); transform: translate(2px, 0); }
          20% { clip-path: inset(80% 0 5% 0); transform: translate(-2px, 0); }
          40% { clip-path: inset(30% 0 20% 0); transform: translate(2px, 0); }
          60% { clip-path: inset(10% 0 50% 0); transform: translate(-2px, 0); }
          80% { clip-path: inset(60% 0 10% 0); transform: translate(2px, 0); }
          100% { clip-path: inset(20% 0 80% 0); transform: translate(-2px, 0); }
        }
      `}</style>
    </div>
  )
}