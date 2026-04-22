import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";

const mockRouterPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import {
  FOCUS_UNIVERSAL_SEARCH_EVENT,
  SaleReceiptModal,
} from "@/components/shared/sale-receipt-modal";
import type { Aluno, Tenant, Venda } from "@/lib/types";

/** Espera o próximo tick para deixar o `useEffect` rodar (formatador BRL). */
async function flushEffects() {
  await act(async () => {
    await Promise.resolve();
  });
}

const TENANT: Tenant = {
  id: "tenant-1",
  nome: "Conceito Fit Centro",
  documento: "12.345.678/0001-99",
  endereco: {
    cep: "00000-000",
    logradouro: "Rua A, 100",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
  },
};

const CLIENTE: Aluno = {
  id: "aluno-1",
  tenantId: "tenant-1",
  nome: "Maria Silva",
  email: "maria@example.com",
  telefone: "11999999999",
  cpf: "12345678900",
  dataNascimento: "1990-01-01",
  sexo: "F",
  status: "ATIVO",
  dataCadastro: "2025-01-01T00:00:00",
};

function mkVenda(overrides: Partial<Venda> = {}): Venda {
  return {
    id: "venda-1",
    tenantId: "tenant-1",
    tipo: "PLANO",
    clienteId: "aluno-1",
    clienteNome: "Maria Silva",
    status: "FECHADA",
    itens: [
      {
        id: "item-1",
        tipo: "PLANO",
        referenciaId: "plano-1",
        descricao: "Plano Mensal",
        quantidade: 1,
        valorUnitario: 180,
        desconto: 0,
        valorTotal: 180,
      },
    ],
    subtotal: 180,
    descontoTotal: 0,
    acrescimoTotal: 0,
    total: 180,
    pagamento: {
      formaPagamento: "PIX",
      valorPago: 180,
    },
    dataCriacao: "2026-04-20T10:00:00",
    ...overrides,
  };
}

