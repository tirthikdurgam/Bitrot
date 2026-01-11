/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // 1. Trust Supabase
      {
        protocol: 'https',
        hostname: 'iqtidkshavbicaecmxtd.supabase.co',
        port: '',
        pathname: '/**', // Allow all paths
      },
      // 2. Trust Render (Your Backend)
      {
        protocol: 'https',
        hostname: 'bitrot.onrender.com',
        port: '',
        pathname: '/**', // <--- THIS WAS MISSING
      },
      // 3. Trust Google (For Login Avatars)
      {
        protocol: 'https',
        hostname: '*.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      // 4. Trust Localhost
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '',
        pathname: '/**',
      },
      // 5. Trust Grainy Gradients (For your background textures)
      {
        protocol: 'https',
        hostname: 'grainy-gradients.vercel.app',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    // This connects the Frontend to the Backend dynamically
    // MAKE SURE 'NEXT_PUBLIC_BACKEND_URL' IS SET IN YOUR VERCEL ENV VARIABLES
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