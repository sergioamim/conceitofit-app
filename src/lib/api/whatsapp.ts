import type {
  WhatsAppConfig,
  WhatsAppMessageLog,
  WhatsAppTemplate,
} from "@/lib/types";
import { apiRequest } from "./http";

const BASE_PATH = "/api/v1/admin/whatsapp";

// --- Templates ---

export async function getWhatsAppTemplatesApi(): Promise<WhatsAppTemplate[]> {
  const response = await apiRequest<WhatsAppTemplate[] | { items?: WhatsAppTemplate[] }>({
    path: `${BASE_PATH}/templates`,
  });
  return Array.isArray(response) ? response : response.items ?? [];
}

export async function getWhatsAppTemplateApi(id: string): Promise<WhatsAppTemplate> {
  return apiRequest<WhatsAppTemplate>({
    path: `${BASE_PATH}/templates/${encodeURIComponent(id)}`,
  });
}

export async function createWhatsAppTemplateApi(
  input: Omit<WhatsAppTemplate, "id" | "createdAt" | "updatedAt">
): Promise<WhatsAppTemplate> {
  return apiRequest<WhatsAppTemplate>({
    path: `${BASE_PATH}/templates`,
    method: "POST",
    body: input,
  });
}

export async function updateWhatsAppTemplateApi(
  id: string,
  input: Partial<Omit<WhatsAppTemplate, "id" | "createdAt" | "updatedAt">>
): Promise<WhatsAppTemplate> {
  return apiRequest<WhatsAppTemplate>({
    path: `${BASE_PATH}/templates/${encodeURIComponent(id)}`,
    method: "PUT",
    body: input,
  });
}

export async function deleteWhatsAppTemplateApi(id: string): Promise<void> {
  await apiRequest<void>({
    path: `${BASE_PATH}/templates/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

// --- Logs ---

export async function getWhatsAppLogsApi(params?: {
  page?: number;
  size?: number;
  status?: string;
}): Promise<WhatsAppMessageLog[]> {
  const response = await apiRequest<WhatsAppMessageLog[] | { items?: WhatsAppMessageLog[] }>({
    path: `${BASE_PATH}/logs`,
    query: {
      page: params?.page,
      size: params?.size,
      status: params?.status,
    },
  });
  return Array.isArray(response) ? response : response.items ?? [];
}

// --- Envio ---

export async function sendWhatsAppMessageApi(input: {
  templateId: string;
  destinatario: string;
  destinatarioNome: string;
  variables: Record<string, string>;
}): Promise<WhatsAppMessageLog> {
  return apiRequest<WhatsAppMessageLog>({
    path: `${BASE_PATH}/enviar`,
    method: "POST",
    body: input,
  });
}

// --- Config ---

export async function getWhatsAppConfigApi(): Promise<WhatsAppConfig> {
  return apiRequest<WhatsAppConfig>({
    path: `${BASE_PATH}/config`,
  });
}

export async function updateWhatsAppConfigApi(
  input: Partial<WhatsAppConfig>
): Promise<WhatsAppConfig> {
  return apiRequest<WhatsAppConfig>({
    path: `${BASE_PATH}/config`,
    method: "PUT",
    body: input,
  });
}
