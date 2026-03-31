import { apiRequest } from "@/lib/api/http";
import {
  buildAdminOnboardingProvisionPayload,
  type AdminOnboardingProvisionFormValues,
} from "@/lib/forms/admin-onboarding-provision-form";

type ProvisionAcademiaApiResponse = {
  academiaId?: string | null;
  tenantId?: string | null;
  unidadePrincipalId?: string | null;
  nomeAcademia?: string | null;
  nomeUnidadePrincipal?: string | null;
  emailAdministrador?: string | null;
  adminEmail?: string | null;
  email?: string | null;
  senhaTemporaria?: string | null;
  temporaryPassword?: string | null;
  password?: string | null;
};

export type AdminOnboardingProvisionResult = {
  academiaId?: string;
  tenantId?: string;
  unidadePrincipalId?: string;
  academiaNome: string;
  unidadePrincipalNome: string;
  adminEmail: string;
  temporaryPassword: string;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function pickFirstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    const normalized = cleanString(value);
    if (normalized) return normalized;
  }
  return undefined;
}

function normalizeProvisionAcademiaResponse(
  response: ProvisionAcademiaApiResponse,
  fallback: AdminOnboardingProvisionFormValues,
): AdminOnboardingProvisionResult {
  return {
    academiaId: cleanString(response.academiaId),
    tenantId: cleanString(response.tenantId),
    unidadePrincipalId: cleanString(response.unidadePrincipalId),
    academiaNome: pickFirstString(response.nomeAcademia, fallback.academiaNome) ?? fallback.academiaNome,
    unidadePrincipalNome:
      pickFirstString(response.nomeUnidadePrincipal, fallback.unidadePrincipalNome) ?? fallback.unidadePrincipalNome,
    adminEmail: pickFirstString(response.emailAdministrador, response.adminEmail, response.email, fallback.adminEmail) ?? fallback.adminEmail,
    temporaryPassword:
      pickFirstString(response.senhaTemporaria, response.temporaryPassword, response.password) ?? "",
  };
}

export async function provisionAcademiaAdminApi(
  values: AdminOnboardingProvisionFormValues,
): Promise<AdminOnboardingProvisionResult> {
  const response = await apiRequest<ProvisionAcademiaApiResponse>({
    path: "/api/v1/admin/onboarding/provision",
    method: "POST",
    body: buildAdminOnboardingProvisionPayload(values),
  });

  return normalizeProvisionAcademiaResponse(response, values);
}
