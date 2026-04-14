import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

const stringIdArraySchema = z.array(z.string().trim()).default([]);

export const globalUserCreateBaseFormSchema = z.object({
  name: requiredTrimmedString("Informe o nome do usuário."),
  email: requiredTrimmedString("Informe o e-mail principal."),
  cpf: z.string().default(""),
  userKind: z.string().default("OPERADOR"),
  scopeType: z.enum(["UNIDADE", "REDE", "GLOBAL"]),
  academiaId: z.string().default(""),
  tenantIds: stringIdArraySchema,
  defaultTenantId: z.string().default(""),
  broadAccess: z.boolean(),
  eligibleForNewUnits: z.boolean(),
  policyScope: z.enum(["ACADEMIA_ATUAL", "REDE"]),
});

export const globalUserCreateFormSchema = globalUserCreateBaseFormSchema.superRefine((values, ctx) => {
  if (values.scopeType !== "GLOBAL" && !values.academiaId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["academiaId"],
      message: "Selecione a academia de referência para o acesso.",
    });
  }

  if (values.scopeType !== "GLOBAL" && values.tenantIds.filter((item) => item.trim()).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantIds"],
      message: "Selecione ao menos uma unidade inicial para o acesso.",
    });
  }

  if (values.defaultTenantId.trim() && !values.tenantIds.includes(values.defaultTenantId.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTenantId"],
      message: "A unidade base precisa estar entre as unidades selecionadas.",
    });
  }

  if (values.scopeType === "GLOBAL" && values.eligibleForNewUnits) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["eligibleForNewUnits"],
      message: "Propagação para novas unidades só pode ser definida em escopo de rede.",
    });
  }
});

export const academiaUserCreateBaseFormSchema = z.object({
  name: requiredTrimmedString("Informe o nome do usuário."),
  email: requiredTrimmedString("Informe o e-mail principal."),
  cpf: z.string().default(""),
  userKind: z.string().default("OPERADOR"),
  networkId: z.string().default(""),
  networkName: z.string().default(""),
  networkSubdomain: z.string().default(""),
  tenantIds: stringIdArraySchema,
  defaultTenantId: z.string().default(""),
  initialPerfilIds: stringIdArraySchema,
  allowedTenantIds: stringIdArraySchema,
  allowedPerfilIds: stringIdArraySchema,
});

export const academiaUserCreateFormSchema = academiaUserCreateBaseFormSchema.superRefine((values, ctx) => {
  if (!values.networkId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["networkId"],
      message: "A rede atual precisa estar identificada para criar o usuário.",
    });
  }

  if (values.tenantIds.filter((item) => item.trim()).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantIds"],
      message: "Selecione ao menos uma unidade da rede atual.",
    });
  }

  if (
    values.allowedTenantIds.length > 0 &&
    values.tenantIds.some((tenantId) => !values.allowedTenantIds.includes(tenantId))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantIds"],
      message: "A academia só pode criar usuários dentro das unidades da própria rede.",
    });
  }

  if (values.defaultTenantId.trim() && !values.tenantIds.includes(values.defaultTenantId.trim())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["defaultTenantId"],
      message: "A unidade base precisa estar entre as unidades selecionadas.",
    });
  }

  if (
    values.allowedPerfilIds.length > 0 &&
    values.initialPerfilIds.some((perfilId) => !values.allowedPerfilIds.includes(perfilId))
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["initialPerfilIds"],
      message: "Selecione apenas perfis disponíveis para a academia atual.",
    });
  }
});
