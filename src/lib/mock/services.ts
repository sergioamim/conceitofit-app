import { getStore, setStore, TENANT_ID_DEFAULT } from "./store";
import type {
  Prospect,
  Aluno,
  Atividade,
  AtividadeGrade,
  Plano,
  Matricula,
  Pagamento,
  FormaPagamento,
  Funcionario,
  Servico,
  BandeiraCartao,
  CartaoCliente,
  Presenca,
  Tenant,
  HorarioFuncionamento,
  Convenio,
  Voucher,
  CategoriaAtividade,
  StatusProspect,
  StatusAluno,
  StatusAgendamento,
  Sexo,
  TipoPlano,
  TipoFormaPagamento,
  CreateProspectInput,
  ConverterProspectInput,
  ConverterProspectResponse,
  DashboardData,
  ReceberPagamentoInput,
  ProspectMensagem,
  ProspectAgendamento,
  VoucherCodigo,
  VoucherAplicarEm,
  VoucherEscopo,
  Sala,
  Cargo,
  Produto,
  Venda,
  VendaItem,
  PagamentoVenda,
  TipoVenda,
  Academia,
  CampanhaCRM,
  CampanhaCanal,
  CampanhaPublicoAlvo,
  CampanhaStatus,
} from "../types";

function genId(): string {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

function now(): string {
  return new Date().toISOString().slice(0, 19);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function subtractDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
}

function getCurrentTenantId(): string {
  const store = getStore();
  return store.currentTenantId ?? store.tenant.id ?? TENANT_ID_DEFAULT;
}

function getCurrentGroupTenantIds(): string[] {
  const store = getStore();
  const currentTenantId = getCurrentTenantId();
  const currentTenant =
    store.tenants.find((t) => t.id === currentTenantId) ?? store.tenant;
  const groupId = currentTenant.academiaId ?? currentTenant.groupId;
  if (!groupId) return [currentTenantId];
  return store.tenants
    .filter((tenant) => (tenant.academiaId ?? tenant.groupId) === groupId)
    .map((tenant) => tenant.id);
}

function getCurrentGroupId(): string | undefined {
  const store = getStore();
  const currentTenantId = getCurrentTenantId();
  const current = store.tenants.find((t) => t.id === currentTenantId) ?? store.tenant;
  return current.academiaId ?? current.groupId;
}

function getCurrentAcademiaId(): string | undefined {
  return getCurrentGroupId();
}

function estimateCampanhaAudience(campanha: Pick<CampanhaCRM, "tenantId" | "publicoAlvo">): number {
  const store = getStore();
  const tenantId = campanha.tenantId;
  if (campanha.publicoAlvo === "PROSPECTS_EM_ABERTO") {
    return store.prospects.filter(
      (p) => p.tenantId === tenantId && p.status !== "CONVERTIDO" && p.status !== "PERDIDO"
    ).length;
  }

  if (campanha.publicoAlvo === "ALUNOS_INATIVOS") {
    return store.alunos.filter(
      (a) => a.tenantId === tenantId && (a.status === "INATIVO" || a.status === "CANCELADO" || a.status === "SUSPENSO")
    ).length;
  }

  const fromDate = subtractDays(new Date(), 90);
  const alunosEvadidos = store.alunos.filter(
    (a) => a.tenantId === tenantId && (a.status === "INATIVO" || a.status === "CANCELADO")
  );
  return alunosEvadidos.filter((aluno) => {
    const mats = store.matriculas
      .filter((m) => m.tenantId === tenantId && m.alunoId === aluno.id)
      .sort((a, b) => b.dataFim.localeCompare(a.dataFim));
    const last = mats[0];
    if (!last) return false;
    return new Date(`${last.dataFim}T00:00:00`) >= fromDate;
  }).length;
}

function normalizeTenantConfig(data: Partial<Tenant>): Partial<Tenant> {
  const modo = data.configuracoes?.impressaoCupom?.modo;
  const larguraRaw = Number(data.configuracoes?.impressaoCupom?.larguraCustomMm ?? 80);
  const larguraCustomMm = Number.isFinite(larguraRaw)
    ? Math.min(120, Math.max(40, larguraRaw))
    : 80;
  return {
    ...data,
    configuracoes: {
      ...(data.configuracoes ?? {}),
      impressaoCupom: {
        modo: modo ?? "80MM",
        larguraCustomMm,
      },
    },
  };
}

function computeAlunoStatus(
  aluno: Aluno,
  store: ReturnType<typeof getStore>,
  pagamentos: Pagamento[]
): StatusAluno {
  if (aluno.status === "CANCELADO") return "CANCELADO";
  if (aluno.status === "SUSPENSO" || aluno.suspensao) return "SUSPENSO";
  const todayStr = today();
  const hasVencido = pagamentos.some(
    (p) => p.alunoId === aluno.id && p.status === "VENCIDO"
  );
  if (hasVencido) return "INATIVO";
  const hasAtivo = store.matriculas.some(
    (m) =>
      m.alunoId === aluno.id &&
      m.status === "ATIVA" &&
      m.dataInicio <= todayStr &&
      m.dataFim >= todayStr
  );
  return hasAtivo ? "ATIVO" : "INATIVO";
}

function syncAlunosStatus(): void {
  setStore((s) => {
    const pagamentosBase = Array.isArray(s.pagamentos) ? s.pagamentos : [];
    const alunosBase = Array.isArray(s.alunos) ? s.alunos : [];
    const matriculasBase = Array.isArray(s.matriculas) ? s.matriculas : [];
    const safeStore = { ...s, matriculas: matriculasBase };

    let pagamentosChanged = false;
    const pagamentos = pagamentosBase.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < today()) {
        pagamentosChanged = true;
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    });
    let alunosChanged = false;
    const alunos = alunosBase.map((a) => {
      const status = computeAlunoStatus(a, safeStore, pagamentos);
      if (status !== a.status) {
        alunosChanged = true;
        return { ...a, status };
      }
      return a;
    });
    if (!pagamentosChanged && !alunosChanged) return s;
    return {
      ...s,
      pagamentos,
      alunos,
    };
  });
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboard(params?: { month?: number; year?: number }): Promise<DashboardData> {
  syncAlunosStatus();
  const store = getStore();
  const tenantId = getCurrentTenantId();
  const alunos = store.alunos.filter((a) => a.tenantId === tenantId);
  const prospects = store.prospects.filter((p) => p.tenantId === tenantId);
  const matriculas = store.matriculas.filter((m) => m.tenantId === tenantId);
  const pagamentos = store.pagamentos.filter((p) => p.tenantId === tenantId);
  const planos = store.planos.filter((p) => p.tenantId === tenantId);
  const todayStr = today();
  const month = params?.month ?? new Date().getMonth();
  const year = params?.year ?? new Date().getFullYear();
  const monthStr = String(month + 1).padStart(2, "0");
  const monthPrefix = `${year}-${monthStr}`;
  const in7Days = addDays(todayStr, 7);

  return {
    totalAlunosAtivos: alunos.filter((a) => a.status === "ATIVO").length,
    prospectsNovos: prospects.filter((p) => p.dataCriacao.startsWith(monthPrefix)).length,
    matriculasDoMes: matriculas.filter((m) =>
      m.dataCriacao.startsWith(monthPrefix)
    ).length,
    receitaDoMes: pagamentos
      .filter(
        (p) =>
          p.status === "PAGO" && p.dataPagamento?.startsWith(monthPrefix)
      )
      .reduce((sum, p) => sum + p.valorFinal, 0),
    prospectsRecentes: prospects
      .filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO")
      .slice(0, 5),
    matriculasVencendo: matriculas
      .filter(
        (m) =>
          m.status === "ATIVA" &&
          m.dataFim >= todayStr &&
          m.dataFim <= in7Days
      )
      .map((m) => ({
        ...m,
        aluno: alunos.find((a) => a.id === m.alunoId),
        plano: planos.find((p) => p.id === m.planoId),
      })),
    pagamentosPendentes: pagamentos
      .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
      .map((p) => ({
        ...p,
        aluno: alunos.find((a) => a.id === p.alunoId),
      })),
  };
}

