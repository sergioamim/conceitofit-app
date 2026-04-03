import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ networkSubdomain: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { networkSubdomain } = await params;
  const { next } = await searchParams;
  const canonicalSubdomain = normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain;
  const targetPath = buildNetworkAccessHref("login", canonicalSubdomain);

  redirect(next ? `${targetPath}?next=${encodeURIComponent(next)}` : targetPath);
}
