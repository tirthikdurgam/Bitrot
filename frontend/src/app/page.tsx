  import Navbar from "@/components/navbar"
  import Feed from "@/components/feed"
  import Sidebar from "@/components/sidebar"

  export default function Home() {
    return (
      <main className="min-h-screen bg-[#050505] text-white relative">
        <div className="fixed inset-0 pointer-events-none z-10 opacity-5">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="scanlines" x="0" y="0" width="100%" height="2" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="100%" y2="0" stroke="#00FF41" strokeWidth="1" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#scanlines)" />
          </svg>
        </div>

        <Navbar />
        <div className="flex pt-16">
          <Feed />
          <Sidebar />
        </div>
      </main>
    )
  }
