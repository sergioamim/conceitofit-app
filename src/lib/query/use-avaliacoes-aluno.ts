import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/http";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface MedidaCorporal {
  nome: string;
  valor: number;
  unidade: string;
}

export interface AvaliacaoFisica {
  id: string;
  alunoId: string;
  data: string;
  profissionalNome: string;
  tipo: string;
  peso?: number;
  altura?: number;
  imc?: number;
  percentualGordura?: number;
  circunferencias?: MedidaCorporal[];
  fotos?: string[];
  observacoes?: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAvaliacoesAluno(input: {
  tenantId: string | undefined;
  alunoId: string | undefined;
  enabled?: boolean;
}) {
  return useQuery<AvaliacaoFisica[]>({
    queryKey: ["avaliacoes-aluno", input.alunoId, input.tenantId],
    queryFn: () =>
      apiRequest<AvaliacaoFisica[]>({
        path: `/api/v1/academia/alunos/${input.alunoId}/avaliacoes`,
        query: { tenantId: input.tenantId },
      }),
    enabled:
      Boolean(input.tenantId) &&
      Boolean(input.alunoId) &&
      (input.enabled ?? true),
    staleTime: 5 * 60 * 1000,
  });
}
