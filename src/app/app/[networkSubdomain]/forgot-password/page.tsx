import { redirect } from "next/navigation";
import { buildNetworkAccessHref, normalizeNetworkSubdomain } from "@/lib/network-subdomain";

export default async function NetworkForgotPasswordPage({
  params,
}: {
  params: Promise<{ networkSubdomain: string }>;
}) {
  const { networkSubdomain } = await params;
  redirect(buildNetworkAccessHref("forgot-password", normalizeNetworkSubdomain(networkSubdomain) ?? networkSubdomain));
}
