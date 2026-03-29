"use client";

import type {
  Funcionario,
  FuncionarioHorario,
  FuncionarioMembership,
  FuncionarioStatusAcesso,
  FuncionarioStatusOperacional,
  FuncionarioTipoContratacao,
  RbacPerfil,
} from "@/lib/types";
import type {
  ColaboradorFlagFiltro,
  ColaboradorListFilters,
  ColaboradorQuickCreateDraft,
} from "@/lib/tenant/administrativo-colaboradores";

export const STATUS_OPERACIONAL_OPTIONS: Array<{ value: FuncionarioStatusOperacional | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Todos os status" },
  { value: "ATIVO", label: "Ativo" },
  { value: "BLOQUEADO", label: "Bloqueado" },
  { value: "INATIVO", label: "Inativo" },
  { value: "DESLIGADO", label: "Desligado" },
];

export const STATUS_ACESSO_OPTIONS: Array<{ value: FuncionarioStatusAcesso | "TODOS"; label: string }> = [
  { value: "TODOS", label: "Qualquer acesso" },
  { value: "SEM_ACESSO", label: "Sem acesso" },
  { value: "ATIVO", label: "Acesso ativo" },
  { value: "CONVITE_PENDENTE", label: "Convite pendente" },
  { value: "PRIMEIRO_ACESSO", label: "Primeiro acesso" },
  { value: "BLOQUEADO", label: "Bloqueado" },
];

export const FLAG_OPTIONS: Array<{ value: ColaboradorFlagFiltro; label: string }> = [
  { value: "TODOS", label: "Todas as flags" },
  { value: "AULAS", label: "Ministra aulas" },
  { value: "CATRACA", label: "Opera catraca" },
  { value: "FORA_HORARIO", label: "Fora do horário" },
  { value: "TECLADO", label: "Teclado de acesso" },
  { value: "COORDENADOR", label: "Coordenação" },
];

export const TAB_OPTIONS = [
  { value: "cadastro", label: "Cadastro" },
  { value: "contratacao", label: "Contratação" },
  { value: "permissoes", label: "Permissões" },
  { value: "horario", label: "Horário" },
  { value: "informacoes", label: "Informações" },
  { value: "notificacoes", label: "Notificações" },
] as const;

export const TIPO_CONTRATACAO_OPTIONS: FuncionarioTipoContratacao[] = ["CLT", "PJ", "ESTAGIO", "AUTONOMO", "HORISTA", "OUTRO"];

export const DEFAULT_FILTERS: ColaboradorListFilters = {
  query: "",
  statusOperacional: "TODOS",
  statusAcesso: "TODOS",
  cargoId: "",
  unidadeId: "",
  flag: "TODOS",
};

const DEFAULT_QUICK_CREATE: ColaboradorQuickCreateDraft = {
  nome: "",
  emailProfissional: "",
  celular: "",
  cargoId: "",
  cargo: "",
  podeMinistrarAulas: false,
  permiteCatraca: false,
  permiteForaHorario: false,
  utilizaTecladoAcesso: false,
  coordenador: false,
  criarAcessoSistema: true,
  provisionamentoAcesso: "CONVITE",
  tenantIds: [],
  tenantBaseId: "",
  perfilAcessoInicialId: "",
  observacoes: "",
};

export const FALLBACK_PERFIS: RbacPerfil[] = [
  { id: "perfil-admin-fallback", tenantId: "fallback", roleName: "ADMIN", displayName: "Administrador", active: true },
  { id: "perfil-gerente-fallback", tenantId: "fallback", roleName: "GERENTE", displayName: "Gerente", active: true },
  { id: "perfil-atendente-fallback", tenantId: "fallback", roleName: "ATENDENTE", displayName: "Atendente", active: true },
];

const DIAS_SEMANA: Array<FuncionarioHorario["diaSemana"]> = ["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"];