// ─── TENANT ────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<Tenant[]> {
  const store = getStore();
  const academiaId = getCurrentAcademiaId();
  if (!academiaId) {
    return store.tenants.filter((t) => t.id === getCurrentTenantId());
  }
  return store.tenants.filter((t) => (t.academiaId ?? t.groupId) === academiaId);
}

export async function getCurrentTenant(): Promise<Tenant> {
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
}

export async function setCurrentTenant(id: string): Promise<void> {
  setStore((s) => {
    const current = s.tenants.find((t) => t.id === s.currentTenantId) ?? s.tenant;
    const currentAcademiaId = current.academiaId ?? current.groupId;
    const tenant = s.tenants.find(
      (t) =>
        t.id === id &&
        t.ativo !== false &&
        (!currentAcademiaId || (t.academiaId ?? t.groupId) === currentAcademiaId)
    ) ?? s.tenant;
    return {
      ...s,
      currentTenantId: tenant.id,
      tenant,
    };
  });
}

export async function listAcademias(): Promise<Academia[]> {
  const academiaId = getCurrentAcademiaId();
  if (!academiaId) return getStore().academias;
  return getStore().academias.filter((a) => a.id === academiaId);
}

export async function getCurrentAcademia(): Promise<Academia> {
  const store = getStore();
  const academiaId = getCurrentAcademiaId();
  return (
    store.academias.find((a) => a.id === academiaId) ??
    store.academias[0] ?? {
      id: "acd-default",
      nome: "Academia",
      ativo: true,
    }
  );
}

export async function updateCurrentAcademia(data: Partial<Academia>): Promise<void> {
  const academiaId = getCurrentAcademiaId();
  if (!academiaId) return;
  setStore((s) => ({
    ...s,
    academias: s.academias.map((a) =>
      a.id === academiaId ? { ...a, ...data } : a
    ),
  }));
}

export async function createTenant(
  data: Omit<Tenant, "id">
): Promise<Tenant> {
  const academiaId = data.academiaId?.trim() || getCurrentAcademiaId() || "acd-default";
  const groupId = data.groupId?.trim() || academiaId;
  const tenant: Tenant = {
    ...data,
    id: genId(),
    nome: data.nome.trim(),
    academiaId,
    groupId,
    ativo: data.ativo ?? true,
  };
  const normalizedTenant = normalizeTenantConfig(tenant) as Tenant;
  setStore((s) => ({
    ...s,
    tenants: [normalizedTenant, ...s.tenants],
  }));
  return normalizedTenant;
}

export async function updateTenantById(id: string, data: Partial<Tenant>): Promise<void> {
  const normalized = normalizeTenantConfig(data);
  setStore((s) => {
    const currentUpdated =
      s.currentTenantId === id ? { ...s.tenant, ...normalized } : s.tenant;
    return {
      ...s,
      tenant: currentUpdated,
      tenants: s.tenants.map((t) => (t.id === id ? { ...t, ...normalized } : t)),
    };
  });
}

export async function toggleTenant(id: string): Promise<void> {
  setStore((s) => {
    const target = s.tenants.find((t) => t.id === id);
    if (!target) return s;
    if (target.id === s.currentTenantId && target.ativo !== false) return s;
    return {
      ...s,
      tenants: s.tenants.map((t) =>
        t.id === id ? { ...t, ativo: t.ativo === false } : t
      ),
    };
  });
}

function tenantHasLinkedData(store: ReturnType<typeof getStore>, tenantId: string): boolean {
  return (
    store.prospects.some((item) => item.tenantId === tenantId) ||
    store.alunos.some((item) => item.tenantId === tenantId) ||
    store.matriculas.some((item) => item.tenantId === tenantId) ||
    store.pagamentos.some((item) => item.tenantId === tenantId) ||
    store.planos.some((item) => item.tenantId === tenantId) ||
    store.formasPagamento.some((item) => item.tenantId === tenantId) ||
    store.atividades.some((item) => item.tenantId === tenantId) ||
    store.atividadeGrades.some((item) => item.tenantId === tenantId) ||
    store.cargos.some((item) => item.tenantId === tenantId) ||
    store.salas.some((item) => item.tenantId === tenantId) ||
    store.servicos.some((item) => item.tenantId === tenantId) ||
    store.produtos.some((item) => item.tenantId === tenantId) ||
    store.vendas.some((item) => item.tenantId === tenantId) ||
    store.vouchers.some((item) => item.tenantId === tenantId) ||
    store.campanhasCrm.some((item) => item.tenantId === tenantId)
  );
}

export async function deleteTenant(id: string): Promise<void> {
  const current = getStore();
  if (id === current.currentTenantId) {
    throw new Error("Não é possível remover a unidade ativa.");
  }
  if (tenantHasLinkedData(current, id)) {
    throw new Error("Não é possível remover unidade com dados vinculados.");
  }
  setStore((s) => ({
    ...s,
    tenants: s.tenants.filter((t) => t.id !== id),
  }));
}

// ─── CAMPANHAS CRM ──────────────────────────────────────────────────────────

export async function listCampanhasCrm(params?: {
  status?: CampanhaStatus;
}): Promise<CampanhaCRM[]> {
  const tenantId = getCurrentTenantId();
  let all = [...getStore().campanhasCrm]
    .filter((c) => c.tenantId === tenantId)
    .map((c) => ({ ...c, audienceEstimado: estimateCampanhaAudience(c) }))
    .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
  if (params?.status) all = all.filter((c) => c.status === params.status);
  return all;
}

export async function createCampanhaCrm(data: {
  nome: string;
  descricao?: string;
  publicoAlvo: CampanhaPublicoAlvo;
  canais: CampanhaCanal[];
  voucherId?: string;
  dataInicio: string;
  dataFim?: string;
  status?: CampanhaStatus;
}): Promise<CampanhaCRM> {
  const campanha: CampanhaCRM = {
    id: genId(),
    tenantId: getCurrentTenantId(),
    nome: data.nome.trim(),
    descricao: data.descricao?.trim() || undefined,
    publicoAlvo: data.publicoAlvo,
    canais: data.canais.length > 0 ? data.canais : ["WHATSAPP"],
    voucherId: data.voucherId,
    dataInicio: data.dataInicio,
    dataFim: data.dataFim || undefined,
    status: data.status ?? "RASCUNHO",
    disparosRealizados: 0,
    dataCriacao: now(),
  };
  setStore((s) => ({ ...s, campanhasCrm: [campanha, ...s.campanhasCrm] }));
  return { ...campanha, audienceEstimado: estimateCampanhaAudience(campanha) };
}

