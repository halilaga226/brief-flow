import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
