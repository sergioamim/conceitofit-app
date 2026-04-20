"use client";

import { ClipboardList } from "lucide-react";
import { ClienteTabPlaceholder } from "./cliente-tab-placeholder";

/**
 * Aba "Avaliações" do cliente (Perfil v3 — Wave 4, AC4.1).
 * Backend de avaliações físicas ainda não retorna histórico aqui —
 * aguardando endpoint para liberar a listagem (IMC, %BF, agendamentos).
 */
export function ClienteTabAvaliacoes() {
  return (
    <ClienteTabPlaceholder
      icon={ClipboardList}
      titulo="Avaliações físicas"
      descricao="Histórico de avaliações (IMC, %BF, cintura, etc.) e agendamentos de nova avaliação ficará disponível quando o backend expuser os dados."
      hint="Backend pendente"
    />
  );
}
