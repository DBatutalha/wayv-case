import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify için output ayarı: standalone
  output: "standalone",

  // API routes için external paketler
  serverExternalPackages: ["postgres", "drizzle-orm"],

  // ESLint hatalarını build sırasında yoksay
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript hatalarını build sırasında yoksay
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
