import { expect, test } from "@playwright/test";
import { normalizeEvoColaboradorDiagnostico } from "../../src/backoffice/lib/importacao-evo";

function canonicalizeFile(value?: string | null): string | null {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (!normalized) return null;
  const compact = normalized.replace(/[^a-z0-9]/g, "");
  switch (compact) {
    case "funcionarioshorarios":
    case "funcionarioshorarioscsv":
      return "funcionariosHorarios";
    case "permissoes":
    case "permissoescsv":
      return "permissoes";
    default:
      return normalized;
  }
}

test.describe("normalizeEvoColaboradorDiagnostico", () => {
  test("marca bloco como naoSelecionado quando nao ha arquivos executados", () => {
    const result = normalizeEvoColaboradorDiagnostico({
      resumo: {
        total: 0,
        processadas: 0,
        criadas: 0,
        atualizadas: 0,
        rejeitadas: 0,
        arquivosSelecionados: [],
        arquivosAusentes: ["FUNCIONARIOS_HORARIOS.csv"],
      },
      canonicalizeFile,
    });

    expect(result.status).toBe("naoSelecionado");
    expect(result.arquivosSelecionados).toEqual([]);
    expect(result.arquivosAusentes).toEqual(["funcionariosHorarios"]);
  });

  test("marca bloco como semLinhas quando backend executou o bloco sem registros", () => {
    const result = normalizeEvoColaboradorDiagnostico({
      resumo: {
        total: 0,
        processadas: 0,
        criadas: 0,
        atualizadas: 0,
        rejeitadas: 0,
        arquivosSelecionados: ["FUNCIONARIOS_HORARIOS.csv"],
      },
      canonicalizeFile,
    });

    expect(result.status).toBe("semLinhas");
    expect(result.arquivosSelecionados).toEqual(["funcionariosHorarios"]);
  });

  test("marca bloco como comRejeicoes quando existem rejeicoes ou parcialidade", () => {
    const result = normalizeEvoColaboradorDiagnostico({
      resumo: {
        total: 3,
        processadas: 3,
        criadas: 0,
        atualizadas: 2,
        rejeitadas: 1,
        parcial: true,
        mensagemParcial: "Uma linha ficou pendente.",
        arquivosSelecionados: ["PERMISSOES.csv"],
      },
      canonicalizeFile,
    });

    expect(result.status).toBe("comRejeicoes");
    expect(result.arquivosSelecionados).toEqual(["permissoes"]);
  });

  test("marca bloco como sucesso quando ha linhas processadas sem rejeicoes", () => {
    const result = normalizeEvoColaboradorDiagnostico({
      resumo: {
        total: 2,
        processadas: 2,
        criadas: 1,
        atualizadas: 1,
        rejeitadas: 0,
        arquivosSelecionados: ["FUNCIONARIOS_HORARIOS.csv", "PERMISSOES.csv"],
        arquivosAusentes: [],
      },
      canonicalizeFile,
    });

    expect(result.status).toBe("sucesso");
    expect(result.arquivosSelecionados).toEqual(["funcionariosHorarios", "permissoes"]);
  });
});
