import { redirect } from "next/navigation";

export default async function AlunoDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/clientes/${id}`);
}
