import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ClientesAdvancedFiltersSheet } from "@/app/(portal)/clientes/components/clientes-advanced-filters-sheet";

describe("ClientesAdvancedFiltersSheet", () => {
  it("exibe badge com quantidade de filtros ativos", () => {
    render(
      <ClientesAdvancedFiltersSheet
        values={{
          financeiro: "COM_PENDENCIA",
          agregador: "WELLHUB",
          responsavel: "TODOS",
          acesso: "TODOS",
        }}
        activeCount={2}
        onApply={vi.fn()}
      />,
    );

    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("limpa filtros avançados e envia query vazia", async () => {
    const onApply = vi.fn();

    render(
      <ClientesAdvancedFiltersSheet
        values={{
          financeiro: "COM_PENDENCIA",
          agregador: "TOTALPASS",
          responsavel: "COM_RESPONSAVEL",
          acesso: "BLOQUEADO",
        }}
        activeCount={4}
        onApply={onApply}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /abrir filtros avançados/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Filtros avançados")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /limpar avançados/i }));

    expect(onApply).toHaveBeenCalledWith({
      comPendenciaFinanceira: null,
      comAgregador: null,
      tipoAgregador: null,
      comResponsavel: null,
      acessoBloqueado: null,
    });
  });

  it("não exibe os filtros removidos do layout", async () => {
    render(
      <ClientesAdvancedFiltersSheet
        values={{
          financeiro: "TODOS",
          agregador: "TODOS",
          responsavel: "TODOS",
          acesso: "TODOS",
        }}
        activeCount={0}
        onApply={vi.fn()}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /abrir filtros avançados/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Filtros avançados")).toBeInTheDocument();
    });

    expect(screen.queryByText("Plano")).not.toBeInTheDocument();
    expect(screen.queryByText("Sem agregador")).not.toBeInTheDocument();
  });
});
