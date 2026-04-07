import type { CrmCadencia, CrmCadenciaAcao, Prospect, StatusProspect } from "@/lib/types";
import { listCrmCadenciasApi, listProspectsApi } from "@/lib/api/crm";
import { triggerCrmCadenceApi } from "@/lib/api/crm-cadencias";
import { sendWhatsAppMessageApi } from "@/lib/api/whatsapp";
import { logger } from "@/lib/shared/logger";

// ---------------------------------------------------------------------------
// WhatsApp message dispatch for cadence steps (Task 482)
// ---------------------------------------------------------------------------

/**
 * Envia mensagem WhatsApp vinculada a uma ação de cadência.
 * Resolve o template correto com base no evento da cadência e popula variáveis.
 */
export async function executeCadenceWhatsAppAction(input: {
  tenantId: string;
  prospectId: string;
  evento: string;
  templateId?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar dados do prospect para popular variáveis
    let prospect: Prospect | undefined;
    try {
      const prospects = await listProspectsApi({ tenantId: input.tenantId });
      prospect = prospects.find((p) => p.id === input.prospectId);
    } catch {
      // Continuar sem dados do prospect — variáveis ficarão vazias
    }

    const variaveis: Record<string, string> = {};
    if (prospect) {
      variaveis.NOME = prospect.nome;
      if (prospect.telefone) variaveis.TELEFONE = prospect.telefone;
      if (prospect.email) variaveis.EMAIL = prospect.email;
    }

    const destinatario = prospect?.telefone ?? "";
    if (!destinatario) {
      return { success: false, error: "Prospect sem telefone cadastrado" };
    }

    await sendWhatsAppMessageApi({
      tenantId: input.tenantId,
      data: {
        templateId: input.templateId,
        evento: input.evento,
        destinatario,
        destinatarioNome: prospect?.nome,
        variaveis,
      },
    });

    logger.info("WhatsApp enviado via cadência", {
      module: "cadence-engine",
      prospectId: input.prospectId,
      evento: input.evento,
    });

    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logger.error("Falha ao enviar WhatsApp via cadência", {
      module: "cadence-engine",
      prospectId: input.prospectId,
      error: msg,
    });
    return { success: false, error: msg };
  }
}

// ---------------------------------------------------------------------------
// Map cadência action type to WhatsApp event
// ---------------------------------------------------------------------------

const ACAO_TO_EVENTO: Partial<Record<CrmCadenciaAcao, string>> = {
  WHATSAPP: "PROSPECT_FOLLOWUP",
};

// ---------------------------------------------------------------------------
// Core: trigger cadências on status change
// ---------------------------------------------------------------------------

/**
 * Busca cadências ativas cujo gatilho e stageStatus correspondem à mudança
 * de etapa do prospect, e dispara a execução de cada uma.
 *
 * Quando a cadência contém passos do tipo WHATSAPP, envia mensagem real
 * via WhatsApp Business API (Task 482).
 *
 * Chamado após persistir a mudança de status via API.
 * Erros individuais de trigger não impedem outros disparos.
 */
export async function triggerCadenciasOnStatusChange(input: {
  tenantId: string;
  prospectId: string;
  novoStatus: StatusProspect;
}): Promise<{ triggered: number; whatsappSent: number; errors: string[] }> {
  let cadencias: CrmCadencia[];
  try {
    cadencias = await listCrmCadenciasApi({ tenantId: input.tenantId });
  } catch {
    return { triggered: 0, whatsappSent: 0, errors: ["Não foi possível carregar cadências."] };
  }

  const matching = cadencias.filter(
    (c) =>
      c.ativo &&
      c.stageStatus === input.novoStatus &&
      (c.gatilho === "MUDANCA_DE_ETAPA" || c.gatilho === "NOVO_PROSPECT")
  );

  if (matching.length === 0) {
    return { triggered: 0, whatsappSent: 0, errors: [] };
  }

  const errors: string[] = [];
  let triggered = 0;
  let whatsappSent = 0;

  await Promise.allSettled(
    matching.map(async (cadencia) => {
      try {
        await triggerCrmCadenceApi({
          tenantId: input.tenantId,
          cadenciaId: cadencia.id,
          prospectId: input.prospectId,
        });
        triggered++;

        // Task 482: Disparar mensagens WhatsApp para passos do tipo WHATSAPP
        const whatsappSteps = (cadencia.passos ?? []).filter(
          (p) => p.acao === "WHATSAPP",
        );
        for (const step of whatsappSteps) {
          const evento = ACAO_TO_EVENTO[step.acao] ?? "PROSPECT_FOLLOWUP";
          const result = await executeCadenceWhatsAppAction({
            tenantId: input.tenantId,
            prospectId: input.prospectId,
            evento,
            templateId: step.template,
          });
          if (result.success) {
            whatsappSent++;
          } else if (result.error) {
            errors.push(`WhatsApp falhou na cadência "${cadencia.nome}": ${result.error}`);
          }
        }
      } catch (error) {
        errors.push(
          `Falha ao disparar cadência "${cadencia.nome}": ${error instanceof Error ? error.message : String(error)}`
        );
      }
    })
  );

  return { triggered, whatsappSent, errors };
}
