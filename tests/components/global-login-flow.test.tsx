import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GlobalLoginFlow } from "@/components/auth/global-login-flow";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();
const mockPush = vi.fn();
const mockQueryClear = vi.fn();
const mockLoginApi = vi.fn();
const mockGetAccessibleContextsApi = vi.fn();
const mockSetTenantContextApi = vi.fn();
const mockGetAuthSessionSnapshot = vi.fn(() => null);
const mockGetPreferredTenantId = vi.fn(() => undefined);
const mockHasActiveSession = vi.fn(() => false);
const mockSetPreferredTenantId = vi.fn();
const mockIsPlatformUser = vi.fn((session: unknown) => {
  void session;
  return false;
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
    push: mockPush,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    clear: mockQueryClear,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  loginApi: (...args: unknown[]) => mockLoginApi(...args),
  getAccessibleContextsApi: (...args: unknown[]) => mockGetAccessibleContextsApi(...args),
}));

vi.mock("@/lib/api/contexto-unidades", () => ({
  setTenantContextApi: (tenantId: string) => mockSetTenantContextApi(tenantId),
}));

vi.mock("@/lib/api/session", () => ({
  getAuthSessionSnapshot: () => mockGetAuthSessionSnapshot(),
  getPreferredTenantId: () => mockGetPreferredTenantId(),
  hasActiveSession: () => mockHasActiveSession(),
  setPreferredTenantId: (tenantId: string) => mockSetPreferredTenantId(tenantId),
}));

vi.mock("@/lib/tenant/auth-redirect", () => ({
  buildForcedPasswordChangeHref: (nextPath?: string | null) => `/trocar-senha?next=${nextPath ?? ""}`,
  resolveHomeForSession: () => "/admin",
  resolvePostLoginPath: (nextPath?: string | null) => nextPath ?? "/dashboard",
  resolvePostLoginPathForSession: (nextPath?: string | null) => nextPath ?? "/dashboard",
}));

vi.mock("@/lib/shared/user-kind", () => ({
  isPlatformUser: (session: unknown) => mockIsPlatformUser(session),
}));

vi.mock("@/lib/tenant/theme-cookie", () => ({
  persistTenantThemeCookie: vi.fn(),
}));

async function selectOption(label: string, optionText: string) {
  fireEvent.pointerDown(screen.getByRole("combobox", { name: label }));
  const option = await screen.findByText(optionText);
  fireEvent.click(option);
}

describe("GlobalLoginFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoginApi.mockResolvedValue({
      userKind: "OPERADOR",
      activeTenantId: "tenant-centro",
      forcePasswordChangeRequired: false,
    });
    mockGetAccessibleContextsApi.mockResolvedValue({
      redes: [
        {
          redeId: "rede-1",
          redeName: "Rede Norte",
          unidades: [
            { id: "tenant-centro", nome: "Centro", matriz: true },
            { id: "tenant-barra", nome: "Barra", matriz: false },
          ],
        },
        {
          redeId: "rede-2",
          redeName: "Rede Sul",
          unidades: [
            { id: "tenant-sul", nome: "Sul", matriz: true },
          ],
        },
      ],
    });
    mockSetTenantContextApi.mockResolvedValue({
      currentTenantId: "tenant-barra",
      tenantAtual: {
        id: "tenant-barra",
        nome: "Barra",
        branding: {
          appName: "Rede Norte",
          themePreset: "MENTA_MODERNA",
          useCustomColors: false,
        },
      },
    });
  });

  it("autentica operador global e exige escolha de rede/unidade quando há ambiguidade", async () => {
    render(<GlobalLoginFlow nextPath="/dashboard" />);

    fireEvent.change(screen.getByLabelText("E-mail, CPF ou usuário"), {
      target: { value: "operador@qa.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mockGetAccessibleContextsApi).toHaveBeenCalled();
      expect(screen.getByLabelText("Rede")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(screen.getByText("Escolha uma rede para continuar.")).toBeInTheDocument();

    await selectOption("Rede", "Rede Norte");
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Unidade")).toBeInTheDocument();
    });

    await selectOption("Unidade", "Barra");
    fireEvent.click(screen.getByRole("button", { name: "Entrar na unidade" }));

    await waitFor(() => {
      expect(mockSetTenantContextApi).toHaveBeenCalledWith("tenant-barra");
      expect(mockSetPreferredTenantId).toHaveBeenCalledWith("tenant-barra");
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
