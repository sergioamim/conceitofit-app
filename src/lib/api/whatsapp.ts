/**
 * ⚠️ MÓDULO PARCIALMENTE FANTASMA — WhatsApp integration (Task #554 em andamento)
 *
 * Em 2026-04-10, o backend Java implementa apenas:
 *   ✅ WhatsAppCredentialController → /api/v1/whatsapp/credentials
 *      (lista multi-credencial por tenant; shape totalmente diferente do
 *      WhatsAppConfig legado do FE)
 *   ✅ WhatsAppWebhookController    → /api/v1/whatsapp/webhook (interno)
 *
 * Continuam fantasmas no BE (retornam 404):
 *   ❌ /api/v1/whatsapp/config       (FE usa este path)
 *   ❌ /api/v1/whatsapp/templates
 *   ❌ /api/v1/whatsapp/logs
 *   ❌ /api/v1/whatsapp/send
 *   ❌ /api/v1/whatsapp/status/{id}
 *   ❌ /api/v1/whatsapp/stats
 *
 * GAP SEMÂNTICO (impede migração mecânica de /config → /credentials):
 *
 *   FE legado (WhatsAppConfig): { provedorAtivo, chaveApi, webhookUrl, ambiente, ativo }
 *   BE atual (WhatsAppCredential): { businessAccountId, wabaId, phoneId, phoneNumber,
 *     mode, accessToken, webhookVerifyToken, onboardingStatus, onboardingStep }
 *
 * A migração /config → /credentials exige refactor do modelo de UI (tela
 * admin/whatsapp gerencia 1 "config", mas BE tem N "credentials" por tenant
 * com fluxo de onboarding WABA). Deixado como TODO após este commit.
 *
 * Status imediato da Task #554: proteção via feature flag
 * `NEXT_PUBLIC_WHATSAPP_INTEGRATION_ENABLED` (default false) — todas as
 * funções exportadas retornam null/throw amigável quando a flag está off.
 * Quando o BE implementar templates/logs/send/stats E o refactor de UI for
 * feito, ligar a flag.
 *
 * @see docs/adr/ADR-001-modulos-fe-fantasma.md seção 3
 */
import { isWhatsappIntegrationEnabled } from "@/lib/feature-flags";
import type {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
} from "@/lib/types";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

export async function getWhatsAppConfigApi(opts: {
  tenantId: string;
}): Promise<WhatsAppConfig | null> {
  if (!isWhatsappIntegrationEnabled()) {
    return null;
  }
  try {
    return await apiRequest<WhatsAppConfig>({
      path: "/api/v1/whatsapp/config",
      query: { tenantId: opts.tenantId },
    });
  } catch {
    return null;
  }
}

