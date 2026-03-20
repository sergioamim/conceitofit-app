import { redirect } from "next/navigation";

export default async function ClienteCartoesRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/clientes/${id}?tab=cartoes`);
}
