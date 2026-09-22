import type { NextConfig } from 'next'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      { protocol: 'http',  hostname: 'localhost', port: '4002' },
      { protocol: 'http',  hostname: 'localhost' },
      { protocol: 'https', hostname: 'localhost' },
      // Render backend (production)
      { protocol: 'https', hostname: '*.onrender.com' },
      // AWS S3 / CloudFront
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'cdn.bangme.com' },
      // Dev placeholders
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'plus.unsplash.com' },
      { protocol: 'https', hostname: '*.ftcdn.net' },
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
