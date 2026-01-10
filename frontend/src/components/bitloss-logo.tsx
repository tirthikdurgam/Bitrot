"use client"

import Link from "next/link"

interface LogoProps {
  className?: string
  // width prop is removed as it's not necessary for text sizing
}

export default function KnixcsLogo({ 
  className = "", 
}: LogoProps) {
  return (
    <Link 
      href="/" 
      className={`group relative z-50 inline-flex items-center no-underline select-none ${className}`}
      aria-label="Bitloss Home"
    >
      <div className="relative font-montserrat font-black tracking-tighter leading-none">
        {/* We use data-text attribute so the CSS can read the content 
          for the pseudo-elements (::before and ::after)
        */}
        <h1 
          className="glitch-logo text-4xl md:text-5xl text-white relative z-10 transition-all duration-300 group-hover:scale-105" 
          data-text="BITLOSS"
        >
          BITLOSS
        </h1>
        
        {/* Subtle Scanline overlay for texture */}
        <div className="absolute inset-0 z-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] mix-blend-overlay pointer-events-none"></div>
      </div>

      <style jsx>{`
        /* Base styles for the glitch layers */
        .glitch-logo::before,
        .glitch-logo::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: #050505; /* Match site bg color to hide main text behind splits */
        }

        /* Layer 1: Blue Shift & Tearing */
        .glitch-logo::before {
          left: 2px;
          text-shadow: -2px 0 #0066FF; /* Site theme blue */
          clip-path: inset(0 0 0 0);
          animation: glitch-anim-1 4s infinite linear alternate-reverse;
          z-index: -1;
        }

        /* Layer 2: Red/Pink Shift & Tearing */
        .glitch-logo::after {
          left: -2px;
          text-shadow: -2px 0 #ff0055; /* Contrast reddish color */
          clip-path: inset(0 0 0 0);
          animation: glitch-anim-2 3s infinite linear alternate-reverse;
          z-index: -2;
        }

        /* Intensify effect heavily on hover */
        .group:hover .glitch-logo::before {
            animation-duration: 0.5s;
            left: 3px;
            text-shadow: -3px 0 #0066FF;
        }
        .group:hover .glitch-logo::after {
            animation-duration: 0.7s;
            left: -3px;
            text-shadow: 3px 0 #ff0055;
        }


        /* Keyframes create random slice/tear effects */
        @keyframes glitch-anim-1 {
          0% { clip-path: inset(40% 0 61% 0); transform: skew(0.5deg); }
          20% { clip-path: inset(92% 0 1% 0); transform: skew(-0.5deg); }
          40% { clip-path: inset(43% 0 1% 0); transform: skew(0.5deg); }
          60% { clip-path: inset(25% 0 58% 0); transform: skew(-0.5deg); }
          80% { clip-path: inset(54% 0 7% 0); transform: skew(0.5deg); }
          100% { clip-path: inset(58% 0 43% 0); transform: skew(-0.5deg); }
        }

        @keyframes glitch-anim-2 {
          0% { clip-path: inset(12% 0 58% 0); transform: skew(1deg); }
          20% { clip-path: inset(54% 0 7% 0); transform: skew(-1deg); }
          40% { clip-path: inset(32% 0 4% 0); transform: skew(1deg); }
          60% { clip-path: inset(10% 0 40% 0); transform: skew(-1deg); }
          80% { clip-path: inset(3% 0 32% 0); transform: skew(1deg); }
          100% { clip-path: inset(78% 0 12% 0); transform: skew(-1deg); }
        }
      `}</style>
    </Link>
  )
}