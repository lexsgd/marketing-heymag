/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
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
  // Handle @imgly/background-removal and onnxruntime-web
  // These packages use import.meta and ES modules that need special handling
  webpack: (config, { isServer }) => {
    // Don't bundle these packages on the server
    // They will be dynamically imported on the client only
    if (isServer) {
      config.externals = config.externals || []
      config.externals.push({
        '@imgly/background-removal': 'commonjs @imgly/background-removal',
        'onnxruntime-web': 'commonjs onnxruntime-web',
        'onnxruntime-node': 'commonjs onnxruntime-node',
      })
    }

    // Handle .mjs files properly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    // Prevent webpack from processing these packages
    config.resolve.alias = {
      ...config.resolve.alias,
      // Prevent server-side imports of ONNX runtime
      ...(isServer ? {
        'onnxruntime-web': false,
        'onnxruntime-node': false,
      } : {}),
    }

    return config
  },
  // Transpile the background removal package
  transpilePackages: ['@imgly/background-removal'],
}

module.exports = nextConfig
