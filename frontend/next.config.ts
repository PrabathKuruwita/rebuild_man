import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

// Validate BACKEND_URL
if (BACKEND_URL && !BACKEND_URL.match(/^https?:\/\//)) {
  throw new Error(`Invalid BACKEND_URL: "${BACKEND_URL}". Must start with http:// or https://`);
}

// Warn if using HTTP in production
if (process.env.NODE_ENV === "production" && BACKEND_URL.startsWith("http://")) {
  console.warn("⚠️  WARNING: BACKEND_URL uses HTTP in production. Use HTTPS for security.");
}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the backend
        source: "/api/:path*",
        destination: `${BACKEND_URL}/api/:path*`,
      },
      {
        // Proxy media files (uploads, images) served by Django
        source: "/media/:path*",
        destination: `${BACKEND_URL}/media/:path*`,
      },
    ];
  },
  experimental: {},
};

export default nextConfig;