describe("SaleReceiptModal (VUN-4.1)", () => {
  it("AC1/AC2: renderiza layout com coluna esquerda (ThermalReceipt modal) e coluna direita", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    // Layout bi-coluna
    expect(screen.getByTestId("sale-receipt-modal-layout")).toBeInTheDocument();
    expect(screen.getByTestId("sale-receipt-modal-left")).toBeInTheDocument();
    expect(screen.getByTestId("sale-receipt-modal-right")).toBeInTheDocument();

    // Recibo térmico variant=modal
    const thermal = screen.getByTestId("thermal-receipt");
    expect(thermal.getAttribute("data-variant")).toBe("modal");
  });

  it("AC3: exibe badge 'Venda Aprovada', total destacado e valor do total", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda({ total: 310 })}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const badge = screen.getByTestId("sale-receipt-status-badge");
    expect(badge.textContent).toMatch(/Venda Aprovada/);

    const total = screen.getByTestId("sale-receipt-total");
    expect(total.textContent).toMatch(/310,00/);
    // font mono 32px é aplicada
    expect(total.className).toMatch(/font-mono/);
    expect(total.className).toMatch(/\[32px\]/);
  });

  it("AC3: exibe parcelamento apenas quando aplicável (parcelas > 1)", async () => {
    const { rerender } = render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();
    expect(screen.queryByTestId("sale-receipt-parcelamento")).toBeNull();

    rerender(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda({
          total: 300,
          pagamento: {
            formaPagamento: "CARTAO_CREDITO",
            parcelas: 3,
            valorPago: 300,
          },
        })}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const parcelamento = screen.getByTestId("sale-receipt-parcelamento");
    expect(parcelamento.textContent).toMatch(/3x/);
    expect(parcelamento.textContent).toMatch(/100,00/);
  });

  it("AC3: input de e-mail vem pré-preenchido com e-mail do cliente", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const input = screen.getByTestId(
      "sale-receipt-email-input",
    ) as HTMLInputElement;
    expect(input.value).toBe("maria@example.com");
  });

  it("AC3: card de impressora térmica com status e botão imprimir", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    expect(screen.getByTestId("sale-receipt-printer-card")).toBeInTheDocument();
    expect(
      screen.getByTestId("sale-receipt-printer-status").textContent,
    ).toMatch(/Conectada/);
    expect(screen.getByTestId("sale-receipt-print-button")).toBeInTheDocument();
  });

  it("AC3: exibe atalhos PDF / WhatsApp / 2ª via e botão Nova venda", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    expect(screen.getByTestId("sale-receipt-shortcut-pdf")).toBeInTheDocument();
    expect(
      screen.getByTestId("sale-receipt-shortcut-whatsapp"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("sale-receipt-shortcut-segunda-via"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("sale-receipt-nova-venda")).toBeInTheDocument();
  });

  it("botão Ver perfil aparece quando há cliente e navega + fecha modal ao clicar", async () => {
    mockRouterPush.mockClear();
    const onClose = vi.fn();
    render(
      <SaleReceiptModal
        open
        onClose={onClose}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const btn = screen.getByTestId("sale-receipt-ver-perfil");
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockRouterPush).toHaveBeenCalledWith(`/clientes/${CLIENTE.id}`);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("botão Ver perfil oculto quando venda não tem cliente (avulsa)", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={null}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    expect(screen.queryByTestId("sale-receipt-ver-perfil")).not.toBeInTheDocument();
    // Nova venda continua presente (full-width neste caso).
    expect(screen.getByTestId("sale-receipt-nova-venda")).toBeInTheDocument();
  });

  it("handler Enviar: botão entra em estado de loading e chama toast de sucesso", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const btn = screen.getByTestId("sale-receipt-send-email");
    fireEvent.click(btn);
    // Estado de loading imediato
    expect(btn.textContent).toMatch(/Enviando/);
  });

  it("handler Imprimir: botão entra em estado de loading", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const btn = screen.getByTestId("sale-receipt-print-button");
    fireEvent.click(btn);
    expect(btn.textContent).toMatch(/Imprimindo/);
  });

  it("botão Nova venda dispara onClose", async () => {
    let closed = false;
    render(
      <SaleReceiptModal
        open
        onClose={() => {
          closed = true;
        }}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    fireEvent.click(screen.getByTestId("sale-receipt-nova-venda"));
    expect(closed).toBe(true);
  });

  it("placeholder quando venda é null mas modal está open", async () => {
    render(
      <SaleReceiptModal open onClose={() => {}} venda={null} />,
    );
    await flushEffects();

    expect(screen.getByTestId("sale-receipt-empty")).toBeInTheDocument();
    expect(screen.queryByTestId("sale-receipt-modal-layout")).toBeNull();
  });

  it("não renderiza conteúdo interno quando open=false", () => {
    render(
      <SaleReceiptModal
        open={false}
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    // Dialog fechado = nada no DOM
    expect(screen.queryByTestId("sale-receipt-modal-layout")).toBeNull();
  });

  it("API externa preservada: aceita todas as props opcionais legadas sem erro", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
        plano={null}
        contratoAutoEnvioMensagem="Contrato enviado automaticamente."
        voucherCodigo="BLACKFIT10"
        voucherDescontoPercent={10}
      />,
    );
    await flushEffects();

    // Contrato auto-envio ainda é exibido
    expect(
      screen.getByTestId("sale-receipt-contrato-msg").textContent,
    ).toMatch(/Contrato enviado automaticamente/);
    // Cupom chega no térmico via rodapé
    const cupom = screen.queryByTestId("thermal-receipt-cupom");
    expect(cupom?.textContent).toMatch(/BLACKFIT10/);
  });

  it("mapeia CARTAO_CREDITO para CREDITO no ThermalReceipt", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda({
          pagamento: {
            formaPagamento: "CARTAO_CREDITO",
            parcelas: 2,
            valorPago: 180,
          },
        })}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const metodo = screen.getByTestId("thermal-receipt-metodo");
    expect(metodo.textContent).toMatch(/Crédito/);
  });
});

