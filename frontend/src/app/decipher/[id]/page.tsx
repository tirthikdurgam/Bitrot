"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Copy, Terminal } from "lucide-react"
import MatrixRain from "@/components/matrix-rain"

export default function DecipherPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  const [secret, setSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSecret = async () => {
      // 1. Force a short delay for dramatic effect (optional)
      await new Promise(r => setTimeout(r, 1500))

      try {
        const res = await fetch(`http://localhost:8000/reveal/${id}`, { 
            cache: 'no-store',
            headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
        })
        const data = await res.json()

        if (data.status === "success") {
            setSecret(data.message)
        } else {
            // FIX: Show the REAL error message from the backend
            setError(data.message || "UNKNOWN_ERROR") 
        }
      } catch (err: any) {
        setError("CONNECTION_LOST")
      } finally {
        setLoading(false)
      }
    }
    fetchSecret()
  }, [id])

  const handleCopy = () => {
    if (secret) navigator.clipboard.writeText(secret)
  }

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden flex flex-col items-center justify-center font-montserrat">
      
      {/* 0. CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes sun-breath {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); } 
          100% { transform: scale(1); }
        }
        @keyframes corona-pulse {
          0% { opacity: 0.6; transform: scale(0.95); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(0.95); }
        }
        .orb-motion { animation: sun-breath 4s ease-in-out infinite; }
        .corona-motion { animation: corona-pulse 5s ease-in-out infinite reverse; }
      `}</style>

      {/* 1. BACKGROUND LAYERS */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-20">
        <MatrixRain />
      </div>

      {/* 2. THE SOLAR ORB */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
        >
            <div className="orb-motion w-[280px] h-[280px] md:w-[450px] md:h-[450px] rounded-full bg-white blur-[1px] relative z-20" 
                 style={{ boxShadow: "0 0 60px 10px #ffcc00, 0 0 120px 40px #ff4500" }} />
            <div className="corona-motion absolute inset-[-30px] rounded-full bg-[#ff4500] blur-[50px] z-10" />
        </motion.div>
      </div>

      {/* 3. THE TEXT LAYER */}
      <div className="relative z-30 w-full px-6 text-center z-50 flex flex-col items-center">
        {loading ? (
           <div className="text-xl md:text-3xl font-bold text-white tracking-widest uppercase animate-pulse drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]">
              DECRYPTING SEQUENCE...
           </div>
        ) : error ? (
           // ERROR STATE
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="bg-black/80 border border-red-500/50 p-6 rounded backdrop-blur-md max-w-lg"
           >
              <h2 className="text-red-500 font-bold tracking-widest text-lg mb-2">DECRYPTION FAILED</h2>
              <p className="font-mono text-red-400 text-sm">ERROR: {error}</p>
           </motion.div>
        ) : (
           // SUCCESS STATE
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
             transition={{ duration: 0.8, ease: "backOut" }}
             className="max-w-4xl mx-auto"
           >
              <div className="mb-4 flex items-center justify-center gap-2 text-black/60 font-bold uppercase tracking-widest text-xs">
                 <Terminal size={14} /> Payload Extracted
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-black leading-tight tracking-tight drop-shadow-xl mix-blend-screen bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                "{secret}"
              </h1>
           </motion.div>
        )}
      </div>

      {/* 4. FOOTER */}
      <div className="absolute bottom-12 z-40 flex items-center gap-8">
        <button onClick={() => router.push("/")} className="group flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold bg-black/50 px-4 py-2 rounded-full border border-white/10 hover:border-white">
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Return
        </button>
        {secret && (
            <button onClick={handleCopy} className="group flex items-center gap-2 text-white/40 hover:text-[#00FF41] transition-colors uppercase tracking-widest text-xs font-bold bg-black/50 px-4 py-2 rounded-full border border-white/10 hover:border-[#00FF41]">
                <Copy size={14} /> Copy Secret
            </button>
        )}
      </div>
    </div>
  )
}