import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { Aluno, Plano, Produto } from "@/lib/types";

import { UniversalSearch } from "@/app/(portal)/vendas/nova/components/universal-search";

// ── Mocks hoisted ──────────────────────────────────────────────────────────
const mocks = vi.hoisted(() => ({
  searchAlunosApi: vi.fn(),
  listPlanosApi: vi.fn(),
  listProdutosApi: vi.fn(),
  useTenantContext: vi.fn(() => ({ tenantId: "tenant-1" })),
}));

vi.mock("@/lib/api/alunos", () => ({
  searchAlunosApi: mocks.searchAlunosApi,
}));

vi.mock("@/lib/api/comercial-catalogo", () => ({
  listPlanosApi: mocks.listPlanosApi,
  listProdutosApi: mocks.listProdutosApi,
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: mocks.useTenantContext,
}));

// Hook use-barcode-scanner depende de MediaDevices/BarcodeDetector do browser;
// para o unit test, neutralizamos retornando um stub controlado.
vi.mock("@/app/(portal)/vendas/nova/hooks/use-barcode-scanner", () => ({
  useBarcodeScanner: () => ({
    scannerOpen: false,
    setScannerOpen: vi.fn(),
    scannerError: "",
    setScannerError: vi.fn(),
    manualCode: "",
    setManualCode: vi.fn(),
    videoRef: { current: null },
  }),
}));

// cmdk depende de stacking context e medição DOM — simplificamos para o DOM
// testing library identificar por data-testid.
vi.mock("cmdk", () => {
  type ItemProps = {
    children?: React.ReactNode;
    onSelect?: () => void;
    className?: string;
  };
  type BaseProps = { children?: React.ReactNode; className?: string };
  const Root = ({ children }: BaseProps) => <div>{children}</div>;
  const MockCommand: React.FC<BaseProps> & {
    Dialog: React.FC<{
      open: boolean;
      onOpenChange: (v: boolean) => void;
      children?: React.ReactNode;
      label?: string;
      className?: string;
      "data-testid"?: string;
    }>;
    Input: React.FC<{
      value: string;
      onValueChange: (v: string) => void;
      placeholder?: string;
      autoFocus?: boolean;
      "aria-label"?: string;
      className?: string;
    }>;
    List: React.FC<BaseProps & { "aria-label"?: string }>;
    Empty: React.FC<BaseProps & { "data-testid"?: string }>;
    Group: React.FC<
      BaseProps & { heading?: string; "data-testid"?: string }
    >;
    Item: React.FC<
      ItemProps & { value?: string; "data-testid"?: string }
    >;
    Separator: React.FC<BaseProps>;
  } = Object.assign(Root, {}) as never;

  MockCommand.Dialog = ({ open, children, "data-testid": testId }) =>
    open ? <div data-testid={testId ?? "cmdk-dialog"}>{children}</div> : null;
  MockCommand.Input = ({ value, onValueChange, placeholder, ...rest }) => (
    <input
      data-testid="cmdk-input"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onValueChange(event.target.value)}
      {...rest}
    />
  );
  MockCommand.List = ({ children, ...rest }) => <div {...rest}>{children}</div>;
  MockCommand.Empty = ({ children, ...rest }) => <div {...rest}>{children}</div>;
  MockCommand.Group = ({ children, heading, ...rest }) => (
    <div {...rest}>
      {heading ? <div data-testid={`cmdk-heading-${heading}`}>{heading}</div> : null}
      {children}
    </div>
  );
  MockCommand.Item = ({ children, onSelect, ...rest }) => (
    <div
      role="option"
      aria-selected="false"
      onClick={() => onSelect?.()}
      {...rest}
    >
      {children}
    </div>
  );
  MockCommand.Separator = () => <hr />;

  return { Command: MockCommand };
});

