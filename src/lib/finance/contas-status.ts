/**
 * Helpers puros para a visualização de Contas a Pagar / Receber (F2 — redesign
 * financeiro 2026-04-23). Todas as funções recebem `today` como parâmetro
 * (string ISO `YYYY-MM-DD`) para garantir hydration safety — nunca chamam
 * `new Date()` implicitamente no render.
 */

export type StatusContaVisual =
  | "pago"
  | "vencido"
  | "hoje"
  | "proximo"
  | "agendado";

/**
 * Diferença em dias (inteiros) entre `iso` e `today`.
 * Positivo = futuro; negativo = passado.
 *
 * Ambas as datas são ancoradas em 12:00 UTC para evitar deslocamentos
 * causados por DST ou diferenças de timezone ao converter ISO → Date.
 */
export function diasPara(iso: string, today: string): number {
  const a = new Date(today + "T12:00:00Z").getTime();
  const b = new Date(iso + "T12:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export interface ContaComStatusInput {
  /** Status backend: PAGA/RECEBIDA, PENDENTE, VENCIDA, CANCELADA. */
  status: string;
  /** Data de vencimento (ISO `YYYY-MM-DD`). */
  dataVencimento: string;
}

/**
 * Classifica a conta em um dos 5 estados visuais do design. Regra de
 * prioridade:
 *   1. status backend PAGA/RECEBIDA/CANCELADA → mapeia direto.
 *   2. vencimento no passado → vencido.
 *   3. vencimento hoje → hoje.
 *   4. vencimento em 1-3 dias → proximo.
 *   5. caso contrário → agendado.
 *
 * "Próximo" cobre os próximos 3 dias inclusive — match com o protótipo
 * do design (data.jsx linha 97).
 */
export function statusContaDe(
  conta: ContaComStatusInput,
  today: string,
): StatusContaVisual {
  const s = conta.status?.toUpperCase();
  if (s === "PAGA" || s === "PAGO" || s === "RECEBIDA") return "pago";
  if (s === "CANCELADA") return "agendado"; // canceladas não caem em vencido/hoje
  const d = diasPara(conta.dataVencimento, today);
  if (d < 0) return "vencido";
  if (d === 0) return "hoje";
  if (d <= 3) return "proximo";
  return "agendado";
}

/** Categoria financeira com cor estável (alinhada ao design). */
export interface CategoriaDef<Id extends string = string> {
  id: Id;
  nome: string;
  color: string;
}

/**
 * Categorias de contas a pagar — mapeadas 1:1 com `CategoriaContaPagar`
 * no backend (`modulo-financeiro`). Cores extraídas do design handoff.
 */
export const CATEGORIAS_PAGAR: CategoriaDef[] = [
  { id: "ALUGUEL", nome: "Aluguel", color: "#7c5cbf" },
  { id: "UTILIDADES", nome: "Energia/Água", color: "#e09020" },
  { id: "FOLHA", nome: "Folha de pagamento", color: "#1ea06a" },
  { id: "EQUIPAMENTOS", nome: "Equipamentos", color: "#6b8c1a" },
  { id: "MARKETING", nome: "Marketing", color: "#dc3545" },
  { id: "FORNECEDORES", nome: "Fornecedores", color: "#2c7ab0" },
  { id: "IMPOSTOS", nome: "Impostos", color: "#16181c" },
  { id: "MANUTENCAO", nome: "Manutenção", color: "#a78bfa" },
  { id: "OUTROS", nome: "Outros", color: "#64697a" },
];

/**
 * Categorias de contas a receber — mapeadas com `CategoriaContaReceberApi`
 * no backend. Aulas/personal/suplementos/diaria do design são cobertas
 * via `SERVICO` e `PRODUTO` no modelo atual — variação visual fica no FE.
 */
export const CATEGORIAS_RECEBER: CategoriaDef[] = [
  { id: "MENSALIDADE", nome: "Mensalidades", color: "#1ea06a" },
  { id: "MATRICULA", nome: "Matrículas", color: "#6b8c1a" },
  { id: "SERVICO", nome: "Serviços/Personal", color: "#7c5cbf" },
  { id: "PRODUTO", nome: "Produtos/Suplementos", color: "#e09020" },
  { id: "AVULSO", nome: "Avulsos", color: "#2c7ab0" },
];

/** Lookup helper — evita repetir `find` em callers. */
export function findCategoria(
  defs: CategoriaDef[],
  id: string,
): CategoriaDef | undefined {
  return defs.find((c) => c.id === id);
}
