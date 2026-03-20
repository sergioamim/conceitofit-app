import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkFirstAccessPage({
  params,
}: {
  params: Promise<{ networkSubdomain: string }>;
}) {
  const { networkSubdomain } = await params;

  return (
    <NetworkAccessFlow
      networkSubdomain={normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain}
      mode="first-access"
    />
  );
}
