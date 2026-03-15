import type { Presenca } from "@/lib/types";
import { apiRequest } from "./http";

type PresencaApiResponse = {
  id?: string;
  alunoId?: string;
  data?: string;
  horario?: string;
  origem?: string;
  atividade?: string | null;
};

function normalizeOrigem(value: unknown): Presenca["origem"] {
  if (value === "CHECKIN" || value === "AULA" || value === "ACESSO") {
    return value;
  }
  return "CHECKIN";
}

function normalizePresenca(input: PresencaApiResponse): Presenca {
  return {
    id: typeof input.id === "string" ? input.id : "",
    alunoId: typeof input.alunoId === "string" ? input.alunoId : "",
    data: typeof input.data === "string" ? input.data : "",
    horario: typeof input.horario === "string" ? input.horario : "",
    origem: normalizeOrigem(input.origem),
    atividade: typeof input.atividade === "string" ? input.atividade : undefined,
  };
}

export async function listPresencasByAlunoApi(input: {
  tenantId?: string;
  alunoId: string;
}): Promise<Presenca[]> {
  const response = await apiRequest<PresencaApiResponse[]>({
    path: `/api/v1/comercial/alunos/${input.alunoId}/presencas`,
    query: {
      tenantId: input.tenantId,
    },
  });
  return response.map(normalizePresenca);
}
