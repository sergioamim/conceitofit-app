import { describe, expect, it } from "vitest";
import {
  COMPARABLE_FIELDS,
  computeOverrides,
  serializeValor,
} from "@/components/treinos/editor-v3/instance-overrides";
import { createTreinoV2MetricField } from "@/lib/tenant/treinos/v2-domain";
import type { TreinoV2EditorSeed } from "@/lib/tenant/treinos/v2-runtime";

/**
 * Lógica do modo "instance": comparar baseline (template original) vs
 * current (overlay editado pelo personal) e gerar lista de overrides.
 *
 * Cobre os 3 tipos: ADD (item novo), MODIFY (campo divergente),
 * REMOVE (item baseline ausente em current).
 */

function makeItem(
  overrides: Partial<TreinoV2EditorSeed["sessoes"][number]["itens"][number]> = {},
): TreinoV2EditorSeed["sessoes"][number]["itens"][number] {
  return {
    id: "item-1",
    exerciseId: "ex-1",
    exerciseNome: "Supino reto",
    ordem: 1,
    series: createTreinoV2MetricField("3"),
    repeticoes: createTreinoV2MetricField("10-12"),
    carga: createTreinoV2MetricField("60kg"),
    intervalo: createTreinoV2MetricField("60"),
    cadencia: "2-0-1",
    rir: 2,
    tecnicas: [],
    ...overrides,
  };
}

function makeSeed(
  itens: TreinoV2EditorSeed["sessoes"][number]["itens"] = [],
): TreinoV2EditorSeed {
  return {
    id: "tpl-1",
    nome: "Hipertrofia ABC",
    categoria: "Hipertrofia",
    nivel: "Intermediário",
    frequenciaSemanal: 3,
    versao: 1,
    snapshot: undefined,
    assignedStatus: "ATIVO",
    assignmentHistory: [],
    customizadoLocalmente: false,
    origem: "TEMPLATE",
    sessoes: [
      {
        id: "sessao-A",
        nome: "A",
        ordem: 1,
        itens,
      },
    ],
  } as unknown as TreinoV2EditorSeed;
}

describe("computeOverrides", () => {
  it("retorna vazio quando baseline e current são idênticos", () => {
    const item = makeItem();
    const result = computeOverrides(makeSeed([item]), makeSeed([item]));
    expect(result).toEqual([]);
  });

  it("gera MODIFY para campo divergente (carga)", () => {
    const base = makeSeed([makeItem()]);
    const cur = makeSeed([
      makeItem({ carga: createTreinoV2MetricField("70kg") }),
    ]);
    const result = computeOverrides(base, cur);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      tipo: "MODIFY",
      sessaoId: "sessao-A",
      exercicioItemId: "item-1",
      campo: "carga",
      valor: "70kg",
    });
  });

  it("gera ADD para item novo na current", () => {
    const base = makeSeed([makeItem()]);
    const cur = makeSeed([
      makeItem(),
      makeItem({ id: "item-2", exerciseId: "ex-2", exerciseNome: "Crucifixo" }),
    ]);
    const result = computeOverrides(base, cur);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      tipo: "ADD",
      sessaoId: "sessao-A",
      afterItemId: null,
      exercicio: expect.objectContaining({
        exercicioCatalogoId: "ex-2",
      }),
    });
  });

  it("gera REMOVE para item presente no baseline e ausente no current", () => {
    const base = makeSeed([
      makeItem(),
      makeItem({ id: "item-2", exerciseId: "ex-2" }),
    ]);
    const cur = makeSeed([makeItem()]);
    const result = computeOverrides(base, cur);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      tipo: "REMOVE",
      sessaoId: "sessao-A",
      exercicioItemId: "item-2",
    });
  });

  it("gera múltiplos MODIFY para vários campos divergentes", () => {
    const base = makeSeed([makeItem()]);
    const cur = makeSeed([
      makeItem({
        carga: createTreinoV2MetricField("80kg"),
        rir: 1,
        cadencia: "3-0-1",
        tecnicas: [{ type: "DROP_SET" }],
      }),
    ]);
    const result = computeOverrides(base, cur);

    const campos = result.map((r) => r.campo).sort();
    expect(campos).toEqual(["cadencia", "carga", "rir", "tecnicas"]);
    expect(result.every((r) => r.tipo === "MODIFY")).toBe(true);
  });

  it("ignora sessões que existem só na current (não há baseline pra comparar)", () => {
    const base = makeSeed([makeItem()]);
    const cur: TreinoV2EditorSeed = {
      ...makeSeed([makeItem()]),
      sessoes: [
        ...makeSeed([makeItem()]).sessoes,
        { id: "sessao-B", nome: "B", ordem: 2, itens: [makeItem({ id: "item-99" })] },
      ],
    };
    const result = computeOverrides(base, cur);
    // Só retorna overrides para sessões existentes em ambos os lados
    expect(result.every((r) => r.sessaoId === "sessao-A")).toBe(true);
  });
});

describe("serializeValor", () => {
  it("retorna null para null/undefined", () => {
    expect(serializeValor(null)).toBeNull();
    expect(serializeValor(undefined)).toBeNull();
  });

  it("preserva primitivos string e number", () => {
    expect(serializeValor("60kg")).toBe("60kg");
    expect(serializeValor(42)).toBe(42);
  });

  it("desempacota objetos com 'raw' (TreinoV2MetricField)", () => {
    expect(serializeValor({ raw: "10-12", numericValue: 10 })).toBe("10-12");
  });

  it("serializa objetos sem 'raw' como JSON", () => {
    expect(serializeValor({ a: 1 })).toBe('{"a":1}');
  });
});

describe("COMPARABLE_FIELDS", () => {
  it("contém os campos comparáveis do contrato de overrides", () => {
    expect([...COMPARABLE_FIELDS]).toEqual([
      "series",
      "repeticoes",
      "carga",
      "intervalo",
      "cadencia",
      "rir",
      "tecnicas",
      "observacoes",
    ]);
  });
});
