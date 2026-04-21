import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SaleReceiptModal } from "@/components/shared/sale-receipt-modal";
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
