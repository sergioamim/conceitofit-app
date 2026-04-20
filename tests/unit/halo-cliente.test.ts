import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  getClienteHaloStatus,
  getHaloRingClass,
  type HaloStatus,
} from "@/lib/domain/status-helpers";
import type { Aluno } from "@/lib/shared/types";

const HOJE = new Date(2026, 3, 20); // 2026-04-20 local

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOJE);
});

afterEach(() => {
  vi.useRealTimers();
});

function makeAluno(overrides: Partial<Aluno> = {}): Aluno {
  return {
    id: "a-1",
    tenantId: "t-1",
    nome: "X",
    email: "x@x.com",
    telefone: "0",
    cpf: "0",
    dataNascimento: "1990-01-01",
    sexo: "F",
    status: "ATIVO",
    dataCadastro: "2023-01-01T00:00:00",
    ...overrides,
  };
}

describe("getClienteHaloStatus", () => {
  it("INATIVO → neutro mesmo com pendência", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno({ status: "INATIVO" }),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: true,
        planoAtivo: null,
      })
    ).toBe("neutro");
  });

  it("CANCELADO → neutro", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno({ status: "CANCELADO" }),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2027-01-01" },
      })
    ).toBe("neutro");
  });

  it("SUSPENSO → critico", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno({ status: "SUSPENSO" }),
        suspenso: true,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2027-04-20" },
      })
    ).toBe("critico");
  });

  it("ATIVO com acesso bloqueado → critico", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: true,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2027-04-20" },
      })
    ).toBe("critico");
  });

  it("ATIVO com pendência financeira → critico", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: true,
        planoAtivo: { dataFim: "2027-04-20" },
      })
    ).toBe("critico");
  });

  it("ATIVO sem contrato → atencao", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: null,
      })
    ).toBe("atencao");
  });

  it("ATIVO com contrato vencido → critico", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2026-04-10" }, // 10 dias atrás
      })
    ).toBe("critico");
  });

  it("ATIVO com contrato vencendo em 14 dias → atencao", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2026-05-04" }, // 14 dias
      })
    ).toBe("atencao");
  });

  it("ATIVO com contrato vencendo em 15 dias → ativo", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2026-05-05" }, // 15 dias
      })
    ).toBe("ativo");
  });

  it("ATIVO pleno → ativo", () => {
    expect(
      getClienteHaloStatus({
        aluno: makeAluno(),
        suspenso: false,
        acessoBloqueado: false,
        pendenteFinanceiro: false,
        planoAtivo: { dataFim: "2027-04-20" },
      })
    ).toBe("ativo");
  });
});

describe("getHaloRingClass", () => {
  it.each<[HaloStatus, string]>([
    ["ativo", "ring-gym-teal/70"],
    ["atencao", "ring-gym-warning/70"],
    ["critico", "ring-gym-danger/70"],
    ["neutro", "ring-border"],
  ])("%s → %s", (status, expected) => {
    expect(getHaloRingClass(status)).toBe(expected);
  });
});
