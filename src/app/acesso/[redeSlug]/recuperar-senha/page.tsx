import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkRecoveryPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;
  redirect(buildNetworkAccessHref("forgot-password", normalizeNetworkSubdomain(redeSlug) ?? redeSlug));
}