export type FuncionarioFormValues = {
  nome: string;
  nomeRegistro: string;
  apelido: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  cargoId: string;
  cargo: string;
  emailProfissional: string;
  emailPessoal: string;
  celular: string;
  telefone: string;
  podeMinistrarAulas: boolean;
  permiteCatraca: boolean;
  permiteForaHorario: boolean;
  utilizaTecladoAcesso: boolean;
  bloqueiaAcessoSistema: boolean;
  coordenador: boolean;
  statusOperacional: FuncionarioStatusOperacional;
  statusAcesso: FuncionarioStatusAcesso;
  possuiAcessoSistema: boolean;
  provisionamentoAcesso: "SEM_ACESSO" | "CONVITE" | "REUTILIZAR_USUARIO";
  tenantBaseId: string;
  tenantBaseNome: string;
  perfilAcessoInicialId: string;
  memberships: FuncionarioMembership[];
  tenantIds: string[];
  criarAcessoSistema: boolean;
  origemCadastro: Funcionario["origemCadastro"];
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento: string;
    bairro: string;
    cidade: string;
    estado: string;
    pais: string;
  };
  emergencia: {
    nomeResponsavel: string;
    telefoneResponsavel: string;
    convenioMedico: string;
    hospitalPreferencia: string;
    alergias: string;
    observacoes: string;
  };
  contratacao: {
    tipo: FuncionarioTipoContratacao | "";
    dataAdmissao: string;
    dataDemissao: string;
    cargoContratual: string;
    salarioAtual: string;
    banco: string;
    agencia: string;
    conta: string;
    pixTipo: "" | "CPF" | "EMAIL" | "TELEFONE" | "ALEATORIA";
    pixValor: string;
    observacoes: string;
  };
  horarios: Array<{
    diaSemana: FuncionarioHorario["diaSemana"];
    horaInicio: string;
    horaFim: string;
    permiteForaHorario: boolean;
    ativo: boolean;
  }>;
  observacoes: string;
  informacoesInternas: string;
  notificacoes: {
    email: boolean;
    whatsapp: boolean;
    pendenciasOperacionais: boolean;
    escala: boolean;
  };
};

function buildDefaultHorarios() {
  return DIAS_SEMANA.map((dia) => ({
    diaSemana: dia,
    horaInicio: "09:00",
    horaFim: "18:00",
    permiteForaHorario: false,
    ativo: dia !== "SAB" && dia !== "DOM",
  }));
}

export function createFuncionarioFormDefaults(currentTenantId?: string): FuncionarioFormValues {
  return {
    nome: "",
    nomeRegistro: "",
    apelido: "",
    cpf: "",
    rg: "",
    dataNascimento: "",
    cargoId: "",
    cargo: "",
    emailProfissional: "",
    emailPessoal: "",
    celular: "",
    telefone: "",
    podeMinistrarAulas: false,
    permiteCatraca: false,
    permiteForaHorario: false,
    utilizaTecladoAcesso: false,
    bloqueiaAcessoSistema: false,
    coordenador: false,
    statusOperacional: "ATIVO",
    statusAcesso: "CONVITE_PENDENTE",
    possuiAcessoSistema: true,
    provisionamentoAcesso: "CONVITE",
    tenantBaseId: currentTenantId ?? "",
    tenantBaseNome: "",
    perfilAcessoInicialId: "",
    memberships: [],
    tenantIds: currentTenantId ? [currentTenantId] : [],
    criarAcessoSistema: true,
    origemCadastro: "MANUAL",
    endereco: {
      cep: "",
      logradouro: "",
      numero: "",
      complemento: "",
      bairro: "",
      cidade: "",
      estado: "",
      pais: "Brasil",
    },
    emergencia: {
      nomeResponsavel: "",
      telefoneResponsavel: "",
      convenioMedico: "",
      hospitalPreferencia: "",
      alergias: "",
      observacoes: "",
    },
    contratacao: {
      tipo: "",
      dataAdmissao: "",
      dataDemissao: "",
      cargoContratual: "",
      salarioAtual: "",
      banco: "",
      agencia: "",
      conta: "",
      pixTipo: "",
      pixValor: "",
      observacoes: "",
    },
    horarios: buildDefaultHorarios(),
    observacoes: "",
    informacoesInternas: "",
    notificacoes: {
      email: true,
      whatsapp: false,
      pendenciasOperacionais: true,
      escala: false,
    },
  };
}

