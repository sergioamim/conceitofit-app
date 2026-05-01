import { useQuery } from "@tanstack/react-query";
import { listarAcessosCatracaDashboardApi, type CatracaAcesso } from "@/lib/api/catraca";
import { queryKeys } from "./keys";

/** Série por horário (índice 0 = hora 1 … 23 = hora 24). */
export type AcessosDiaPorHora = {
  entradasPorHora: number[];
  clientesUnicosPorHora: number[];
  /** Média móvel (3 barras vizinhas) sobre entradas. */
  mediaMovelPorHora: number[];
  amostragemTruncada?: boolean;
  totalLinhasConsumidas: number;
};

export function hourlyBucketFromOccurredAt(iso: string | undefined, diaISO: string): number | null {
  if (!iso?.trim() || !diaISO?.trim()) return null;
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;

  const [yyS, mmS, ddS] = diaISO.trim().split("-");
  const yy = Number(yyS);
  const mm = Number(mmS);
  const dd = Number(ddS);
  if (!yy || !mm || !dd) return null;

  if (d.getFullYear() !== yy || d.getMonth() + 1 !== mm || d.getDate() !== dd) {
    return null;
  }

  return d.getHours();
}

function rollingAverage3(series: readonly number[]): number[] {
  return series.map((_, h) => {
    const prev = series[Math.max(0, h - 1)] ?? 0;
    const cur = series[h] ?? 0;
    const next = series[Math.min(series.length - 1, h + 1)] ?? 0;
    return Math.round(((prev + cur + next) / 3) * 100) / 100;
  });
}

function aggregateLinhasPorHora(items: CatracaAcesso[], diaISO: string) {
  const entradas = Array.from({ length: 24 }, () => 0);
  const memberSets = Array.from({ length: 24 }, () => new Set<string>());

  for (const a of items) {
    const hh = hourlyBucketFromOccurredAt(a.occurredAt ?? a.createdAt, diaISO);
    if (hh === null) continue;

    entradas[hh] += 1;
    const owner = [a.memberId, a.memberDocumento, a.memberNome].filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
    const key =
      owner[0]?.trim()
      ?? (owner[2] ?? owner[1] ?? "").trim()
      ?? String(a.raw?.signature ?? "").trim();
    if (key) memberSets[hh]!.add(key);
  }

  const clientesUnicos = memberSets.map((s) => s.size);
  return { entradas, clientesUnicos };
}

async function paginarTodosAcessosDia(opts: {
  tenantId: string;
  diaISO: string;
  maxPaginas?: number;
}): Promise<{ itens: CatracaAcesso[]; truncado?: boolean }> {
  const maxPaginas = Math.min(48, Math.max(1, opts.maxPaginas ?? 24));
  const out: CatracaAcesso[] = [];
  for (let page = 0; page < maxPaginas; page += 1) {
    const r = await listarAcessosCatracaDashboardApi({
      tenantId: opts.tenantId,
      startDate: opts.diaISO,
      endDate: opts.diaISO,
      page,
      size: 200,
    });
    out.push(...r.items);
    if (!r.hasNext) return { itens: out };
  }
  return { itens: out, truncado: true };
}

export function useCockpitAcessosDiaPorHora(input: {
  tenantId?: string | null;
  enabled: boolean;
  diaISO: string;
}) {
  return useQuery({
    queryKey: queryKeys.cockpit.acessosPorHoraDia(input.tenantId ?? "", input.diaISO),
    queryFn: async (): Promise<AcessosDiaPorHora> => {
      const tenantId = input.tenantId!;
      const { itens, truncado } = await paginarTodosAcessosDia({ tenantId, diaISO: input.diaISO });
      const { entradas, clientesUnicos } = aggregateLinhasPorHora(itens, input.diaISO);
      const mediaMovelPorHora = rollingAverage3(entradas);
      return {
        entradasPorHora: entradas,
        clientesUnicosPorHora: clientesUnicos,
        mediaMovelPorHora,
        amostragemTruncada: Boolean(truncado),
        totalLinhasConsumidas: itens.length,
      };
    },
    enabled: Boolean(input.tenantId) && Boolean(input.diaISO) && input.enabled,
    staleTime: 120_000,
  });
}
