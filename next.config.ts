import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    // Evita que el cache persistente de Turbopack crezca sin limite en dev.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
