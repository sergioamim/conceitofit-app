import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const backendProxyTarget = process.env.BACKEND_PROXY_TARGET ?? "http://localhost:8080";
const backendProxyMaxBodySize = Number.parseInt(process.env.BACKEND_PROXY_MAX_BODY_SIZE ?? "150", 10) || 150;
const isDev = process.env.NODE_ENV === "development";

const scriptSrc = isDev
  ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
  : "script-src 'self' 'unsafe-inline'";

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io",
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

const finalConfig = withBundleAnalyzer(nextConfig);

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(finalConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      hideSourceMaps: true,
      disableLogger: true,
      tunnelRoute: "/monitoring",
      widenClientFileUpload: true,
      sourcemaps: {
        disable: !process.env.SENTRY_AUTH_TOKEN,
      },
    })
  : finalConfig;
