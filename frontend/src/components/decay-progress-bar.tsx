"use client"

import { useEffect, useRef, useState } from "react"

interface DecayProps {
  current: number // 0 to 100
  max?: number
}

export default function DecayProgressBar({ current, max = 100 }: DecayProps) {
  const percentage = Math.min(100, Math.max(0, (current / max) * 100))
  const pathRef = useRef<SVGPathElement>(null)
  
  // Color logic based on health
  const getColor = (p: number) => {
    if (p > 60) return "#00FF41" // Matrix Green
    if (p > 30) return "#FFDD00" // Warning Yellow
    return "#FF0000"             // Critical Red
  }

  const color = getColor(percentage)

  useEffect(() => {
    let animationFrameId: number
    let time = 0

    const animate = () => {
      if (!pathRef.current) return
      time += 0.2

      // 1. CALCULATE NOISE INTENSITY
      // The lower the health, the higher the chaos (amplitude)
      // At 100%, amplitude is 0 (flat line)
      // At 0%, amplitude is high (violent spikes)
      const stability = percentage / 100
      const chaosLevel = 1 - stability 
      const amplitude = chaosLevel * 15 // Max spike height

      // 2. GENERATE WAVEFORM POINTS
      const points = []
      const width = 100 // SVG viewBox width
      const segments = 40 // How detailed the wave is
      
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * width
        
        // Base line is vertically centered at 50%
        let y = 50 

        // Apply noise only if not perfectly healthy
        if (percentage < 100) {
          // Mix of sine wave (pulse) and random noise (glitch)
          const noise = (Math.random() - 0.5) * amplitude * 2
          const wave = Math.sin(x * 0.5 + time) * (amplitude * 0.5)
          y += noise + wave
        }

        points.push(`${x},${y}`)
      }

      // 3. DRAW THE PATH
      // "L" connects points with straight lines for a "jagged" digital look
      const d = `M 0,50 L ${points.join(" L ")}`
      pathRef.current.setAttribute("d", d)

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationFrameId)
  }, [percentage])

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between text-xs font-courier uppercase tracking-widest">
        <span style={{ color }}>Signal_Integrity</span>
        <span style={{ color }}>{Math.floor(percentage)}%</span>
      </div>

      {/* Container for the signal */}
      <div className="relative h-12 w-full bg-black/40 border border-white/10 rounded overflow-hidden">
        
        {/* Background Grid (Optional aesthetic) */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
               backgroundSize: '10px 10px' 
             }} 
        />

        {/* The Signal Line */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          {/* Shadow/Glow copy for effect */}
          <path
            ref={pathRef}
            fill="none"
            stroke={color}
            strokeWidth="0.5" // Thinner line feels more precise/scientific
            vectorEffect="non-scaling-stroke"
            className="drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]"
            style={{ filter: `drop-shadow(0 0 5px ${color})` }}
          />
        </svg>

        {/* Scanline Overlay */}
        <div className="absolute inset-0 bg-[url('https://media.giphy.com/media/oEI9uBYSzLpBK/giphy.gif')] opacity-10 pointer-events-none mix-blend-overlay"></div>
      </div>
    </div>
  )
}