/**
 * Rota legada: redireciona para a versão nova `/admin/gestao-acessos/papeis`
 * implementada no RBAC v2 (story #18).
 *
 * O conteúdo antigo permanece em `./components/perfis-content.tsx` apenas
 * por compatibilidade com referências de import; pode ser removido depois
 * que a migração estabilizar (auditar com `grep PerfisContent src/`).
 */

import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminPerfisLegacyPage() {
  redirect("/admin/gestao-acessos/papeis");
}