export async function updateCampanhaCrm(
  id: string,
  data: Partial<Omit<CampanhaCRM, "id" | "tenantId" | "dataCriacao" | "disparosRealizados" | "ultimaExecucao" | "audienceEstimado">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) =>
      c.id === id
        ? {
            ...c,
            ...data,
            nome: data.nome?.trim() ?? c.nome,
            descricao: data.descricao?.trim() || undefined,
            canais: data.canais && data.canais.length > 0 ? data.canais : c.canais,
            dataAtualizacao: now(),
          }
        : c
    ),
  }));
}

export async function dispararCampanhaCrm(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) => {
      if (c.id !== id) return c;
      const audiencia = estimateCampanhaAudience(c);
      return {
        ...c,
        status: "ATIVA",
        disparosRealizados: c.disparosRealizados + 1,
        ultimaExecucao: now(),
        dataAtualizacao: now(),
        audienceEstimado: audiencia,
      };
    }),
  }));
}

export async function encerrarCampanhaCrm(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    campanhasCrm: s.campanhasCrm.map((c) =>
      c.id === id
        ? { ...c, status: "ENCERRADA", dataAtualizacao: now() }
        : c
    ),
  }));
}

// ─── PROSPECTS ──────────────────────────────────────────────────────────────

export async function listProspects(params?: {
  status?: StatusProspect;
}): Promise<Prospect[]> {
  const tenantId = getCurrentTenantId();
  const { prospects } = getStore();
  const all = [...prospects].reverse();
  const byTenant = all.filter((p) => p.tenantId === tenantId);
  if (params?.status) return byTenant.filter((p) => p.status === params.status);
  return byTenant;
}

export async function updateProspect(
  id: string,
  data: Partial<Omit<Prospect, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id ? { ...p, ...data } : p
    ),
  }));
}

export async function getProspect(id: string): Promise<Prospect | null> {
  const tenantId = getCurrentTenantId();
  return getStore().prospects.find((p) => p.id === id && p.tenantId === tenantId) ?? null;
}

export async function createProspect(
  data: CreateProspectInput
): Promise<Prospect> {
  const createdAt = now();
  const prospect: Prospect = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    status: "NOVO",
    dataCriacao: createdAt,
    statusLog: [{ status: "NOVO", data: createdAt }],
  };
  setStore((s) => ({ ...s, prospects: [prospect, ...s.prospects] }));
  return prospect;
}

export async function updateProspectStatus(
  id: string,
  status: StatusProspect
): Promise<void> {
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id
        ? {
            ...p,
            status,
            dataUltimoContato: at,
            statusLog: [...(p.statusLog ?? []), { status, data: at }],
          }
        : p
    ),
  }));
}

export async function marcarProspectPerdido(
  id: string,
  motivo?: string
): Promise<void> {
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "PERDIDO" as StatusProspect,
            motivoPerda: motivo,
            dataUltimoContato: at,
            statusLog: [
              ...(p.statusLog ?? []),
              { status: "PERDIDO" as StatusProspect, data: at },
            ],
          }
        : p
    ),
  }));
}

// ─── PROSPECT MENSAGENS ──────────────────────────────────────────────────────

export async function listProspectMensagens(
  prospectId: string
): Promise<ProspectMensagem[]> {
  return getStore().prospectMensagens.filter((m) => m.prospectId === prospectId);
}

export async function addProspectMensagem(
  prospectId: string,
  texto: string,
  autorNome: string,
  autorId?: string
): Promise<ProspectMensagem> {
  const msg: ProspectMensagem = {
    id: genId(),
    prospectId,
    texto,
    datahora: now(),
    autorNome,
    autorId,
  };
  setStore((s) => ({ ...s, prospectMensagens: [...s.prospectMensagens, msg] }));
  const at = now();
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === prospectId ? { ...p, dataUltimoContato: at } : p
    ),
  }));
  return msg;
}

// ─── PROSPECT AGENDAMENTOS ───────────────────────────────────────────────────

export async function listProspectAgendamentos(
  prospectId: string
): Promise<ProspectAgendamento[]> {
  return getStore().prospectAgendamentos
    .filter((a) => a.prospectId === prospectId)
    .sort((a, b) => a.data.localeCompare(b.data) || a.hora.localeCompare(b.hora));
}

export async function criarProspectAgendamento(data: {
  prospectId: string;
  funcionarioId: string;
  titulo: string;
  data: string;
  hora: string;
  observacoes?: string;
}): Promise<ProspectAgendamento> {
  const ag: ProspectAgendamento = {
    id: genId(),
    ...data,
    status: "AGENDADO",
  };
  setStore((s) => ({
    ...s,
    prospectAgendamentos: [...s.prospectAgendamentos, ag],
  }));
  return ag;
}

export async function updateProspectAgendamento(
  id: string,
  status: StatusAgendamento
): Promise<void> {
  setStore((s) => ({
    ...s,
    prospectAgendamentos: s.prospectAgendamentos.map((a) =>
      a.id === id ? { ...a, status } : a
    ),
  }));
}

export async function checkProspectDuplicate(params: {
  telefone?: string;
  cpf?: string;
  email?: string;
}): Promise<boolean> {
  const tenantId = getCurrentTenantId();
  const { prospects } = getStore();
  const tel = params.telefone?.replace(/\D/g, "");
  return prospects.some((p) => {
    if (p.tenantId !== tenantId) return false;
    const samePhone =
      tel && p.telefone?.replace(/\D/g, "").includes(tel);
    const sameCpf = params.cpf && p.cpf === params.cpf;
    const sameEmail =
      params.email && p.email?.toLowerCase() === params.email.toLowerCase();
    return Boolean(samePhone || sameCpf || sameEmail);
  });
}

export async function converterProspect(
  data: ConverterProspectInput
): Promise<ConverterProspectResponse> {
  const store = getStore();
  const tenantId = getCurrentTenantId();
  const prospect = store.prospects.find((p) => p.id === data.prospectId && p.tenantId === tenantId);
  if (!prospect) throw new Error("Prospect não encontrado");

  const plano = store.planos.find((p) => p.id === data.planoId && p.tenantId === tenantId);
  if (!plano) throw new Error("Plano não encontrado");

  const alunoId = genId();
  const matriculaId = genId();
  const pagamentoId = genId();

  const aluno: Aluno = {
    id: alunoId,
    tenantId,
    prospectId: data.prospectId,
    nome: prospect.nome,
    email: prospect.email ?? "",
    telefone: prospect.telefone,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    status: "INATIVO",
    dataCadastro: now(),
  };

  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const desconto = data.desconto ?? 0;

  const matricula: Matricula = {
    id: matriculaId,
    tenantId,
    alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: false,
    dataCriacao: now(),
  };

  const valorFinal = plano.valor - desconto;
  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId,
    alunoId,
    matriculaId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: "PENDENTE",
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
    prospects: s.prospects.map((p) =>
      p.id === data.prospectId
        ? {
            ...p,
            status: "CONVERTIDO" as StatusProspect,
            dataUltimoContato: now(),
            statusLog: [
              ...(p.statusLog ?? []),
              { status: "CONVERTIDO" as StatusProspect, data: now() },
            ],
          }
        : p
    ),
  }));

  return { aluno, matricula, pagamento };
}

// ─── CADASTRO DIRETO ────────────────────────────────────────────────────────

