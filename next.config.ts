import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thumbnail*.coupangcdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ads-partners.coupang.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'X-Robots-Tag',
          value: 'noindex',
        },
      ],
    },
  ],
};

export default nextConfig;
