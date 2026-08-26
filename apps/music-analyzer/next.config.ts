import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@bridge-tools/bridge-ui",
    "@bridge-tools/music-analysis",
    "@bridge-tools/pitch-engine",
  ],
};

export default nextConfig;