export interface CriarAlunoComMatriculaInput {
  nome: string;
  email: string;
  telefone: string;
  telefoneSec?: string;
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  rg?: string;
  endereco?: {
    cep?: string;
    logradouro?: string;
    numero?: string;
    complemento?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
  };
  contatoEmergencia?: {
    nome: string;
    telefone: string;
    parentesco?: string;
  };
  observacoesMedicas?: string;
  foto?: string;
  planoId: string;
  dataInicio: string;
  formaPagamento: TipoFormaPagamento;
  desconto?: number;
  motivoDesconto?: string;
}

export interface CriarAlunoComMatriculaResponse {
  aluno: Aluno;
  matricula: Matricula;
  pagamento: Pagamento;
}

export async function criarAluno(
  data: Omit<
    CriarAlunoComMatriculaInput,
    | "planoId"
    | "dataInicio"
    | "formaPagamento"
    | "desconto"
    | "motivoDesconto"
  >
): Promise<Aluno> {
  const alunoId = genId();
  const aluno: Aluno = {
    id: alunoId,
    tenantId: getCurrentTenantId(),
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    telefoneSec: data.telefoneSec,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    foto: data.foto,
    status: "INATIVO",
    dataCadastro: now(),
  };
  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
  }));
  return aluno;
}

export async function criarAlunoComMatricula(
  data: CriarAlunoComMatriculaInput
): Promise<CriarAlunoComMatriculaResponse> {
  const store = getStore();
  const plano = store.planos.find((p) => p.id === data.planoId);
  if (!plano) throw new Error("Plano não encontrado");

  const alunoId = genId();
  const matriculaId = genId();
  const pagamentoId = genId();

  const aluno: Aluno = {
    id: alunoId,
    tenantId: getCurrentTenantId(),
    nome: data.nome,
    email: data.email,
    telefone: data.telefone,
    telefoneSec: data.telefoneSec,
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    endereco: data.endereco,
    contatoEmergencia: data.contatoEmergencia,
    observacoesMedicas: data.observacoesMedicas,
    foto: data.foto,
    status: "ATIVO",
    dataCadastro: now(),
  };

  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const desconto = data.desconto ?? 0;

  const matricula: Matricula = {
    id: matriculaId,
    tenantId: getCurrentTenantId(),
    alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: false,
    dataCriacao: now(),
  };

  const valorFinal = plano.valor - desconto;
  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId: getCurrentTenantId(),
    alunoId,
    matriculaId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: "PENDENTE",
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
  }));
  syncAlunosStatus();

  return { aluno, matricula, pagamento };
}

export async function deleteProspect(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    prospects: s.prospects.filter((p) => p.id !== id),
  }));
}

// ─── FUNCIONÁRIOS ───────────────────────────────────────────────────────────

export async function listCargos(params?: { apenasAtivos?: boolean }): Promise<Cargo[]> {
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivos ?? false;
  const cargos = getStore().cargos.filter((c) => c.tenantId === tenantId);
  return only ? cargos.filter((c) => c.ativo) : cargos;
}

export async function createCargo(
  data: Omit<Cargo, "id" | "tenantId" | "ativo">
): Promise<Cargo> {
  const cargo: Cargo = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, cargos: [cargo, ...s.cargos] }));
  return cargo;
}

export async function updateCargo(
  id: string,
  data: Partial<Omit<Cargo, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    cargos: s.cargos.map((c) => (c.id === id ? { ...c, ...data } : c)),
  }));
}

export async function toggleCargo(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    cargos: s.cargos.map((c) => (c.id === id ? { ...c, ativo: !c.ativo } : c)),
  }));
}

export async function deleteCargo(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    cargos: s.cargos.filter((c) => c.id !== id),
    funcionarios: s.funcionarios.map((f) =>
      f.cargoId === id ? { ...f, cargoId: undefined } : f
    ),
  }));
}

export async function listFuncionarios(params?: { apenasAtivos?: boolean }): Promise<Funcionario[]> {
  const only = params?.apenasAtivos ?? true;
  return only
    ? getStore().funcionarios.filter((f) => f.ativo)
    : getStore().funcionarios;
}

export async function createFuncionario(
  data: Omit<Funcionario, "id" | "ativo">
): Promise<Funcionario> {
  const f: Funcionario = {
    ...data,
    podeMinistrarAulas: data.podeMinistrarAulas ?? false,
    id: genId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, funcionarios: [f, ...s.funcionarios] }));
  return f;
}

export async function updateFuncionario(
  id: string,
  data: Partial<Omit<Funcionario, "id">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.map((f) =>
      f.id === id
        ? { ...f, ...data, podeMinistrarAulas: data.podeMinistrarAulas ?? f.podeMinistrarAulas }
        : f
    ),
  }));
}

export async function toggleFuncionario(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.map((f) =>
      f.id === id ? { ...f, ativo: !f.ativo } : f
    ),
  }));
}

export async function deleteFuncionario(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    funcionarios: s.funcionarios.filter((f) => f.id !== id),
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.funcionarioId === id ? { ...g, funcionarioId: undefined } : g
    ),
  }));
}

// ─── SALAS ──────────────────────────────────────────────────────────────────

export async function listSalas(params?: { apenasAtivas?: boolean }): Promise<Sala[]> {
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivas ?? false;
  const salas = getStore().salas.filter((s) => s.tenantId === tenantId);
  return only ? salas.filter((s) => s.ativo) : salas;
}

export async function createSala(
  data: Omit<Sala, "id" | "tenantId" | "ativo">
): Promise<Sala> {
  const sala: Sala = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, salas: [sala, ...s.salas] }));
  return sala;
}

export async function updateSala(
  id: string,
  data: Partial<Omit<Sala, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    salas: s.salas.map((item) => (item.id === id ? { ...item, ...data } : item)),
  }));
}

export async function toggleSala(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    salas: s.salas.map((item) => (item.id === id ? { ...item, ativo: !item.ativo } : item)),
  }));
}

export async function deleteSala(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    salas: s.salas.filter((item) => item.id !== id),
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.salaId === id ? { ...g, salaId: undefined } : g
    ),
  }));
}

// ─── TENANT ────────────────────────────────────────────────────────────────

export async function getTenant(): Promise<Tenant> {
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
}

export async function updateTenant(data: Partial<Tenant>): Promise<void> {
  setStore((s) => ({
    ...s,
    tenant: s.tenant.id === s.currentTenantId ? { ...s.tenant, ...data } : s.tenant,
    tenants: s.tenants.map((t) =>
      t.id === s.currentTenantId ? { ...t, ...data } : t
    ),
  }));
}

export async function listHorarios(): Promise<HorarioFuncionamento[]> {
  return getStore().horarios;
}

export async function updateHorarios(
  data: HorarioFuncionamento[]
): Promise<void> {
  setStore((s) => ({ ...s, horarios: data }));
}

export async function listConvenios(params?: { apenasAtivos?: boolean }): Promise<Convenio[]> {
  const only = params?.apenasAtivos ?? false;
  return only ? getStore().convenios.filter((c) => c.ativo) : getStore().convenios;
}

export async function createConvenio(
  data: Omit<Convenio, "id">
): Promise<Convenio> {
  const convenio: Convenio = { ...data, id: genId() };
  setStore((s) => ({ ...s, convenios: [convenio, ...s.convenios] }));
  return convenio;
}

export async function updateConvenio(
  id: string,
  data: Partial<Omit<Convenio, "id">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    convenios: s.convenios.map((c) => (c.id === id ? { ...c, ...data } : c)),
  }));
}

