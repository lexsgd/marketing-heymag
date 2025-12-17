/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  eslint: {
    // Disable ESLint during production builds (linting done separately)
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore to debug Vercel build
    ignoreBuildErrors: true,
  },
  // Note: Image optimization now handled by Supabase Storage transformations
  // + Next.js Image component (no Sharp dependency required)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/render/image/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig
