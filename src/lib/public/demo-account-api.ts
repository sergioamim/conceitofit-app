import type { DemoAccountFormValues } from "./demo-account-schema";

export interface DemoAccountResponse {
  token: string;
  refreshToken: string;
  type?: string;
  expiresIn?: number;
  userId?: string;
  userKind?: string;
  displayName?: string;
  activeTenantId?: string;
  tenantBaseId?: string;
  redeId?: string;
  redeSubdominio?: string;
  redeSlug?: string;
  redeNome?: string;
  availableTenants?: Array<{ tenantId: string; defaultTenant: boolean }>;
  availableScopes?: string[];
  broadAccess?: boolean;
  mensagem?: string;
}

function resolvePublicDemoUrl(): string {
  if (typeof window !== "undefined") {
    return "/backend/api/v1/publico/demo";
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  return baseUrl ? `${baseUrl}/api/v1/publico/demo` : "/backend/api/v1/publico/demo";
}

export async function createDemoAccount(
  data: DemoAccountFormValues,
): Promise<DemoAccountResponse> {
  const res = await fetch(resolvePublicDemoUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      nome: data.nome.trim(),
      email: data.email.trim(),
      senha: data.senha,
    }),
  });

  if (!res.ok) {
    let message = `Erro ao criar conta demo (HTTP ${res.status})`;
    try {
      const body = await res.json();
      if (body.message) message = body.message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return res.json();
}
