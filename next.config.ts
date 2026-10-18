import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Capturas dos terminais abrem o servidor de desenvolvimento por 127.0.0.1; sem isto o Next bloqueia o HMR e mostra "1 Issue".
  allowedDevOrigins: ["127.0.0.1"],
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
