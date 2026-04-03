import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkFirstAccessPage({
  params,
}: {
  params: Promise<{ networkSubdomain: string }>;
}) {
  const { networkSubdomain } = await params;
  redirect(buildNetworkAccessHref("first-access", normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain));
}
