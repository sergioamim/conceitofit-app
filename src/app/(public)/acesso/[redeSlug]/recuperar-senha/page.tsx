import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkRecoveryPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;

  return (
    <NetworkAccessFlow
      networkSubdomain={normalizeNetworkSubdomain(redeSlug) ?? redeSlug}
      mode="recovery"
    />
  );
}
