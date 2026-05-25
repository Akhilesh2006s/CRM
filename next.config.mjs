/** @type {import('next').NextConfig} */
const nextConfig = {
  // Default local API to 5000 (matches backend/.env PORT=5000).
  env: {
    NEXT_PUBLIC_API_BASE_URL:
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
