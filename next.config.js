/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const nextConfig = {
  experimental: isDev
    ? {
        allowedDevOrigins: [
          'http://localhost:5000',
          'http://0.0.0.0:5000',
          'https://*.replit.dev',
          'https://*.replit.app',
        ],
      }
    : {},
};

module.exports = nextConfig;