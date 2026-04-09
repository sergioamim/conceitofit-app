
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppTopbar } from "@/components/layout/app-topbar";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock useTenantContext
vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({
    tenantId: "t1",
    tenantName: "Academia Teste",
    eligibleTenants: [],
    setTenant: vi.fn(),
    loading: false,
  }),
}));

// Mock ActiveTenantSelector to simplify
vi.mock("@/components/layout/active-tenant-selector", () => ({
  ActiveTenantSelector: () => <div data-testid="tenant-selector">Tenant Selector</div>,
}));

describe("AppTopbar", () => {
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
});
