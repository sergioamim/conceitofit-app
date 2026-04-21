import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useState } from "react";
import type { CartItem } from "@/lib/tenant/hooks/use-commercial-flow";

// hoisted refs estáveis (sem gerar novo objeto a cada render → evita loops de effect)
const mocks = vi.hoisted(() => {
  return {
    clearCartSpy: vi.fn(),
    loadAlunosSpy: vi.fn(),
    setClienteIdSpy: vi.fn(),
    setTenantSpy: vi.fn(),
    setConvenioPlanoIdSpy: vi.fn(),
    setParcelasAnuidadeSpy: vi.fn(),
    setDataInicioPlanoSpy: vi.fn(),
    setRenovacaoAutomaticaPlanoSpy: vi.fn(),
    processSaleSpy: vi.fn(),
    addPlanoToCartSpy: vi.fn(),
    addItemToCartSpy: vi.fn(),
    tenantContextStable: {
      tenantId: "t1",
      tenant: { id: "t1", nome: "Unidade 1" },
      tenants: [] as Array<{ id: string }>,
      setTenant: vi.fn(),
    },
    queryClientStable: { invalidateQueries: vi.fn() },
    receiptStable: {
      receiptOpen: false,
      setReceiptOpen: vi.fn(),
      receiptVenda: null,
      receiptCliente: null,
      receiptPlano: null,
      receiptContratoAutoMsg: "",
      receiptVoucherCodigo: null,
      receiptVoucherPercent: 0,
      showReceipt: vi.fn(),
    },
    scannerStable: {},
    saleItemsStable: {
      servicos: [],
      produtos: [],
      selectedItemId: "",
      setSelectedItemId: vi.fn(),
      itemQuery: "",
      setItemQuery: vi.fn(),
      qtd: "1",
      setQtd: vi.fn(),
      itemOptions: [],
      addItem: vi.fn(),
      applyCodeToProduct: vi.fn(),
    },
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/tenant/comercial/runtime", () => ({
  resolveAlunoTenantService: vi.fn(),
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => mocks.tenantContextStable,
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => mocks.queryClientStable,
}));

vi.mock("@/lib/tenant/hooks/use-commercial-flow", () => ({
  useCommercialFlow: () => {
    const [cart, setCart] = useState<CartItem[]>([]);

    // rebind das implementações para usar o setCart do render atual
    mocks.addPlanoToCartSpy.mockImplementation(
      (plano: { id: string; nome: string; valor: number }) => {
        setCart((prev) => [
          ...prev,
          {
            tipo: "PLANO",
            referenciaId: plano.id,
            descricao: `Plano: ${plano.nome}`,
            quantidade: 1,
            valorUnitario: plano.valor,
            desconto: 0,
          },
        ]);
      }
    );
    mocks.addItemToCartSpy.mockImplementation((item: CartItem) => {
      setCart((prev) => [...prev, item]);
    });

    return {
      alunos: [],
      planos: [],
      convenios: [],
      formasPagamento: [],
      loadingData: false,
      alunosLoaded: true,
      loadAlunos: mocks.loadAlunosSpy,
      clienteId: "",
      setClienteId: mocks.setClienteIdSpy,
      cart,
      selectedPlano: null,
      conveniosPlano: [],
      convenioPlanoId: "__SEM_CONVENIO__",
      setConvenioPlanoId: mocks.setConvenioPlanoIdSpy,
      parcelasAnuidade: "1",
      setParcelasAnuidade: mocks.setParcelasAnuidadeSpy,
      dataInicioPlano: "2026-04-20",
      setDataInicioPlano: mocks.setDataInicioPlanoSpy,
      renovacaoAutomaticaPlano: false,
      setRenovacaoAutomaticaPlano: mocks.setRenovacaoAutomaticaPlanoSpy,
      cupomAppliedCode: "",
      cupomPercent: 0,
      addPlanoToCart: mocks.addPlanoToCartSpy,
      addItemToCart: mocks.addItemToCartSpy,
      clearCart: mocks.clearCartSpy,
      processSale: mocks.processSaleSpy,
    };
  },
}));

vi.mock("@/app/(portal)/vendas/nova/hooks/use-barcode-scanner", () => ({
  useBarcodeScanner: () => mocks.scannerStable,
}));

vi.mock("@/app/(portal)/vendas/nova/hooks/use-sale-receipt", () => ({
  useSaleReceipt: () => mocks.receiptStable,
}));

vi.mock("@/app/(portal)/vendas/nova/hooks/use-sale-items", () => ({
  useSaleItems: () => mocks.saleItemsStable,
}));

// import após mocks
import { useVendaWorkspace } from "@/app/(portal)/vendas/nova/hooks/use-venda-workspace";

describe("useVendaWorkspace — RN-011 combo livre (VUN-2.3)", () => {
  it("trocar tipoVenda NÃO zera o carrinho — combo PLANO → PRODUTO → SERVICO preserva 3 itens", () => {
    mocks.clearCartSpy.mockClear();
    const { result } = renderHook(() => useVendaWorkspace());

    // 1) adiciona plano na tab PLANO
    act(() => {
      result.current.addPlanoToCart(
        { id: "plano-a", nome: "Anual", valor: 1200 } as never,
        1
      );
    });
    expect(result.current.cart).toHaveLength(1);

    // 2) troca pra tab PRODUTO — efeito NÃO deve chamar clearCart
    act(() => {
      result.current.setTipoVenda("PRODUTO");
    });
    expect(result.current.cart).toHaveLength(1);

    act(() => {
      result.current.addItemToCart({
        tipo: "PRODUTO",
        referenciaId: "p1",
        descricao: "Whey",
        quantidade: 1,
        valorUnitario: 120,
        desconto: 0,
      });
    });
    expect(result.current.cart).toHaveLength(2);

    // 3) troca pra tab SERVICO
    act(() => {
      result.current.setTipoVenda("SERVICO");
    });
    expect(result.current.cart).toHaveLength(2);

    act(() => {
      result.current.addItemToCart({
        tipo: "SERVICO",
        referenciaId: "s1",
        descricao: "Avaliação",
        quantidade: 1,
        valorUnitario: 50,
        desconto: 0,
      });
    });

    // Combo livre: 1 plano + 1 produto + 1 serviço = 3 itens preservados
    expect(result.current.cart).toHaveLength(3);
    expect(result.current.cart.map((i) => i.tipo)).toEqual([
      "PLANO",
      "PRODUTO",
      "SERVICO",
    ]);

    // Nenhum clearCart foi disparado pela troca de tab
    expect(mocks.clearCartSpy).not.toHaveBeenCalled();
  });
});
