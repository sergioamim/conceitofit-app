import { NetworkAccessFlow } from "@/components/auth/network-access-flow";

export default async function AccessNetworkFirstAccessPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;

  return <NetworkAccessFlow redeSlug={redeSlug} mode="first-access" />;
}
