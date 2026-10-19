import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Capturas dos terminais abrem o servidor de desenvolvimento por 127.0.0.1; sem isto o Next bloqueia o HMR e mostra "1 Issue".
  allowedDevOrigins: ["127.0.0.1"],
  // O selo "N" do Next (só no servidor de desenvolvimento) cobria o botão Recolher menu, no canto de baixo à esquerda.
  devIndicators: { position: "bottom-right" },
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
