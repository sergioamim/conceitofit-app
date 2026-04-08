import type {
  WhatsAppCredentialResponse,
  WhatsAppCredentialRequest,
  CredentialHealthResponse,
} from "@/lib/shared/types/whatsapp-crm";
import { apiRequest } from "./http";

// ---------------------------------------------------------------------------
// CRUD de credenciais
// ---------------------------------------------------------------------------

export async function listCredentialsApi(opts: {
  tenantId: string;
}): Promise<WhatsAppCredentialResponse[]> {
  return apiRequest<WhatsAppCredentialResponse[]>({
    path: "/api/v1/whatsapp/credentials",
    query: { tenantId: opts.tenantId },
  });
}

export async function createCredentialApi(opts: {
  tenantId: string;
  data: WhatsAppCredentialRequest;
}): Promise<WhatsAppCredentialResponse> {
  return apiRequest<WhatsAppCredentialResponse>({
    path: "/api/v1/whatsapp/credentials",
    method: "POST",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

export async function updateCredentialApi(opts: {
  tenantId: string;
  id: string;
  data: WhatsAppCredentialRequest;
}): Promise<WhatsAppCredentialResponse> {
  return apiRequest<WhatsAppCredentialResponse>({
    path: `/api/v1/whatsapp/credentials/${opts.id}`,
    method: "PUT",
    query: { tenantId: opts.tenantId },
    body: opts.data,
  });
}

export async function deleteCredentialApi(opts: {
  tenantId: string;
  id: string;
}): Promise<void> {
  await apiRequest<void>({
    path: `/api/v1/whatsapp/credentials/${opts.id}`,
    method: "DELETE",
    query: { tenantId: opts.tenantId },
  });
}

// ---------------------------------------------------------------------------
// Health check e refresh token
// ---------------------------------------------------------------------------

export async function checkCredentialHealthApi(opts: {
  tenantId: string;
  id: string;
}): Promise<CredentialHealthResponse> {
  return apiRequest<CredentialHealthResponse>({
    path: `/api/v1/whatsapp/credentials/${opts.id}/health`,
    query: { tenantId: opts.tenantId },
  });
}

export async function refreshCredentialTokenApi(opts: {
  tenantId: string;
  id: string;
}): Promise<WhatsAppCredentialResponse> {
  return apiRequest<WhatsAppCredentialResponse>({
    path: `/api/v1/whatsapp/credentials/${opts.id}/refresh-token`,
    method: "POST",
    query: { tenantId: opts.tenantId },
  });
}
