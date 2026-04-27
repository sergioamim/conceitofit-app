import { apiRequest } from "./http";
import { saveAuthSession, type AuthSession } from "./session";

interface SandboxTokenResponse {
  token?: string;
  refreshToken?: string;
  type?: string;
  expiresIn?: number;
  sessionMode?: string;
  userKind?: string;
  redeId?: string;
  activeTenantId?: string;
  tenantBaseId?: string;
  availableTenants?: Array<{ tenantId: string; defaultTenant: boolean }>;
  sandboxMode?: boolean;
  sandboxRedeId?: string;
  sandboxUnidadeId?: string;
  sandboxExpiresAt?: string;
}

export interface SandboxEnterInput {
  redeId: string;
  unidadeId?: string;
  justificativa?: string;
}

export interface SandboxSwitchInput {
  redeId: string;
  unidadeId?: string;
}

export interface TenantsTreeUnidade {
  id: string;
  nome: string;
  matriz: boolean;
}

export interface TenantsTreeRede {
  redeId: string;
  redeName: string;
  unidades: TenantsTreeUnidade[];
}

export interface TenantsTreeResponse {
  redes: TenantsTreeRede[];
}

function toAuthSession(response: SandboxTokenResponse): AuthSession {
  return {
    token: response.token,
    refreshToken: response.refreshToken,
    type: response.type ?? "Bearer",
    expiresIn: response.expiresIn,
    sessionMode: response.sessionMode,
    userKind: response.userKind,
    networkId: response.redeId,
    activeTenantId: response.activeTenantId,
    baseTenantId: response.tenantBaseId,
    availableTenants: response.availableTenants?.map((item) => ({
      tenantId: item.tenantId,
      defaultTenant: item.defaultTenant,
    })),
    sandboxMode: Boolean(response.sandboxMode),
    sandboxRedeId: response.sandboxRedeId,
    sandboxUnidadeId: response.sandboxUnidadeId,
    sandboxExpiresAt: response.sandboxExpiresAt,
  };
}

export async function enterSandboxApi(input: SandboxEnterInput): Promise<AuthSession> {
  const response = await apiRequest<SandboxTokenResponse>({
    path: "/api/v1/admin/sandbox/enter",
    method: "POST",
    includeContextHeader: false,
    body: input,
  });
  const session = toAuthSession(response);
  saveAuthSession(session);
  return session;
}

export async function switchSandboxApi(input: SandboxSwitchInput): Promise<AuthSession> {
  const response = await apiRequest<SandboxTokenResponse>({
    path: "/api/v1/admin/sandbox/switch",
    method: "POST",
    includeContextHeader: false,
    body: input,
  });
  const session = toAuthSession(response);
  saveAuthSession(session);
  return session;
}

export async function exitSandboxApi(): Promise<AuthSession> {
  const response = await apiRequest<SandboxTokenResponse>({
    path: "/api/v1/admin/sandbox/exit",
    method: "POST",
    includeContextHeader: false,
  });
  const session = toAuthSession(response);
  saveAuthSession(session);
  return session;
}

export async function getTenantsTreeApi(): Promise<TenantsTreeResponse> {
  return apiRequest<TenantsTreeResponse>({
    path: "/api/v1/admin/tenants/tree",
    method: "GET",
    includeContextHeader: false,
  });
}
