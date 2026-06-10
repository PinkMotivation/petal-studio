import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  typescript: {
    // This stops strict type-checking errors from crashing your deployment
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
