"use client";

import { Dumbbell } from "lucide-react";
import { ClienteTabPlaceholder } from "./cliente-tab-placeholder";

/**
 * Aba "Treinos" do cliente (Perfil v3 — Wave 4, AC4.1).
 * Dado do lado do operador ainda não está conectado neste workspace.
 * Há implementação lado aluno em `components/shared/meus-treinos-client.tsx`
 * que pode ser adaptada em iteração dedicada ao Treinos v2 operador.
 */
export function ClienteTabTreinos() {
  return (
    <ClienteTabPlaceholder
      icon={Dumbbell}
      titulo="Treinos do cliente"
      descricao="Listagem de treinos ativos, divisões e aderência chegará em breve — integrada com o Treinos v2 já existente no app do aluno."
      hint="Integração Treinos v2 operador pendente"
    />
  );
}
