import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import {
  TableFilters,
  type FilterConfig,
  type ActiveFilters,
} from "@/components/shared/table-filters";

/* ---------------------------------------------------------------------------
 * Mocks
 * --------------------------------------------------------------------------- */

let mockSearchParams = new URLSearchParams();
const mockPathname = "/test";

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => mockSearchParams,
}));

// Mock SuggestionInput para simplificar testes
vi.mock("@/components/shared/suggestion-input", () => ({
  SuggestionInput: ({
    value,
    onValueChange,
    onSelect,
    options,
    placeholder,
    className,
  }: {
    value: string;
    onValueChange: (v: string) => void;
    onSelect: (opt: { id: string; label: string }) => void;
    options: { id: string; label: string }[];
    placeholder?: string;
    className?: string;
  }) => (
    <div data-testid="suggestion-input" className={className}>
      <input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        aria-label="suggestion"
      />
      {options.map((opt) => (
        <button
          key={opt.id}
          data-testid={`suggestion-option-${opt.id}`}
          onClick={() => onSelect(opt)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock window.history.pushState
const pushStateSpy = vi.fn();

beforeEach(() => {
  mockSearchParams = new URLSearchParams();
  pushStateSpy.mockClear();
  Object.defineProperty(window, "history", {
    value: { pushState: pushStateSpy },
    writable: true,
    configurable: true,
  });
});

afterEach(() => {
  vi.clearAllTimers();
});

/* ---------------------------------------------------------------------------
 * Testes
 * --------------------------------------------------------------------------- */

describe("TableFilters", () => {
  it("renderiza filtro de texto com label e placeholder", () => {
    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca", placeholder: "Nome..." },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Busca")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Nome...")).toBeInTheDocument();
  });

  it("renderiza filtro select com opcoes", () => {
    const filters: FilterConfig[] = [
      {
        type: "select",
        key: "status",
        label: "Status",
        options: [
          { value: "ATIVO", label: "Ativo" },
          { value: "INATIVO", label: "Inativo" },
        ],
      },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Status")).toBeInTheDocument();
  });

  it("renderiza filtro date-range com dois inputs", () => {
    const filters: FilterConfig[] = [
      { type: "date-range", key: "data", label: "Periodo" },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Periodo")).toBeInTheDocument();
    expect(screen.getByLabelText("Periodo - início")).toBeInTheDocument();
    expect(screen.getByLabelText("Periodo - fim")).toBeInTheDocument();
    expect(screen.getByText("até")).toBeInTheDocument();
  });

  it("renderiza filtro status-badge com badges clicaveis", () => {
    const filters: FilterConfig[] = [
      {
        type: "status-badge",
        key: "status",
        label: "Status",
        options: [
          { value: "ATIVO", label: "Ativo", className: "bg-green-500/15 text-green-400" },
          { value: "INATIVO", label: "Inativo" },
        ],
      },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Todos")).toBeInTheDocument();
    expect(screen.getByText("Ativo")).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();
  });

  it("nao mostra botao limpar filtros quando nao ha filtros ativos", () => {
    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.queryByText("Limpar filtros")).not.toBeInTheDocument();
  });

  it("mostra botao limpar filtros quando ha filtros ativos na URL", () => {
    mockSearchParams = new URLSearchParams("q=teste");

    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Limpar filtros")).toBeInTheDocument();
  });

  it("limpar filtros remove todos os parametros de filtro da URL", async () => {
    mockSearchParams = new URLSearchParams("q=teste&status=ATIVO");

    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
      {
        type: "select",
        key: "status",
        label: "Status",
        options: [{ value: "ATIVO", label: "Ativo" }],
      },
    ];

    render(<TableFilters filters={filters} />);

    const clearButton = screen.getByText("Limpar filtros");
    fireEvent.click(clearButton);

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/test");
  });

  it("texto com debounce atualiza URL apos delay", async () => {
    vi.useFakeTimers();

    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca", debounceMs: 300 },
    ];

    render(<TableFilters filters={filters} />);

    const input = screen.getByPlaceholderText("Buscar...");
    fireEvent.change(input, { target: { value: "teste" } });

    // Nao deve ter atualizado ainda
    expect(pushStateSpy).not.toHaveBeenCalled();

    // Avanca o timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/test?q=teste");

    vi.useRealTimers();
  });

  it("date-range start atualiza URL imediatamente", async () => {
    const filters: FilterConfig[] = [
      { type: "date-range", key: "data", label: "Periodo" },
    ];

    render(<TableFilters filters={filters} />);

    const startInput = screen.getByLabelText("Periodo - início");
    fireEvent.change(startInput, { target: { value: "2026-01-01" } });

    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/test?data_start=2026-01-01",
    );
  });

  it("status-badge clica em badge para filtrar", async () => {
    const filters: FilterConfig[] = [
      {
        type: "status-badge",
        key: "status",
        label: "Status",
        options: [
          { value: "ATIVO", label: "Ativo" },
          { value: "INATIVO", label: "Inativo" },
        ],
      },
    ];

    render(<TableFilters filters={filters} />);

    const ativoBadge = screen.getByText("Ativo");
    fireEvent.click(ativoBadge);

    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/test?status=ATIVO",
    );
  });

  it("status-badge clica no badge ativo para desativar", async () => {
    mockSearchParams = new URLSearchParams("status=ATIVO");

    const filters: FilterConfig[] = [
      {
        type: "status-badge",
        key: "status",
        label: "Status",
        options: [
          { value: "ATIVO", label: "Ativo" },
          { value: "INATIVO", label: "Inativo" },
        ],
      },
    ];

    render(<TableFilters filters={filters} />);

    const ativoBadge = screen.getByText("Ativo");
    fireEvent.click(ativoBadge);

    expect(pushStateSpy).toHaveBeenCalledWith(null, "", "/test");
  });

  it("chama onFiltersChange quando filtros mudam", () => {
    mockSearchParams = new URLSearchParams("q=teste&status=ATIVO");

    const onFiltersChange = vi.fn();
    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
      {
        type: "select",
        key: "status",
        label: "Status",
        options: [{ value: "ATIVO", label: "Ativo" }],
      },
    ];

    render(<TableFilters filters={filters} onFiltersChange={onFiltersChange} />);

    expect(onFiltersChange).toHaveBeenCalledWith({
      q: "teste",
      status: "ATIVO",
    });
  });

  it("renderiza suggestion filter", () => {
    const filters: FilterConfig[] = [
      {
        type: "suggestion",
        key: "cliente",
        label: "Cliente",
        placeholder: "Buscar cliente...",
        options: [
          { id: "1", label: "Joao Silva" },
          { id: "2", label: "Maria Santos" },
        ],
      },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Cliente")).toBeInTheDocument();
    expect(screen.getByTestId("suggestion-input")).toBeInTheDocument();
  });

  it("reseta pagina ao aplicar filtro", async () => {
    mockSearchParams = new URLSearchParams("page=3");

    const filters: FilterConfig[] = [
      {
        type: "status-badge",
        key: "status",
        label: "Status",
        options: [{ value: "ATIVO", label: "Ativo" }],
      },
    ];

    render(<TableFilters filters={filters} />);

    fireEvent.click(screen.getByText("Ativo"));

    // Deve ter removido page e adicionado status
    expect(pushStateSpy).toHaveBeenCalledWith(
      null,
      "",
      "/test?status=ATIVO",
    );
  });

  it("tem role search e aria-label no container", () => {
    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
    ];

    render(<TableFilters filters={filters} />);

    const container = screen.getByRole("search");
    expect(container).toHaveAttribute("aria-label", "Filtros da tabela");
  });

  it("renderiza multiplos filtros simultaneamente", () => {
    const filters: FilterConfig[] = [
      { type: "text", key: "q", label: "Busca" },
      {
        type: "select",
        key: "tipo",
        label: "Tipo",
        options: [{ value: "A", label: "Tipo A" }],
      },
      {
        type: "status-badge",
        key: "status",
        label: "Status",
        options: [{ value: "ATIVO", label: "Ativo" }],
      },
      { type: "date-range", key: "data", label: "Data" },
    ];

    render(<TableFilters filters={filters} />);

    expect(screen.getByText("Busca")).toBeInTheDocument();
    expect(screen.getByText("Tipo")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
  });
});
