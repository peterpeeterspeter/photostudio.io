/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  compiler: { styledComponents: true },
  experimental: isDev ? {
    allowedDevOrigins: [
      'http://localhost:5000',
      'http://0.0.0.0:5000',
      'https://*.replit.dev',
      'https://*.replit.app',
    ],
  } : {},
  async headers() {
    // Light-touch security headers (tune CSP after you add GA/Stripe/etc.)
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'X-Frame-Options', value: 'DENY' },
      ],
    }];
  },
};

module.exports = nextConfig;