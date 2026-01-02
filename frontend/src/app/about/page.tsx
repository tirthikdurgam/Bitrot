"use client"

import Navbar from "@/components/navbar"
import { motion } from "framer-motion"

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-12">
        
        {/* Header */}
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16 border-b border-white/10 pb-8"
        >
            <h1 className="font-courier text-4xl font-bold text-[#00FF41] mb-4 tracking-widest">
                {`> SYSTEM_MANIFESTO`}
            </h1>
            <p className="font-montserrat text-xl text-white/80 leading-relaxed">
                The internet promised us permanence. It was a lie.<br />
                BitRot introduces <span className="text-white font-bold">digital entropy</span> to the web.
            </p>
        </motion.div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-12">
            
            {/* Column 1: The Philosophy */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="space-y-8"
            >
                <div>
                    <h2 className="font-courier text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00FF41]"></span>
                        THE PROBLEM
                    </h2>
                    <p className="font-montserrat text-white/60 text-sm leading-6">
                        We hoard data. Screenshots, memes, and memories pile up in cloud servers, 
                        losing their value because they are infinite. When everything lasts forever, 
                        nothing feels precious.
                    </p>
                </div>

                <div>
                    <h2 className="font-courier text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-[#00FF41]"></span>
                        THE SOLUTION
                    </h2>
                    <p className="font-montserrat text-white/60 text-sm leading-6">
                        BitLoss enforces scarcity through destruction. Every interaction damages the file. 
                        To view an image is to contribute to its death.
                    </p>
                </div>
            </motion.div>

            {/* Column 2: The Rules */}
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white/5 border border-white/10 p-8 rounded-lg"
            >
                <h3 className="font-courier text-sm font-bold text-white/50 mb-6 tracking-widest">
                    OPERATIONAL_LOGIC
                </h3>

                <ul className="space-y-6">
                    <li className="flex gap-4">
                        <span className="font-courier text-[#00FF41] font-bold">01</span>
                        <div>
                            <strong className="block font-montserrat text-white text-sm">Upload</strong>
                            <span className="text-xs text-white/50">Artifacts enter the system at 100% Integrity.</span>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <span className="font-courier text-[#00FF41] font-bold">02</span>
                        <div>
                            <strong className="block font-montserrat text-white text-sm">Degrade</strong>
                            <span className="text-xs text-white/50">Popularity equals damage. High traffic accelerates compression algorithms.</span>
                        </div>
                    </li>
                    <li className="flex gap-4">
                        <span className="font-courier text-[#00FF41] font-bold">03</span>
                        <div>
                            <strong className="block font-montserrat text-white text-sm">Perish</strong>
                            <span className="text-xs text-white/50">At 0% Integrity, the file is moved to the Archive. It can never be restored.</span>
                        </div>
                    </li>
                </ul>
            </motion.div>

        </div>

        {/* Footer / Credits */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-20 pt-8 border-t border-white/10 text-center"
        >
            <p className="font-courier text-xs text-white/30">
                SYSTEM_VERSION: 1.0.0 // STATUS: UNSTABLE
            </p>
        </motion.div>
      </div>
    </main>
  )
}