import type { NextConfig } from "next";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const backendProxyTarget = process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";
const backendProxyMaxBodySize = Number.parseInt(process.env.BACKEND_PROXY_MAX_BODY_SIZE ?? "150", 10) || 150;

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Needed for EVO backup uploads (~70MB) forwarded through /backend rewrite.
    proxyClientMaxBodySize: backendProxyMaxBodySize * 1024 * 1024,
  },
  async redirects() {
    return [
      {
        source: "/admin/importacao-evo-p0",
        destination: "/admin/importacao-evo",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/backend/api/v1/treinos/:id/atribuir",
        destination: `${backendProxyTarget}/api/v1/treinos/templates/:id/atribuir`,
      },
      {
        source: "/backend/api/v1/treinos/:id/atribuir-em-lote",
        destination: `${backendProxyTarget}/api/v1/treinos/templates/:id/atribuir-em-lote`,
      },
      {
        source: "/backend/:path*",
        destination: `${backendProxyTarget}/:path*`,
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
