import { imageHosts } from './image-hosts.config.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: true,
  distDir: process.env.DIST_DIR || '.next',
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: imageHosts,
    // Optimized copies of the (static) screenshots are cached for 30 days instead of re-validated every minute.
    minimumCacheTTL: 2592000,
    qualities: [75, 85, 100],
  },
};
export default nextConfig;