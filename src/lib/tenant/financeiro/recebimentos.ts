import {
  type CategoriaContaReceberApi,
  type ContaReceberApiResponse,
  cancelarContaReceberApi,
  createContaReceberApi,
  listContasReceberApi,
  listContasReceberPageApi,
  receberContaReceberApi,
  updateContaReceberApi,
} from "@/lib/api/contas-receber";
import { extractAlunosFromListResponse, getAlunoApi, listAlunosApi } from "@/lib/api/alunos";
import { type Pagamento, type TipoFormaPagamento, type Aluno } from "@/lib/types";

export interface RecebimentoAvulsoInput {
  alunoId?: string;
  clienteNome?: string;
  documentoCliente?: string;
  descricao: string;
  tipo?: Pagamento["tipo"];
  valor: number;
  desconto?: number;
  dataVencimento: string;
  status?: "PENDENTE" | "PAGO";
  dataPagamento?: string;
  formaPagamento?: TipoFormaPagamento;
  codigoTransacao?: string;
  observacoes?: string;
}

export type PagamentoImportItem = RecebimentoAvulsoInput;

export interface ImportarPagamentosResultado {
  total: number;
  importados: number;
  ignorados: number;
  erros: string[];
}

export interface AjustarPagamentoInput {
  alunoId?: string;
  descricao?: string;
  tipo?: Pagamento["tipo"];
  valor?: number;
  desconto?: number;
  dataVencimento?: string;
  status?: Pagamento["status"];
  dataPagamento?: string;
  formaPagamento?: TipoFormaPagamento;
  codigoTransacao?: string;
  observacoes?: string;
}

export type PagamentoComAluno = Pagamento & {
  aluno?: Aluno;
  clienteNome?: string;
  documentoCliente?: string;
};

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return nowIso().slice(0, 10);
}

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized || undefined;
}

function mergeObservacoesComCodigoTransacao(
  observacoes: string | undefined,
  codigoTransacao: string | undefined
): string | undefined {
  const cleanedObservacoes = cleanString(observacoes);
  const cleanedCodigo = cleanString(codigoTransacao);

  if (!cleanedCodigo) {
    return cleanedObservacoes;
  }

  const linhaCodigo = `Código da transação: ${cleanedCodigo}`;
  if (!cleanedObservacoes) {
    return linhaCodigo;
  }

  if (cleanedObservacoes.includes(linhaCodigo)) {
    return cleanedObservacoes;
  }

  return `${cleanedObservacoes}\n${linhaCodigo}`;
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true" || normalized === "1" || normalized === "sim") return true;
    if (normalized === "false" || normalized === "0" || normalized === "nao" || normalized === "não") return false;
  }
  return fallback;
}

function toCpfDigits(value?: string | null): string {
  return (value ?? "").replace(/\D/g, "");
}

function firstDayOfMonth(date: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return `${date.slice(0, 7)}-01`;
  }
  return `${todayIso().slice(0, 7)}-01`;
}

function mapContaReceberStatusToPagamento(status: ContaReceberApiResponse["status"]): Pagamento["status"] {
  if (status === "RECEBIDA") return "PAGO";
  if (status === "VENCIDA") return "VENCIDO";
  if (status === "CANCELADA") return "CANCELADO";
  return "PENDENTE";
}

function mapContaReceberCategoriaToTipo(categoria: CategoriaContaReceberApi): Pagamento["tipo"] {
  if (categoria === "MATRICULA") return "MATRICULA";
  if (categoria === "MENSALIDADE") return "MENSALIDADE";
  if (categoria === "PRODUTO") return "PRODUTO";
  if (categoria === "SERVICO") return "TAXA";
  return "AVULSO";
}

function mapTipoToContaReceberCategoria(tipo: Pagamento["tipo"]): CategoriaContaReceberApi {
  if (tipo === "MATRICULA") return "MATRICULA";
  if (tipo === "MENSALIDADE") return "MENSALIDADE";
  if (tipo === "PRODUTO") return "PRODUTO";
  if (tipo === "TAXA") return "SERVICO";
  return "AVULSO";
}

function resolveAlunoByContaReceber(conta: ContaReceberApiResponse, alunos: Aluno[]): Aluno | undefined {
  const cpf = toCpfDigits(conta.documentoCliente);
  if (cpf) {
    const byCpf = alunos.find((aluno) => toCpfDigits(aluno.cpf) === cpf);
    if (byCpf) return byCpf;
  }

  const nome = conta.cliente.trim().toLowerCase();
  if (!nome) return undefined;
  return alunos.find((aluno) => aluno.nome.trim().toLowerCase() === nome);
}

