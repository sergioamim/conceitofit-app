import { getStore, setStore, TENANT_ID_DEFAULT } from "./store";
import type {
  Prospect,
  Aluno,
  Atividade,
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

function today(): string {
  return new Date().toISOString().split("T")[0];
}

function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart <= bEnd && aEnd >= bStart;
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
    const pagamentos = s.pagamentos.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < today()) {
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    });
    return {
      ...s,
      pagamentos,
      alunos: s.alunos.map((a) => {
        const status = computeAlunoStatus(a, s, pagamentos);
        return status === a.status ? a : { ...a, status };
      }),
    };
  });
}

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboard(params?: { month?: number; year?: number }): Promise<DashboardData> {
  syncAlunosStatus();
  const store = getStore();
  const todayStr = today();
  const month = params?.month ?? new Date().getMonth();
  const year = params?.year ?? new Date().getFullYear();
  const monthStr = String(month + 1).padStart(2, "0");
  const monthPrefix = `${year}-${monthStr}`;
  const in7Days = addDays(todayStr, 7);

  return {
    totalAlunosAtivos: store.alunos.filter((a) => a.status === "ATIVO").length,
    prospectsNovos: store.prospects.filter((p) => p.dataCriacao.startsWith(monthPrefix)).length,
    matriculasDoMes: store.matriculas.filter((m) =>
      m.dataCriacao.startsWith(monthPrefix)
    ).length,
    receitaDoMes: store.pagamentos
      .filter(
        (p) =>
          p.status === "PAGO" && p.dataPagamento?.startsWith(monthPrefix)
      )
      .reduce((sum, p) => sum + p.valorFinal, 0),
    prospectsRecentes: store.prospects
      .filter((p) => p.status !== "CONVERTIDO" && p.status !== "PERDIDO")
      .slice(0, 5),
    matriculasVencendo: store.matriculas
      .filter(
        (m) =>
          m.status === "ATIVA" &&
          m.dataFim >= todayStr &&
          m.dataFim <= in7Days
      )
      .map((m) => ({
        ...m,
        aluno: store.alunos.find((a) => a.id === m.alunoId),
        plano: store.planos.find((p) => p.id === m.planoId),
      })),
    pagamentosPendentes: store.pagamentos
      .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
      .map((p) => ({
        ...p,
        aluno: store.alunos.find((a) => a.id === p.alunoId),
      })),
  };
}

// ─── TENANT ────────────────────────────────────────────────────────────────

export async function listTenants(): Promise<Tenant[]> {
  return getStore().tenants;
}

export async function getCurrentTenant(): Promise<Tenant> {
  const store = getStore();
  return store.tenants.find((t) => t.id === store.currentTenantId) ?? store.tenant;
}

export async function setCurrentTenant(id: string): Promise<void> {
  setStore((s) => {
    const tenant = s.tenants.find((t) => t.id === id) ?? s.tenant;
    return {
      ...s,
      currentTenantId: tenant.id,
      tenant,
    };
  });
}

// ─── PROSPECTS ──────────────────────────────────────────────────────────────

export async function listProspects(params?: {
  status?: StatusProspect;
}): Promise<Prospect[]> {
  const { prospects } = getStore();
  const all = [...prospects].reverse();
  if (params?.status) return all.filter((p) => p.status === params.status);
  return all;
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
  return getStore().prospects.find((p) => p.id === id) ?? null;
}

