import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 1. Image Configuration (Keep your existing settings)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        // Your specific Supabase project ID
        hostname: 'iqtidkshavbicaecmxtd.supabase.co', 
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8000',
        pathname: '/**',
      },
    ],
  },

  // 2. The Proxy (Fixes "Failed to Fetch" / CORS errors)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*', // Proxy to Python Backend
      },
    ]
  },
};

export default nextConfig;