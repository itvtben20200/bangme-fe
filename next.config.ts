import type { NextConfig } from 'next'
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.bangme.com' },
    ],
  },
}

module.exports = withBundleAnalyzer(nextConfig)
