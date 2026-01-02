import React from 'react';

export default function ScanlineOverlay() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 h-screen w-screen overflow-hidden">
      {/* 1. The Scanlines (Horizontal Lines) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none" />
      
      {/* 2. The Flicker/Noise Animation */}
      <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay animate-noise pointer-events-none bg-white" />
      
      {/* 3. The Vignette (Dark Corners) */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
    </div>
  );
}