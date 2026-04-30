/**
 * Helpers de override para o modo "instance" do TreinoV3Editor.
 *
 * Quando o personal customiza um template para um aluno específico, o
 * backend persiste só o delta (overrides) em vez de duplicar a
 * estrutura inteira. Estas funções comparam baseline vs current e
 * geram a lista de operações ADD/MODIFY/REMOVE.
 *
 * Lógica crítica de negócio — candidato prioritário a teste unitário.
 */

import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";
import type { InstanciaOverride } from "@/lib/api/treino-instancia";

type SessaoItem = TreinoV2EditorSeed["sessoes"][number]["itens"][number];

export const COMPARABLE_FIELDS = [
  "series",
  "repeticoes",
  "carga",
  "intervalo",
  "cadencia",
  "rir",
  "tecnicas",
  "observacoes",
] as const;

export type ComparableField = (typeof COMPARABLE_FIELDS)[number];

/**
 * Gera o array de overrides comparando current vs baseline.
 * - Campo divergente → MODIFY
 * - Item só no current → ADD
 * - Item só no baseline → REMOVE
 */
export function computeOverrides(
  base: TreinoV2EditorSeed,
  cur: TreinoV2EditorSeed,
): InstanciaOverride[] {
  const out: InstanciaOverride[] = [];
  for (const sCur of cur.sessoes) {
    const sBase = base.sessoes.find((b) => b.id === sCur.id);
    if (!sBase) continue;
    const baseItensById = new Map<string, SessaoItem>(
      sBase.itens.map((i) => [i.id, i]),
    );
    const curItensById = new Map<string, SessaoItem>(
      sCur.itens.map((i) => [i.id, i]),
    );
    for (const itCur of sCur.itens) {
      const itBase = baseItensById.get(itCur.id);
      if (!itBase) {
        out.push({
          tipo: "ADD",
          sessaoId: sCur.id,
          afterItemId: null,
          exercicio: itCur.exerciseId
            ? {
                exercicioCatalogoId: itCur.exerciseId,
                series: itCur.series?.numericValue,
                reps: itCur.repeticoes?.raw,
                carga: itCur.carga?.raw,
                intervalo: itCur.intervalo?.raw,
                cadencia: itCur.cadencia,
                rir: itCur.rir,
              }
            : undefined,
        });
        continue;
      }
      for (const f of COMPARABLE_FIELDS) {
        if (JSON.stringify(itCur[f] ?? null) !== JSON.stringify(itBase[f] ?? null)) {
          out.push({
            tipo: "MODIFY",
            sessaoId: sCur.id,
            exercicioItemId: itCur.id,
            campo: f,
            valor: serializeValor(itCur[f]),
          });
        }
      }
    }
    for (const itBase of sBase.itens) {
      if (!curItensById.has(itBase.id)) {
        out.push({ tipo: "REMOVE", sessaoId: sCur.id, exercicioItemId: itBase.id });
      }
    }
  }
  return out;
}

export function serializeValor(value: unknown): string | number | null {
  if (value == null) return null;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "object" && value && "raw" in value) {
    return (value as { raw: string }).raw;
  }
  return JSON.stringify(value);
}
