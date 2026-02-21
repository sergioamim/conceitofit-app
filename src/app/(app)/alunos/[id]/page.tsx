import { redirect } from "next/navigation";

export default function AlunoDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/clientes/${params.id}`);
}
