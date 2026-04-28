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
            { id: "tenant-barra", nome: "Barra", matriz: true },
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

  it("autentica operador global e define automaticamente a unidade quando o contexto é único", async () => {
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
      expect(mockSetTenantContextApi).toHaveBeenCalledWith("tenant-barra");
      expect(mockSetPreferredTenantId).toHaveBeenCalledWith("tenant-barra");
      expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    });
  });
});
