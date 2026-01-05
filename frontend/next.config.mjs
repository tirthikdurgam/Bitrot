/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. Trust Supabase (Where your images actually live)
      {
        protocol: 'https',
        hostname: 'iqtidkshavbicaecmxtd.supabase.co',
      },
      // 2. Trust Render (Your Backend)
      {
        protocol: 'https',
        hostname: 'bitrot.onrender.com',
      },
      // 3. Trust Google (For Login Avatars)
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
      },
      // 4. Trust Localhost (For when you code on your laptop)
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
    // This connects the Frontend to the Backend dynamically
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