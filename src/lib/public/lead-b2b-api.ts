import type { LeadB2bFormValues } from "./lead-b2b-schema";

export interface LeadB2bResponse {
  id: string;
  mensagem: string;
}

function resolvePublicLeadUrl(): string {
  if (typeof window !== "undefined") {
    return "/backend/api/v1/publico/leads";
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ?? "";
  return baseUrl ? `${baseUrl}/api/v1/publico/leads` : "/backend/api/v1/publico/leads";
}

export async function submitLeadB2b(
  data: LeadB2bFormValues,
): Promise<LeadB2bResponse> {
  const res = await fetch(resolvePublicLeadUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    let message = `Erro ao enviar (HTTP ${res.status})`;
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