export async function toggleConvenio(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    convenios: s.convenios.map((c) =>
      c.id === id ? { ...c, ativo: !c.ativo } : c
    ),
  }));
}

export async function deleteConvenio(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    convenios: s.convenios.filter((c) => c.id !== id),
  }));
}

// ─── VOUCHERS ───────────────────────────────────────────────────────────────

export async function listVouchers(): Promise<Voucher[]> {
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  const { vouchers } = getStore();
  return [...vouchers].reverse().filter((v) => {
    if (v.escopo === "GRUPO") {
      return Boolean(groupId) && v.groupId === groupId;
    }
    return v.tenantId === tenantId;
  });
}

function gerarCodigoAleatorio(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createVoucher(
  data: Omit<Voucher, "id" | "tenantId" | "groupId" | "ativo"> & { codigoUnicoCustom?: string }
): Promise<Voucher> {
  const { codigoUnicoCustom, ...voucherData } = data;
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  const voucher: Voucher = {
    ...voucherData,
    id: genId(),
    tenantId: data.escopo === "GRUPO" ? undefined : tenantId,
    groupId: data.escopo === "GRUPO" ? groupId : undefined,
    ativo: true,
  };

  const qty = data.codigoTipo === "UNICO" ? 1 : Math.min(data.quantidade ?? 10, 50);
  const uniCodigo = (codigoUnicoCustom ?? "").trim().toUpperCase() || gerarCodigoAleatorio();
  const codigos: VoucherCodigo[] = Array.from({ length: qty }, () => ({
    id: genId(),
    voucherId: voucher.id,
    codigo: data.codigoTipo === "UNICO" ? uniCodigo : gerarCodigoAleatorio(),
    usado: false,
  }));

  setStore((s) => ({
    ...s,
    vouchers: [voucher, ...s.vouchers],
    voucherCodigos: [...s.voucherCodigos, ...codigos],
  }));
  return voucher;
}

export async function listVoucherCodigos(voucherId: string): Promise<VoucherCodigo[]> {
  return getStore().voucherCodigos.filter((c) => c.voucherId === voucherId);
}

export async function toggleVoucher(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    vouchers: s.vouchers.map((v) =>
      v.id === id ? { ...v, ativo: !v.ativo } : v
    ),
  }));
}

export async function updateVoucher(
  id: string,
  data: {
    escopo: VoucherEscopo;
    tipo: string;
    nome: string;
    periodoInicio: string;
    periodoFim?: string;
    prazoDeterminado: boolean;
    quantidade?: number;
    ilimitado: boolean;
    usarNaVenda: boolean;
    planoIds: string[];
    umaVezPorCliente: boolean;
    aplicarEm: VoucherAplicarEm[];
  }
): Promise<void> {
  const hasUsage = getStore().voucherCodigos.some(
    (c) => c.voucherId === id && c.usado
  );
  if (hasUsage) {
    throw new Error("Voucher já utilizado não pode ser editado.");
  }
  const tenantId = getCurrentTenantId();
  const groupId = getCurrentGroupId();
  setStore((s) => ({
    ...s,
    vouchers: s.vouchers.map((v) =>
      v.id === id
        ? {
            ...v,
            ...data,
            tenantId: data.escopo === "GRUPO" ? undefined : tenantId,
            groupId: data.escopo === "GRUPO" ? groupId : undefined,
          }
        : v
    ),
  }));
}

export async function listVoucherUsageCounts(): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const c of getStore().voucherCodigos) {
    if (c.usado) {
      result[c.voucherId] = (result[c.voucherId] ?? 0) + 1;
    }
  }
  return result;
}

// ─── PRESENÇAS ─────────────────────────────────────────────────────────────

export async function listPresencasByAluno(alunoId: string): Promise<Presenca[]> {
  return getStore().presencas.filter((p) => p.alunoId === alunoId);
}

// ─── ALUNOS ─────────────────────────────────────────────────────────────────

export async function listAlunos(params?: {
  status?: StatusAluno;
}): Promise<Aluno[]> {
  const tenantId = getCurrentTenantId();
  syncAlunosStatus();
  const { alunos } = getStore();
  const all = [...alunos].reverse().filter((a) => a.tenantId === tenantId);
  if (params?.status) return all.filter((a) => a.status === params.status);
  return all;
}

export async function getAluno(id: string): Promise<Aluno | null> {
  const tenantId = getCurrentTenantId();
  syncAlunosStatus();
  return getStore().alunos.find((a) => a.id === id && a.tenantId === tenantId) ?? null;
}

export async function updateAlunoStatus(
  id: string,
  status: StatusAluno
): Promise<void> {
  setStore((s) => ({
    ...s,
    alunos: s.alunos.map((a) => (a.id === id ? { ...a, status } : a)),
  }));
}

export async function updateAluno(
  id: string,
  data: Partial<Omit<Aluno, "id" | "tenantId" | "dataCadastro">>
): Promise<Aluno | null> {
  let updated: Aluno | null = null;
  setStore((s) => ({
    ...s,
    alunos: s.alunos.map((a) => {
      if (a.id !== id) return a;
      updated = {
        ...a,
        ...data,
        dataAtualizacao: now(),
      };
      return updated;
    }),
  }));
  syncAlunosStatus();
  return updated;
}

// ─── SERVIÇOS ─────────────────────────────────────────────────────────────

export async function listServicos(params?: {
  apenasAtivos?: boolean;
}): Promise<Servico[]> {
  const tenantId = getCurrentTenantId();
  const { servicos } = getStore();
  const all = [...servicos].reverse().filter((s) => s.tenantId === tenantId);
  if (params?.apenasAtivos) return all.filter((s) => s.ativo);
  return all;
}

export async function createServico(
  data: Omit<Servico, "id" | "tenantId" | "ativo">
): Promise<Servico> {
  const servico: Servico = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, servicos: [servico, ...s.servicos] }));
  return servico;
}

export async function updateServico(
  id: string,
  data: Partial<Omit<Servico, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    servicos: s.servicos.map((sv) =>
      sv.id === id ? { ...sv, ...data } : sv
    ),
  }));
}

export async function toggleServico(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    servicos: s.servicos.map((sv) =>
      sv.id === id ? { ...sv, ativo: !sv.ativo } : sv
    ),
  }));
}

export async function deleteServico(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    servicos: s.servicos.filter((sv) => sv.id !== id),
  }));
}

// ─── PRODUTOS ──────────────────────────────────────────────────────────────

export async function listProdutos(params?: {
  apenasAtivos?: boolean;
}): Promise<Produto[]> {
  const groupTenantIds = getCurrentGroupTenantIds();
  const { produtos } = getStore();
  const all = [...produtos].reverse().filter((p) => groupTenantIds.includes(p.tenantId));
  if (params?.apenasAtivos) return all.filter((p) => p.ativo);
  return all;
}

export async function createProduto(
  data: Omit<Produto, "id" | "tenantId" | "ativo">
): Promise<Produto> {
  const produto: Produto = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, produtos: [produto, ...s.produtos] }));
  return produto;
}

export async function updateProduto(
  id: string,
  data: Partial<Omit<Produto, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    produtos: s.produtos.map((p) =>
      p.id === id ? { ...p, ...data } : p
    ),
  }));
}

export async function toggleProduto(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    produtos: s.produtos.map((p) =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ),
  }));
}

