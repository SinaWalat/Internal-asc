import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  transpilePackages: ['konva', 'react-konva'],
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];

    // Fix for ReactCurrentOwner error (duplicate React instances)
    config.resolve.alias = {
      ...config.resolve.alias,
      'react$': require.resolve('react'),
      'react-dom$': require.resolve('react-dom'),
      'react-konva$': require.resolve('react-konva'),
    };

    return config;
  },
};

export default nextConfig;
