import type { NextConfig } from "next";

const backendProxyTarget = process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";
const backendProxyMaxBodySize = Number.parseInt(process.env.BACKEND_PROXY_MAX_BODY_SIZE ?? "150", 10) || 150;

const nextConfig: NextConfig = {
  experimental: {
    // Needed for EVO backup uploads (~70MB) forwarded through /backend rewrite.
    proxyClientMaxBodySize: backendProxyMaxBodySize * 1024 * 1024,
  },
  async rewrites() {
    return [
      {
        source: "/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
