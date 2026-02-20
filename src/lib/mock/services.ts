import { getStore, setStore, TENANT_ID_DEFAULT } from "./store";
import type {
  Prospect,
  Aluno,
  Plano,
  Matricula,
  Pagamento,
  FormaPagamento,
  StatusProspect,
  StatusAluno,
  Sexo,
  TipoFormaPagamento,
  CreateProspectInput,
  ConverterProspectInput,
  ConverterProspectResponse,
  DashboardData,
  ReceberPagamentoInput,
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

// ─── DASHBOARD ──────────────────────────────────────────────────────────────

export async function getDashboard(): Promise<DashboardData> {
  const store = getStore();
  const todayStr = today();
  const in7Days = addDays(todayStr, 7);
  const thisMonth = todayStr.substring(0, 7);

  return {
    totalAlunosAtivos: store.alunos.filter((a) => a.status === "ATIVO").length,
    prospectsNovos: store.prospects.filter((p) => p.status === "NOVO").length,
    matriculasDoMes: store.matriculas.filter((m) =>
      m.createdAt.startsWith(thisMonth)
    ).length,
    receitaDoMes: store.pagamentos
      .filter(
        (p) =>
          p.status === "PAGO" && p.dataPagamento?.startsWith(thisMonth)
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

// ─── PROSPECTS ──────────────────────────────────────────────────────────────

export async function listProspects(params?: {
  status?: StatusProspect;
}): Promise<Prospect[]> {
  const { prospects } = getStore();
  const all = [...prospects].reverse();
  if (params?.status) return all.filter((p) => p.status === params.status);
  return all;
}

export async function getProspect(id: string): Promise<Prospect | null> {
  return getStore().prospects.find((p) => p.id === id) ?? null;
}

export async function createProspect(
  data: CreateProspectInput
): Promise<Prospect> {
  const prospect: Prospect = {
    ...data,
    id: genId(),
    tenantId: TENANT_ID_DEFAULT,
    status: "NOVO",
    createdAt: now(),
  };
  setStore((s) => ({ ...s, prospects: [prospect, ...s.prospects] }));
  return prospect;
}

export async function updateProspectStatus(
  id: string,
  status: StatusProspect
): Promise<void> {
  setStore((s) => ({
    ...s,
    prospects: s.prospects.map((p) =>
      p.id === id ? { ...p, status, updatedAt: now() } : p
    ),
  }));
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
    status: "ATIVO",
    createdAt: now(),
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
    createdAt: now(),
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
    createdAt: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
    prospects: s.prospects.map((p) =>
      p.id === data.prospectId
        ? { ...p, status: "CONVERTIDO" as StatusProspect, updatedAt: now() }
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
  cpf: string;
  dataNascimento: string;
  sexo: Sexo;
  rg?: string;
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
    cpf: data.cpf,
    rg: data.rg,
    dataNascimento: data.dataNascimento,
    sexo: data.sexo,
    status: "ATIVO",
    createdAt: now(),
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
    createdAt: now(),
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
    createdAt: now(),
  };

  setStore((s) => ({
    ...s,
    alunos: [...s.alunos, aluno],
    matriculas: [...s.matriculas, matricula],
    pagamentos: [...s.pagamentos, pagamento],
  }));

  return { aluno, matricula, pagamento };
}

export async function deleteProspect(id: string): Promise<void> {
  setStore((s) => ({
    ...s,
    prospects: s.prospects.filter((p) => p.id !== id),
  }));
}

// ─── ALUNOS ─────────────────────────────────────────────────────────────────

export async function listAlunos(params?: {
  status?: StatusAluno;
}): Promise<Aluno[]> {
  const { alunos } = getStore();
  const all = [...alunos].reverse();
  if (params?.status) return all.filter((a) => a.status === params.status);
  return all;
}

export async function getAluno(id: string): Promise<Aluno | null> {
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

// ─── PLANOS ─────────────────────────────────────────────────────────────────

export async function listPlanos(): Promise<Plano[]> {
  return getStore().planos.filter((p) => p.ativo);
}

export async function getPlano(id: string): Promise<Plano | null> {
  return getStore().planos.find((p) => p.id === id) ?? null;
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

// ─── PAGAMENTOS ─────────────────────────────────────────────────────────────

export async function listPagamentos(params?: {
  status?: string;
}): Promise<(Pagamento & { aluno?: Aluno })[]> {
  const store = getStore();
  let pags = [...store.pagamentos].reverse();
  if (params?.status) pags = pags.filter((p) => p.status === params.status);
  return pags.map((p) => ({
    ...p,
    aluno: store.alunos.find((a) => a.id === p.alunoId),
  }));
}

export async function receberPagamento(
  id: string,
  data: ReceberPagamentoInput
): Promise<void> {
  setStore((s) => ({
    ...s,
    pagamentos: s.pagamentos.map((p) =>
      p.id === id
        ? {
            ...p,
            status: "PAGO" as const,
            dataPagamento: data.dataPagamento,
            formaPagamento: data.formaPagamento,
            observacoes: data.observacoes,
          }
        : p
    ),
  }));
}

// ─── FORMAS DE PAGAMENTO ────────────────────────────────────────────────────

export async function listFormasPagamento(): Promise<FormaPagamento[]> {
  return getStore().formasPagamento.filter((f) => f.ativo);
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
