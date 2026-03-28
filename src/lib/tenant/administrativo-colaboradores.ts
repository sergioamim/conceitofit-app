import type {
  Cargo,
  DiaSemana,
  Funcionario,
  FuncionarioMembership,
  FuncionarioProvisionamentoAcesso,
  FuncionarioStatusAcesso,
  FuncionarioStatusOperacional,
  FuncionarioTipoContratacao,
  RbacPerfil,
  Tenant,
} from "@/lib/types";

type FuncionarioNotificacaoApiEvento =
  | "ESCALA_ALTERADA"
  | "AULA_ATRIBUIDA"
  | "ACESSO_BLOQUEADO"
  | "COMUNICADO_OPERACIONAL";

type FuncionarioNotificacaoApiRequest = {
  evento: FuncionarioNotificacaoApiEvento;
  email: boolean;
  push: boolean;
  inApp: boolean;
};

export type ColaboradorFlagFiltro =
  | "TODOS"
  | "AULAS"
  | "CATRACA"
  | "FORA_HORARIO"
  | "TECLADO"
  | "COORDENADOR";

export type ColaboradorListFilters = {
  query: string;
  statusOperacional: FuncionarioStatusOperacional | "TODOS";
  statusAcesso: FuncionarioStatusAcesso | "TODOS";
  cargoId: string;
  unidadeId: string;
  flag: ColaboradorFlagFiltro;
};

export type ColaboradorQuickCreateDraft = {
  nome: string;
  emailProfissional: string;
  celular: string;
  cargoId: string;
  cargo?: string;
  podeMinistrarAulas: boolean;
  permiteCatraca: boolean;
  permiteForaHorario: boolean;
  utilizaTecladoAcesso: boolean;
  coordenador: boolean;
  criarAcessoSistema: boolean;
  provisionamentoAcesso: FuncionarioProvisionamentoAcesso;
  tenantIds: string[];
  tenantBaseId: string;
  perfilAcessoInicialId: string;
  observacoes: string;
};

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function cleanBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "sim"].includes(normalized)) return true;
    if (["false", "0", "nao", "não"].includes(normalized)) return false;
  }
  return fallback;
}

function cleanNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".").trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function normalizeDiaSemana(value: unknown): DiaSemana | undefined {
  const normalized = cleanString(value)?.toUpperCase();
  if (!normalized) return undefined;
  if (["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].includes(normalized)) {
    return normalized as DiaSemana;
  }
  return undefined;
}

function normalizeStatusOperacional(value: unknown, ativo = true): FuncionarioStatusOperacional {
  const normalized = cleanString(value)?.toUpperCase();
  if (normalized === "ATIVO" || normalized === "BLOQUEADO" || normalized === "INATIVO" || normalized === "DESLIGADO") {
    return normalized;
  }
  return ativo ? "ATIVO" : "INATIVO";
}

function normalizeStatusAcesso(value: unknown, input: {
  possuiAcessoSistema: boolean;
  bloqueiaAcessoSistema: boolean;
}): FuncionarioStatusAcesso {
  const normalized = cleanString(value)?.toUpperCase();
  if (
    normalized === "SEM_ACESSO"
    || normalized === "ATIVO"
    || normalized === "CONVITE_PENDENTE"
    || normalized === "PRIMEIRO_ACESSO"
    || normalized === "BLOQUEADO"
  ) {
    return normalized;
  }
  if (input.bloqueiaAcessoSistema) return "BLOQUEADO";
  return input.possuiAcessoSistema ? "ATIVO" : "SEM_ACESSO";
}

function notificationHasAnyChannel(input: {
  email?: unknown;
  push?: unknown;
  inApp?: unknown;
}) {
  return cleanBoolean(input.email, false) || cleanBoolean(input.push, false) || cleanBoolean(input.inApp, false);
}

function normalizeNotificacoes(input: unknown): Funcionario["notificacoes"] | undefined {
  if (Array.isArray(input)) {
    const enabledEvents = input.reduce(
      (acc, item) => {
        if (!item || typeof item !== "object") return acc;
        const record = item as Record<string, unknown>;
        const evento = cleanString(record.evento)?.toUpperCase() as FuncionarioNotificacaoApiEvento | undefined;
        if (!evento || !notificationHasAnyChannel(record)) return acc;

        if (evento === "ESCALA_ALTERADA" || evento === "AULA_ATRIBUIDA") {
          acc.escala = true;
        }
        if (evento === "COMUNICADO_OPERACIONAL" || evento === "ACESSO_BLOQUEADO") {
          acc.pendenciasOperacionais = true;
        }
        if (cleanBoolean(record.email, false)) {
          acc.email = true;
        }
        if (cleanBoolean(record.push, false)) {
          acc.whatsapp = true;
        }
        return acc;
      },
      {
        email: false,
        whatsapp: false,
        pendenciasOperacionais: false,
        escala: false,
      }
    );

    return enabledEvents;
  }

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    return {
      email: cleanBoolean(record.email, false),
      whatsapp: cleanBoolean(record.whatsapp, false),
      pendenciasOperacionais: cleanBoolean(record.pendenciasOperacionais, false),
      escala: cleanBoolean(record.escala, false),
    };
  }

  return undefined;
}

