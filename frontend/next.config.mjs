/** @type {import('next').NextConfig} */
const apiProxyTarget = process.env.NEXT_PUBLIC_API_PROXY_TARGET || 'http://localhost:8000';

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // Local dev proxy to the FastAPI backend; production rewrites live in vercel.json.
    if (process.env.VERCEL) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiProxyTarget}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
