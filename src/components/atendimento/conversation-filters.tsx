"use client";

import type { FilterConfig } from "@/components/shared/table-filters";
import { TableFilters } from "@/components/shared/table-filters";
import type { ActiveFilters } from "@/components/shared/table-filters";

/* ---------------------------------------------------------------------------
 * Configuração dos filtros de conversas
 * --------------------------------------------------------------------------- */

export const CONVERSATION_FILTER_CONFIGS: FilterConfig[] = [
  {
    type: "text",
    key: "busca",
    label: "Buscar",
    placeholder: "Nome, telefone ou mensagem...",
    debounceMs: 300,
  },
  {
    type: "select",
    key: "status",
    label: "Status",
    options: [
      { value: "ABERTA", label: "Aberta" },
      { value: "EM_ATENDIMENTO", label: "Em atendimento" },
      { value: "PENDENTE", label: "Pendente" },
      { value: "ENCERRADA", label: "Encerrada" },
      { value: "SPAM", label: "Spam" },
      { value: "BLOQUEADA", label: "Bloqueada" },
    ],
  },
  {
    type: "text",
    key: "queue",
    label: "Fila",
    placeholder: "Qualquer fila",
    debounceMs: 300,
  },
  {
    type: "text",
    key: "ownerUserId",
    label: "Responsável",
    placeholder: "Qualquer responsável",
    debounceMs: 300,
  },
];

/* ---------------------------------------------------------------------------
 * Componente principal
 * --------------------------------------------------------------------------- */

export interface ConversationFiltersProps {
  /** Callback com os filtros ativos (chave → valor) */
  onFiltersChange?: (filters: ActiveFilters) => void;
  className?: string;
}

/**
 * Filtros da lista de conversas do inbox.
 *
 * Usa o componente genérico `TableFilters` com persistência via URL
 * search params. Os filtros disponíveis são:
 *
 * - `busca` — texto livre (nome, telefone ou preview da mensagem)
 * - `status` — enum de ConversationStatus
 * - `queue` — nome da fila (texto livre)
 * - `ownerUserId` — UUID do responsável (texto livre)
 *
 * Os filtros são sincronizados com a URL para compartilhamento de estado
 * e permitem que o usuário recarregue a página mantendo a seleção.
 */
export function ConversationFilters({
  onFiltersChange,
  className,
}: ConversationFiltersProps) {
  return (
    <TableFilters
      filters={CONVERSATION_FILTER_CONFIGS}
      onFiltersChange={onFiltersChange}
      className={className}
    />
  );
}