export function funcionarioToFormValues(input: Funcionario): FuncionarioFormValues {
  return {
    nome: input.nome,
    nomeRegistro: input.nomeRegistro ?? "",
    apelido: input.apelido ?? "",
    cpf: input.cpf ?? "",
    rg: input.rg ?? "",
    dataNascimento: input.dataNascimento ?? "",
    cargoId: input.cargoId ?? "",
    cargo: input.cargo ?? "",
    emailProfissional: input.emailProfissional ?? "",
    emailPessoal: input.emailPessoal ?? "",
    celular: input.celular ?? "",
    telefone: input.telefone ?? "",
    podeMinistrarAulas: input.podeMinistrarAulas,
    permiteCatraca: input.permiteCatraca ?? false,
    permiteForaHorario: input.permiteForaHorario ?? false,
    utilizaTecladoAcesso: input.utilizaTecladoAcesso ?? false,
    bloqueiaAcessoSistema: input.bloqueiaAcessoSistema ?? false,
    coordenador: input.coordenador ?? false,
    statusOperacional: input.statusOperacional ?? (input.ativo ? "ATIVO" : "INATIVO"),
    statusAcesso: input.statusAcesso ?? (input.possuiAcessoSistema ? "ATIVO" : "SEM_ACESSO"),
    possuiAcessoSistema: input.possuiAcessoSistema ?? false,
    provisionamentoAcesso: input.provisionamentoAcesso ?? (input.possuiAcessoSistema ? "CONVITE" : "SEM_ACESSO"),
    tenantBaseId: input.tenantBaseId ?? input.memberships?.find((item) => item.defaultTenant)?.tenantId ?? "",
    tenantBaseNome: input.tenantBaseNome ?? input.memberships?.find((item) => item.defaultTenant)?.tenantNome ?? "",
    perfilAcessoInicialId: input.perfilAcessoInicialId ?? "",
    memberships: [...(input.memberships ?? [])],
    tenantIds: (input.memberships ?? []).map((membership) => membership.tenantId),
    criarAcessoSistema: input.possuiAcessoSistema ?? false,
    origemCadastro: input.origemCadastro ?? "MANUAL",
    endereco: {
      cep: input.endereco?.cep ?? "",
      logradouro: input.endereco?.logradouro ?? "",
      numero: input.endereco?.numero ?? "",
      complemento: input.endereco?.complemento ?? "",
      bairro: input.endereco?.bairro ?? "",
      cidade: input.endereco?.cidade ?? "",
      estado: input.endereco?.estado ?? "",
      pais: input.endereco?.pais ?? "Brasil",
    },
    emergencia: {
      nomeResponsavel: input.emergencia?.nomeResponsavel ?? "",
      telefoneResponsavel: input.emergencia?.telefoneResponsavel ?? "",
      convenioMedico: input.emergencia?.convenioMedico ?? "",
      hospitalPreferencia: input.emergencia?.hospitalPreferencia ?? "",
      alergias: input.emergencia?.alergias ?? "",
      observacoes: input.emergencia?.observacoes ?? "",
    },
    contratacao: {
      tipo: input.contratacao?.tipo ?? "",
      dataAdmissao: input.contratacao?.dataAdmissao ?? "",
      dataDemissao: input.contratacao?.dataDemissao ?? "",
      cargoContratual: input.contratacao?.cargoContratual ?? "",
      salarioAtual: input.contratacao?.salarioAtual != null ? String(input.contratacao.salarioAtual) : "",
      banco: input.contratacao?.banco ?? "",
      agencia: input.contratacao?.agencia ?? "",
      conta: input.contratacao?.conta ?? "",
      pixTipo: input.contratacao?.pixTipo ?? "",
      pixValor: input.contratacao?.pixValor ?? "",
      observacoes: input.contratacao?.observacoes ?? "",
    },
    horarios: input.horarios?.length
      ? input.horarios.map((item) => ({
          diaSemana: item.diaSemana,
          horaInicio: item.horaInicio ?? "",
          horaFim: item.horaFim ?? "",
          permiteForaHorario: item.permiteForaHorario ?? false,
          ativo: item.ativo ?? false,
        }))
      : buildDefaultHorarios(),
    observacoes: input.observacoes ?? "",
    informacoesInternas: input.informacoesInternas ?? "",
    notificacoes: {
      email: input.notificacoes?.email ?? true,
      whatsapp: input.notificacoes?.whatsapp ?? false,
      pendenciasOperacionais: input.notificacoes?.pendenciasOperacionais ?? true,
      escala: input.notificacoes?.escala ?? false,
    },
  };
}

