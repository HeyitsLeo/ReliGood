/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@zamgo/shared', '@zamgo/backend'],
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
}

export default nextConfig
