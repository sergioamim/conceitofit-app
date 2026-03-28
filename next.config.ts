import type { NextConfig } from "next";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const backendProxyTarget = process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";
const backendProxyMaxBodySize = Number.parseInt(process.env.BACKEND_PROXY_MAX_BODY_SIZE ?? "150", 10) || 150;

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    // Needed for EVO backup uploads (~70MB) forwarded through /backend rewrite.
    proxyClientMaxBodySize: backendProxyMaxBodySize * 1024 * 1024,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
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