export function formValuesToFuncionario(values: FuncionarioFormValues, source: Funcionario): Funcionario {
  return {
    ...source,
    nome: values.nome.trim(),
    nomeRegistro: values.nomeRegistro.trim() || undefined,
    apelido: values.apelido.trim() || undefined,
    cpf: values.cpf.trim() || undefined,
    rg: values.rg.trim() || undefined,
    dataNascimento: values.dataNascimento || undefined,
    cargoId: values.cargoId || undefined,
    cargo: values.cargo || undefined,
    emailProfissional: values.emailProfissional.trim() || undefined,
    emailPessoal: values.emailPessoal.trim() || undefined,
    celular: values.celular.trim() || undefined,
    telefone: values.telefone.trim() || undefined,
    podeMinistrarAulas: values.podeMinistrarAulas,
    permiteCatraca: values.permiteCatraca,
    permiteForaHorario: values.permiteForaHorario,
    utilizaTecladoAcesso: values.utilizaTecladoAcesso,
    bloqueiaAcessoSistema: values.bloqueiaAcessoSistema,
    coordenador: values.coordenador,
    statusOperacional: values.statusOperacional,
    statusAcesso: values.statusAcesso,
    possuiAcessoSistema: values.possuiAcessoSistema,
    provisionamentoAcesso: values.possuiAcessoSistema ? values.provisionamentoAcesso : "SEM_ACESSO",
    tenantBaseId: values.tenantBaseId || undefined,
    tenantBaseNome: values.tenantBaseNome || undefined,
    perfilAcessoInicialId: values.perfilAcessoInicialId || undefined,
    memberships: source.memberships,
    endereco: {
      cep: values.endereco.cep.trim() || undefined,
      logradouro: values.endereco.logradouro.trim() || undefined,
      numero: values.endereco.numero.trim() || undefined,
      complemento: values.endereco.complemento.trim() || undefined,
      bairro: values.endereco.bairro.trim() || undefined,
      cidade: values.endereco.cidade.trim() || undefined,
      estado: values.endereco.estado.trim() || undefined,
      pais: values.endereco.pais.trim() || undefined,
    },
    emergencia: {
      nomeResponsavel: values.emergencia.nomeResponsavel.trim() || undefined,
      telefoneResponsavel: values.emergencia.telefoneResponsavel.trim() || undefined,
      convenioMedico: values.emergencia.convenioMedico.trim() || undefined,
      hospitalPreferencia: values.emergencia.hospitalPreferencia.trim() || undefined,
      alergias: values.emergencia.alergias.trim() || undefined,
      observacoes: values.emergencia.observacoes.trim() || undefined,
    },
    contratacao: {
      tipo: values.contratacao.tipo || undefined,
      dataAdmissao: values.contratacao.dataAdmissao || undefined,
      dataDemissao: values.contratacao.dataDemissao || undefined,
      cargoContratual: values.contratacao.cargoContratual.trim() || undefined,
      salarioAtual: values.contratacao.salarioAtual.trim()
        ? Number(values.contratacao.salarioAtual.replace(",", "."))
        : undefined,
      banco: values.contratacao.banco.trim() || undefined,
      agencia: values.contratacao.agencia.trim() || undefined,
      conta: values.contratacao.conta.trim() || undefined,
      pixTipo: values.contratacao.pixTipo || undefined,
      pixValor: values.contratacao.pixValor.trim() || undefined,
      observacoes: values.contratacao.observacoes.trim() || undefined,
    },
    horarios: values.horarios.map((item) => ({
      diaSemana: item.diaSemana,
      horaInicio: item.horaInicio || undefined,
      horaFim: item.horaFim || undefined,
      permiteForaHorario: item.permiteForaHorario,
      ativo: item.ativo,
    })),
    observacoes: values.observacoes.trim() || undefined,
    informacoesInternas: values.informacoesInternas.trim() || undefined,
    notificacoes: {
      email: values.notificacoes.email,
      whatsapp: values.notificacoes.whatsapp,
      pendenciasOperacionais: values.notificacoes.pendenciasOperacionais,
      escala: values.notificacoes.escala,
    },
  };
}

export function buildQuickCreateDraftFromForm(values: FuncionarioFormValues): ColaboradorQuickCreateDraft {
  return {
    nome: values.nome.trim(),
    emailProfissional: values.emailProfissional.trim(),
    celular: values.celular.trim(),
    cargoId: values.cargoId,
    cargo: values.cargo,
    podeMinistrarAulas: values.podeMinistrarAulas,
    permiteCatraca: values.permiteCatraca,
    permiteForaHorario: values.permiteForaHorario,
    utilizaTecladoAcesso: values.utilizaTecladoAcesso,
    coordenador: values.coordenador,
    criarAcessoSistema: values.criarAcessoSistema,
    provisionamentoAcesso: values.criarAcessoSistema ? values.provisionamentoAcesso : "SEM_ACESSO",
    tenantIds: values.tenantIds,
    tenantBaseId: values.tenantBaseId,
    perfilAcessoInicialId: values.perfilAcessoInicialId,
    observacoes: values.observacoes.trim(),
  };
}

export function statusTone(status?: FuncionarioStatusOperacional | FuncionarioStatusAcesso) {
  if (status === "ATIVO") return "bg-gym-teal/15 text-gym-teal";
  if (status === "CONVITE_PENDENTE" || status === "PRIMEIRO_ACESSO") return "bg-gym-warning/15 text-gym-warning";
  if (status === "BLOQUEADO" || status === "DESLIGADO") return "bg-gym-danger/15 text-gym-danger";
  return "bg-secondary text-muted-foreground";
}

export function maskSensitive(value: string | number | undefined, canView: boolean) {
  if (canView) return value || "—";
  return "Protegido";
}