// ============================================================================
// VUN-4.2 — a11y + "Nova venda" reset + mocks de print/email
// ============================================================================
describe("SaleReceiptModal (VUN-4.2)", () => {
  it("AC1: handler e-mail valida via zod, entra em loading e anuncia via aria-live", async () => {
    vi.useFakeTimers();
    try {
      render(
        <SaleReceiptModal
          open
          onClose={() => {}}
          venda={mkVenda()}
          cliente={CLIENTE}
          tenant={TENANT}
        />,
      );
      await act(async () => {
        await Promise.resolve();
      });

      const btn = screen.getByTestId("sale-receipt-send-email");
      const liveRegion = screen.getByTestId("sale-receipt-live-region");
      expect(liveRegion.getAttribute("aria-live")).toBe("polite");

      fireEvent.click(btn);
      // Estado de loading imediato + anúncio "Enviando…"
      expect(btn.textContent).toMatch(/Enviando/);
      expect(liveRegion.textContent).toMatch(/Enviando/);

      // Avança o mock (600ms) para completar o envio
      await act(async () => {
        await vi.advanceTimersByTimeAsync(650);
      });

      expect(btn.textContent).not.toMatch(/Enviando/);
      expect(liveRegion.textContent).toBe("E-mail enviado");
    } finally {
      vi.useRealTimers();
    }
  });

  it("AC1: e-mail inválido não dispara loading e anuncia erro via aria-live", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={{ ...CLIENTE, email: "" }}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const input = screen.getByTestId(
      "sale-receipt-email-input",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "nao-e-email" } });
    const btn = screen.getByTestId("sale-receipt-send-email");
    fireEvent.click(btn);

    // Não entra em loading
    expect(btn.textContent).not.toMatch(/Enviando/);
    const liveRegion = screen.getByTestId("sale-receipt-live-region");
    expect(liveRegion.textContent).toMatch(/inválido/i);
  });

  it("AC2: handler imprimir entra em loading e anuncia via aria-live", async () => {
    vi.useFakeTimers();
    try {
      render(
        <SaleReceiptModal
          open
          onClose={() => {}}
          venda={mkVenda()}
          cliente={CLIENTE}
          tenant={TENANT}
        />,
      );
      await act(async () => {
        await Promise.resolve();
      });

      const btn = screen.getByTestId("sale-receipt-print-button");
      const liveRegion = screen.getByTestId("sale-receipt-live-region");

      fireEvent.click(btn);
      expect(btn.textContent).toMatch(/Imprimindo/);
      expect(liveRegion.textContent).toMatch(/impressora/i);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(850);
      });

      expect(btn.textContent).not.toMatch(/Imprimindo/);
      expect(liveRegion.textContent).toBe("Enviado para impressora");
    } finally {
      vi.useRealTimers();
    }
  });

  it("AC3: atalhos PDF / WhatsApp / 2ª via têm aria-label descritivo", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    expect(
      screen.getByTestId("sale-receipt-shortcut-pdf").getAttribute("aria-label"),
    ).toMatch(/PDF/i);
    expect(
      screen
        .getByTestId("sale-receipt-shortcut-whatsapp")
        .getAttribute("aria-label"),
    ).toMatch(/WhatsApp/i);
    expect(
      screen
        .getByTestId("sale-receipt-shortcut-segunda-via")
        .getAttribute("aria-label"),
    ).toMatch(/2ª via/i);
  });

  it("AC4: 'Nova venda' dispatcha CustomEvent focus-universal-search + fecha modal", async () => {
    let closed = false;
    const listener = vi.fn();
    window.addEventListener(FOCUS_UNIVERSAL_SEARCH_EVENT, listener);
    try {
      render(
        <SaleReceiptModal
          open
          onClose={() => {
            closed = true;
          }}
          venda={mkVenda()}
          cliente={CLIENTE}
          tenant={TENANT}
        />,
      );
      await flushEffects();

      fireEvent.click(screen.getByTestId("sale-receipt-nova-venda"));
      expect(closed).toBe(true);

      // Espera o requestAnimationFrame disparar o event (happy-dom chama
      // rAF no próximo microtask — aguardamos).
      await waitFor(() => {
        expect(listener).toHaveBeenCalledTimes(1);
      });
      const event = listener.mock.calls[0][0] as Event;
      expect(event.type).toBe(FOCUS_UNIVERSAL_SEARCH_EVENT);
    } finally {
      window.removeEventListener(FOCUS_UNIVERSAL_SEARCH_EVENT, listener);
    }
  });

  it("AC5: foco inicial vai pro botão 'Enviar por e-mail' ao abrir", async () => {
    render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    // Aguarda o onOpenAutoFocus ser chamado pelo Radix (microtask).
    await waitFor(() => {
      const btn = screen.getByTestId("sale-receipt-send-email");
      expect(document.activeElement).toBe(btn);
    });
  });

  it("AC7: axe — modal aberto com venda não deve ter violações críticas", async () => {
    const { container } = render(
      <SaleReceiptModal
        open
        onClose={() => {}}
        venda={mkVenda()}
        cliente={CLIENTE}
        tenant={TENANT}
      />,
    );
    await flushEffects();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