export function serializeFuncionarioNotificacoes(input: Funcionario["notificacoes"] | undefined): FuncionarioNotificacaoApiRequest[] | undefined {
  if (!input) return undefined;

  const email = cleanBoolean(input.email, false);
  const push = cleanBoolean(input.whatsapp, false);
  const operacional = cleanBoolean(input.pendenciasOperacionais, false);
  const escala = cleanBoolean(input.escala, false);

  const requests: FuncionarioNotificacaoApiRequest[] = [];

  if (operacional) {
    requests.push({
      evento: "COMUNICADO_OPERACIONAL",
      email,
      push,
      inApp: true,
    });
    requests.push({
      evento: "ACESSO_BLOQUEADO",
      email,
      push,
      inApp: true,
    });
  }

  if (escala) {
    requests.push({
      evento: "ESCALA_ALTERADA",
      email,
      push,
      inApp: true,
    });
    requests.push({
      evento: "AULA_ATRIBUIDA",
      email,
      push,
      inApp: true,
    });
  }

  return requests;
}

function normalizeMemberships(
  raw: unknown,
  fallback: {
    tenantBaseId?: string;
    tenantBaseNome?: string;
    perfilAcessoInicialNome?: string;
    possuiAcessoSistema: boolean;
  },
): FuncionarioMembership[] {
  if (Array.isArray(raw)) {
    const memberships: FuncionarioMembership[] = [];
    raw.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const record = item as Record<string, unknown>;
      const tenantId = cleanString(record.tenantId);
      const tenantNome = cleanString(record.tenantNome);
      if (!tenantId || !tenantNome) return;
      memberships.push({
        tenantId,
        tenantNome,
        roleName: cleanString(record.roleName),
        roleDisplayName: cleanString(record.roleDisplayName),
        defaultTenant: cleanBoolean(record.defaultTenant),
        active: cleanBoolean(record.active, true),
        accessOrigin:
          cleanString(record.accessOrigin)?.toUpperCase() === "HERDADO_POLITICA"
            ? "HERDADO_POLITICA"
            : "MANUAL",
      });
    });
    return memberships;
  }

  if (!fallback.possuiAcessoSistema || !fallback.tenantBaseId || !fallback.tenantBaseNome) {
    return [];
  }

  return [
    {
      tenantId: fallback.tenantBaseId,
      tenantNome: fallback.tenantBaseNome,
      roleDisplayName: fallback.perfilAcessoInicialNome,
      defaultTenant: true,
      active: true,
      accessOrigin: "MANUAL",
    },
  ];
}

