import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'iqtidkshavbicaecmxtd.supabase.co', // Your Supabase Storage
      },
      {
        protocol: 'https',
        hostname: 'bitrot.onrender.com', // <--- ADDED: Your Render Backend
      },
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com', // Google Auth avatars
      },
      // Local Development
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async rewrites() {
    // Dynamic Backend URL:
    // 1. If we set NEXT_PUBLIC_BACKEND_URL in Vercel, it uses that.
    // 2. Otherwise (on your laptop), it falls back to http://127.0.0.1:8000
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
    
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;