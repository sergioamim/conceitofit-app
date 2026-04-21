import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ClienteAcoesDrawer } from "@/app/(portal)/clientes/[id]/cliente-acoes-drawer";
import type { SugestaoAcao } from "@/lib/domain/sugestoes-cliente";

function makeSugestao(overrides: Partial<SugestaoAcao> = {}): SugestaoAcao {
  return {
    id: "s-1",
    tipo: "cobrar-pendencia",
    prioridade: "alta",
    titulo: "Cobrar pendência",
    descricao: "1 boleto vencido",
    cta: "Ver financeiro",
    ...overrides,
  };
}

describe("ClienteAcoesDrawer", () => {
  it("renderiza título com contagem de sugestões", () => {
    render(
      <ClienteAcoesDrawer
        open
        onOpenChange={() => {}}
        sugestoes={[makeSugestao(), makeSugestao({ id: "s-2", tipo: "renovar-plano", prioridade: "media" })]}
        onAction={() => {}}
      />
    );
    expect(screen.getByText(/2 oportunidades/i)).toBeInTheDocument();
  });

  it("renderiza singular 'oportunidade' quando só há uma sugestão", () => {
    render(
      <ClienteAcoesDrawer
        open
        onOpenChange={() => {}}
        sugestoes={[makeSugestao()]}
        onAction={() => {}}
      />
    );
    expect(screen.getByText(/1 oportunidade(?!s)/i)).toBeInTheDocument();
  });

  it("mostra estado vazio quando não há sugestões", () => {
    render(
      <ClienteAcoesDrawer
        open
        onOpenChange={() => {}}
        sugestoes={[]}
        onAction={() => {}}
      />
    );
    expect(screen.getByText(/nada a sugerir/i)).toBeInTheDocument();
  });

  it("dispara onAction e fecha o drawer ao clicar no CTA", () => {
    const onAction = vi.fn();
    const onOpenChange = vi.fn();
    const sugestao = makeSugestao({ cta: "Cobrar agora" });
    render(
      <ClienteAcoesDrawer
        open
        onOpenChange={onOpenChange}
        sugestoes={[sugestao]}
        onAction={onAction}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Cobrar agora" }));
    expect(onAction).toHaveBeenCalledWith(sugestao);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("renderiza chip de prioridade correto para cada nível", () => {
    const sugestoes: SugestaoAcao[] = [
      makeSugestao({ id: "a", prioridade: "alta", titulo: "Item Alta", cta: "X" }),
      makeSugestao({ id: "m", prioridade: "media", titulo: "Item Média", cta: "Y" }),
      makeSugestao({ id: "b", prioridade: "baixa", titulo: "Item Baixa", cta: "Z" }),
    ];
    render(
      <ClienteAcoesDrawer
        open
        onOpenChange={() => {}}
        sugestoes={sugestoes}
        onAction={() => {}}
      />
    );
    // Sheet renderiza em portal no `document.body`, então procuramos globalmente
    // pelos chips (span com classe `text-[9px]`) — não só no container do render.
    const chips = Array.from(document.body.querySelectorAll("span"))
      .filter((s) => (s as HTMLElement).className.includes("text-[9px]"))
      .map((s) => s.textContent?.trim());
    expect(chips).toContain("Alta");
    expect(chips).toContain("Média");
    expect(chips).toContain("Baixa");
  });
});