export async function deleteProduto(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    produtos: s.produtos.filter((p) => p.id !== id),
  }));
}

// ─── VENDAS ────────────────────────────────────────────────────────────────

export interface CreateVendaInput {
  tipo: TipoVenda;
  clienteId?: string;
  itens: Array<{
    tipo: TipoVenda;
    referenciaId: string;
    descricao: string;
    quantidade: number;
    valorUnitario: number;
    desconto?: number;
  }>;
  descontoTotal?: number;
  acrescimoTotal?: number;
  pagamento: PagamentoVenda;
}

export async function listVendas(): Promise<Venda[]> {
  const tenantId = getCurrentTenantId();
  return [...getStore().vendas].reverse().filter((v) => v.tenantId === tenantId);
}

export async function createVenda(input: CreateVendaInput): Promise<Venda> {
  const requiresCliente = input.itens.some((item) => item.tipo === "PLANO" || item.tipo === "SERVICO");
  if (requiresCliente && !input.clienteId) {
    throw new Error("Cliente é obrigatório para venda de plano/serviço.");
  }

  const store = getStore();
  const cliente = input.clienteId ? store.alunos.find((a) => a.id === input.clienteId) : undefined;

  const itens: VendaItem[] = input.itens.map((item) => {
    const qtd = Math.max(1, item.quantidade || 1);
    const unit = Math.max(0, item.valorUnitario || 0);
    const desconto = Math.max(0, item.desconto || 0);
    const valorTotal = Math.max(0, unit * qtd - desconto);
    return {
      id: genId(),
      tipo: item.tipo,
      referenciaId: item.referenciaId,
      descricao: item.descricao,
      quantidade: qtd,
      valorUnitario: unit,
      desconto,
      valorTotal,
    };
  });

  const subtotal = itens.reduce((sum, i) => sum + i.valorUnitario * i.quantidade, 0);
  const descontoItens = itens.reduce((sum, i) => sum + i.desconto, 0);
  const descontoTotal = Math.max(0, (input.descontoTotal ?? 0) + descontoItens);
  const acrescimoTotal = Math.max(0, input.acrescimoTotal ?? 0);
  const total = Math.max(0, subtotal - descontoTotal + acrescimoTotal);

  const venda: Venda = {
    id: genId(),
    tenantId: getCurrentTenantId(),
    tipo: input.tipo,
    clienteId: input.clienteId,
    clienteNome: cliente?.nome,
    status: "FECHADA",
    itens,
    subtotal,
    descontoTotal,
    acrescimoTotal,
    total,
    pagamento: input.pagamento,
    dataCriacao: now(),
  };

  const pagamentoTipo = itens.some((item) => item.tipo === "PLANO")
    ? "MENSALIDADE"
    : itens.some((item) => item.tipo === "SERVICO")
      ? "AVULSO"
      : "PRODUTO";
  const descricaoPagamento = itens.length === 1
    ? `Venda ${input.tipo.toLowerCase()} · ${itens[0].descricao}`
    : `Venda mista · ${itens.length} itens`;

  setStore((s) => ({
    ...s,
    vendas: [venda, ...s.vendas],
    pagamentos: input.clienteId
      ? [
          {
            id: genId(),
            tenantId: getCurrentTenantId(),
            alunoId: input.clienteId,
            tipo: pagamentoTipo,
            descricao: descricaoPagamento,
            valor: total,
            desconto: descontoTotal,
            valorFinal: total,
            dataVencimento: now().slice(0, 10),
            dataPagamento: now().slice(0, 10),
            formaPagamento: input.pagamento.formaPagamento,
            status: "PAGO",
            observacoes: input.pagamento.observacoes,
            dataCriacao: now(),
          },
          ...s.pagamentos,
        ]
      : s.pagamentos,
  }));

  return venda;
}

// ─── BANDEIRAS DE CARTÃO ───────────────────────────────────────────────────

export async function listBandeirasCartao(params?: {
  apenasAtivas?: boolean;
}): Promise<BandeiraCartao[]> {
  const { bandeirasCartao } = getStore();
  const all = [...bandeirasCartao].reverse();
  if (params?.apenasAtivas) return all.filter((b) => b.ativo);
  return all;
}

export async function createBandeiraCartao(
  data: Omit<BandeiraCartao, "id" | "ativo">
): Promise<BandeiraCartao> {
  const bandeira: BandeiraCartao = {
    ...data,
    id: genId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, bandeirasCartao: [bandeira, ...s.bandeirasCartao] }));
  return bandeira;
}

export async function updateBandeiraCartao(
  id: string,
  data: Partial<Omit<BandeiraCartao, "id">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.map((b) =>
      b.id === id ? { ...b, ...data } : b
    ),
  }));
}

export async function toggleBandeiraCartao(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.map((b) =>
      b.id === id ? { ...b, ativo: !b.ativo } : b
    ),
  }));
}

export async function deleteBandeiraCartao(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    bandeirasCartao: s.bandeirasCartao.filter((b) => b.id !== id),
  }));
}

// ─── CARTÕES DO CLIENTE ────────────────────────────────────────────────────

export async function listCartoesCliente(alunoId: string): Promise<CartaoCliente[]> {
  return getStore().cartoesCliente.filter((c) => c.alunoId === alunoId);
}

export async function createCartaoCliente(
  data: Omit<CartaoCliente, "id" | "ativo">
): Promise<CartaoCliente> {
  const cartao: CartaoCliente = {
    ...data,
    id: genId(),
    ativo: true,
  };
  setStore((s) => {
    const jaTemPadrao = s.cartoesCliente.some((c) => c.alunoId === data.alunoId && c.padrao);
    const novo = jaTemPadrao ? cartao : { ...cartao, padrao: true };
    return {
      ...s,
      cartoesCliente: [
        novo,
        ...s.cartoesCliente.map((c) =>
          !jaTemPadrao && c.alunoId === data.alunoId ? { ...c, padrao: false } : c
        ),
      ],
    };
  });
  return cartao;
}

export async function setCartaoPadrao(id: string): Promise<void> {
  setStore((s) => {
    const alvo = s.cartoesCliente.find((c) => c.id === id);
    if (!alvo) return s;
    return {
      ...s,
      cartoesCliente: s.cartoesCliente.map((c) =>
        c.alunoId === alvo.alunoId ? { ...c, padrao: c.id === id } : c
      ),
    };
  });
}

export async function deleteCartaoCliente(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    cartoesCliente: s.cartoesCliente.filter((c) => c.id !== id),
  }));
}

// ─── ATIVIDADES ─────────────────────────────────────────────────────────────

export async function listAtividades(params?: {
  apenasAtivas?: boolean;
  categoria?: CategoriaAtividade;
}): Promise<Atividade[]> {
  const tenantId = getCurrentTenantId();
  const { atividades } = getStore();
  let all = [...atividades].reverse().filter((a) => a.tenantId === tenantId);
  if (params?.apenasAtivas) all = all.filter((a) => a.ativo);
  if (params?.categoria) all = all.filter((a) => a.categoria === params.categoria);
  return all;
}

export async function createAtividade(
  data: Omit<Atividade, "id" | "tenantId" | "ativo">
): Promise<Atividade> {
  const normalized = normalizeAtividadeCheckinRules(data);
  const atividade: Atividade = {
    ...normalized,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, atividades: [atividade, ...s.atividades] }));
  return atividade;
}

