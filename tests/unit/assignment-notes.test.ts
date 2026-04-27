import { describe, expect, it } from "vitest";
import {
  parseAssignmentNotes,
  serializeAssignmentNotes,
} from "../../src/lib/tenant/treinos/assignment-notes";

describe("assignment-notes parser", () => {
  it("retorna estado vazio quando entrada é nula ou vazia", () => {
    expect(parseAssignmentNotes(undefined)).toEqual({
      objetivoIndividual: "",
      restricoes: "",
      notasProfessor: "",
    });
    expect(parseAssignmentNotes("")).toEqual({
      objetivoIndividual: "",
      restricoes: "",
      notasProfessor: "",
    });
    expect(parseAssignmentNotes("   ")).toEqual({
      objetivoIndividual: "",
      restricoes: "",
      notasProfessor: "",
    });
  });

  it("trata texto livre antigo como notasProfessor (compat)", () => {
    const parsed = parseAssignmentNotes("Treinou bem na semana passada, manter cargas.");
    expect(parsed.objetivoIndividual).toBe("");
    expect(parsed.restricoes).toBe("");
    expect(parsed.notasProfessor).toBe("Treinou bem na semana passada, manter cargas.");
  });

  it("extrai os 3 sub-campos quando markdown estruturado", () => {
    const raw = [
      "## Objetivo",
      "Perder 5kg em 8 semanas",
      "",
      "## Restrições",
      "Lesão no joelho direito",
      "",
      "## Notas do professor",
      "Cargas leves nas 2 primeiras semanas",
    ].join("\n");

    const parsed = parseAssignmentNotes(raw);
    expect(parsed.objetivoIndividual).toBe("Perder 5kg em 8 semanas");
    expect(parsed.restricoes).toBe("Lesão no joelho direito");
    expect(parsed.notasProfessor).toBe("Cargas leves nas 2 primeiras semanas");
  });

  it("preserva preâmbulo (texto antes do primeiro header) em notasProfessor", () => {
    const raw = "Anotação rápida\n\n## Objetivo\nGanhar massa";
    const parsed = parseAssignmentNotes(raw);
    expect(parsed.objetivoIndividual).toBe("Ganhar massa");
    // O preâmbulo precede notas — vai pra notasProfessor que estava vazio.
    expect(parsed.notasProfessor).toBe("Anotação rápida");
  });

  it("aceita ordem arbitrária dos headers", () => {
    const raw = [
      "## Notas do professor",
      "Inversão de ordem",
      "",
      "## Objetivo",
      "Reabilitação pós-cirurgia",
    ].join("\n");
    const parsed = parseAssignmentNotes(raw);
    expect(parsed.objetivoIndividual).toBe("Reabilitação pós-cirurgia");
    expect(parsed.notasProfessor).toBe("Inversão de ordem");
  });
});

describe("assignment-notes serializer", () => {
  it("retorna string vazia quando todos os campos vazios", () => {
    expect(
      serializeAssignmentNotes({
        objetivoIndividual: "",
        restricoes: "",
        notasProfessor: "",
      }),
    ).toBe("");
  });

  it("emite só os campos preenchidos, na ordem canônica", () => {
    const out = serializeAssignmentNotes({
      objetivoIndividual: "Perder peso",
      restricoes: "",
      notasProfessor: "Iniciante",
    });
    expect(out).toBe("## Objetivo\nPerder peso\n\n## Notas do professor\nIniciante");
  });

  it("roundtrip: parse(serialize(x)) === x quando sem preâmbulo", () => {
    const input = {
      objetivoIndividual: "Hipertrofia coxas",
      restricoes: "Sem agachamento profundo",
      notasProfessor: "Foco em volume nas pernas",
    };
    const roundtripped = parseAssignmentNotes(serializeAssignmentNotes(input));
    expect(roundtripped).toEqual(input);
  });
});
