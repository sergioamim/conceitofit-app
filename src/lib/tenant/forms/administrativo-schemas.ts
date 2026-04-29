import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

function isValidOptionalEmail(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  return z.string().email().safeParse(normalized).success;
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function hasValidOptionalPhone(value: string) {
  const digits = digitsOnly(value);
  return !digits || (digits.length >= 10 && digits.length <= 15);
}

function hasValidOptionalCpf(value: string) {
  const digits = digitsOnly(value);
  return !digits || digits.length === 11;
}

function isPastOptionalIsoDate(value: string) {
  const normalized = value.trim();
  if (!normalized) return true;
  const parsed = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parsed < today;
}

export const cargoFormSchema = z.object({
  nome: requiredTrimmedString("Informe o nome do cargo."),
  ativo: z.boolean(),
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
    if (!isValidOptionalEmail(values.emailProfissional)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailProfissional"],
        message: "Informe um e-mail profissional válido.",
      });
    }

    if (!isValidOptionalEmail(values.emailPessoal)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emailPessoal"],
        message: "Informe um e-mail pessoal válido.",
      });
    }

    if (!hasValidOptionalCpf(values.cpf)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cpf"],
        message: "Informe um CPF com 11 dígitos.",
      });
    }

    if (!hasValidOptionalPhone(values.celular)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["celular"],
        message: "Informe um celular com 10 a 15 dígitos.",
      });
    }

    if (!hasValidOptionalPhone(values.telefone)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["telefone"],
        message: "Informe um telefone com 10 a 15 dígitos.",
      });
    }

    if (!hasValidOptionalPhone(values.emergencia.telefoneResponsavel)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["emergencia", "telefoneResponsavel"],
        message: "Informe um telefone de emergência com 10 a 15 dígitos.",
      });
    }

    if (!isPastOptionalIsoDate(values.dataNascimento)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dataNascimento"],
        message: "Informe uma data de nascimento anterior a hoje.",
      });
    }

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

    if (values.contratacao.salarioAtual.trim()) {
      const parsed = Number(values.contratacao.salarioAtual.replace(",", "."));
      if (!Number.isNaN(parsed) && parsed < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contratacao", "salarioAtual"],
          message: "Informe um valor maior ou igual a zero para salário.",
        });
      }
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
