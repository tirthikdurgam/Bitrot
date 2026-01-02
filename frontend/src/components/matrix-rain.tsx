"use client"

import { useEffect, useRef } from "react"

interface MatrixRainProps {
  opacity?: number
}

export default function MatrixRain({ opacity = 0.05 }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const chars = "ABCDEF0123456789"
    const charArray = chars.split("")
    const fontSize = 14
    const columns = canvas.width / fontSize
    const drops: number[] = []

    for (let i = 0; i < columns; i++) drops[i] = 1

    const draw = () => {
      // Clear with very low opacity to create trails
      ctx.fillStyle = `rgba(0, 0, 0, 0.05)`
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#00FF41"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = charArray[Math.floor(Math.random() * charArray.length)]
        
        // Randomly skip drawing some characters to make it look "broken/sparse"
        if (Math.random() > 0.975) {
            ctx.globalAlpha = opacity // Use the prop opacity
            ctx.fillText(text, i * fontSize, drops[i] * fontSize)
        }

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)
    const handleResize = () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)
    return () => {
        clearInterval(interval)
        window.removeEventListener("resize", handleResize)
    }
  }, [opacity])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}