export function normalizeFuncionarioRecord(input: Record<string, unknown>, fallbackTenantId?: string): Funcionario {
  const ativo = cleanBoolean(input.ativo, true);
  const possuiAcessoSistema = cleanBoolean(
    input.possuiAcessoSistema,
    Boolean(cleanString(input.usuarioId) || (Array.isArray(input.memberships) && input.memberships.length > 0)),
  );
  const bloqueiaAcessoSistema = cleanBoolean(input.bloqueiaAcessoSistema, false);
  const tenantBaseId = cleanString(input.tenantBaseId);
  const tenantBaseNome = cleanString(input.tenantBaseNome);
  const perfilAcessoInicialNome = cleanString(input.perfilAcessoInicialNome);

  return {
    id: cleanString(input.id) ?? "",
    tenantId: cleanString(input.tenantId) ?? fallbackTenantId,
    usuarioId: cleanString(input.usuarioId),
    externalId: cleanString(input.externalId),
    nome: cleanString(input.nome) ?? "Colaborador sem nome",
    nomeRegistro: cleanString(input.nomeRegistro),
    apelido: cleanString(input.apelido),
    cpf: cleanString(input.cpf),
    rg: cleanString(input.rg),
    dataNascimento: cleanString(input.dataNascimento),
    cargoId: cleanString(input.cargoId),
    cargo: cleanString(input.cargo),
    emailProfissional: cleanString(input.emailProfissional) ?? cleanString(input.email),
    emailPessoal: cleanString(input.emailPessoal),
    celular: cleanString(input.celular),
    telefone: cleanString(input.telefone),
    podeMinistrarAulas: cleanBoolean(input.podeMinistrarAulas, false),
    permiteCatraca: cleanBoolean(input.permiteCatraca, false),
    permiteForaHorario: cleanBoolean(input.permiteForaHorario, false),
    utilizaTecladoAcesso: cleanBoolean(input.utilizaTecladoAcesso, false),
    bloqueiaAcessoSistema,
    coordenador: cleanBoolean(input.coordenador, false),
    alertaFuncionarios: cleanBoolean(input.alertaFuncionarios, false),
    statusOperacional: normalizeStatusOperacional(input.statusOperacional, ativo),
    statusAcesso: normalizeStatusAcesso(input.statusAcesso, {
      possuiAcessoSistema,
      bloqueiaAcessoSistema,
    }),
    origemCadastro:
      cleanString(input.origemCadastro)?.toUpperCase() === "IMPORTADO_EVO"
        ? "IMPORTADO_EVO"
        : cleanString(input.origemCadastro)?.toUpperCase() === "CONVITE"
          ? "CONVITE"
          : cleanString(input.origemCadastro)?.toUpperCase() === "SINCRONIZADO"
            ? "SINCRONIZADO"
            : "MANUAL",
    possuiAcessoSistema,
    provisionamentoAcesso:
      cleanString(input.provisionamentoAcesso)?.toUpperCase() === "REUTILIZAR_USUARIO"
        ? "REUTILIZAR_USUARIO"
        : cleanString(input.provisionamentoAcesso)?.toUpperCase() === "SEM_ACESSO"
          ? "SEM_ACESSO"
          : "CONVITE",
    tenantBaseId,
    tenantBaseNome,
    perfilAcessoInicialId: cleanString(input.perfilAcessoInicialId),
    perfilAcessoInicialNome,
    memberships: normalizeMemberships(input.memberships, {
      tenantBaseId,
      tenantBaseNome,
      perfilAcessoInicialNome,
      possuiAcessoSistema,
    }),
    endereco:
      input.endereco && typeof input.endereco === "object"
        ? {
            cep: cleanString((input.endereco as Record<string, unknown>).cep),
            logradouro: cleanString((input.endereco as Record<string, unknown>).logradouro),
            numero: cleanString((input.endereco as Record<string, unknown>).numero),
            complemento: cleanString((input.endereco as Record<string, unknown>).complemento),
            bairro: cleanString((input.endereco as Record<string, unknown>).bairro),
            cidade: cleanString((input.endereco as Record<string, unknown>).cidade),
            estado: cleanString((input.endereco as Record<string, unknown>).estado),
            pais: cleanString((input.endereco as Record<string, unknown>).pais) ?? "Brasil",
          }
        : undefined,
    emergencia:
      input.emergencia && typeof input.emergencia === "object"
        ? {
            nomeResponsavel: cleanString((input.emergencia as Record<string, unknown>).nomeResponsavel),
            telefoneResponsavel: cleanString((input.emergencia as Record<string, unknown>).telefoneResponsavel),
            convenioMedico: cleanString((input.emergencia as Record<string, unknown>).convenioMedico),
            hospitalPreferencia: cleanString((input.emergencia as Record<string, unknown>).hospitalPreferencia),
            alergias: cleanString((input.emergencia as Record<string, unknown>).alergias),
            observacoes: cleanString((input.emergencia as Record<string, unknown>).observacoes),
          }
        : undefined,
    contratacao:
      input.contratacao && typeof input.contratacao === "object"
        ? {
            tipo: cleanString((input.contratacao as Record<string, unknown>).tipo)?.toUpperCase() as FuncionarioTipoContratacao | undefined,
            dataAdmissao: cleanString((input.contratacao as Record<string, unknown>).dataAdmissao),
            dataDemissao: cleanString((input.contratacao as Record<string, unknown>).dataDemissao),
            cargoContratual: cleanString((input.contratacao as Record<string, unknown>).cargoContratual),
            salarioAtual: cleanNumber((input.contratacao as Record<string, unknown>).salarioAtual),
            banco: cleanString((input.contratacao as Record<string, unknown>).banco),
            agencia: cleanString((input.contratacao as Record<string, unknown>).agencia),
            conta: cleanString((input.contratacao as Record<string, unknown>).conta),
            pixTipo: cleanString((input.contratacao as Record<string, unknown>).pixTipo)?.toUpperCase() as "CPF" | "EMAIL" | "TELEFONE" | "ALEATORIA" | undefined,
            pixValor: cleanString((input.contratacao as Record<string, unknown>).pixValor),
            observacoes: cleanString((input.contratacao as Record<string, unknown>).observacoes),
          }
        : undefined,
    horarios: Array.isArray(input.horarios)
      ? input.horarios.reduce<NonNullable<Funcionario["horarios"]>>((acc, item) => {
          if (!item || typeof item !== "object") return acc;
          const record = item as Record<string, unknown>;
          const diaSemana = normalizeDiaSemana(record.diaSemana);
          if (!diaSemana) return acc;
          acc.push({
            id: cleanString(record.id),
            diaSemana,
            horaInicio: cleanString(record.horaInicio),
            horaFim: cleanString(record.horaFim),
            permiteForaHorario: cleanBoolean(record.permiteForaHorario, false),
            ativo: cleanBoolean(record.ativo, true),
          });
          return acc;
        }, [])
      : [],
    observacoes: cleanString(input.observacoes),
    informacoesInternas: cleanString(input.informacoesInternas),
    notificacoes: normalizeNotificacoes(input.notificacoes),
    ativo,
  };
}

