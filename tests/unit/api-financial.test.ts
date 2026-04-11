import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelTransactionApi,
  closeLedgerApi,
  confirmTransactionApi,
  createFinancialAccountApi,
  createFinancialTransactionApi,
  createLedgerApi,
  getBalancoPatrimonialApi,
  getFluxoCaixaApi,
  listAltaFrequenciaApi,
  listAltoValorApi,
  listFinancialAccountsApi,
  listFinancialTransactionsApi,
  listLedgerEntriesApi,
  listLedgersApi,
  listPadroesIncomunsApi,
  listTransacoesSuspeitasApi,
  reverseTransactionApi,
  updateFinancialAccountApi,
} from "@/lib/api/financial";
import * as http from "@/lib/api/http";

describe("api/financial", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("accounts", () => {
    it("listFinancialAccountsApi normaliza números", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "a1", saldoAtual: "100.5", nivel: "2" },
      ] as never);
      const result = await listFinancialAccountsApi({ tenantId: "t1" });
      expect(result[0].saldoAtual).toBe(100.5);
      expect(result[0].nivel).toBe(2);
    });

    it("listFinancialAccountsApi extrai envelope data", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        data: [{ id: "a1", saldoAtual: 100 }],
      } as never);
      const result = await listFinancialAccountsApi();
      expect(result).toHaveLength(1);
    });

    it("listFinancialAccountsApi extrai envelope rows", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        rows: [{ id: "a1" }],
      } as never);
      const result = await listFinancialAccountsApi();
      expect(result).toHaveLength(1);
    });

    it("listFinancialAccountsApi resposta não-objeto → []", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue("string" as never);
      const result = await listFinancialAccountsApi();
      expect(result).toEqual([]);
    });

    it("createFinancialAccountApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createFinancialAccountApi({
        tenantId: "t1",
        codigo: "01",
        nome: "Conta",
        tipo: "ATIVO",
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("updateFinancialAccountApi PUT", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await updateFinancialAccountApi("a1", { nome: "Edit" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/accounts/a1",
      );
      expect(spy.mock.calls[0][0].method).toBe("PUT");
    });
  });

  describe("ledgers", () => {
    it("listLedgersApi normaliza totais", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "l1", totalDebitos: "100", totalCreditos: "200" },
      ] as never);
      const result = await listLedgersApi({ tenantId: "t1" });
      expect(result[0].totalDebitos).toBe(100);
      expect(result[0].totalCreditos).toBe(200);
    });

    it("createLedgerApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createLedgerApi({
        tenantId: "t1",
        nome: "L",
        referencia: "2026-04",
        dataInicio: "2026-04-01",
        dataFim: "2026-04-30",
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("closeLedgerApi PATCH /close", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await closeLedgerApi("l1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/ledgers/l1/close",
      );
    });
  });

  describe("ledger-entries", () => {
    it("listLedgerEntriesApi sem contaId → path base", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listLedgerEntriesApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/ledger-entries",
      );
    });

    it("listLedgerEntriesApi com contaId → by-account", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listLedgerEntriesApi({ tenantId: "t1", contaId: "c1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/ledger-entries/by-account/c1",
      );
    });

    it("listLedgerEntriesApi normaliza valor", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "e1", valor: "50.5" },
      ] as never);
      const result = await listLedgerEntriesApi({ tenantId: "t1" });
      expect(result[0].valor).toBe(50.5);
    });
  });

  describe("transactions", () => {
    it("listFinancialTransactionsApi normaliza valor", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue([
        { id: "tx1", valor: "99" },
      ] as never);
      const result = await listFinancialTransactionsApi({
        tenantId: "t1",
        status: "CONFIRMED",
      });
      expect(result[0].valor).toBe(99);
    });

    it("createFinancialTransactionApi POST", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await createFinancialTransactionApi({
        tenantId: "t1",
        tipo: "RECEITA",
        descricao: "D",
        valor: 100,
        data: "2026-04-10",
      });
      expect(spy.mock.calls[0][0].method).toBe("POST");
    });

    it("confirmTransactionApi PATCH /confirm", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await confirmTransactionApi("tx1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/transactions/tx1/confirm",
      );
    });

    it("reverseTransactionApi POST /reverse", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await reverseTransactionApi("tx1", { motivo: "erro" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/transactions/tx1/reverse",
      );
      expect(spy.mock.calls[0][0].method).toBe("POST");
      expect(spy.mock.calls[0][0].body).toEqual({ motivo: "erro" });
    });

    it("cancelTransactionApi PATCH /cancel", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue({} as never);
      await cancelTransactionApi("tx1");
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/transactions/tx1/cancel",
      );
    });
  });

  describe("reports", () => {
    it("getBalancoPatrimonialApi retorna estrutura vazia (warning)", async () => {
      const warnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => undefined);
      const result = await getBalancoPatrimonialApi({ tenantId: "t1" });
      expect(result).toEqual({});
      expect(warnSpy).toHaveBeenCalled();
    });

    it("getFluxoCaixaApi extrai data do envelope", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        data: { totalEntradas: 100 },
      } as never);
      const result = await getFluxoCaixaApi({ tenantId: "t1" });
      expect(result).toEqual({ totalEntradas: 100 });
    });

    it("getFluxoCaixaApi sem envelope → passthrough", async () => {
      vi.spyOn(http, "apiRequest").mockResolvedValue({
        totalEntradas: 500,
      } as never);
      const result = await getFluxoCaixaApi();
      expect(result).toEqual({ totalEntradas: 500 });
    });
  });

  describe("monitoring", () => {
    it("listTransacoesSuspeitasApi GET", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listTransacoesSuspeitasApi({ tenantId: "t1", revisada: true });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/monitoring/suspicious-transactions",
      );
      expect(spy.mock.calls[0][0].query?.revisada).toBe("true");
    });

    it("listTransacoesSuspeitasApi revisada undefined → não envia", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listTransacoesSuspeitasApi();
      expect(spy.mock.calls[0][0].query?.revisada).toBeUndefined();
    });

    it("listPadroesIncomunsApi usa path param", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listPadroesIncomunsApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/monitoring/unusual-patterns/t1",
      );
    });

    it("listAltaFrequenciaApi usa path param", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listAltaFrequenciaApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/monitoring/high-frequency/t1",
      );
    });

    it("listAltoValorApi usa path param", async () => {
      const spy = vi.spyOn(http, "apiRequest").mockResolvedValue([] as never);
      await listAltoValorApi({ tenantId: "t1" });
      expect(spy.mock.calls[0][0].path).toBe(
        "/api/v1/financial/monitoring/high-value/t1",
      );
    });
  });
});
