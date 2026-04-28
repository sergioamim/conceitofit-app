import { z } from "zod";
import type { FieldPath } from "react-hook-form";
import type { Tenant } from "@/lib/types";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import { isValidCnpj, normalizeCnpjDigits } from "@/lib/utils/cnpj";

function hasValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 10;
}

function hasValidEmail(value: string) {
  return z.string().email().safeParse(value).success;
}

const optionalFormString = z.string().trim().default("");

export const unidadeFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome da unidade.").min(3, "Informe o nome da unidade."),
  razaoSocial: optionalFormString,
  documento: optionalFormString.refine((value) => value.length === 0 || isValidCnpj(value), "Informe um CNPJ válido."),
  groupId: requiredTrimmedString("Informe o grupo da unidade."),
  subdomain: optionalFormString.refine(
    (value) => value.length === 0 || /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
    "Use apenas letras minúsculas, números e hífen no subdomínio.",
  ),
  email: optionalFormString.refine((value) => value.length === 0 || hasValidEmail(value), "Informe um e-mail válido."),
  telefone: optionalFormString.refine((value) => value.length === 0 || hasValidPhone(value), "Informe um telefone válido."),
  cupomPrintMode: z.enum(["58MM", "80MM", "CUSTOM"] as const).default("80MM"),
  cupomCustomWidthMm: optionalFormString,
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

export type UnidadeFormValues = z.infer<typeof unidadeFormSchema>;

export const EMPTY_UNIDADE_FORM_VALUES: UnidadeFormValues = {
  nome: "",
  razaoSocial: "",
  documento: "",
  groupId: "",
  subdomain: "",
  email: "",
  telefone: "",
  cupomPrintMode: "80MM",
  cupomCustomWidthMm: "80",
};

export function buildUnidadeFormValues(item?: Tenant | null): UnidadeFormValues {
  if (!item) {
    return { ...EMPTY_UNIDADE_FORM_VALUES };
  }

  return {
    nome: item.nome ?? "",
    razaoSocial: item.razaoSocial ?? "",
    documento: item.documento ?? "",
    groupId: item.groupId ?? "",
    subdomain: item.subdomain ?? "",
    email: item.email ?? "",
    telefone: item.telefone ?? "",
    cupomPrintMode: item.configuracoes?.impressaoCupom?.modo ?? "80MM",
    cupomCustomWidthMm: String(item.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80),
  };
}

export function buildUnidadePayload(values: UnidadeFormValues): Partial<Tenant> {
  return {
    nome: values.nome.trim(),
    razaoSocial: values.razaoSocial.trim() || undefined,
    documento: values.documento.trim() ? normalizeCnpjDigits(values.documento) : undefined,
    groupId: values.groupId.trim(),
    subdomain: values.subdomain.trim().toLowerCase() || undefined,
    email: values.email.trim() || undefined,
    telefone: values.telefone.trim() || undefined,
    configuracoes: {
      impressaoCupom: {
        modo: values.cupomPrintMode,
        larguraCustomMm: Math.max(40, Math.min(120, Number(values.cupomCustomWidthMm) || 80)),
      },
    },
  };
}

const unidadeFieldPaths = new Set<string>([
  "nome",
  "razaoSocial",
  "documento",
  "groupId",
  "subdomain",
  "email",
  "telefone",
  "cupomPrintMode",
  "cupomCustomWidthMm",
]);

export function mapUnidadeFieldError(field: string): FieldPath<UnidadeFormValues> | null {
  if (field === "configuracoes.impressaoCupom.larguraCustomMm") {
    return "cupomCustomWidthMm";
  }

  if (unidadeFieldPaths.has(field)) {
    return field as FieldPath<UnidadeFormValues>;
  }

  return null;
}
