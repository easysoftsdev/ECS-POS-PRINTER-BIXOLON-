import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: {}, // Satisfies Next.js 16 Turbopack requirement
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        perf_hooks: false,
        crypto: false,
      };
    }
    return config;
  },
};

export default nextConfig;