import { NetworkAccessFlow } from "@/components/auth/network-access-flow";

export default async function AccessNetworkLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ redeSlug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { redeSlug } = await params;
  const { next } = await searchParams;

  return <NetworkAccessFlow redeSlug={redeSlug} nextPath={next} mode="login" />;
}
