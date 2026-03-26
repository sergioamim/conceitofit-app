"use client";

import { ChangeEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, BadgeCheck, FileText, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getNfseConfiguracaoAtualApi } from "@/lib/api/admin-financeiro";
import { extractAlunosFromListResponse, listAlunosApi } from "@/lib/api/alunos";
import { listConveniosApi } from "@/lib/api/beneficios";
import { listFormasPagamentoApi } from "@/lib/api/formas-pagamento";
import { listMatriculasApi } from "@/lib/api/matriculas";
import { emitirNfsePagamentoApi } from "@/lib/api/pagamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBusinessCurrentMonthYear } from "@/lib/business-date";
import {
  ajustarPagamentoService,
  importarPagamentosEmLoteService,
  listContasReceberOperacionais,
  type ImportarPagamentosResultado,
  type PagamentoComAluno,
  type PagamentoImportItem,
} from "@/lib/financeiro/recebimentos";
import { useTenantContext } from "@/hooks/use-session-context";
import { getNfseBloqueioMensagem } from "@/lib/admin-financeiro";
import { StatusBadge } from "@/components/shared/status-badge";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import { MonthYearPicker } from "@/components/shared/month-year-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type {
  Pagamento,
  Aluno,
  StatusPagamento,
  TipoFormaPagamento,
  FormaPagamento,
  Matricula,
  Convenio,
  NfseConfiguracao,
} from "@/lib/types";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDate } from "@/lib/formatters";

type ParsedImportCsvRow = {
  clienteNome: string;
  documentoCliente: string;
  descricao: string;
  valor: string;
  desconto: string;
  dataVencimento: string;
  dataPagamento: string;
  status: string;
  formaPagamento: string;
  tipo: string;
  observacoes: string;
};

const STATUS_FILTERS: { value: StatusPagamento | "TODOS"; label: string }[] = [
  { value: "TODOS", label: "Todos" },
  { value: "PENDENTE", label: "Pendentes" },
  { value: "VENCIDO", label: "Vencidos" },
  { value: "PAGO", label: "Pagos" },
  { value: "CANCELADO", label: "Cancelados" },
];

const TIPO_LABEL: Record<string, string> = {
  MATRICULA: "Matrícula",
  MENSALIDADE: "Mensalidade",
  TAXA: "Taxa",
  PRODUTO: "Produto",
  AVULSO: "Avulso",
};

const IMPORTAR_PAGAMENTOS_EXEMPLO = `Nome,CPF,Descricao,Valor,Desconto,Data Vencimento,Data Pagamento,Status,Forma Pagamento,Tipo
Maria Souza,11987654321,Mensalidade Fevereiro,199,10,10/02/2026,10/02/2026,PAGO,PIX,MENSALIDADE
João Alves,11876543210,Taxa de reativação,80,0,20/02/2026,,PENDENTE,,AVULSO`;

