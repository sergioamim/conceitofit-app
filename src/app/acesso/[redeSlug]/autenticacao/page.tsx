import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function AccessNetworkLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ redeSlug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { redeSlug } = await params;
  const { next } = await searchParams;
  const targetPath = buildNetworkAccessHref("login", normalizeNetworkSubdomain(redeSlug) ?? redeSlug);
  redirect(next ? `${targetPath}?next=${encodeURIComponent(next)}` : targetPath);
}
