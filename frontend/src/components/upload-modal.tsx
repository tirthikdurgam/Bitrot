"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Upload, Loader2, CloudUpload, Type, Lock } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

const scrollbarHiddenClass = "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess?: () => void
}

export default function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [secret, setSecret] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // AUTH GUARD
  useEffect(() => {
    if (isOpen) {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                onClose()
                router.push("/login")
            }
        }
        checkAuth()
    }
  }, [isOpen, onClose, router, supabase])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0]
      setFile(selectedFile)
      setPreview(URL.createObjectURL(selectedFile))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setIsUploading(true)
    
    try {
        // 1. Get User & Session Token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session?.user) {
            alert("Session expired. Please login again.")
            router.push("/login")
            return
        }
        
        // 2. Prepare Form Data
        const formData = new FormData()
        formData.append("file", file)
        formData.append("caption", caption)
        if (secret.trim()) {
            formData.append("secret", secret)
        }

        // 3. Resolve API URL (Fixing the "Code Not Updating" issue)
        // We strip any trailing slashes to prevent "http://url//upload" errors
        let baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://bitrot.onrender.com"
        baseUrl = baseUrl.replace(/\/$/, "") 
        const endpoint = `${baseUrl}/upload`

        console.log("📡 Transmitting to:", endpoint) // <--- CHECK YOUR BROWSER CONSOLE FOR THIS

        // 4. Send Request
        const res = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${session.access_token}`
            },
            body: formData,
        })
        
        if (res.ok) {
            const data = await res.json()
            console.log("Upload success:", data)
            setFile(null)
            setPreview(null)
            setCaption("")
            setSecret("")
            if (onUploadSuccess) onUploadSuccess()
            onClose()
        } else {
            const errorData = await res.json()
            console.error("Server Error:", errorData)
            throw new Error(errorData.detail || "Server rejected the file")
        }
    } catch (error: any) {
        console.error("Network/Client Error:", error)
        // This specific error message helps identify if it's the network or the code
        const msg = error.message === "Failed to fetch" 
            ? "Cannot reach server. Check your network or API URL." 
            : error.message
        
        alert(`Transmission rejected: ${msg}`)
    } finally {
        setIsUploading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8 font-montserrat">
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            className="relative w-full max-w-5xl bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[24px] md:rounded-[40px] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col md:flex-row max-h-[90vh] overflow-y-auto md:overflow-visible"
          >
            
            <button
              type="button" 
              onClick={onClose}
              className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors rounded-full backdrop-blur-md cursor-pointer border border-white/5"
            >
              <X size={20} />
            </button>

            {/* LEFT PANEL: PREVIEW */}
            <div className={`w-full md:w-5/12 h-64 md:h-auto border-b md:border-b-0 md:border-r border-white/10 relative flex flex-col ${scrollbarHiddenClass} bg-white/[0.02] shrink-0`}>
              {preview ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full h-full flex flex-col items-center justify-center p-8">
                  <div className="relative w-full h-full md:aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                      <Image 
                        src={preview} 
                        alt="Preview" 
                        fill 
                        className="object-contain" 
                        unoptimized={true}
                      />
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-4 md:static md:mt-6 text-xs font-bold text-white hover:text-black uppercase tracking-widest bg-white/10 hover:bg-white px-6 py-3 rounded-xl transition-all border border-white/10 backdrop-blur-md shadow-lg"
                  >
                    Replace
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="w-full h-full flex flex-col"
                >
                    <div className="px-6 py-4 md:px-8 md:pt-8 md:pb-4 flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-full text-white">
                            <CloudUpload size={20} />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">Upload Image</h3>
                            <p className="text-white/40 text-[10px]">Select files to inject into the feed</p>
                        </div>
                    </div>

                    <div className="flex-1 p-6 pt-0">
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            className="w-full h-full border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.01] hover:bg-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 md:gap-6 group relative overflow-hidden"
                        >
                             <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/0 group-hover:via-white/5 transition-colors duration-500" />

                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/5 flex items-center justify-center text-white/50 group-hover:scale-110 group-hover:bg-white/10 group-hover:text-white transition-all z-10">
                                <CloudUpload size={24} className="md:w-8 md:h-8" />
                            </div>
                            
                            <div className="text-center space-y-2 z-10">
                                <p className="text-white font-bold text-sm">Drop artifact here</p>
                                <p className="text-white/30 text-[10px] uppercase tracking-wide font-medium">Max 50MB</p>
                            </div>

                            <button type="button" className="px-4 py-2 md:px-6 md:py-2.5 bg-white/10 hover:bg-white text-white hover:text-black text-xs font-bold rounded-lg transition-all border border-white/10 shadow-lg mt-2 z-10 pointer-events-none">
                                Browse
                            </button>
                        </div>
                    </div>
                </motion.div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            {/* RIGHT PANEL: FORM */}
            <div className="w-full md:w-7/12 p-6 md:p-12 flex flex-col justify-center relative">
               <div className="mb-6 md:mb-10 relative z-10">
                   <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tighter drop-shadow-lg">Create Artifact.</h2>
                   <p className="text-sm font-medium text-white/50">Inject a new memory into the decay cycle.</p>
               </div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10 pb-6 md:pb-0">
                <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest pl-1 transition-colors group-focus-within:text-white">
                      <Type size={12} /> Signal Metadata
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Add a public description"
                    className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/30 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 outline-none transition-all shadow-lg focus:shadow-white/5 font-medium"
                  />
                </div>

                <div className="space-y-2 group">
                  <label className="flex items-center gap-2 text-xs font-bold text-white/40 uppercase tracking-widest pl-1 group-focus-within:text-white transition-colors">
                      <Lock size={12} /> Secret Payload (Optional)
                  </label>
                  <div className="relative">
                      <textarea
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="Enter hidden data (will be lost upon decay)"
                        className="w-full bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/10 focus:border-white/30 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-white/20 outline-none transition-all shadow-lg focus:shadow-white/5 min-h-[100px] md:min-h-[120px] resize-none font-medium custom-scrollbar"
                      />
                      <div className="absolute top-4 right-4 pointer-events-none">
                          <Lock size={16} className={secret ? "text-white" : "text-white/20"} />
                      </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!file || isUploading}
                  className="w-full relative overflow-hidden bg-white text-black hover:bg-white/90 font-bold text-sm uppercase tracking-widest py-5 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] mt-6 hover:-translate-y-1"
                >
                  {isUploading ? (
                      <span className="flex items-center justify-center gap-2">
                          <Loader2 className="animate-spin" size={18} /> Transmitting...
                      </span>
                  ) : (
                      <span className="flex items-center justify-center gap-2">
                          <Upload size={18} /> Transmit Artifact
                      </span>
                  )}
                </button>
              </form>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
} 