vi.mock("@/components/ui/dialog", () => ({
  DialogTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

vi.mock("@/lib/formatters", () => ({
  formatBRL: (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`,
  formatCpf: (value: string | null | undefined) => {
    if (!value) return "";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) return value;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  },
}));

vi.mock("@/lib/utils", () => ({
  cn: (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" "),
}));

// ── Fixtures ────────────────────────────────────────────────────────────────
const clienteMaria: Aluno = {
  id: "cliente-1",
  tenantId: "tenant-1",
  nome: "Maria Silva",
  email: "maria@example.com",
  telefone: "11999999999",
  cpf: "12345678901",
  dataNascimento: "1990-01-01",
  sexo: "FEMININO",
  status: "ATIVO",
} as unknown as Aluno;

const planoFit: Plano = {
  id: "plano-1",
  tenantId: "tenant-1",
  nome: "Plano Fitness Mensal",
  tipo: "MENSAL",
  duracaoDias: 30,
  valor: 120,
  valorMatricula: 0,
  cobraAnuidade: false,
  permiteRenovacaoAutomatica: true,
  permiteCobrancaRecorrente: true,
  contratoAssinatura: "AMBAS",
  contratoEnviarAutomaticoEmail: false,
  destaque: false,
  ativo: true,
} as unknown as Plano;

const produtoWhey: Produto = {
  id: "produto-1",
  tenantId: "tenant-1",
  nome: "Whey Protein 900g",
  sku: "WHEY-900",
  codigoBarras: "7891234567890",
  unidadeMedida: "UN",
  valorVenda: 189.9,
  controlaEstoque: false,
  estoqueAtual: 10,
  permiteDesconto: true,
  permiteVoucher: true,
  ativo: true,
} as unknown as Produto;

// ── Helpers ─────────────────────────────────────────────────────────────────
function setupApiMocks(overrides?: {
  alunos?: Aluno[];
  planos?: Plano[];
  produtos?: Produto[];
}) {
  mocks.searchAlunosApi.mockResolvedValue(overrides?.alunos ?? [clienteMaria]);
  mocks.listPlanosApi.mockResolvedValue(overrides?.planos ?? [planoFit]);
  mocks.listProdutosApi.mockResolvedValue(overrides?.produtos ?? [produtoWhey]);
}

async function openDialog() {
  fireEvent.keyDown(document, { key: "k", metaKey: true });
}

async function typeQuery(term: string) {
  const input = screen.getByTestId("cmdk-input");
  fireEvent.change(input, { target: { value: term } });
  // Permite debounce (300ms) + Promise.allSettled resolverem
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 350));
  });
}

describe("UniversalSearch (VUN-2.1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupApiMocks();
  });

  it("exibe o trigger com atalho ⌘K e abre o diálogo ao acionar Cmd+K (AC1, AC2)", async () => {
    render(<UniversalSearch />);

    expect(screen.getByTestId("universal-search-trigger")).toBeInTheDocument();
    expect(
      screen.queryByTestId("universal-search-dialog")
    ).not.toBeInTheDocument();

    await openDialog();

    expect(screen.getByTestId("universal-search-dialog")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/buscar cliente.*plano ou produto/i)
    ).toBeInTheDocument();
  });

  it("não dispara busca com menos de 3 caracteres (AC3)", async () => {
    render(<UniversalSearch />);
    await openDialog();
    await typeQuery("ma");

    expect(mocks.searchAlunosApi).not.toHaveBeenCalled();
    expect(mocks.listPlanosApi).not.toHaveBeenCalled();
    expect(mocks.listProdutosApi).not.toHaveBeenCalled();

    expect(
      screen.getByTestId("universal-search-empty")
    ).toHaveTextContent(/pelo menos 3 caracteres/i);
  });

  it("dispara busca debounced paralela em ≥3 chars e agrupa resultados (AC3, AC4)", async () => {
    render(<UniversalSearch />);
    await openDialog();
    await typeQuery("maria");

    expect(mocks.searchAlunosApi).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      search: "maria",
      size: 5,
    });
    expect(mocks.listPlanosApi).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      apenasAtivos: true,
    });
    expect(mocks.listProdutosApi).toHaveBeenCalledWith(true);

    expect(
      screen.getByTestId("universal-search-group-clientes")
    ).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
  });

  it("chama onSelectCliente quando um cliente é selecionado (AC6)", async () => {
    const onSelectCliente = vi.fn();
    render(<UniversalSearch onSelectCliente={onSelectCliente} />);
    await openDialog();
    await typeQuery("maria");

    const clienteItem = screen.getByText("Maria Silva");
    fireEvent.click(clienteItem);

    expect(onSelectCliente).toHaveBeenCalledWith(
      expect.objectContaining({ id: "cliente-1", nome: "Maria Silva" })
    );
    expect(
      screen.queryByTestId("universal-search-dialog")
    ).not.toBeInTheDocument();
  });

  it("chama onSelectPlano quando um plano é selecionado (AC7)", async () => {
    const onSelectPlano = vi.fn();
    render(<UniversalSearch onSelectPlano={onSelectPlano} />);
    await openDialog();
    await typeQuery("fitness");

    const planoItem = screen.getByText("Plano Fitness Mensal");
    fireEvent.click(planoItem);

    expect(onSelectPlano).toHaveBeenCalledWith(
      expect.objectContaining({ id: "plano-1" })
    );
  });

  it("chama onSelectProduto quando um produto é selecionado (AC8)", async () => {
    const onSelectProduto = vi.fn();
    render(<UniversalSearch onSelectProduto={onSelectProduto} />);
    await openDialog();
    await typeQuery("whey");

    const produtoItem = screen.getByText("Whey Protein 900g");
    fireEvent.click(produtoItem);

    expect(onSelectProduto).toHaveBeenCalledWith(
      expect.objectContaining({ id: "produto-1" })
    );
  });

  it("exibe CTA 'Criar prospect com CPF …' quando CPF válido sem cliente (AC9/VUN-2.4 AC1)", async () => {
    setupApiMocks({ alunos: [] });
    render(<UniversalSearch />);
    await openDialog();
    // CPF válido (Maria Silva) → backend retorna vazio → CTA aparece
    await typeQuery("529.982.247-25");

    const cta = await screen.findByTestId("universal-search-create-prospect");
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveTextContent(/Criar prospect com CPF 529\.982\.247-25/i);
  });

  it("scanner toggle alterna o painel inline com video + input manual (AC5, AC10)", async () => {
    render(<UniversalSearch />);
    await openDialog();

    const toggle = screen.getByTestId("universal-search-scanner-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByTestId("universal-search-scanner-panel")
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.queryByTestId("universal-search-scanner-panel")
    ).not.toBeInTheDocument();
  });

  it("input possui aria-label e lista tem rótulo acessível (AC10)", async () => {
    render(<UniversalSearch />);
    await openDialog();
    expect(screen.getByLabelText("Termo de busca")).toBeInTheDocument();
    expect(screen.getByLabelText("Resultados da busca")).toBeInTheDocument();
  });
});
