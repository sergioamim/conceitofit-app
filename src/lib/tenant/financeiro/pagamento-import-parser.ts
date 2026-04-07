/**
 * CSV parser e normalizadores para importação de pagamentos em lote.
 *
 * Extraído de pagamentos-client.tsx (Task 466) para arquivo reutilizável e testável.
 */

import type { Pagamento, TipoFormaPagamento } from "@/lib/types";
import type { PagamentoImportItem } from "@/lib/tenant/financeiro/recebimentos";

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

/**
 * Parse raw CSV string into PagamentoImportItem[].
 */
export function parseImportPayload(raw: string): PagamentoImportItem[] {
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
