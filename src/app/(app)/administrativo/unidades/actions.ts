"use server";

import { gerarCatracaCredencialApi, type CatracaCredentialResponse } from "@/lib/api/catraca";

function resolveAdminToken(): string {
  return (
    process.env.CATRACA_ADMIN_TOKEN ??
    process.env.INTEGRATION_ADMIN_TOKEN ??
    process.env.ADMIN_TOKEN ??
    ""
  ).trim();
}

export async function hasServerAdminToken(): Promise<boolean> {
  return resolveAdminToken().length > 0;
}

export async function gerarCatracaCredencialAction(input: {
  tenantId: string;
  manualToken?: string;
}): Promise<{ data?: CatracaCredentialResponse; error?: string }> {
  const adminToken = input.manualToken?.trim() || resolveAdminToken();
  if (!adminToken) {
    return {
      error:
        "Token de admin não configurado no servidor. Defina CATRACA_ADMIN_TOKEN (ou INTEGRATION_ADMIN_TOKEN / ADMIN_TOKEN) nas variáveis de ambiente do servidor, ou informe manualmente.",
    };
  }

  try {
    const result = await gerarCatracaCredencialApi({
      tenantId: input.tenantId,
      adminToken,
    });
    return { data: result };
  } catch (err) {
    if (err && typeof err === "object" && "status" in err) {
      const status = (err as { status: number }).status;
      if (status === 401 || status === 403) {
        return { error: "Token de admin inválido ou sem permissão." };
      }
      if (status === 503) {
        return {
          error:
            "Backend sem integração configurada. Verifique se INTEGRATION_ADMIN_TOKEN (lado servidor) está definido.",
        };
      }
    }
    return {
      error: err instanceof Error ? err.message : "Erro ao gerar credencial.",
    };
  }
}
