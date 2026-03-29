
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

  it("renders search button", () => {
    render(<AppTopbar />);
    expect(screen.getByText("Buscar ou navegar...")).toBeInTheDocument();
  });

  it("dispatches keyboard event when search button is clicked", () => {
    const dispatchSpy = vi.spyOn(document, "dispatchEvent");
    render(<AppTopbar />);
    const searchBtn = screen.getByText("Buscar ou navegar...").closest("button");
    if (searchBtn) fireEvent.click(searchBtn);
    
    expect(dispatchSpy).toHaveBeenCalled();
    const event = dispatchSpy.mock.calls.find(call => call[0] instanceof KeyboardEvent && (call[0] as KeyboardEvent).key === "k")?.[0] as KeyboardEvent;
    expect(event).toBeDefined();
    expect(event.metaKey).toBe(true);
  });

  it("calls onOpenMenu when mobile menu button is clicked", () => {
    const onOpenMenu = vi.fn();
    render(<AppTopbar onOpenMenu={onOpenMenu} />);
    const menuBtn = screen.getByLabelText("Abrir menu principal");
    fireEvent.click(menuBtn);
    expect(onOpenMenu).toHaveBeenCalled();
  });
});
