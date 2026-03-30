import { useQuery } from "@tanstack/react-query";
import {
  listAtividadeGradesApi,
  listAtividadesApi,
  listFuncionariosApi,
  listSalasApi,
} from "@/lib/api/administrativo";
import { listHorariosApi } from "@/lib/api/contexto-unidades";
import type {
  Atividade,
  AtividadeGrade,
  Funcionario,
  HorarioFuncionamento,
  Sala,
} from "@/lib/types";
import { queryKeys } from "./keys";

export interface GradeData {
  grades: AtividadeGrade[];
  atividades: Atividade[];
  salas: Sala[];
  funcionarios: Funcionario[];
  horarios: HorarioFuncionamento[];
}

export function useGrade(input: {
  tenantId: string | undefined;
  tenantResolved: boolean;
}) {
  return useQuery<GradeData>({
    queryKey: queryKeys.grade.week(input.tenantId ?? ""),
    queryFn: async () => {
      const [grades, atividades, salas, funcionarios, horarios] =
        await Promise.all([
          listAtividadeGradesApi({ apenasAtivas: true }),
          listAtividadesApi({
            tenantId: input.tenantId!,
            apenasAtivas: true,
          }),
          listSalasApi(true),
          listFuncionariosApi(true),
          listHorariosApi(input.tenantId!),
        ]);
      return { grades, atividades, salas, funcionarios, horarios };
    },
    enabled: Boolean(input.tenantId) && input.tenantResolved,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
