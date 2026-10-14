import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aplikasi ini sepenuhnya dinamis (auth + data per pengguna); gunakan model render klasik.
  cacheComponents: false,
  // pdfkit membaca file font AFM dari node_modules saat runtime; jangan dibundel.
  serverExternalPackages: ["pdfkit"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
