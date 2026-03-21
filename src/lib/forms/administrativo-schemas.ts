import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

export const cargoFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do cargo."),
  ativo: z.boolean(),
});

export const funcionarioFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do funcionário."),
  cargoId: z.string(),
  ativo: z.boolean(),
  podeMinistrarAulas: z.boolean(),
});

export const convenioFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do convênio."),
  descontoPercentual: z.string(),
  ativo: z.boolean(),
  planoIds: z.array(z.string()).default([]),
  observacoes: z.string(),
});

export const quickCreateColaboradorFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do colaborador."),
  emailProfissional: z.string(),
  celular: z.string(),
  cargoId: z.string(),
  cargo: z.string().optional(),
  podeMinistrarAulas: z.boolean(),
  permiteCatraca: z.boolean(),
  permiteForaHorario: z.boolean(),
  utilizaTecladoAcesso: z.boolean(),
  coordenador: z.boolean(),
  criarAcessoSistema: z.boolean(),
  provisionamentoAcesso: z.enum(["CONVITE", "REUTILIZAR_USUARIO", "SEM_ACESSO"]),
  tenantIds: z.array(z.string()).default([]),
  tenantBaseId: z.string(),
  perfilAcessoInicialId: z.string(),
  observacoes: z.string(),
}).superRefine((values, ctx) => {
  if (values.criarAcessoSistema && !values.emailProfissional.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["emailProfissional"],
      message: "Informe o e-mail profissional para criar acesso.",
    });
  }
  if (values.criarAcessoSistema && values.tenantIds.filter(Boolean).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantIds"],
      message: "Selecione ao menos uma unidade para provisionar o acesso.",
    });
  }
  if (values.criarAcessoSistema && !values.perfilAcessoInicialId.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["perfilAcessoInicialId"],
      message: "Selecione um perfil inicial de acesso.",
    });
  }
  if (
    values.criarAcessoSistema &&
    values.tenantIds.filter(Boolean).length > 0 &&
    !values.tenantIds.includes(values.tenantBaseId)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["tenantBaseId"],
      message: "A unidade base precisa estar entre as unidades selecionadas.",
    });
  }
});

export const novoVoucherStepSchema = z.object({
  escopo: z.enum(["UNIDADE", "GRUPO"]),
  tipo: requiredTrimmedString("Selecione o tipo de voucher"),
  nome: requiredTrimmedString("Informe o nome do voucher"),
  periodoInicio: requiredTrimmedString("Informe a data de início"),
  periodoFim: z.string(),
  prazoDeterminado: z.boolean(),
  quantidade: z.string(),
  ilimitada: z.boolean(),
  codigoTipo: z.enum(["UNICO", "ALEATORIO"]),
  codigoUnicoCustom: z.string(),
  usarNaVenda: z.boolean(),
  planoIds: z.array(z.string()).default([]),
  umaVezPorCliente: z.boolean(),
  aplicarEm: z.array(z.string()).default([]),
}).superRefine((values, ctx) => {
  if (values.prazoDeterminado && !values.periodoFim.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["periodoFim"],
      message: "Informe a data de término",
    });
  }
  if (!values.ilimitada && !values.quantidade.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantidade"],
      message: "Informe a quantidade ou marque ilimitada",
    });
  }
  if (values.codigoTipo === "UNICO" && !values.codigoUnicoCustom.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["codigoUnicoCustom"],
      message: "Digite o código único do voucher",
    });
  }
});

export const editarVoucherFormSchema = z.object({
  escopo: z.enum(["UNIDADE", "GRUPO"]),
  tipo: requiredTrimmedString("Selecione o tipo de voucher"),
  nome: requiredTrimmedString("Informe o nome do voucher"),
  periodoInicio: requiredTrimmedString("Informe a data de início"),
  periodoFim: z.string(),
  prazoDeterminado: z.boolean(),
  quantidade: z.string(),
  ilimitada: z.boolean(),
  usarNaVenda: z.boolean(),
  planoIds: z.array(z.string()).default([]),
  umaVezPorCliente: z.boolean(),
  aplicarEm: z.array(z.string()).default([]),
}).superRefine((values, ctx) => {
  if (values.prazoDeterminado && !values.periodoFim.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["periodoFim"],
      message: "Informe a data de término",
    });
  }
  if (!values.ilimitada && !values.quantidade.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["quantidade"],
      message: "Informe a quantidade ou marque ilimitada",
    });
  }
});