export async function updateAtividade(
  id: string,
  data: Partial<Omit<Atividade, "id" | "tenantId">>
): Promise<void> {
  const current = getStore().atividades.find((a) => a.id === id);
  if (!current) return;
  const normalized = normalizeAtividadeCheckinRules({ ...current, ...data });
  setStore((s) => ({
    ...s,
    atividades: s.atividades.map((a) =>
      a.id === id ? { ...a, ...normalized } : a
    ),
  }));
}

export async function toggleAtividade(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    atividades: s.atividades.map((a) =>
      a.id === id ? { ...a, ativo: !a.ativo } : a
    ),
  }));
}

export async function deleteAtividade(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    atividades: s.atividades.filter((a) => a.id !== id),
    atividadeGrades: s.atividadeGrades.filter((g) => g.atividadeId !== id),
  }));
}

function normalizeAtividadeCheckinRules<T extends {
  permiteCheckin: boolean;
  checkinObrigatorio: boolean;
}>(atividade: T): T {
  if (!atividade.permiteCheckin) {
    return {
      ...atividade,
      checkinObrigatorio: false,
    };
  }
  return atividade;
}

// ─── ATIVIDADES · GRADE ───────────────────────────────────────────────────

export async function listAtividadeGrades(params?: {
  atividadeId?: string;
  apenasAtivas?: boolean;
}): Promise<AtividadeGrade[]> {
  const tenantId = getCurrentTenantId();
  const { atividadeGrades } = getStore();
  let all = [...atividadeGrades].reverse().filter((g) => g.tenantId === tenantId);
  if (params?.atividadeId) all = all.filter((g) => g.atividadeId === params.atividadeId);
  if (params?.apenasAtivas) all = all.filter((g) => g.ativo);
  return all;
}

export async function createAtividadeGrade(
  data: Omit<AtividadeGrade, "id" | "tenantId" | "ativo">
): Promise<AtividadeGrade> {
  const grade: AtividadeGrade = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, atividadeGrades: [grade, ...s.atividadeGrades] }));
  return grade;
}

export async function updateAtividadeGrade(
  id: string,
  data: Partial<Omit<AtividadeGrade, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.id === id ? { ...g, ...data } : g
    ),
  }));
}

export async function toggleAtividadeGrade(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.map((g) =>
      g.id === id ? { ...g, ativo: !g.ativo } : g
    ),
  }));
}

export async function deleteAtividadeGrade(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    atividadeGrades: s.atividadeGrades.filter((g) => g.id !== id),
  }));
}

// ─── PLANOS ─────────────────────────────────────────────────────────────────

export async function listPlanos(): Promise<Plano[]> {
  const tenantId = getCurrentTenantId();
  return getStore().planos.filter((p) => p.tenantId === tenantId);
}

export async function getPlano(id: string): Promise<Plano | null> {
  const tenantId = getCurrentTenantId();
  return getStore().planos.find((p) => p.id === id && p.tenantId === tenantId) ?? null;
}

export async function createPlano(
  data: Omit<Plano, "id" | "tenantId" | "ativo">
): Promise<Plano> {
  const sanitized = sanitizePlanoRules(data);
  const plano: Plano = {
    ...sanitized,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, planos: [plano, ...s.planos] }));
  return plano;
}

export async function updatePlano(
  id: string,
  data: Partial<Omit<Plano, "id" | "tenantId">>
): Promise<void> {
  const current = getStore().planos.find((p) => p.id === id);
  if (!current) return;
  const merged = { ...current, ...data };
  const sanitized = sanitizePlanoRules(merged);
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) => (p.id === id ? { ...p, ...sanitized } : p)),
  }));
}

export async function togglePlanoAtivo(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id ? { ...p, ativo: !p.ativo } : p
    ),
  }));
}

export async function togglePlanoDestaque(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) =>
      p.id === id ? { ...p, destaque: !p.destaque } : p
    ),
  }));
}

export async function deletePlano(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    planos: s.planos.filter((p) => p.id !== id),
  }));
}

// ─── MATRÍCULAS ─────────────────────────────────────────────────────────────

export async function listMatriculas(params?: {
  status?: string;
}): Promise<(Matricula & { aluno?: Aluno; plano?: Plano })[]> {
  const tenantId = getCurrentTenantId();
  const store = getStore();
  let mats = [...store.matriculas].reverse().filter((m) => m.tenantId === tenantId);
  if (params?.status) mats = mats.filter((m) => m.status === params.status);
  return mats.map((m) => ({
    ...m,
    aluno: store.alunos.find((a) => a.id === m.alunoId),
    plano: store.planos.find((p) => p.id === m.planoId),
  }));
}

export async function getAlunoMatriculas(
  alunoId: string
): Promise<(Matricula & { plano?: Plano })[]> {
  const tenantId = getCurrentTenantId();
  const store = getStore();
  return store.matriculas
    .filter((m) => m.alunoId === alunoId && m.tenantId === tenantId)
    .map((m) => ({ ...m, plano: store.planos.find((p) => p.id === m.planoId) }));
}

export async function cancelarMatricula(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    matriculas: s.matriculas.map((m) =>
      m.id === id ? { ...m, status: "CANCELADA" as const } : m
    ),
  }));
}

export async function criarMatricula(data: {
  alunoId: string;
  planoId: string;
  dataInicio: string;
  valorPago: number;
  valorMatricula?: number;
  desconto?: number;
  motivoDesconto?: string;
  formaPagamento: TipoFormaPagamento;
  renovacaoAutomatica?: boolean;
  observacoes?: string;
  convenioId?: string;
  dataPagamento?: string;
}): Promise<Matricula> {
  const store = getStore();
  const plano = store.planos.find((p) => p.id === data.planoId);
  if (!plano) throw new Error("Plano não encontrado");
  if (data.renovacaoAutomatica && !plano.permiteRenovacaoAutomatica) {
    throw new Error("Este plano não permite renovação automática.");
  }
  if (data.formaPagamento === "RECORRENTE" && !plano.permiteCobrancaRecorrente) {
    throw new Error("Este plano não permite cobrança recorrente.");
  }
  if (data.convenioId) {
    const convenio = store.convenios.find((c) => c.id === data.convenioId);
    if (!convenio || !convenio.ativo) {
      throw new Error("Convênio inativo");
    }
    if (convenio.planoIds && convenio.planoIds.length > 0) {
      if (!convenio.planoIds.includes(data.planoId)) {
        throw new Error("Convênio não aplicável para este plano");
      }
    }
  }

  const matId = genId();
  const pagamentoId = genId();
  let desconto = data.desconto ?? 0;
  if (data.convenioId) {
    const convenio = store.convenios.find((c) => c.id === data.convenioId);
    if (convenio && convenio.ativo) {
      const descontoConvenio = (plano.valor * convenio.descontoPercentual) / 100;
      desconto += descontoConvenio;
    }
  }
  const dataFim = addDays(data.dataInicio, plano.duracaoDias);
  const planoAtividades = plano.atividades ?? [];
  const conflitos = store.matriculas.filter((m) => {
    if (m.alunoId !== data.alunoId) return false;
    if (m.status !== "ATIVA") return false;
    return rangesOverlap(data.dataInicio, dataFim, m.dataInicio, m.dataFim);
  });
  if (conflitos.length > 0) {
    const conflitoMesmoPlano = conflitos.some((m) => m.planoId === data.planoId);
    if (conflitoMesmoPlano) {
      throw new Error("Já existe um plano igual vigente neste período.");
    }
    const conflitoAtividade = conflitos.some((m) => {
      const planoExistente = store.planos.find((p) => p.id === m.planoId);
      const atividadesExistentes = planoExistente?.atividades ?? [];
      return planoAtividades.some((a) => atividadesExistentes.includes(a));
    });
    if (conflitoAtividade) {
      throw new Error("Já existe um plano com a mesma atividade no período vigente.");
    }
  }
  const valorFinal = Math.max(0, plano.valor - desconto);

  const matricula: Matricula = {
    id: matId,
    tenantId: getCurrentTenantId(),
    alunoId: data.alunoId,
    planoId: data.planoId,
    dataInicio: data.dataInicio,
    dataFim,
    valorPago: data.valorPago,
    valorMatricula: data.valorMatricula ?? plano.valorMatricula,
    desconto,
    motivoDesconto: data.motivoDesconto,
    formaPagamento: data.formaPagamento,
    status: "ATIVA",
    renovacaoAutomatica: data.renovacaoAutomatica ?? false,
    observacoes: data.observacoes,
    dataCriacao: now(),
    convenioId: data.convenioId,
  };

  const pagamento: Pagamento = {
    id: pagamentoId,
    tenantId: getCurrentTenantId(),
    alunoId: data.alunoId,
    matriculaId: matId,
    tipo: "MENSALIDADE",
    descricao: `Mensalidade – ${plano.nome}`,
    valor: plano.valor,
    desconto,
    valorFinal,
    dataVencimento: data.dataInicio,
    status: data.dataPagamento ? "PAGO" : "PENDENTE",
    dataPagamento: data.dataPagamento,
    dataCriacao: now(),
  };

  setStore((s) => ({
    ...s,
    matriculas: [matricula, ...s.matriculas],
    pagamentos: [pagamento, ...s.pagamentos],
    alunos: s.alunos,
  }));
  syncAlunosStatus();

  return matricula;
}

