import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkAppIndexPage({
  params,
}: {
  params: Promise<{ networkSubdomain: string }>;
}) {
  const { networkSubdomain } = await params;
  redirect(buildNetworkAccessHref("login", normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain));
}
