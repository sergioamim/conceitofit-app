import { describe, it, expect, vi } from "vitest";
import { parseImportPayload } from "@/lib/tenant/financeiro/pagamento-import-parser";

describe("pagamento-import-parser", () => {
  it("parse CSV válido com separador vírgula", () => {
    const csv = `Nome,CPF,Descricao,Valor,Desconto,Data Vencimento,Data Pagamento,Status,Forma Pagamento,Tipo
Maria Souza,12345678901,Mensalidade Janeiro,199.90,10,2026-01-10,2026-01-10,PAGO,PIX,MENSALIDADE`;

    const result = parseImportPayload(csv);

    expect(result).toHaveLength(1);
    expect(result[0].clienteNome).toBe("Maria Souza");
    expect(result[0].documentoCliente).toBe("12345678901");
    expect(result[0].descricao).toBe("Mensalidade Janeiro");
    expect(result[0].valor).toBeCloseTo(199.9);
    expect(result[0].desconto).toBeCloseTo(10);
    expect(result[0].status).toBe("PAGO");
    expect(result[0].formaPagamento).toBe("PIX");
    expect(result[0].tipo).toBe("MENSALIDADE");
  });

  it("parse CSV com separador ponto e vírgula", () => {
    const csv = `Nome;CPF;Descricao;Valor;Data Vencimento;Status
João Alves;98765432100;Taxa;80;15/02/2026;PENDENTE`;

    const result = parseImportPayload(csv);

    expect(result).toHaveLength(1);
    expect(result[0].descricao).toBe("Taxa");
    expect(result[0].valor).toBeCloseTo(80);
  });

  it("lança erro quando header não é reconhecido", () => {
    const csv = `ColunaA,ColunaB,ColunaC
valor1,valor2,valor3`;

    expect(() => parseImportPayload(csv)).toThrow(
      /cabeçalho CSV reconhecido/,
    );
  });

  it("lança erro quando valor é negativo", () => {
    const csv = `Nome,CPF,Descricao,Valor,Data Vencimento,Status
Maria,123,Mensalidade,-50,2026-01-10,PENDENTE`;

    expect(() => parseImportPayload(csv)).toThrow(/inválido/);
  });

  it("retorna array vazio para input vazio", () => {
    expect(parseImportPayload("")).toEqual([]);
    expect(parseImportPayload("   ")).toEqual([]);
  });
});
