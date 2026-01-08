"use client"

import Link from "next/link"
import Image from "next/image"

interface LogoProps {
  className?: string
  width?: number
}

export default function KnixcsLogo({ 
  className = "", 
  width = 200 
}: LogoProps) {
  return (
    <Link 
      href="/" 
      className={`group relative z-50 inline-flex items-center no-underline select-none ${className}`}
    >
      <div className="relative transition-all duration-300 group-hover:scale-105 group-hover:brightness-125 drop-shadow-2xl">
        <Image 
          src="/image.png" 
          alt="Bitloss" 
          width={width} 
          height={70}
          className="object-contain w-auto h-auto"
          priority 
        />
      </div>
    </Link>
  )
}