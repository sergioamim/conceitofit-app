import { headers } from "next/headers";
import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { AdminLoginFlow } from "@/components/auth/admin-login-flow";
import { resolveNetworkSubdomain } from "@/lib/network-subdomain";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; redeIdentifier?: string }>;
}) {
  const { next, redeIdentifier } = await searchParams;
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const networkSubdomain = redeIdentifier?.trim() || resolveNetworkSubdomain({ host });

  if (networkSubdomain) {
    return <NetworkAccessFlow networkSubdomain={networkSubdomain} nextPath={next} mode="login" />;
  }

  return <AdminLoginFlow nextPath={next} />;
}
