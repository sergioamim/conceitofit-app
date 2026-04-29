import { ApiRequestError } from "@/lib/api/http";
import type { CreateProspectInput } from "@/lib/types";

export function buildDuplicateProspectError(data: Pick<CreateProspectInput, "telefone" | "cpf" | "email">) {
  const fieldErrors: Record<string, string> = {};
  const message = "Já existe prospect com este telefone, CPF ou e-mail.";

  if (data.telefone?.trim()) {
    fieldErrors.telefone = message;
  }
  if (data.cpf?.trim()) {
    fieldErrors.cpf = message;
  }
  if (data.email?.trim()) {
    fieldErrors.email = message;
  }

  if (Object.keys(fieldErrors).length === 0) {
    fieldErrors.telefone = message;
  }

  return new ApiRequestError({
    status: 400,
    message: "validation failed",
    fieldErrors,
  });
}
