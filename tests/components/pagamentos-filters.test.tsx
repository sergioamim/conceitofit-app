import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PagamentosFilters } from "@/app/(portal)/pagamentos/components/pagamentos-filters/pagamentos-filters";
import { FILTER_ALL } from "@/lib/shared/constants/filters";

vi.mock("@/components/shared/month-year-picker", () => ({
  MonthYearPicker: () => <div data-testid="month-year-picker">month-year-picker</div>,
}));

describe("PagamentosFilters", () => {
  it("seleciona cliente via suggestion box", async () => {
    const onClienteFiltroChange = vi.fn();
    const onClienteBuscaChange = vi.fn();
    const onClienteSelect = vi.fn();
    const onClienteSuggestionOpen = vi.fn();

    render(
      <PagamentosFilters
        filtro={FILTER_ALL}
        onFiltroChange={vi.fn()}
        clienteFiltro={FILTER_ALL}
        onClienteFiltroChange={onClienteFiltroChange}
        clienteBusca="Mar"
        onClienteBuscaChange={onClienteBuscaChange}
        onClienteSelect={onClienteSelect}
        onClienteSuggestionOpen={onClienteSuggestionOpen}
        mes={3}
        ano={2026}
        onMesAnoChange={vi.fn()}
        clienteOptions={[
          { id: "al-1", label: "Maria Souza", searchText: "11122233344" },
          { id: "al-2", label: "Marcos Lima", searchText: "55566677788" },
        ]}
      />,
    );

    const input = screen.getByRole("combobox", { name: /buscar cliente/i });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Maria Souza" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("option", { name: "Maria Souza" }));

    expect(onClienteSuggestionOpen).toHaveBeenCalled();
    expect(onClienteSelect).toHaveBeenCalledWith({
      id: "al-1",
      label: "Maria Souza",
      searchText: "11122233344",
    });
  });

  it("limpa o filtro quando o campo fica vazio", () => {
    const onClienteFiltroChange = vi.fn();
    const onClienteBuscaChange = vi.fn();

    render(
      <PagamentosFilters
        filtro={FILTER_ALL}
        onFiltroChange={vi.fn()}
        clienteFiltro="al-1"
        onClienteFiltroChange={onClienteFiltroChange}
        clienteBusca="Maria Souza"
        onClienteBuscaChange={onClienteBuscaChange}
        onClienteSelect={vi.fn()}
        onClienteSuggestionOpen={vi.fn()}
        mes={3}
        ano={2026}
        onMesAnoChange={vi.fn()}
        clienteOptions={[]}
      />,
    );

    const input = screen.getByRole("combobox", { name: /buscar cliente/i });
    fireEvent.change(input, { target: { value: "" } });

    expect(onClienteBuscaChange).toHaveBeenCalledWith("");
    expect(onClienteFiltroChange).toHaveBeenCalledWith(FILTER_ALL);
  });
});