function mapContaReceberToPagamento(conta: ContaReceberApiResponse, alunos: Aluno[]): PagamentoComAluno {
  const aluno = resolveAlunoByContaReceber(conta, alunos);
  const anyConta = conta as unknown as Record<string, unknown>;
  const valor = Math.max(0, toNumber(conta.valorOriginal));
  const desconto = Math.max(0, toNumber(conta.desconto));
  const juros = Math.max(0, toNumber(conta.jurosMulta));
  const valorFinal = Math.max(0, valor - desconto + juros);

  return {
    id: conta.id,
    tenantId: conta.tenantId,
    alunoId: aluno?.id ?? `manual-cr-${conta.id}`,
    tipo: mapContaReceberCategoriaToTipo(conta.categoria),
    descricao: conta.descricao,
    valor,
    desconto,
    valorFinal,
    dataVencimento: conta.dataVencimento,
    dataPagamento: conta.dataRecebimento ?? undefined,
    formaPagamento: conta.formaPagamento ?? undefined,
    status: mapContaReceberStatusToPagamento(conta.status),
    observacoes: conta.observacoes ?? undefined,
    nfseEmitida: parseBoolean(anyConta.nfseEmitida),
    nfseNumero: cleanString(anyConta.nfseNumero),
    nfseChave: cleanString(anyConta.nfseChave),
    dataEmissaoNfse: cleanString(anyConta.dataEmissaoNfse) as Pagamento["dataEmissaoNfse"] | undefined,
    dataCriacao: conta.dataCriacao,
    aluno,
    clienteNome: conta.cliente,
    documentoCliente: toCpfDigits(conta.documentoCliente) || undefined,
  };
}

async function listAlunosTenant(tenantId: string): Promise<Aluno[]> {
  const response = await listAlunosApi({
    tenantId,
    page: 0,
    size: 500,
  });
  return extractAlunosFromListResponse(response);
}

async function resolveClienteFromAlunoId(inputAlunoId: string | undefined, tenantId: string): Promise<{
  alunoId: string;
  cliente: string;
  documentoCliente?: string;
}> {
  const trimmed = inputAlunoId?.trim();
  const resolvedAlunoId = trimmed || `manual-avulso-${tenantId}`;
  if (!trimmed) {
    return {
      alunoId: resolvedAlunoId,
      cliente: "Sem cliente (avulso)",
    };
  }

  try {
    const aluno = await getAlunoApi({
      tenantId,
      id: trimmed,
    });
    return {
      alunoId: aluno.id,
      cliente: aluno.nome,
      documentoCliente: toCpfDigits(aluno.cpf) || undefined,
    };
  } catch {
    return {
      alunoId: resolvedAlunoId,
      cliente: "Cliente não identificado",
    };
  }
}

async function resolveClienteFromInput(input: {
  tenantId: string;
  alunoId?: string;
  clienteNome?: string;
  documentoCliente?: string;
}): Promise<{
  alunoId: string;
  cliente: string;
  documentoCliente?: string;
}> {
  const normalizedDocumento = toCpfDigits(input.documentoCliente);

  if (input.alunoId?.trim()) {
    return resolveClienteFromAlunoId(input.alunoId, input.tenantId);
  }

  if (!input.clienteNome?.trim() && !normalizedDocumento) {
    return resolveClienteFromAlunoId(undefined, input.tenantId);
  }

  const alunosTenant = await listAlunosTenant(input.tenantId);
  const matchedByCpf = alunosTenant.find((item) => toCpfDigits(item.cpf) === normalizedDocumento);
  if (matchedByCpf) {
    return {
      alunoId: matchedByCpf.id,
      cliente: matchedByCpf.nome,
      documentoCliente: toCpfDigits(matchedByCpf.cpf) || undefined,
    };
  }

  const normalizedClientName = input.clienteNome?.trim().toLowerCase();
  if (normalizedClientName) {
    const matchedByName = alunosTenant.find((item) => item.nome.trim().toLowerCase() === normalizedClientName);
    if (matchedByName) {
      return {
        alunoId: matchedByName.id,
        cliente: matchedByName.nome,
        documentoCliente: toCpfDigits(matchedByName.cpf) || undefined,
      };
    }

    return {
      alunoId: `manual-avulso-${input.tenantId}`,
      cliente: input.clienteNome?.trim() ?? "",
      documentoCliente: normalizedDocumento || undefined,
    };
  }

  return {
    alunoId: `manual-avulso-${input.tenantId}`,
    cliente: "Cliente não identificado",
    documentoCliente: normalizedDocumento || undefined,
  };
}

