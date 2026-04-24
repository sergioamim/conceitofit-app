import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

export const cargoFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do cargo."),
  ativo: z.boolean(),
});

const funcionarioFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do funcionário."),
  cargoId: z.string(),
  ativo: z.boolean(),
  podeMinistrarAulas: z.boolean(),
});

export const convenioFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do convênio."),
  tipoDesconto: z.enum(["PERCENTUAL", "VALOR_FIXO"]).default("PERCENTUAL"),
  descontoPercentual: z.string(),
  descontoValor: z.string(),
  ativo: z.boolean(),
  permiteVoucherAcumulado: z.boolean().default(true),
  planoIds: z.array(z.string()).default([]),
  formasPagamentoPermitidas: z.array(z.string()).default([]),
  validoDe: z.string(),
  validoAte: z.string(),
  observacoes: z.string(),
});

const quickCreateColaboradorFormSchema = z.object({
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

const funcionarioPerfilBaseSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do colaborador."),
  nomeRegistro: z.string(),
  apelido: z.string(),
  cpf: z.string(),
  rg: z.string(),
  dataNascimento: z.string(),
  cargoId: z.string(),
  cargo: z.string(),
  emailProfissional: z.string(),
  emailPessoal: z.string(),
  celular: z.string(),
  telefone: z.string(),
  podeMinistrarAulas: z.boolean(),
  permiteCatraca: z.boolean(),
  permiteForaHorario: z.boolean(),
  utilizaTecladoAcesso: z.boolean(),
  bloqueiaAcessoSistema: z.boolean(),
  coordenador: z.boolean(),
  statusOperacional: z.enum(["ATIVO", "BLOQUEADO", "INATIVO", "DESLIGADO"]),
  statusAcesso: z.enum(["SEM_ACESSO", "ATIVO", "CONVITE_PENDENTE", "PRIMEIRO_ACESSO", "BLOQUEADO"]),
  possuiAcessoSistema: z.boolean(),
  provisionamentoAcesso: z.enum(["SEM_ACESSO", "CONVITE", "REUTILIZAR_USUARIO"]),
  tenantBaseId: z.string(),
  tenantBaseNome: z.string(),
  perfilAcessoInicialId: z.string(),
  memberships: z.array(
    z.object({
      tenantId: z.string(),
      tenantNome: z.string(),
      roleName: z.string().optional(),
      roleDisplayName: z.string().optional(),
      defaultTenant: z.boolean().optional(),
      active: z.boolean().optional(),
      accessOrigin: z.enum(["MANUAL", "HERDADO_POLITICA"]).optional(),
    })
  ),
  tenantIds: z.array(z.string()).default([]),
  criarAcessoSistema: z.boolean(),
  origemCadastro: z.enum(["MANUAL", "IMPORTADO_EVO", "CONVITE", "SINCRONIZADO"]).optional(),
  endereco: z.object({
    cep: z.string(),
    logradouro: z.string(),
    numero: z.string(),
    complemento: z.string(),
    bairro: z.string(),
    cidade: z.string(),
    estado: z.string(),
    pais: z.string(),
  }),
  emergencia: z.object({
    nomeResponsavel: z.string(),
    telefoneResponsavel: z.string(),
    convenioMedico: z.string(),
    hospitalPreferencia: z.string(),
    alergias: z.string(),
    observacoes: z.string(),
  }),
  contratacao: z.object({
    tipo: z.enum(["", "CLT", "PJ", "ESTAGIO", "AUTONOMO", "HORISTA", "OUTRO"]),
    dataAdmissao: z.string(),
    dataDemissao: z.string(),
    cargoContratual: z.string(),
    salarioAtual: z.string(),
    banco: z.string(),
    agencia: z.string(),
    conta: z.string(),
    pixTipo: z.enum(["", "CPF", "EMAIL", "TELEFONE", "ALEATORIA"]),
    pixValor: z.string(),
    observacoes: z.string(),
  }),
  horarios: z.array(
    z.object({
      diaSemana: z.enum(["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"]),
      horaInicio: z.string(),
      horaFim: z.string(),
      permiteForaHorario: z.boolean(),
      ativo: z.boolean(),
    })
  ),
  observacoes: z.string(),
  informacoesInternas: z.string(),
  notificacoes: z.object({
    email: z.boolean(),
    whatsapp: z.boolean(),
    pendenciasOperacionais: z.boolean(),
    escala: z.boolean(),
  }),
});

export function buildFuncionarioProfileFormSchema(mode: "create" | "edit") {
  return funcionarioPerfilBaseSchema.superRefine((values, ctx) => {
    if (mode === "create" && values.criarAcessoSistema && !values.emailProfissional.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailProfissional"],
        message: "Informe o e-mail profissional para criar acesso.",
      });
    }

    if (mode === "create" && values.criarAcessoSistema && values.tenantIds.filter(Boolean).length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tenantIds"],
        message: "Selecione ao menos uma unidade para provisionar o acesso.",
      });
    }

    if (mode === "create" && values.criarAcessoSistema && !values.perfilAcessoInicialId.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["perfilAcessoInicialId"],
        message: "Selecione um perfil inicial de acesso.",
      });
    }

    if (
      mode === "create" &&
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

    if (values.contratacao.salarioAtual.trim() && Number.isNaN(Number(values.contratacao.salarioAtual.replace(",", ".")))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["contratacao", "salarioAtual"],
        message: "Informe um valor numérico válido para salário.",
      });
    }
  });
}

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