export async function saveWhatsAppConfigApi(opts: {
  tenantId: string;
  data: Partial<Omit<WhatsAppConfig, "id" | "tenantId">>;
}): Promise<WhatsAppConfig> {
  if (!isWhatsappIntegrationEnabled()) {
    throw new Error(
      "Integração WhatsApp desabilitada. Aguardando migração do modelo /config → /credentials (Task #554)."
    );
  }
  return apiRequest<WhatsAppConfig>({
    path: "/api/v1/whatsapp/config",
    method: "PUT",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

export async function testWhatsAppConnectionApi(opts: {
  tenantId: string;
}): Promise<{ success: boolean; message?: string }> {
  return apiRequest<{ success: boolean; message?: string }>({
    path: "/api/v1/whatsapp/config/test",
    method: "POST",
    query: { tenantId: opts.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

export async function listWhatsAppTemplatesApi(opts: {
  tenantId: string;
}): Promise<WhatsAppTemplate[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/whatsapp/templates",
    query: { tenantId: opts.tenantId },
  });
  if (Array.isArray(response)) return response;
  const obj = response as Record<string, unknown>;
  const list = obj.data ?? obj.items ?? obj.content;
  return Array.isArray(list) ? list : [];
}

export async function createWhatsAppTemplateApi(opts: {
  tenantId: string;
  data: Omit<WhatsAppTemplate, "id" | "tenantId" | "criadoEm" | "atualizadoEm">;
}): Promise<WhatsAppTemplate> {
  return apiRequest<WhatsAppTemplate>({
    path: "/api/v1/whatsapp/templates",
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

export async function updateWhatsAppTemplateApi(opts: {
  tenantId: string;
  id: string;
  data: Partial<Omit<WhatsAppTemplate, "id" | "tenantId">>;
}): Promise<WhatsAppTemplate> {
  return apiRequest<WhatsAppTemplate>({
    path: `/api/v1/whatsapp/templates/${opts.id}`,
    method: "PUT",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

export async function deleteWhatsAppTemplateApi(opts: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/whatsapp/templates/${opts.id}`,
    method: "DELETE",
    query: { tenantId: opts.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Messages / Logs
// ---------------------------------------------------------------------------

export async function listWhatsAppLogsApi(opts: {
  tenantId: string;
  page?: number;
  size?: number;
}): Promise<WhatsAppMessageLog[]> {
  const response = await apiRequest<unknown>({
    path: "/api/v1/whatsapp/logs",
    query: { tenantId: opts.tenantId, page: opts.page, size: opts.size },
  });
  if (Array.isArray(response)) return response;
  const obj = response as Record<string, unknown>;
  const list = obj.data ?? obj.items ?? obj.content;
  return Array.isArray(list) ? list : [];
}

export async function sendWhatsAppMessageApi(opts: {
  tenantId: string;
  data: {
    templateId?: string;
    evento: string;
    destinatario: string;
    destinatarioNome?: string;
    variaveis?: Record<string, string>;
  };
}): Promise<WhatsAppMessageLog> {
  if (!isWhatsappIntegrationEnabled()) {
    throw new Error(
      "Envio WhatsApp desabilitado (flag). BE ainda não expõe /send — Task #554."
    );
  }
  return apiRequest<WhatsAppMessageLog>({
    path: "/api/v1/whatsapp/send",
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

// ---------------------------------------------------------------------------
// Message Status (Task 479)
// ---------------------------------------------------------------------------

export async function getWhatsAppMessageStatusApi(opts: {
  tenantId: string;
  messageId: string;
}): Promise<{
  id: string;
  status: "ENVIADA" | "ENTREGUE" | "LIDA" | "FALHA";
  enviadoEm: string;
  entregueEm?: string;
  lidoEm?: string;
  erroMensagem?: string;
}> {
  return apiRequest({
    path: `/api/v1/whatsapp/status/${opts.messageId}`,
    query: { tenantId: opts.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Webhook Registration (Task 479)
// ---------------------------------------------------------------------------

async function registerWhatsAppWebhookApi(opts: {
  tenantId: string;
  webhookUrl: string;
}): Promise<{ success: boolean }> {
  return apiRequest({
    path: "/api/v1/whatsapp/webhook/register",
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: { webhookUrl: opts.webhookUrl },
  });
}

// ---------------------------------------------------------------------------
// Monitoring Stats (Task 481)
// ---------------------------------------------------------------------------

export async function getWhatsAppStatsApi(opts: {
  tenantId: string;
}): Promise<{
  total: number;
  enviadas: number;
  entregues: number;
  lidas: number;
  falhas: number;
  taxaEntrega: number;
  taxaLeitura: number;
}> {
  try {
    return await apiRequest({
      path: "/api/v1/whatsapp/stats",
      query: { tenantId: opts.tenantId },
    });
  } catch {
    // Fallback: calcular stats dos logs quando o endpoint não existir
    const logs = await listWhatsAppLogsApi({ tenantId: opts.tenantId, size: 500 });
    const total = logs.length;
    const enviadas = logs.filter((l) => l.status === "ENVIADA").length;
    const entregues = logs.filter((l) => l.status === "ENTREGUE").length;
    const lidas = logs.filter((l) => l.status === "LIDA").length;
    const falhas = logs.filter((l) => l.status === "FALHA").length;
    return {
      total,
      enviadas,
      entregues,
      lidas,
      falhas,
      taxaEntrega: total > 0 ? ((entregues + lidas) / total) * 100 : 0,
      taxaLeitura: total > 0 ? (lidas / total) * 100 : 0,
    };
  }
}

// ---------------------------------------------------------------------------
// Aliases (compat with backoffice page)
// ---------------------------------------------------------------------------

export const getWhatsAppTemplatesApi = (tenantId?: string) =>
  listWhatsAppTemplatesApi({ tenantId: tenantId ?? "" });

export const getWhatsAppLogsApi = (opts?: { size?: number; tenantId?: string }) =>
  listWhatsAppLogsApi({ tenantId: opts?.tenantId ?? "", size: opts?.size });
