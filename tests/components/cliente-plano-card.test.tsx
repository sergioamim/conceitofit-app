import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClientePlanoCard } from "@/app/(portal)/clientes/[id]/cliente-plano-card";

const HOJE = new Date(2026, 3, 20); // 2026-04-20

describe("ClientePlanoCard", () => {
  describe("sem plano ativo", () => {
    // Nota (2026-04-23): o CTA "Nova contratação" inline no card foi
    // removido com o refactor que moveu "Nova Venda" pro header/topbar
    // (commit 0be7df5). O card agora só exibe a mensagem de status; a
    // ação de venda vive no header via `onNovaVenda`.
    it("exibe mensagem de estado vazio e nao renderiza botao inline", () => {
      const onRenovar = vi.fn();
      render(<ClientePlanoCard planoAtivo={null} hoje={HOJE} onRenovar={onRenovar} />);
      expect(screen.getByText(/sem contrato ativo/i)).toBeInTheDocument();
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(onRenovar).not.toHaveBeenCalled();
    });

    it("omite CTA quando onRenovar não é provido", () => {
      render(<ClientePlanoCard planoAtivo={null} hoje={HOJE} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  describe("countdown de vencimento", () => {
    it("mostra dias restantes com tom positivo quando > 14 dias", () => {
      const { container } = render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-05-20" }}
          planoAtivoInfo={{ id: "p1", nome: "Anual Black" } as never}
          hoje={HOJE}
        />
      );
      expect(screen.getByText("30")).toBeInTheDocument();
      expect(screen.getByText(/dias restantes/i)).toBeInTheDocument();
      expect(screen.getByText("Anual Black")).toBeInTheDocument();
      // Cor verde (gym-teal) aplicada
      const countdownSpan = container.querySelector(".text-gym-teal");
      expect(countdownSpan).toBeTruthy();
    });

    it("usa tom de atenção quando vence em ≤ 14 dias", () => {
      const { container } = render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-04-30" }}
          hoje={HOJE}
        />
      );
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(container.querySelector(".text-gym-warning")).toBeTruthy();
    });

    it("mostra 'vence hoje' quando dataFim é hoje", () => {
      render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-04-20" }}
          hoje={HOJE}
        />
      );
      expect(screen.getByText(/vence hoje/i)).toBeInTheDocument();
    });

    it("usa tom crítico e mensagem 'vencido' quando plano venceu", () => {
      const { container } = render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-04-10" }}
          hoje={HOJE}
        />
      );
      expect(screen.getByText("10")).toBeInTheDocument();
      expect(screen.getByText(/dias vencido/i)).toBeInTheDocument();
      expect(container.querySelector(".text-gym-danger")).toBeTruthy();
    });
  });

  describe("próxima cobrança", () => {
    it("renderiza data + valor quando há cobrança recorrente", () => {
      render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-06-20" }}
          recorrente={{
            data: "2026-05-15",
            plano: { nome: "Mensal" },
            valor: 159.9,
          }}
          hoje={HOJE}
        />
      );
      expect(screen.getByText(/próxima cobrança/i)).toBeInTheDocument();
      expect(screen.getByText(/R\$\s?159,90/)).toBeInTheDocument();
    });

    it("omite bloco de próxima cobrança quando recorrente é null", () => {
      render(<ClientePlanoCard planoAtivo={{ dataFim: "2026-06-20" }} hoje={HOJE} />);
      expect(screen.queryByText(/próxima cobrança/i)).not.toBeInTheDocument();
    });
  });

  describe("ações Renovar/Pausar", () => {
    it("dispara onRenovar ao clicar em 'Renovar'", () => {
      const onRenovar = vi.fn();
      render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-06-20" }}
          onRenovar={onRenovar}
          hoje={HOJE}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /^renovar$/i }));
      expect(onRenovar).toHaveBeenCalled();
    });

    it("dispara onPausar ao clicar em 'Pausar'", () => {
      const onPausar = vi.fn();
      render(
        <ClientePlanoCard
          planoAtivo={{ dataFim: "2026-06-20" }}
          onPausar={onPausar}
          hoje={HOJE}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /^pausar$/i }));
      expect(onPausar).toHaveBeenCalled();
    });
  });
});
