import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
