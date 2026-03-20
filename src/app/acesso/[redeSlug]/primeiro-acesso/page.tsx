import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkFirstAccessPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;
  redirect(buildNetworkAccessHref("first-access", normalizeNetworkSubdomain(redeSlug) ?? redeSlug));
}
