/**
 * Biblioteca de visualização financeira — primitivas e cards usados
 * pelas telas de Contas a Pagar/Receber (F2 redesign 2026-04-23).
 */

export { Sparkline } from "./sparkline";
export type { SparklineProps } from "./sparkline";

export { Donut } from "./donut";
export type { DonutProps, DonutSegment } from "./donut";

export { BarChart } from "./bar-chart";
export type { BarChartProps, BarItem } from "./bar-chart";

export { StatusContaPill } from "./status-conta-pill";
export type { StatusContaPillProps } from "./status-conta-pill";

export { TimelineVencimentos } from "./timeline-vencimentos";
export type { TimelineConta, TimelineVencimentosProps } from "./timeline-vencimentos";

export { CategoriaBreakdown } from "./categoria-breakdown";
export type {
  CategoriaBreakdownConta,
  CategoriaBreakdownProps,
} from "./categoria-breakdown";

export { PrevisaoMini } from "./previsao-mini";
export type { PrevisaoConta, PrevisaoMiniProps } from "./previsao-mini";
