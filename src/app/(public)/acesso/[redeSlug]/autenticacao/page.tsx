import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import { normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ redeSlug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { redeSlug } = await params;
  const { next } = await searchParams;

  return (
    <NetworkAccessFlow
      networkSubdomain={normalizeNetworkSubdomain(redeSlug) ?? redeSlug}
      nextPath={next}
      mode="login"
    />
  );
}
