import { redirect } from "next/navigation";

export default async function AccessNetworkIndexPage({
  params,
}: {
  params: Promise<{ redeSlug: string }>;
}) {
  const { redeSlug } = await params;
  redirect(`/acesso/${redeSlug}/autenticacao`);
}