function sanitizePlanoRules<T extends {
  tipo: TipoPlano;
  cobraAnuidade: boolean;
  valorAnuidade?: number;
  parcelasMaxAnuidade?: number;
  permiteRenovacaoAutomatica: boolean;
  permiteCobrancaRecorrente: boolean;
  diaCobrancaPadrao?: number;
}>(plano: T): T {
  if (plano.tipo === "AVULSO") {
    return {
      ...plano,
      permiteRenovacaoAutomatica: false,
      permiteCobrancaRecorrente: false,
      diaCobrancaPadrao: undefined,
      cobraAnuidade: false,
      valorAnuidade: undefined,
      parcelasMaxAnuidade: undefined,
    };
  }

  const dia =
    plano.permiteCobrancaRecorrente && plano.diaCobrancaPadrao
      ? Math.min(28, Math.max(1, Math.floor(plano.diaCobrancaPadrao)))
      : undefined;

  return {
    ...plano,
    diaCobrancaPadrao: dia,
    valorAnuidade: plano.cobraAnuidade ? Math.max(0, plano.valorAnuidade ?? 0) : undefined,
    parcelasMaxAnuidade: plano.cobraAnuidade ? Math.max(1, Math.min(24, Math.floor(plano.parcelasMaxAnuidade ?? 1))) : undefined,
  };
}

export async function renovarMatricula(id: string, planoId?: string): Promise<void> {
  const store = getStore();
  const atual = store.matriculas.find((m) => m.id === id);
  if (!atual) throw new Error("Matrícula não encontrada");
  if (atual.convenioId) {
    const convenio = store.convenios.find((c) => c.id === atual.convenioId);
    if (!convenio || !convenio.ativo) {
      throw new Error("Convênio inativo. Renovação bloqueada.");
    }
  }
  const novoPlanoId = planoId ?? atual.planoId;
  const plano = store.planos.find((p) => p.id === novoPlanoId);
  if (!plano) throw new Error("Plano não encontrado");
  const start = addDays(atual.dataFim, 1);
  await criarMatricula({
    alunoId: atual.alunoId,
    planoId: novoPlanoId,
    dataInicio: start,
    valorPago: plano.valor,
    valorMatricula: plano.valorMatricula,
    formaPagamento: atual.formaPagamento,
    desconto: 0,
    convenioId: atual.convenioId,
  });
}

// ─── PAGAMENTOS ─────────────────────────────────────────────────────────────

export async function listPagamentos(params?: {
  status?: string;
}): Promise<(Pagamento & { aluno?: Aluno })[]> {
  const tenantId = getCurrentTenantId();
  const todayStr = today();
  // Atualiza vencidos e bloqueia clientes quando necessário
  setStore((s) => {
    const pagamentosBase = Array.isArray(s.pagamentos) ? s.pagamentos : [];
    let changed = false;
    const pagamentos = pagamentosBase.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < todayStr) {
        changed = true;
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    });
    return changed ? { ...s, pagamentos } : s;
  });
  syncAlunosStatus();
  const updated = getStore();
  let pags = [...updated.pagamentos].reverse().filter((p) => p.tenantId === tenantId);
  if (params?.status) pags = pags.filter((p) => p.status === params.status);
  return pags.map((p) => ({
    ...p,
    aluno: updated.alunos.find((a) => a.id === p.alunoId),
  }));
}

export async function receberPagamento(
  id: string,
  data: ReceberPagamentoInput
): Promise<void> {
  setStore((s) => {
    const pagamentos = s.pagamentos.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "PAGO" as const,
            dataPagamento: data.dataPagamento,
            formaPagamento: data.formaPagamento,
            observacoes: data.observacoes,
          }
        : p
    );
    return { ...s, pagamentos };
  });
  syncAlunosStatus();
}

// ─── FORMAS DE PAGAMENTO ────────────────────────────────────────────────────

export async function listFormasPagamento(params?: {
  apenasAtivas?: boolean;
}): Promise<FormaPagamento[]> {
  const tenantId = getCurrentTenantId();
  const only = params?.apenasAtivas ?? true;
  const formas = getStore().formasPagamento.filter((f) => f.tenantId === tenantId);
  return only ? formas.filter((f) => f.ativo) : formas;
}

export async function createFormaPagamento(
  data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">
): Promise<FormaPagamento> {
  const fp: FormaPagamento = {
    ...data,
    id: genId(),
    tenantId: getCurrentTenantId(),
    ativo: true,
  };
  setStore((s) => ({ ...s, formasPagamento: [fp, ...s.formasPagamento] }));
  return fp;
}

export async function updateFormaPagamento(
  id: string,
  data: Partial<Omit<FormaPagamento, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id ? { ...f, ...data } : f
    ),
  }));
}

export async function toggleFormaPagamento(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.map((f) =>
      f.id === id ? { ...f, ativo: !f.ativo } : f
    ),
  }));
}

export async function deleteFormaPagamento(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    formasPagamento: s.formasPagamento.filter((f) => f.id !== id),
  }));
}

export async function getFormasPagamentoLabels(): Promise<
  Record<TipoFormaPagamento, string>
> {
  return {
    DINHEIRO: "Dinheiro",
    PIX: "PIX",
    CARTAO_CREDITO: "Cartão de Crédito",
    CARTAO_DEBITO: "Cartão de Débito",
    BOLETO: "Boleto",
    RECORRENTE: "Recorrente",
  };
}