export async function listContasReceberOperacionais(input: {
  tenantId: string;
  status?: Pagamento["status"];
  startDate?: string;
  endDate?: string;
}): Promise<PagamentoComAluno[]> {
  const [contas, alunos] = await Promise.all([
    listContasReceberApi({
      tenantId: input.tenantId,
      status:
        input.status === "PAGO"
          ? "RECEBIDA"
          : input.status === "VENCIDO"
            ? "VENCIDA"
            : input.status === "CANCELADO"
              ? "CANCELADA"
              : input.status === "PENDENTE"
                ? "PENDENTE"
                : undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      page: 0,
      size: 500,
    }),
    listAlunosTenant(input.tenantId),
  ]);

  return contas.map((item) => mapContaReceberToPagamento(item, alunos));
}

/**
 * Variante com paginação server-side (P0-A 2026-04-23). Retorna o
 * `PagamentoComAluno[]` da página + meta (`total`, `hasNext`) lidos
 * dos headers `X-Total-Count` / `X-Total-Pages` que o endpoint já
 * emite. Substitui a versão legada no `/pagamentos` pra eliminar o
 * truncamento silencioso quando o caller fixava `size=500`.
 *
 * Os outros callers (BI, emitir-em-lote) continuam na versão sem
 * paginação porque trabalham com agregados/lotes pequenos.
 */
