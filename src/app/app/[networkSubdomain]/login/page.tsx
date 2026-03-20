import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ networkSubdomain: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { networkSubdomain } = await params;
  const { next } = await searchParams;

  return (
    <NetworkAccessFlow
      networkSubdomain={normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain}
      nextPath={next}
      mode="login"
    />
  );
}
