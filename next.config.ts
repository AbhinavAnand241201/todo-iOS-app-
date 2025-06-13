import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // !! WARN !!
    // Recommended: false in production. 
    // Set to true only if you are aware of the implications and plan to fix errors later.
    ignoreBuildErrors: true,
  },
  eslint: {
    // !! WARN !!
    // Recommended: false in production. 
    // Set to true only if you are aware of the implications and plan to fix errors later.
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
