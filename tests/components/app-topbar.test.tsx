import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AppTopbar } from "@/components/layout/app-topbar";

const mockReplace = vi.fn();
const mockRefresh = vi.fn();
const mockLocationReplace = vi.fn();
const mockSetTenant = vi.fn().mockResolvedValue(undefined);

const originalLocation = window.location;

beforeAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: {
      ...originalLocation,
      replace: mockLocationReplace,
    },
  });
});

afterAll(() => {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: originalLocation,
  });
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  usePathname: () => "/dashboard",
}));

vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({
    tenantId: "t1",
    tenantName: "Academia Teste",
    eligibleTenants: [{ id: "t2", nome: "Unidade 2", ativo: true }],
    baseTenantId: "t1",
    baseTenantName: "Academia Teste",
    blockedTenants: [],
    networkName: "Rede Teste",
    availableScopes: ["UNIDADE"],
    broadAccess: false,
    setTenant: mockSetTenant,
    loading: false,
  }),
}));

vi.mock("@/components/layout/active-tenant-selector", () => ({
  ActiveTenantSelector: ({ onChange }: { onChange: (tenantId: string) => void | Promise<void> }) => (
    <button data-testid="tenant-selector" onClick={() => void onChange("t2")}>
      Tenant Selector
    </button>
  ),
}));

vi.mock("@/components/layout/onboarding-status-badge", () => ({
  OnboardingStatusBadge: () => <div data-testid="onboarding-badge" />,
}));

describe("AppTopbar", () => {
  beforeEach(() => {
    mockReplace.mockReset();
    mockRefresh.mockReset();
    mockLocationReplace.mockReset();
    mockSetTenant.mockClear();
  });

  it("renders the topbar with tenant selector", () => {
    render(<AppTopbar />);
    expect(screen.getByTestId("tenant-selector")).toBeInTheDocument();
  });

  it("renders mobile menu button", () => {
    render(<AppTopbar />);
    expect(screen.getByLabelText("Abrir menu principal")).toBeInTheDocument();
  });

  it("calls onOpenMenu when mobile menu button is clicked", () => {
    const onOpenMenu = vi.fn();
    render(<AppTopbar onOpenMenu={onOpenMenu} />);
    const menuBtn = screen.getByLabelText("Abrir menu principal");
    fireEvent.click(menuBtn);
    expect(onOpenMenu).toHaveBeenCalled();
  });

  it("atualiza o tenant e recarrega o dashboard após trocar a unidade ativa", async () => {
    render(<AppTopbar />);

    fireEvent.click(screen.getByTestId("tenant-selector"));

    await waitFor(() => {
      expect(mockSetTenant).toHaveBeenCalledWith("t2");
      expect(mockLocationReplace).toHaveBeenCalledWith("/dashboard");
    });
    expect(mockRefresh).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
