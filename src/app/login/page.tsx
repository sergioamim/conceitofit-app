import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { headers } from "next/headers";
import { resolveNetworkSubdomain } from "@/lib/network-subdomain";

const NetworkAccessFlow = dynamic(() =>
  import("@/components/auth/network-access-flow").then((m) => m.NetworkAccessFlow),
);
const AdminLoginFlow = dynamic(() =>
  import("@/components/auth/admin-login-flow").then((m) => m.AdminLoginFlow),
);

export const metadata: Metadata = {
  title: "Entrar — Conceito Fit",
  description:
    "Acesse sua conta Conceito Fit — sistema de gestão para academias, studios e redes.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: "https://conceito.fit/login" },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redeIdentifier?: string; reason?: string }>;
}) {
  const { next, redeIdentifier, reason } = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const networkSubdomain = redeIdentifier?.trim() || resolveNetworkSubdomain({ host });

  if (networkSubdomain) {
    return <NetworkAccessFlow networkSubdomain={networkSubdomain} nextPath={next} mode="login" />;
  }

  return <AdminLoginFlow nextPath={next} reason={reason} />;
}