function toSafeText(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

function normalizeHeaderToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/^\uFEFF/, "")
    .toLowerCase()
    .replace(/["']/g, "")
    .replace(/[^\w]+/g, " ")
    .trim();
}

function detectCsvSeparator(rowSample: string[]): "," | ";" {
  if (!rowSample.length) return ",";
  const counts = rowSample.reduce(
    (acc, line) => {
      let inQuotes = false;
      for (let i = 0; i < line.length; i += 1) {
        const char = line[i];
        if (char === '"') {
          if (line[i + 1] === '"') {
            i += 1;
            continue;
          }
          inQuotes = !inQuotes;
          continue;
        }
        if (!inQuotes) {
          if (char === ",") acc.comma += 1;
          if (char === ";") acc.semicolon += 1;
        }
      }
      return acc;
    },
    { comma: 0, semicolon: 0 },
  );

  if (counts.semicolon > counts.comma) return ";";
  return ",";
}

function parseCsv(raw: string, separator: "," | ";"): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };

  const pushRow = () => {
    if (row.length > 1 || row[0]?.trim()) {
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];
    const next = raw[i + 1];
    if (char === '"') {
      if (next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && (char === separator)) {
      pushField();
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") i += 1;
      pushField();
      pushRow();
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    pushField();
  }
  if (row.length) {
    pushRow();
  }

  return rows;
}

function mapCsvHeader(header: string[]): Record<string, number> {
  const headers = header.map((item) => normalizeHeaderToken(item));
  const map: Record<string, number> = {};
  const aliases: Record<string, keyof ParsedImportCsvRow> = {
    nome: "clienteNome",
    "nome cliente": "clienteNome",
    cliente: "clienteNome",
    "cliente nome": "clienteNome",
    aluno: "clienteNome",
    "nome aluno": "clienteNome",
    cpf: "documentoCliente",
    "documento": "documentoCliente",
    "documento cliente": "documentoCliente",
    "numero documento": "documentoCliente",
    descricao: "descricao",
    historico: "descricao",
    "historico pagamento": "descricao",
    "historico financeiro": "descricao",
    valor: "valor",
    valorapagar: "valor",
    "valor pago": "valor",
    "valor bruto": "valor",
    desconto: "desconto",
    "desconto valor": "desconto",
    "valor desconto": "desconto",
    "vencimento": "dataVencimento",
    "data vencimento": "dataVencimento",
    "data de vencimento": "dataVencimento",
    "vencimento original": "dataVencimento",
    venc: "dataVencimento",
    "data pagamento": "dataPagamento",
    "data liquidaçao": "dataPagamento",
    "data liquidacao": "dataPagamento",
    "data de pagamento": "dataPagamento",
    status: "status",
    situacao: "status",
    "situacao financeira": "status",
    "forma pagamento": "formaPagamento",
    "forma de pagamento": "formaPagamento",
    pagamento: "formaPagamento",
    "metodo pagamento": "formaPagamento",
    "meio pagamento": "formaPagamento",
    observacoes: "observacoes",
    observacao: "observacoes",
    tipo: "tipo",
    categoria: "tipo",
    "tipo cobranca": "tipo",
  };

  headers.forEach((h, index) => {
    const mapped = aliases[h];
    if (mapped) {
      map[mapped] = index;
      return;
    }
    for (const [alias, key] of Object.entries(aliases)) {
      if (h.includes(alias)) {
        map[key] = index;
        break;
      }
    }
  });

  return map;
}

function normalizeSeparator(value: string): string {
  return toSafeText(value).replace(/\s+/g, " ");
}

function normalizeDateValue(rawInput: unknown, line: number, fieldName: string): string {
  const raw = normalizeSeparator(toSafeText(rawInput));
  if (!raw) return "";
  const trimmedDate = raw.split(" ").filter(Boolean)[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) return trimmedDate;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmedDate)) {
    const [dd, mm, yyyy] = trimmedDate.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmedDate)) {
    const [dd, mm, yyyy] = trimmedDate.split("-");
    return `${yyyy}-${mm}-${dd}`;
  }
  throw new Error(`Linha ${line}: coluna ${fieldName} inválida (${raw}).`);
}

function normalizeMoney(value: unknown, line: number): number {
  const raw = toSafeText(value);
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,-]/g, "");
  const hasDot = cleaned.includes(".");
  const hasComma = cleaned.includes(",");
  let normalized = cleaned;
  if (hasDot && hasComma) {
    const lastDot = cleaned.lastIndexOf(".");
    const lastComma = cleaned.lastIndexOf(",");
    if (lastDot > lastComma) {
      normalized = cleaned.replace(/,/g, "");
    } else {
      normalized = cleaned.replace(/\./g, "").replace(/,/g, ".");
    }
  } else if (hasComma && !hasDot) {
    normalized = cleaned.replace(".", "").replace(",", ".");
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`Linha ${line}: valor inválido (${raw}).`);
  }
  return parsed;
}

