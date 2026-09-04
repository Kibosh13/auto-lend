import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: process.env.DEPLOY_TARGET === 'node' ? 'standalone' : undefined,
};

export default nextConfig;
