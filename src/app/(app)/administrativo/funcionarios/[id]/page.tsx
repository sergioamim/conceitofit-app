import { FuncionarioFormPage } from "@/components/administrativo/funcionarios/funcionario-form-page";

export default async function FuncionarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FuncionarioFormPage mode="edit" funcionarioId={id} />;
}
