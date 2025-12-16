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
  // Exclude sharp from webpack bundling - it's loaded at runtime if available
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
}

module.exports = nextConfig
