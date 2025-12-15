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
  // Exclude ONNX/background-removal from server-side bundling
  // These packages are client-only and use browser APIs (WebAssembly, WebGPU)
  experimental: {
    serverComponentsExternalPackages: [
      '@imgly/background-removal',
      'onnxruntime-web',
      'onnxruntime-node',
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle .mjs files properly
    config.module.rules.push({
      test: /\.mjs$/,
      include: /node_modules/,
      type: 'javascript/auto',
    })

    // On the server, completely ignore these packages
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@imgly/background-removal': false,
        'onnxruntime-web': false,
        'onnxruntime-node': false,
      }
    }

    return config
  },
}

module.exports = nextConfig
