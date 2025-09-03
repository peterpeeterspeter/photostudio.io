/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow all hosts for Replit environment
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Allow all dev origins for Replit cross-origin requests (Next.js 15+ syntax)
  devOrigins: ['*'],
  // Fix cross-origin warnings
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig