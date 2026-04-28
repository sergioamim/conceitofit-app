import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NetworkAccessFlow } from "@/components/auth/network-access-flow";
import {
  parseTenantThemeCookiePayload,
  TENANT_THEME_COOKIE_NAME,
  TENANT_THEME_PRESETS,
} from "@/lib/tenant/tenant-theme";

const replaceCookieSnapshots: string[] = [];
const mockReplace = vi.fn(() => {
  replaceCookieSnapshots.push(document.cookie);
});
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();
const mockQueryClear = vi.fn();
const mockGetAccessNetworkContextApi = vi.fn();
const mockLoginApi = vi.fn();
const mockRequestFirstAccessApi = vi.fn();
const mockRequestPasswordRecoveryApi = vi.fn();
const mockGetTenantContextApi = vi.fn();
const mockSetTenantContextApi = vi.fn();
const mockGetAuthSessionSnapshot = vi.fn(() => null);
const mockGetPreferredTenantId = vi.fn(() => undefined);
const mockHasActiveSession = vi.fn(() => false);
const mockSetPreferredTenantId = vi.fn();
const mockIsPlatformUser = vi.fn((session: unknown) => {
  void session;
  return false;
});

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : "#"} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    clear: mockQueryClear,
  }),
}));

vi.mock("@/lib/api/auth", () => ({
  getAccessNetworkContextApi: (...args: unknown[]) => mockGetAccessNetworkContextApi(...args),
  loginApi: (...args: unknown[]) => mockLoginApi(...args),
  requestFirstAccessApi: (...args: unknown[]) => mockRequestFirstAccessApi(...args),
  requestPasswordRecoveryApi: (...args: unknown[]) => mockRequestPasswordRecoveryApi(...args),
}));

vi.mock("@/lib/api/contexto-unidades", () => ({
  getTenantContextApi: () => mockGetTenantContextApi(),
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

vi.mock("@/lib/network-subdomain", () => ({
  buildNetworkAccessHref: () => "/login",
}));

function expireThemeCookie() {
  document.cookie = `${TENANT_THEME_COOKIE_NAME}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

describe("NetworkAccessFlow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    replaceCookieSnapshots.length = 0;
    expireThemeCookie();

    mockGetAccessNetworkContextApi.mockResolvedValue({
      subdomain: "rede-norte",
      slug: "rede-norte",
      name: "Rede Norte",
      appName: "Rede Norte Fit",
      accentLabel: "Acesso por rede",
    });
    mockLoginApi.mockResolvedValue({
      networkSubdomain: "rede-norte",
      activeTenantId: "tenant-centro",
      forcePasswordChangeRequired: false,
    });
    mockGetTenantContextApi.mockResolvedValue({
      currentTenantId: "tenant-centro",
      tenantAtual: {
        id: "tenant-centro",
        academiaId: "academia-1",
        academiaNome: "Rede Norte Fit",
        nome: "Unidade Centro",
        ativo: true,
        branding: {
          appName: "Rede Norte Fit",
          themePreset: "MENTA_MODERNA",
          useCustomColors: false,
        },
      },
      unidadesDisponiveis: [
        {
          id: "tenant-centro",
          academiaId: "academia-1",
          academiaNome: "Rede Norte Fit",
          nome: "Unidade Centro",
          ativo: true,
          branding: {
            appName: "Rede Norte Fit",
            themePreset: "MENTA_MODERNA",
            useCustomColors: false,
          },
        },
      ],
    });
    mockSetTenantContextApi.mockResolvedValue({
      currentTenantId: "tenant-centro",
      tenantAtual: {
        id: "tenant-centro",
        academiaId: "academia-1",
        academiaNome: "Rede Norte Fit",
        nome: "Unidade Centro",
        ativo: true,
        branding: {
          appName: "Rede Norte Fit",
          themePreset: "MENTA_MODERNA",
          useCustomColors: false,
        },
      },
      unidadesDisponiveis: [],
    });
  });

  it("persiste o tema do tenant antes de redirecionar após o login contextual", async () => {
    render(<NetworkAccessFlow networkSubdomain="rede-norte" nextPath="/app" mode="login" />);

    fireEvent.change(screen.getByLabelText("Identificador"), {
      target: { value: "ana@qa.local" },
    });
    fireEvent.change(screen.getByLabelText("Senha"), {
      target: { value: "12345678" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => {
      expect(mockSetTenantContextApi).toHaveBeenCalledWith("tenant-centro");
      expect(mockReplace).toHaveBeenCalledWith("/app");
    });

    const cookieAtRedirect = replaceCookieSnapshots.at(0) ?? "";
    const themeCookieValue = cookieAtRedirect
      .split("; ")
      .find((entry) => entry.startsWith(`${TENANT_THEME_COOKIE_NAME}=`))
      ?.slice(`${TENANT_THEME_COOKIE_NAME}=`.length);

    expect(themeCookieValue).toBeTruthy();
    expect(parseTenantThemeCookiePayload(themeCookieValue)).toEqual({
      scopeKey: "tenant:tenant-centro",
      appName: "Rede Norte Fit",
      theme: TENANT_THEME_PRESETS.MENTA_MODERNA,
    });
    expect(mockQueryClear).toHaveBeenCalled();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
