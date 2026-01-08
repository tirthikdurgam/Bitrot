"use client"

import Navbar from "@/components/navbar"
import Feed from "@/components/feed"
import Sidebar from "@/components/sidebar"
import SiteLoader from "@/components/site-loader"

export default function Home() {
  return (
    <main className="min-h-screen bg-[#050505] text-white relative">
      
      {/* 1. LOADING SCREEN (Handles its own session logic) */}
      <SiteLoader />

      {/* 2. MAIN CONTENT */}
      {/* The loader sits on top and fades out, revealing this content naturally. */}
      <div>
        <Navbar />
        <div className="flex pt-16">
          <Feed />
          <Sidebar />
        </div>
      </div>

    </main>
  )
}