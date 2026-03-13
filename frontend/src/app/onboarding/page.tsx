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

    // 1. Client-side formatting
    const cleanUsername = username.toLowerCase().trim().replace(/\s+/g, '_')
    
    if (cleanUsername.length < 3) {
        setError("Username must be at least 3 characters.")
        setLoading(false)
        return
    }

    // 2. Prevent breaking the interceptor logic
    if (cleanUsername.startsWith('user_')) {
        setError("Callsigns cannot start with 'user_'. Choose a unique identity.")
        setLoading(false)
        return
    }

    try {
      // 3. Get the current authenticated user session
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('Authentication lost. Please log in again.')

      // 4. UPDATE instead of UPSERT
      const { error: updateError } = await supabase
        .from('users')
        .update({ username: cleanUsername })
        .eq('id', user.id)

      if (updateError) {
        // Postgres Error Code 23505 = "Unique Violation"
        if (updateError.code === '23505') {
            throw new Error(`The callsign '${cleanUsername}' is already claimed.`)
        }
        throw new Error("Failed to initialize identity. Try again.")
      }

      // 5. Success! Hard redirect to clear Next.js cache and trigger middleware
      window.location.href = '/'

    } catch (err: any) {
      console.error("Onboarding Error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white font-montserrat p-6 md:p-16 lg:p-24 selection:bg-[#0066FF] selection:text-white relative overflow-hidden z-0">
      
      {/* --- SUBTLE AMBIENT GLOWS (For the glass to interact with) --- */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#0066FF]/[0.03] rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/[0.02] rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-white/10 pb-8 mb-12 pt-12 md:pt-0 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-6 uppercase drop-shadow-sm">
            INITIALIZE <span className="text-[#0066FF]">IDENTITY</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl font-medium">
            The network requires a unique callsign. <span className="bg-[#0066FF]/20 text-[#0066FF] px-2 py-0.5 rounded font-bold backdrop-blur-sm">Verification required.</span>
          </p>
        </div>
        
        {/* TECH STATS */}
        <div className="hidden md:flex flex-col gap-3 text-xs font-bold text-white/40 mt-8 md:mt-0 tracking-widest shrink-0">
          <div className="flex items-center gap-2"><span className="text-[#0066FF] animate-pulse">///</span> STATUS_CODE: 401_UNAUTHORIZED</div>
          <div className="flex items-center gap-2"><span className="text-[#0066FF]">///</span> ENCRYPTION: ACTIVE</div>
          <div className="flex items-center gap-2"><span className="text-[#0066FF]">///</span> UPLINK: SECURE</div>
        </div>
      </div>

      {/* FORM SECTION (SMOKED GLASS CONTAINER) */}
      <form onSubmit={handleSubmit} className="max-w-2xl relative z-10">
        <div className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden group">
          
          {/* Subtle inner glass edge highlight */}
          <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none mix-blend-overlay" />
          
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4 relative">
            <h2 className="text-sm font-bold uppercase tracking-widest text-white/60 flex items-center gap-2">
               <span className="text-[#0066FF]">&gt;_</span> REGISTRATION_PROTOCOL
            </h2>
            <span className="text-[10px] text-[#0066FF] border border-[#0066FF]/30 bg-[#0066FF]/10 px-3 py-1 rounded tracking-widest shadow-[0_0_10px_rgba(0,102,255,0.2)]">
              SYS_EXEC_MODE
            </span>
          </div>

          <div className="space-y-6 relative">
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-[0.2em] mb-3 block">
                Desired Callsign
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. trackingmilkdads"
                className="w-full bg-white/5 backdrop-blur-md border border-white/10 focus:border-[#0066FF]/50 focus:bg-black/60 focus:shadow-[0_0_20px_rgba(0,102,255,0.1)] rounded-xl p-5 text-white placeholder:text-white/20 outline-none transition-all duration-300 font-medium tracking-wide shadow-inner"
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded-xl text-red-500 text-sm font-bold flex items-center gap-3 shadow-inner">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                {error}
              </div>
            )}
            
            <button 
              disabled={loading} 
              className="w-full relative overflow-hidden bg-[#0066FF] text-white font-black uppercase tracking-[0.2em] p-5 rounded-xl hover:bg-[#0052cc] active:scale-[0.99] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-4 shadow-[0_0_20px_rgba(0,102,255,0.3)] hover:shadow-[0_0_30px_rgba(0,102,255,0.5)]"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} /> 
                  <span>SYNCING_DATA...</span>
                </>
              ) : (
                'CONFIRM_IDENTITY'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}