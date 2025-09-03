/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  // Allow all hosts for Replit environment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
}

module.exports = nextConfig