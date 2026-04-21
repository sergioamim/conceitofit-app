import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClienteRiscoCard } from "@/app/(portal)/clientes/[id]/cliente-risco-card";
import type { RiscoEvasaoInput } from "@/lib/domain/risco-evasao";
import type { Aluno } from "@/lib/shared/types";

const HOJE = new Date(2026, 3, 20);

function makeAluno(overrides: Partial<Aluno> = {}): Aluno {
  return {
    id: "a-1",
    tenantId: "t-1",
    nome: "Cliente Teste",
    email: "cli@ex.com",
    telefone: "0",
    cpf: "0",
    dataNascimento: "1990-01-01",
    sexo: "F",
    status: "ATIVO",
    dataCadastro: "2023-01-01T00:00:00",
    ...overrides,
  };
}

function baseInput(overrides: Partial<RiscoEvasaoInput> = {}): RiscoEvasaoInput {
  return {
    aluno: makeAluno(),
    suspenso: false,
    pendenteFinanceiro: false,
    planoAtivo: { dataFim: "2027-04-20" },
    pagamentos: [],
    presencas: [],
    hoje: HOJE,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOJE);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("ClienteRiscoCard", () => {
  it("mostra score e rótulo Alto quando cliente em situação crítica", () => {
    render(
      <ClienteRiscoCard
        input={baseInput({
          suspenso: true,
          aluno: makeAluno({ status: "SUSPENSO" }),
          presencas: [{ data: "2026-04-05" }],
        })}
      />
    );
    // Rótulo aparece duas vezes: chip no card + chip no SheetHeader (renderizado em portal)
    expect(screen.getAllByText("Alto").length).toBeGreaterThan(0);
  });

  it("mostra rótulo Baixo para cliente ativo com sinais positivos", () => {
    render(
      <ClienteRiscoCard
        input={baseInput({
          presencas: Array.from({ length: 12 }, (_, i) => ({
            data: `2026-04-${String(1 + i).padStart(2, "0")}`,
          })),
        })}
      />
    );
    expect(screen.getAllByText("Baixo").length).toBeGreaterThan(0);
  });

  it("exibe 'Sem dados suficientes' quando não há fatores", () => {
    render(
      <ClienteRiscoCard
        input={baseInput({
          presencas: Array.from({ length: 5 }, (_, i) => ({
            data: `2026-04-${String(10 + i).padStart(2, "0")}`,
          })),
        })}
      />
    );
    expect(screen.getByText(/sem dados suficientes/i)).toBeInTheDocument();
  });

  it("lista até 3 fatores principais no card", () => {
    const { container } = render(
      <ClienteRiscoCard
        input={baseInput({
          suspenso: true, // 50
          aluno: makeAluno({ status: "SUSPENSO" }),
          planoAtivo: { dataFim: "2026-04-10" }, // +40 vencido
          pendenteFinanceiro: true, // +20
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
          presencas: [], // +30 baixa freq
        })}
      />
    );
    // Card in-page (não SheetContent) exibe top 3. SheetContent só aparece com detail aberto.
    const principais = container.querySelector('ul');
    expect(principais).toBeTruthy();
    expect(principais?.children.length).toBeLessThanOrEqual(3);
  });

  it("abre painel de detalhes ao clicar 'Ver detalhes'", () => {
    render(
      <ClienteRiscoCard
        input={baseInput({
          pendenteFinanceiro: true,
          pagamentos: [{ status: "VENCIDO", dataVencimento: "2026-04-01", valor: 100 }],
          presencas: [{ data: "2026-04-05" }],
        })}
      />
    );
    const button = screen.getByRole("button", { name: /ver detalhes/i });
    fireEvent.click(button);
    expect(screen.getByText(/heurística determinística/i)).toBeInTheDocument();
    expect(screen.getByText(/tendência \(7 semanas\)/i)).toBeInTheDocument();
  });
});
