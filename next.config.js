/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Use standalone output only for self-hosted (Render, Railway, etc.)
  // Vercel handles this automatically - don't use standalone there
  ...(process.env.STANDALONE === 'true' ? { output: 'standalone' } : {}),
  // Disable static optimization completely to prevent pre-rendering errors
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // Skip static generation for all routes
  generateBuildId: async () => {
    return 'build-' + Date.now()
  },
}

module.exports = nextConfig

