"use client";

import { Gift } from "lucide-react";
import { ClienteTabPlaceholder } from "./cliente-tab-placeholder";

/**
 * Aba "Fidelidade" do cliente (Perfil v3 — Wave 4, AC4.1).
 * Backend de pontos/níveis/recompensas ainda não existe neste workspace.
 */
export function ClienteTabFidelidade() {
  return (
    <ClienteTabPlaceholder
      icon={Gift}
      titulo="Programa de fidelidade"
      descricao="Saldo de pontos, nível, histórico de resgates e próximos benefícios aparecerão aqui quando o módulo de fidelidade for habilitado."
      hint="Módulo de fidelidade pendente"
    />
  );
}
