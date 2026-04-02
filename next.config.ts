import type { NextConfig } from "next";
import { getAppEnv } from "./src/lib/env";

const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ? require("@next/bundle-analyzer")({ enabled: true })
    : (config: NextConfig) => config;

const env = getAppEnv();
const backendProxyTarget = env.BACKEND_PROXY_TARGET;
const backendProxyMaxBodySize = env.BACKEND_PROXY_MAX_BODY_SIZE;
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
  serverExternalPackages: ['@prisma/instrumentation', '@opentelemetry/instrumentation'],
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

function applySentry(config: NextConfig): NextConfig {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { withSentryConfig } = require("@sentry/nextjs");
    return withSentryConfig(config, {
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
    });
  } catch {
    // @sentry/nextjs não instalado — prosseguir sem Sentry
    return config;
  }
}

export default env.NEXT_PUBLIC_SENTRY_DSN
  ? applySentry(finalConfig)
  : finalConfig;
