import React from 'react';

export default function CyberCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative group ${className}`}>
      {/* The Glow/Border Effect */}
      <div 
        className="absolute -inset-[1px] bg-cyber-dim group-hover:bg-cyber-red transition-colors duration-300"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)" }} 
      />
      
      {/* The Actual Card Content */}
      <div 
        className="relative h-full w-full bg-cyber-black border border-cyber-dim p-6 text-white"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 90%, 90% 100%, 0 100%)" }}
      >
        {/* Decorative "Tech" lines in the corner */}
        <div className="absolute top-0 right-0 p-2">
           <div className="w-2 h-2 bg-cyber-red opacity-50"></div>
        </div>
        
        {children}
      </div>
    </div>
  );
}