export async function createProspect(
  data: CreateProspectInput
): Promise<Prospect> {
  const createdAt = now();
  const prospect: Prospect = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
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
  const { prospects } = getStore();
  const tel = params.telefone?.replace(/\D/g, "");
  return prospects.some((p) => {
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
  const prospect = store.prospects.find((p) => p.id === data.prospectId);
  if (!prospect) throw new Error("Prospect não encontrado");

  const plano = store.planos.find((p) => p.id === data.planoId);
  if (!plano) throw new Error("Plano não encontrado");

  const alunoId = genId();
  const matriculaId = genId();
  const pagamentoId = genId();

  const aluno: Aluno = {
    id: alunoId,
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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

export async function listFuncionarios(params?: { apenasAtivos?: boolean }): Promise<Funcionario[]> {
  const only = params?.apenasAtivos ?? true;
  return only
    ? getStore().funcionarios.filter((f) => f.ativo)
    : getStore().funcionarios;
}

export async function createFuncionario(
  data: Omit<Funcionario, "id" | "ativo">
): Promise<Funcionario> {
  const f: Funcionario = { ...data, id: genId(), ativo: true };
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
      f.id === id ? { ...f, ...data } : f
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
  }));
}

// ─── TENANT ────────────────────────────────────────────────────────────────

export async function getTenant(): Promise<Tenant> {
  return getStore().tenant;
}

export async function updateTenant(data: Partial<Tenant>): Promise<void> {
  setStore((s) => ({
    ...s,
    tenant: { ...s.tenant, ...data },
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
  const { vouchers } = getStore();
  return [...vouchers].reverse();
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
  data: Omit<Voucher, "id" | "tenantId" | "ativo"> & { codigoUnicoCustom?: string }
): Promise<Voucher> {
  const { codigoUnicoCustom, ...voucherData } = data;
  const voucher: Voucher = {
    ...voucherData,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
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
  setStore((s) => ({
    ...s,
    vouchers: s.vouchers.map((v) => (v.id === id ? { ...v, ...data } : v)),
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
  syncAlunosStatus();
  const { alunos } = getStore();
  const all = [...alunos].reverse();
  if (params?.status) return all.filter((a) => a.status === params.status);
  return all;
}

export async function getAluno(id: string): Promise<Aluno | null> {
  syncAlunosStatus();
  return getStore().alunos.find((a) => a.id === id) ?? null;
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
  const { servicos } = getStore();
  const all = [...servicos].reverse();
  if (params?.apenasAtivos) return all.filter((s) => s.ativo);
  return all;
}

export async function createServico(
  data: Omit<Servico, "id" | "tenantId" | "ativo">
): Promise<Servico> {
  const servico: Servico = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
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
  const { atividades } = getStore();
  let all = [...atividades].reverse();
  if (params?.apenasAtivas) all = all.filter((a) => a.ativo);
  if (params?.categoria) all = all.filter((a) => a.categoria === params.categoria);
  return all;
}

export async function createAtividade(
  data: Omit<Atividade, "id" | "tenantId" | "ativo">
): Promise<Atividade> {
  const atividade: Atividade = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
    ativo: true,
  };
  setStore((s) => ({ ...s, atividades: [atividade, ...s.atividades] }));
  return atividade;
}

export async function updateAtividade(
  id: string,
  data: Partial<Omit<Atividade, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    atividades: s.atividades.map((a) =>
      a.id === id ? { ...a, ...data } : a
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
  }));
}

// ─── PLANOS ─────────────────────────────────────────────────────────────────

export async function listPlanos(): Promise<Plano[]> {
  return getStore().planos;
}

export async function getPlano(id: string): Promise<Plano | null> {
  return getStore().planos.find((p) => p.id === id) ?? null;
}

export async function createPlano(
  data: Omit<Plano, "id" | "tenantId" | "ativo">
): Promise<Plano> {
  const plano: Plano = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
    ativo: true,
  };
  setStore((s) => ({ ...s, planos: [plano, ...s.planos] }));
  return plano;
}

export async function updatePlano(
  id: string,
  data: Partial<Omit<Plano, "id" | "tenantId">>
): Promise<void> {
  setStore((s) => ({
    ...s,
    planos: s.planos.map((p) => (p.id === id ? { ...p, ...data } : p)),
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
  const store = getStore();
  let mats = [...store.matriculas].reverse();
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
  const store = getStore();
  return store.matriculas
    .filter((m) => m.alunoId === alunoId)
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
    tenantId: TENANT_ID_DEFAULT,
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
    tenantId: TENANT_ID_DEFAULT,
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
  const todayStr = today();
  // Atualiza vencidos e bloqueia clientes quando necessário
  setStore((s) => ({
    ...s,
    pagamentos: s.pagamentos.map((p) => {
      if (p.status === "PENDENTE" && p.dataVencimento < todayStr) {
        return { ...p, status: "VENCIDO" as const };
      }
      return p;
    }),
  }));
  syncAlunosStatus();
  const updated = getStore();
  let pags = [...updated.pagamentos].reverse();
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
  const only = params?.apenasAtivas ?? true;
  return only
    ? getStore().formasPagamento.filter((f) => f.ativo)
    : getStore().formasPagamento;
}

export async function createFormaPagamento(
  data: Omit<FormaPagamento, "id" | "tenantId" | "ativo">
): Promise<FormaPagamento> {
  const fp: FormaPagamento = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
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
