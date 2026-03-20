import { headers } from "next/headers";
import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { LegacyLoginFlow } from "@/components/auth/legacy-login-flow";
import { resolveNetworkSubdomain } from "@/lib/network-subdomain";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const networkSubdomain = resolveNetworkSubdomain({ host });

  if (networkSubdomain) {
    return <NetworkAccessFlow networkSubdomain={networkSubdomain} nextPath={next} mode="login" />;
  }

  return <LegacyLoginFlow nextPath={next} />;
}