export function filterColaboradores(items: Funcionario[], filters: ColaboradorListFilters): Funcionario[] {
  const query = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.statusOperacional !== "TODOS" && item.statusOperacional !== filters.statusOperacional) {
      return false;
    }
    if (filters.statusAcesso !== "TODOS" && item.statusAcesso !== filters.statusAcesso) {
      return false;
    }
    if (filters.cargoId && item.cargoId !== filters.cargoId) {
      return false;
    }
    if (filters.unidadeId && !item.memberships?.some((membership) => membership.tenantId === filters.unidadeId)) {
      return false;
    }
    if (filters.flag === "AULAS" && !item.podeMinistrarAulas) return false;
    if (filters.flag === "CATRACA" && !item.permiteCatraca) return false;
    if (filters.flag === "FORA_HORARIO" && !item.permiteForaHorario) return false;
    if (filters.flag === "TECLADO" && !item.utilizaTecladoAcesso) return false;
    if (filters.flag === "COORDENADOR" && !item.coordenador) return false;

    if (!query) return true;

    const haystack = [
      item.nome,
      item.apelido,
      item.cargo,
      item.emailProfissional,
      item.emailPessoal,
      item.cpf,
      item.tenantBaseNome,
      ...(item.memberships?.map((membership) => membership.tenantNome) ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

export function buildQuickCreateColaboradorPayload(input: {
  draft: ColaboradorQuickCreateDraft;
  cargos: Cargo[];
  perfis: RbacPerfil[];
  availableTenants: Tenant[];
  currentTenantId?: string;
}): Omit<Funcionario, "id"> {
  const nome = cleanString(input.draft.nome);
  if (!nome) {
    throw new Error("Informe o nome do colaborador.");
  }

  const cargo = input.cargos.find((item) => item.id === input.draft.cargoId);
  const emailProfissional = cleanString(input.draft.emailProfissional);
  const tenantIds = [...new Set(input.draft.tenantIds.filter(Boolean))];
  const perfil = input.perfis.find((item) => item.id === input.draft.perfilAcessoInicialId);

  if (input.draft.criarAcessoSistema && !emailProfissional) {
    throw new Error("Informe o e-mail profissional para criar acesso.");
  }
  if (input.draft.criarAcessoSistema && tenantIds.length === 0) {
    throw new Error("Selecione ao menos uma unidade para provisionar o acesso.");
  }
  if (input.draft.criarAcessoSistema && !perfil) {
    throw new Error("Selecione um perfil inicial de acesso.");
  }
  if (input.draft.criarAcessoSistema && !tenantIds.includes(input.draft.tenantBaseId)) {
    throw new Error("A unidade base precisa estar entre as unidades selecionadas.");
  }

  const tenantBase =
    input.availableTenants.find((item) => item.id === input.draft.tenantBaseId)
    ?? input.availableTenants.find((item) => item.id === input.currentTenantId)
    ?? input.availableTenants[0];

  const memberships: FuncionarioMembership[] = input.draft.criarAcessoSistema
    ? tenantIds.reduce<FuncionarioMembership[]>((acc, tenantId) => {
        const tenant = input.availableTenants.find((item) => item.id === tenantId);
        if (!tenant) return acc;
        acc.push({
          tenantId: tenant.id,
          tenantNome: tenant.nome,
          roleName: perfil?.roleName,
          roleDisplayName: perfil?.displayName,
          defaultTenant: tenant.id === input.draft.tenantBaseId,
          active: true,
          accessOrigin: "MANUAL",
        });
        return acc;
      }, [])
    : [];

  const provisionamentoAcesso: FuncionarioProvisionamentoAcesso = input.draft.criarAcessoSistema
    ? input.draft.provisionamentoAcesso
    : "SEM_ACESSO";

  return {
    tenantId: tenantBase?.id ?? input.currentTenantId,
    nome,
    cargoId: cargo?.id,
    cargo: cargo?.nome ?? cleanString(input.draft.cargo),
    emailProfissional,
    celular: cleanString(input.draft.celular),
    podeMinistrarAulas: input.draft.podeMinistrarAulas,
    permiteCatraca: input.draft.permiteCatraca,
    permiteForaHorario: input.draft.permiteForaHorario,
    utilizaTecladoAcesso: input.draft.utilizaTecladoAcesso,
    coordenador: input.draft.coordenador,
    statusOperacional: "ATIVO",
    statusAcesso: input.draft.criarAcessoSistema
      ? provisionamentoAcesso === "REUTILIZAR_USUARIO"
        ? "ATIVO"
        : "CONVITE_PENDENTE"
      : "SEM_ACESSO",
    provisionamentoAcesso,
    origemCadastro: provisionamentoAcesso === "SEM_ACESSO" ? "MANUAL" : "CONVITE",
    possuiAcessoSistema: input.draft.criarAcessoSistema,
    perfilAcessoInicialId: perfil?.id,
    perfilAcessoInicialNome: perfil?.displayName,
    tenantBaseId: tenantBase?.id,
    tenantBaseNome: tenantBase?.nome,
    memberships,
    observacoes: cleanString(input.draft.observacoes),
    ativo: true,
    bloqueiaAcessoSistema: false,
    alertaFuncionarios: false,
  };
}
