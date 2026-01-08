import Link from "next/link"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] text-white font-montserrat p-4 text-center">
       <h1 className="text-2xl font-bold text-red-500 mb-4 tracking-widest">AUTHENTICATION FAILURE</h1>
       <p className="text-white/50 mb-8 max-w-md text-xs tracking-wider">
         The system rejected your credentials due to a database integrity protocol.
       </p>
       <Link href="/login" className="px-6 py-3 border border-white/20 hover:bg-white/10 rounded-full transition-all text-xs font-bold uppercase tracking-widest">
          TRY AGAIN
       </Link>
    </div>
  )
}