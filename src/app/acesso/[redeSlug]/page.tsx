import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkIndexPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;
  redirect(buildNetworkAccessHref("login", normalizeNetworkSubdomain(redeSlug) ?? redeSlug));
}