export async function listContasReceberOperacionaisPage(input: {
  tenantId: string;
  status?: Pagamento["status"];
  startDate?: string;
  endDate?: string;
  /** CPF digits-only — filtra contas pelo cliente no backend. */
  documentoCliente?: string;
  page?: number;
  size?: number;
}): Promise<{
  items: PagamentoComAluno[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
}> {
  const [pageResult, alunos] = await Promise.all([
    listContasReceberPageApi({
      tenantId: input.tenantId,
      status:
        input.status === "PAGO"
          ? "RECEBIDA"
          : input.status === "VENCIDO"
            ? "VENCIDA"
            : input.status === "CANCELADO"
              ? "CANCELADA"
              : input.status === "PENDENTE"
                ? "PENDENTE"
                : undefined,
      startDate: input.startDate,
      endDate: input.endDate,
      documentoCliente: input.documentoCliente,
      page: input.page ?? 0,
      size: input.size ?? 200,
    }),
    listAlunosTenant(input.tenantId),
  ]);

  return {
    items: pageResult.items.map((item) => mapContaReceberToPagamento(item, alunos)),
    total: pageResult.total,
    page: pageResult.page,
    size: pageResult.size,
    hasNext: pageResult.hasNext,
  };
}

export async function createRecebimentoAvulsoService(input: {
  tenantId: string;
  data: RecebimentoAvulsoInput;
}): Promise<Pagamento> {
  const valor = Math.max(0, Number(input.data.valor ?? 0));
  const desconto = Math.max(0, Number(input.data.desconto ?? 0));
  const valorFinal = Math.max(0, valor - desconto);
  const status = input.data.status === "PAGO" ? "PAGO" : "PENDENTE";
  const clienteData = await resolveClienteFromInput({
    tenantId: input.tenantId,
    alunoId: input.data.alunoId,
    clienteNome: input.data.clienteNome,
    documentoCliente: input.data.documentoCliente,
  });

  const created = await createContaReceberApi({
    tenantId: input.tenantId,
    data: {
      cliente: clienteData.cliente,
      documentoCliente: clienteData.documentoCliente,
      descricao: input.data.descricao.trim(),
      categoria: mapTipoToContaReceberCategoria(input.data.tipo ?? "AVULSO"),
      competencia: firstDayOfMonth(input.data.dataVencimento),
      dataEmissao: todayIso(),
      dataVencimento: input.data.dataVencimento,
      valorOriginal: valor,
      desconto,
      jurosMulta: 0,
      observacoes: cleanString(input.data.observacoes),
    },
  });

  if (!created) {
    throw new Error("Backend retornou lançamento vazio para conta a receber.");
  }

  let synced = created;
  if (status === "PAGO") {
    synced = await receberContaReceberApi({
      tenantId: input.tenantId,
      id: created.id,
      data: {
        dataRecebimento: input.data.dataPagamento ?? todayIso(),
        formaPagamento: input.data.formaPagamento ?? "PIX",
        codigoTransacao: cleanString(input.data.codigoTransacao),
        valorRecebido: valorFinal,
        observacoes: mergeObservacoesComCodigoTransacao(input.data.observacoes, input.data.codigoTransacao),
      },
    });
  }

  const alunos = await listAlunosTenant(input.tenantId);
  const mapped = mapContaReceberToPagamento(synced, alunos);
  return {
    ...mapped,
    alunoId: clienteData.alunoId,
  };
}

export async function importarPagamentosEmLoteService(input: {
  tenantId: string;
  items: PagamentoImportItem[];
}): Promise<ImportarPagamentosResultado> {
  const resultado: ImportarPagamentosResultado = {
    total: input.items.length,
    importados: 0,
    ignorados: 0,
    erros: [],
  };

  for (let index = 0; index < input.items.length; index += 1) {
    const item = input.items[index];
    try {
      const descricao = item.descricao.trim();
      if (!descricao) {
        throw new Error(`Linha ${index + 1}: descrição é obrigatória.`);
      }

      if (!item.dataVencimento || !/^\d{4}-\d{2}-\d{2}$/.test(item.dataVencimento)) {
        throw new Error(`Linha ${index + 1}: dataVencimento inválida (use YYYY-MM-DD).`);
      }

      const valor = Number(item.valor);
      if (!Number.isFinite(valor) || valor <= 0) {
        throw new Error(`Linha ${index + 1}: valor deve ser maior que zero.`);
      }

      const desconto = item.desconto == null ? 0 : Number(item.desconto);
      if (!Number.isFinite(desconto) || desconto < 0) {
        throw new Error(`Linha ${index + 1}: desconto inválido.`);
      }

      await createRecebimentoAvulsoService({
        tenantId: input.tenantId,
        data: {
          alunoId: item.alunoId,
          clienteNome: item.clienteNome,
          documentoCliente: item.documentoCliente,
          descricao,
          tipo: item.tipo,
          valor,
          desconto,
          dataVencimento: item.dataVencimento,
          status: item.status === "PAGO" ? "PAGO" : "PENDENTE",
          dataPagamento: item.dataPagamento,
          formaPagamento: item.formaPagamento,
          observacoes: item.observacoes,
        },
      });

      resultado.importados += 1;
    } catch (error) {
      resultado.ignorados += 1;
      resultado.erros.push(error instanceof Error ? error.message : "Erro desconhecido no registro.");
    }
  }

  return resultado;
}

export async function ajustarPagamentoService(input: {
  tenantId: string;
  id: string;
  data: AjustarPagamentoInput;
}): Promise<Pagamento> {
  const contasAtuais = await listContasReceberApi({
    tenantId: input.tenantId,
    page: 0,
    size: 500,
  });
  const current = contasAtuais.find((item) => item.id === input.id);
  const alvoStatus = input.data.status ?? (current ? mapContaReceberStatusToPagamento(current.status) : "PENDENTE");

  if (alvoStatus === "PENDENTE" && current && (current.status === "RECEBIDA" || current.status === "CANCELADA")) {
    throw new Error("Reabertura de conta recebida/cancelada ainda não está disponível no backend.");
  }

  const clienteData = input.data.alunoId === undefined
    ? undefined
    : await resolveClienteFromAlunoId(input.data.alunoId, input.tenantId);
  const descricao = input.data.descricao == null ? undefined : input.data.descricao.trim();
  const observacoes = input.data.observacoes === undefined ? undefined : cleanString(input.data.observacoes);
  const codigoTransacao = cleanString(input.data.codigoTransacao);
  const valorOriginal = input.data.valor == null ? undefined : Math.max(0, Number(input.data.valor));
  const desconto = input.data.desconto == null ? undefined : Math.max(0, Number(input.data.desconto));

  let updated = await updateContaReceberApi({
    tenantId: input.tenantId,
    id: input.id,
    data: {
      cliente: clienteData?.cliente,
      documentoCliente: clienteData?.documentoCliente,
      descricao,
      categoria: input.data.tipo ? mapTipoToContaReceberCategoria(input.data.tipo) : undefined,
      competencia: input.data.dataVencimento ? firstDayOfMonth(input.data.dataVencimento) : undefined,
      dataVencimento: input.data.dataVencimento,
      valorOriginal,
      desconto,
      observacoes,
    },
  });

  if (alvoStatus === "PAGO") {
    const baseValor = valorOriginal ?? Math.max(0, Number(updated.valorOriginal ?? 0));
    const baseDesconto = desconto ?? Math.max(0, Number(updated.desconto ?? 0));
    const baseJuros = Math.max(0, Number(updated.jurosMulta ?? 0));
    updated = await receberContaReceberApi({
      tenantId: input.tenantId,
      id: input.id,
      data: {
        dataRecebimento: input.data.dataPagamento ?? current?.dataRecebimento ?? todayIso(),
        formaPagamento: input.data.formaPagamento ?? current?.formaPagamento ?? "PIX",
        codigoTransacao,
        valorRecebido: Math.max(0, baseValor - baseDesconto + baseJuros),
        observacoes: mergeObservacoesComCodigoTransacao(observacoes, codigoTransacao),
      },
    });
  } else if (alvoStatus === "CANCELADO") {
    updated = await cancelarContaReceberApi({
      tenantId: input.tenantId,
      id: input.id,
      observacoes,
    });
  }

  const alunos = await listAlunosTenant(input.tenantId);
  const mapped = mapContaReceberToPagamento(updated, alunos);
  return clienteData ? { ...mapped, alunoId: clienteData.alunoId } : mapped;
}
