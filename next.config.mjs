/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default local API to 5001 (matches backend/server.js; macOS uses 5000 for AirPlay).
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5001",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
