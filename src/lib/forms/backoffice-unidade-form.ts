import { z } from "zod";
import type { FieldPath } from "react-hook-form";
import type { Tenant } from "@/lib/types";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

const optionalFormString = z.string().trim().default("");

function hasValidEmail(value: string) {
  return z.string().email().safeParse(value).success;
}

export const backofficeUnidadeSchema = z.object({
  academiaId: requiredTrimmedString("Selecione a academia."),
  nome: requiredTrimmedString("Informe o nome da unidade."),
  razaoSocial: optionalFormString,
  documento: requiredTrimmedString("Informe o documento da unidade."),
  groupId: optionalFormString,
  subdomain: requiredTrimmedString("Informe o subdomínio.").refine(
    (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Use apenas letras minúsculas, números e hífen no subdomínio.",
  ),
  email: requiredTrimmedString("Informe o e-mail da unidade.").refine(
    hasValidEmail,
    "Informe um e-mail válido.",
  ),
  telefone: optionalFormString,
  ativo: z.boolean().default(true),
  cupomPrintMode: z.enum(["58MM", "80MM", "CUSTOM"] as const).default("80MM"),
  cupomCustomWidthMm: optionalFormString.default("80"),
}).superRefine((values, ctx) => {
  if (values.cupomPrintMode !== "CUSTOM") {
    return;
  }

  const width = Number(values.cupomCustomWidthMm);
  if (!Number.isFinite(width) || width < 40 || width > 120) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cupomCustomWidthMm"],
      message: "Informe uma largura entre 40mm e 120mm.",
    });
  }
});

export type BackofficeUnidadeFormValues = z.infer<typeof backofficeUnidadeSchema>;

export function buildBackofficeUnidadeDefaults(
  tenant?: Tenant | null,
  academiaId?: string,
): BackofficeUnidadeFormValues {
  return {
    academiaId: tenant?.academiaId ?? tenant?.groupId ?? academiaId ?? "",
    nome: tenant?.nome ?? "",
    razaoSocial: tenant?.razaoSocial ?? "",
    documento: tenant?.documento ?? "",
    groupId: tenant?.groupId ?? "",
    subdomain: tenant?.subdomain ?? "",
    email: tenant?.email ?? "",
    telefone: tenant?.telefone ?? "",
    ativo: tenant?.ativo !== false,
    cupomPrintMode: tenant?.configuracoes?.impressaoCupom?.modo ?? "80MM",
    cupomCustomWidthMm: String(tenant?.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80),
  };
}

export function buildBackofficeUnidadePayload(values: BackofficeUnidadeFormValues): Partial<Tenant> {
  return {
    academiaId: values.academiaId.trim(),
    groupId: values.groupId.trim() || values.academiaId.trim(),
    nome: values.nome.trim(),
    razaoSocial: values.razaoSocial.trim() || undefined,
    documento: values.documento.trim(),
    subdomain: values.subdomain.trim().toLowerCase(),
    email: values.email.trim(),
    telefone: values.telefone.trim() || undefined,
    ativo: values.ativo,
    configuracoes: {
      impressaoCupom: {
        modo: values.cupomPrintMode,
        larguraCustomMm: Math.max(40, Math.min(120, Number(values.cupomCustomWidthMm) || 80)),
      },
    },
  };
}

const unitFieldPaths = new Set<string>([
  "academiaId",
  "nome",
  "razaoSocial",
  "documento",
  "groupId",
  "subdomain",
  "email",
  "telefone",
  "ativo",
  "cupomPrintMode",
  "cupomCustomWidthMm",
]);

export function mapBackofficeUnidadeFieldError(
  field: string,
): FieldPath<BackofficeUnidadeFormValues> | null {
  if (field === "configuracoes.impressaoCupom.larguraCustomMm") {
    return "cupomCustomWidthMm";
  }

  if (unitFieldPaths.has(field)) {
    return field as FieldPath<BackofficeUnidadeFormValues>;
  }

  return null;
}
