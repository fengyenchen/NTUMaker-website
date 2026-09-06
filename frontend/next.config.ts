import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  distDir: process.env.NODE_ENV === "production" ? ".next-build" : ".next",
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    return [{ source: "/api/:path*", destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
