/**
 * Rota legada: redireciona para `/admin/gestao-acessos/usuarios` (RBAC v2).
 * Story #18.
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminOperadoresLegacyPage() {
  redirect("/admin/gestao-acessos/usuarios");
}
