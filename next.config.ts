import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify için output ayarları
  output: "standalone",

  // Static export için (eğer server functions kullanmayacaksanız)
  // trailingSlash: true,
  // output: 'export',

  // API routes için - düzeltildi
  serverExternalPackages: ["postgres", "drizzle-orm"],

  // ESLint hatalarını geçici olarak devre dışı bırak
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript hatalarını geçici olarak devre dışı bırak
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
