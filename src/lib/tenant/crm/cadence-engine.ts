import type { CrmCadencia, StatusProspect } from "@/lib/types";
import { listCrmCadenciasApi } from "@/lib/api/crm";
import { triggerCrmCadenceApi } from "@/lib/api/crm-cadencias";

/**
 * Busca cadências ativas cujo gatilho e stageStatus correspondem à mudança
 * de etapa do prospect, e dispara a execução de cada uma.
 *
 * Chamado após persistir a mudança de status via API.
 * Erros individuais de trigger não impedem outros disparos.
 */
export async function triggerCadenciasOnStatusChange(input: {
  tenantId: string;
  prospectId: string;
  novoStatus: StatusProspect;
}): Promise<{ triggered: number; errors: string[] }> {
  let cadencias: CrmCadencia[];
  try {
    cadencias = await listCrmCadenciasApi({ tenantId: input.tenantId });
  } catch {
    return { triggered: 0, errors: ["Não foi possível carregar cadências."] };
  }

  const matching = cadencias.filter(
    (c) =>
      c.ativo &&
      c.stageStatus === input.novoStatus &&
      (c.gatilho === "MUDANCA_DE_ETAPA" || c.gatilho === "NOVO_PROSPECT")
  );

  if (matching.length === 0) {
    return { triggered: 0, errors: [] };
  }

  const errors: string[] = [];
  let triggered = 0;

  await Promise.allSettled(
    matching.map(async (cadencia) => {
      try {
        await triggerCrmCadenceApi({
          tenantId: input.tenantId,
          cadenciaId: cadencia.id,
          prospectId: input.prospectId,
        });
        triggered++;
      } catch (error) {
        errors.push(
          `Falha ao disparar cadência "${cadencia.nome}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })
  );

  return { triggered, errors };
}