function normalizeTipoPagamento(value: unknown): Pagamento["tipo"] {
  const normalized = normalizeHeaderToken(toSafeText(value)).toUpperCase();
  if (!normalized || normalized === "") return "AVULSO";
  if (["MATRICULA", "MENSALIDADE", "TAXA", "PRODUTO", "AVULSO"].includes(normalized)) {
    return normalized as Pagamento["tipo"];
  }
  if (normalized.includes("MATRIC") || normalized.includes("MATRICULA")) return "MATRICULA";
  if (normalized.includes("MENSAL") || normalized.includes("MENSALIDADE")) return "MENSALIDADE";
  if (normalized.includes("TAXA")) return "TAXA";
  if (normalized.includes("PROD") || normalized.includes("ITEM") || normalized.includes("VEND")) return "PRODUTO";
  throw new Error(`Tipo de pagamento inválido: ${toSafeText(value)}.`);
}

function normalizeStatusPagamento(value: unknown): "PENDENTE" | "PAGO" {
  const normalized = normalizeHeaderToken(toSafeText(value)).toUpperCase();
  if (!normalized || normalized.includes("PENDEN") || normalized.includes("ABERT") || normalized.includes("VENC")) {
    return "PENDENTE";
  }
  if (
    normalized.includes("PAGO") ||
    normalized.includes("QUIT") ||
    normalized.includes("BAIX") ||
    normalized.includes("LIQU") ||
    normalized.includes("OK")
  ) {
    return "PAGO";
  }
  throw new Error(`Status inválido no import: ${toSafeText(value)}. Use PAGO ou PENDENTE.`);
}

function normalizeFormaPagamento(value: unknown): TipoFormaPagamento | undefined {
  const normalized = normalizeHeaderToken(toSafeText(value)).toUpperCase();
  if (!normalized) return undefined;
  if ([
    "DINHEIRO",
    "PIX",
    "CARTAOCREDITO",
    "CARTAODEBITO",
    "BOLETO",
    "RECORRENTE",
  ].includes(normalized)) {
    if (normalized === "CARTAOCREDITO") return "CARTAO_CREDITO";
    if (normalized === "CARTAODEBITO") return "CARTAO_DEBITO";
    return normalized as TipoFormaPagamento;
  }
  if (normalized.includes("CARTAO") && normalized.includes("CRED")) return "CARTAO_CREDITO";
  if (normalized.includes("CARTAO") && (normalized.includes("DEB") || normalized.includes("DEBIT"))) return "CARTAO_DEBITO";
  throw new Error(`Forma de pagamento inválida: ${toSafeText(value)}.`);
}

function parseImportPayload(raw: string): PagamentoImportItem[] {
  const payload = raw.trim();
  if (!payload) return [];

  const lines = payload.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const separator = detectCsvSeparator(lines.slice(0, 5));
  const parsedRows = parseCsv(payload, separator);
  if (parsedRows.length === 0) return [];

  const header = parsedRows[0] ?? [];
  const map = mapCsvHeader(header);
  const expected = new Set<keyof ParsedImportCsvRow>([
    "clienteNome",
    "documentoCliente",
    "descricao",
    "valor",
    "dataVencimento",
  ]);
  const mappedHeaders = [...expected].filter((key) => map[key] !== undefined).length;
  const hasHeader = mappedHeaders >= 2;
  if (!hasHeader) {
    throw new Error(
      `Não foi identificado cabeçalho CSV reconhecido. Verifique o arquivo de backup do EVO com colunas padrão (Nome, CPF, Descricao, Valor, Desconto, Data Vencimento, Data Pagamento, Status, Forma Pagamento).`
    );
  }

  const dataRows = parsedRows.slice(1).filter((row) => row.some(Boolean));
  return dataRows.map((row, index) => {
    const line = index + 2;
    const pick = (key: keyof ParsedImportCsvRow): string => {
      const col = map[key];
      if (col == null || col >= row.length) return "";
      return row[col] ?? "";
    };

    const dataVencimento = normalizeDateValue(pick("dataVencimento"), line, "Data Vencimento");
    if (!dataVencimento) {
      throw new Error(`Linha ${line}: Data Vencimento é obrigatória.`);
    }

    const descricao = normalizeSeparator(pick("descricao"));
    if (!descricao) {
      throw new Error(`Linha ${line}: descricao é obrigatória.`);
    }

    const tipo = normalizeTipoPagamento(pick("tipo"));
    const status = normalizeStatusPagamento(pick("status"));
    const formaPagamento = normalizeFormaPagamento(pick("formaPagamento")) ?? undefined;

    const clienteNome = normalizeSeparator(pick("clienteNome"));
    const documentoCliente = normalizeSeparator(pick("documentoCliente"));

    if (!clienteNome && !documentoCliente) {
      throw new Error(`Linha ${line}: informe clienteNome ou documentoCliente/cpf.`);
    }

    const valor = normalizeMoney(pick("valor"), line);
    if (valor <= 0) {
      throw new Error(`Linha ${line}: valor deve ser maior que zero.`);
    }

    const desconto = normalizeMoney(pick("desconto"), line);

  const dataPagamento = normalizeSeparator(pick("dataPagamento"))
      ? normalizeDateValue(pick("dataPagamento"), line, "Data Pagamento")
      : undefined;

    return {
      alunoId: undefined,
      clienteNome: clienteNome || undefined,
      documentoCliente: documentoCliente || undefined,
      descricao,
      tipo,
      valor,
      desconto,
      dataVencimento,
      status,
      dataPagamento,
      formaPagamento,
      observacoes: normalizeSeparator(pick("observacoes")) || undefined,
    };
  });
}


function PagamentosPageContent() {
  const searchParams = useSearchParams();
  const { tenantId } = useTenantContext();
  const [pagamentos, setPagamentos] = useState<PagamentoComAluno[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [clientes, setClientes] = useState<Aluno[]>([]);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [filtro, setFiltro] = useState<StatusPagamento | "TODOS">("TODOS");
  const [recebendo, setRecebendo] = useState<PagamentoComAluno | null>(null);
  const [emitindo, setEmitindo] = useState<PagamentoComAluno | null>(null);
  const [visualizandoNfse, setVisualizandoNfse] = useState<PagamentoComAluno | null>(null);
  const [emailDestino, setEmailDestino] = useState("");
  const [emailResultado, setEmailResultado] = useState("");
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [solicitandoSegundaVia, setSolicitandoSegundaVia] = useState(false);
  const [nfseConfiguracao, setNfseConfiguracao] = useState<NfseConfiguracao | null>(null);
  const [nfseFeedback, setNfseFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [mes, setMes] = useState(() => getBusinessCurrentMonthYear().month);
  const [ano, setAno] = useState(() => getBusinessCurrentMonthYear().year);
  const [clienteFiltro, setClienteFiltro] = useState<string>("TODOS");
  const [importPayload, setImportPayload] = useState(IMPORTAR_PAGAMENTOS_EXEMPLO);
  const [importandoPagamentos, setImportandoPagamentos] = useState(false);
  const [importResultado, setImportResultado] = useState<ImportarPagamentosResultado | null>(null);
  const [importErro, setImportErro] = useState<string | null>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    const [pags, fps, cls, mats, cvs, nfseConfig] = await Promise.all([
      listContasReceberOperacionais({ tenantId }),
      listFormasPagamentoApi({ tenantId, apenasAtivas: false }),
      listAlunosApi({ tenantId, page: 0, size: 500 }),
      listMatriculasApi({ tenantId, page: 0, size: 500 }),
      listConveniosApi(),
      getNfseConfiguracaoAtualApi({ tenantId }).catch(() => null),
    ]);
    setPagamentos(pags);
    setFormasPagamento(fps);
    setClientes(extractAlunosFromListResponse(cls));
    setMatriculas(mats);
    setConvenios(cvs);
    setNfseConfiguracao(nfseConfig);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const alunoId = searchParams.get("clienteId") ?? searchParams.get("alunoId");
  const filteredBase =
    filtro === "TODOS"
      ? pagamentos
      : pagamentos.filter((p) => p.status === filtro);

  const filtered = filteredBase.filter((p) => {
    if (alunoId && p.alunoId !== alunoId) return false;
    if (clienteFiltro !== "TODOS" && p.alunoId !== clienteFiltro) return false;
    const d = new Date(p.dataVencimento + "T00:00:00");
    return d.getMonth() === mes && d.getFullYear() === ano;
  });

  const totalRecebido = filtered
    .filter((p) => p.status === "PAGO")
    .reduce((s, p) => s + p.valorFinal, 0);

  const totalPendente = filtered
    .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
    .reduce((s, p) => s + p.valorFinal, 0);
  const nfseBloqueio = getNfseBloqueioMensagem(nfseConfiguracao);

  async function handleConfirmRecebimento(data: {
    dataPagamento: string;
    formaPagamento: TipoFormaPagamento;
    observacoes?: string;
  }) {
    if (!recebendo || !tenantId) return;
    await ajustarPagamentoService({
      tenantId,
      id: recebendo.id,
      data: {
        status: "PAGO",
        dataPagamento: data.dataPagamento,
        formaPagamento: data.formaPagamento,
        observacoes: data.observacoes,
      },
    });
    setRecebendo(null);
    await load();
  }

  async function handleConfirmEmissao() {
    if (!emitindo || !tenantId) return;
    try {
      setNfseFeedback(null);
      await emitirNfsePagamentoApi({
        tenantId,
        id: emitindo.id,
      });
      setNfseFeedback({ type: "success", message: "NFSe emitida com sucesso." });
      setEmitindo(null);
      await load();
    } catch (error) {
      setNfseFeedback({ type: "error", message: normalizeErrorMessage(error) });
      setEmitindo(null);
    }
  }

  async function handleImportarPagamentos() {
    if (!tenantId) return;
    setImportErro(null);
    setImportResultado(null);
    setImportandoPagamentos(true);

    try {
      const parsed = parseImportPayload(importPayload);
      if (parsed.length === 0) {
        throw new Error("Payload vazio.");
      }

      const resultado = await importarPagamentosEmLoteService({
        tenantId,
        items: parsed,
      });
      setImportResultado(resultado);
      await load();
    } catch (error) {
      setImportErro(error instanceof Error ? error.message : "Falha ao importar pagamentos.");
    } finally {
      setImportandoPagamentos(false);
    }
  }

  async function handleImportFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setImportPayload(text);
    } catch {
      setImportErro("Não foi possível ler o arquivo selecionado.");
    } finally {
      if (importFileRef.current) {
        importFileRef.current.value = "";
      }
    }
  }

  function handleAbrirDetalheNfse(pagamento: PagamentoComAluno) {
    setVisualizandoNfse(pagamento);
    setEmailDestino(pagamento.aluno?.email ?? "");
    setEmailResultado("");
  }

  async function handleSolicitarSegundaVia() {
    if (!visualizandoNfse || !tenantId) return;
    setSolicitandoSegundaVia(true);
    try {
      await emitirNfsePagamentoApi({
        tenantId,
        id: visualizandoNfse.id,
      });
      setEmailResultado("Solicitação de segunda via concluída.");
      await load();
    } catch (error) {
      setEmailResultado(normalizeErrorMessage(error));
    } finally {
      setSolicitandoSegundaVia(false);
    }
  }

  async function handleEnviarNfseEmail() {
    if (!visualizandoNfse) return;
    const destino = emailDestino.trim();
    if (!destino || !destino.includes("@")) {
      setEmailResultado("Informe um e-mail válido.");
      return;
    }

    setEnviandoEmail(true);
    setEmailResultado("");
    try {
      const assunto = encodeURIComponent(`NFS-e ${visualizandoNfse.nfseNumero ?? visualizandoNfse.id}`);
      const corpo = encodeURIComponent(
        [
          `NFS-e do cliente: ${visualizandoNfse.aluno?.nome ?? "Cliente"}`,
          `Pagamento: ${visualizandoNfse.descricao}`,
          `Valor: ${formatBRL(visualizandoNfse.valorFinal)}`,
          `Vencimento: ${formatDate(visualizandoNfse.dataVencimento)}`,
          visualizandoNfse.nfseNumero ? `N° ${visualizandoNfse.nfseNumero}` : "NFS-e emitida",
          visualizandoNfse.dataEmissaoNfse ? `Emitida em ${formatDate(visualizandoNfse.dataEmissaoNfse)}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );

      window.location.href = `mailto:${encodeURIComponent(destino)}?subject=${assunto}&body=${corpo}`;
      setEmailResultado("Abrindo cliente de e-mail para envio.");
    } finally {
      setEnviandoEmail(false);
    }
  }

  return (
    <div className="space-y-6">
      {recebendo && (
        <ReceberPagamentoModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
          convenio={(() => {
            const mat = matriculas.find((m) => m.id === recebendo.matriculaId);
            if (!mat?.convenioId) return undefined;
            const conv = convenios.find((c) => c.id === mat.convenioId);
            return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
          })()}
          onClose={() => setRecebendo(null)}
          onConfirm={handleConfirmRecebimento}
        />
      )}
      {emitindo && (
        <Dialog open onOpenChange={(open) => !open && setEmitindo(null)}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Confirmar emissão de NF</DialogTitle>
              <DialogDescription>
                Confirma a emissão da NFS-e para <strong>{emitindo.aluno?.nome ?? "este pagamento"}</strong>? Isso marca
                o documento fiscal como emitido e ficará visível na aba NFS-e.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={() => setEmitindo(null)}
              >
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleConfirmEmissao()}>
                Confirmar emissão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {visualizandoNfse && (
        <Dialog open onOpenChange={(open) => !open && setVisualizandoNfse(null)}>
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-lg">Detalhes da NFS-e</DialogTitle>
              <DialogDescription>
                Documento fiscal emitido para {visualizandoNfse.aluno?.nome ?? "cliente"}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="font-semibold">
                {visualizandoNfse.nfseNumero
                  ? `N° ${visualizandoNfse.nfseNumero}`
                  : "NFS-e emitida"}
              </p>
              <p className="text-muted-foreground">{visualizandoNfse.descricao}</p>
              <p>
                {formatBRL(visualizandoNfse.valorFinal)}
                {visualizandoNfse.dataEmissaoNfse
                  ? ` · emitida em ${formatDate(visualizandoNfse.dataEmissaoNfse)}`
                  : ""}
              </p>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Enviar por e-mail
                </label>
                <Input
                  value={emailDestino}
                  onChange={(event) => setEmailDestino(event.target.value)}
                  placeholder="email@cliente.com"
                  className="bg-secondary border-border"
                />
              </div>
              {emailResultado && <p className="text-xs text-muted-foreground">{emailResultado}</p>}
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={handleSolicitarSegundaVia}
                disabled={solicitandoSegundaVia}
              >
                <FileText className="size-4" />
                {solicitandoSegundaVia ? "Solicitando..." : "Segunda via"}
              </Button>
              <Button
                type="button"
                onClick={() => void handleEnviarNfseEmail()}
                disabled={enviandoEmail}
              >
                <Mail className="size-4" />
                {enviandoEmail ? "Enviando..." : "Enviar por e-mail"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Pagamentos
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie cobranças e recebimentos
        </p>
      </div>

      {nfseFeedback ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            nfseFeedback.type === "error"
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {nfseFeedback.message}
        </div>
      ) : null}

      {nfseBloqueio ? (
        <div className="rounded-xl border border-gym-warning/30 bg-gym-warning/10 px-4 py-3 text-sm text-gym-warning">
          {nfseBloqueio}
        </div>
      ) : null}

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-teal" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Recebido no mês
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">
            {formatBRL(totalRecebido)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-warning" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Em aberto
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {formatBRL(totalPendente)}
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl border border-border bg-card p-5">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gym-accent" />
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total de cobranças
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-accent">
            {filtered.length}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Importar pagamentos
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cole um CSV (ex.: backup do EVO) e execute a importação em lote.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={importFileRef}
              type="file"
              accept=".csv,.txt,text/csv"
              className="hidden"
              onChange={handleImportFileUpload}
            />
            <Button
              type="button"
              variant="outline"
              className="border-border text-xs"
              onClick={() => importFileRef.current?.click()}
            >
              Selecionar arquivo
            </Button>
            <Button
              type="button"
              className="text-xs"
              onClick={() => void handleImportarPagamentos()}
              disabled={importandoPagamentos}
            >
              {importandoPagamentos ? "Importando..." : "Importar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-border text-xs"
              onClick={() => setImportPayload("")}
            >
              Limpar
            </Button>
          </div>
        </div>
        <textarea
          value={importPayload}
          onChange={(event) => setImportPayload(event.target.value)}
          rows={9}
          className="mt-3 w-full rounded-md border border-border bg-secondary p-2 text-xs leading-5 text-foreground"
          placeholder='Nome,CPF,Descricao,Valor,Desconto,Data Vencimento,Data Pagamento,Status,Forma Pagamento,Tipo'
        />
        {(importErro || importResultado) && (
          <div
            className={`mt-3 rounded-md border px-3 py-2 text-xs ${
              importErro || (importResultado?.ignorados ?? 0) > 0
                ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
                : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
            }`}
          >
            {importErro && <p className="font-semibold">{importErro}</p>}
            {!importErro && importResultado && (
              <div className="space-y-1">
                <p>
                  Registros processados: {importResultado.total} · Importados: {importResultado.importados} · Ignorados:
                  {importResultado.ignorados}
                </p>
                {importResultado.erros.length > 0 && (
                  <ul className="list-disc pl-4">
                    {importResultado.erros.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s.value}
              onClick={() => setFiltro(s.value)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filtro === s.value
                  ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                  : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Button asChild variant="outline" className="border-border text-xs">
            <Link href="/pagamentos/emitir-em-lote">Emitir NF em lote</Link>
          </Button>
          <Select value={clienteFiltro} onValueChange={setClienteFiltro}>
            <SelectTrigger className="w-52 bg-secondary border-border text-xs">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODOS">Todos clientes</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MonthYearPicker
            month={mes}
            year={ano}
            onChange={(next) => {
              setMes(next.month);
              setAno(next.year);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Descrição
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Vencimento
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                NFS-e
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ação
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum pagamento encontrado
                </td>
              </tr>
            )}
            {filtered.map((p) => (
              <tr key={p.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{p.aluno?.nome ?? "—"}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                  {p.descricao}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {TIPO_LABEL[p.tipo] ?? p.tipo}
                </td>
                <td className="px-4 py-3">
                  <p className="font-display font-bold text-sm text-gym-accent">
                    {formatBRL(p.valorFinal)}
                  </p>
                  {p.desconto > 0 && (
                    <p className="text-xs text-muted-foreground">
                      desc. {formatBRL(p.desconto)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm">{formatDate(p.dataVencimento)}</p>
                  {p.dataPagamento && (
                    <p className="text-xs text-gym-teal">
                      Pago em {formatDate(p.dataPagamento)}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="inline-flex items-center gap-2 text-xs">
                    {p.nfseEmitida ? (
                      <button
                        type="button"
                        onClick={() => handleAbrirDetalheNfse(p)}
                        className="inline-flex items-center gap-2 rounded-md"
                        title="Detalhes da NFS-e"
                      >
                        <BadgeCheck className="size-4 text-gym-teal" />
                        <span className="font-semibold text-gym-teal">Emitida</span>
                      </button>
                    ) : nfseBloqueio ? (
                      <span
                        className="inline-flex items-center gap-2 rounded-md"
                        title={nfseBloqueio}
                      >
                        <AlertTriangle className="size-4 text-gym-danger" />
                        <span className="font-semibold text-gym-danger">Bloqueada</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setEmitindo(p)}
                        className="inline-flex items-center gap-2 rounded-md"
                        title="Emitir NFS-e"
                      >
                        <AlertTriangle className="size-4 text-gym-warning" />
                        <span className="font-semibold text-gym-warning">Pendente</span>
                      </button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                      <Button
                        size="sm"
                        onClick={() => setRecebendo(p)}
                        className="h-7 text-xs"
                      >
                        Receber
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function PagamentosPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Carregando pagamentos...</div>}>
      <PagamentosPageContent />
    </Suspense>
  );
}
