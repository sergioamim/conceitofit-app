
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";

const setSidebarCollapsedMock = vi.fn();
const mocks = vi.hoisted(() => ({
  setSidebarCollapsed: vi.fn(),
  useUserPreferences: vi.fn(() => ({
    sidebarCollapsed: false,
    setSidebarCollapsed: vi.fn(), // This will be overridden in the test
    favorites: [],
    recent: [],
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
  }))
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock next-themes
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
  }),
}));

// Mock context and hooks
vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: () => ({
    tenant: { id: "t1", nome: "Academia Teste" },
    tenantName: "Academia Teste",
    loading: false,
  }),
  useAuthAccess: () => ({
    user: { nome: "Admin", email: "admin@test.com" },
    isAdmin: true,
  }),
  DEFAULT_ACTIVE_TENANT_LABEL: "Academia",
  DEFAULT_ACADEMIA_LABEL: "Academia",
}));

vi.mock("@/lib/tenant/hooks/use-user-preferences", () => ({
  useUserPreferences: mocks.useUserPreferences,
}));

describe("Sidebar", () => {
  it("renders the sidebar with branding", () => {
    render(<Sidebar />);
    // Branding text from DOM output is "Conceito Fit"
    expect(screen.getByText(/Conceito Fit/i)).toBeInTheDocument();
  });

  it("renders navigation items", () => {
    render(<Sidebar />);
    // Navigation items are rendered. We use queryByText to be safe with partial matches
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Clientes/i)).toBeInTheDocument();
  });

  it("renders sections for admin", () => {
    render(<Sidebar />);
    expect(screen.getByText(/Atividade/i)).toBeInTheDocument();
    expect(screen.getByText(/CRM/i)).toBeInTheDocument();
  });

  it("toggles collapse when button is clicked", () => {
    const { container } = render(<Sidebar />);
    const aside = container.querySelector("aside");
    // Initially not collapsed (220px)
    expect(aside?.className).toContain("md:w-[220px]");

    const collapseBtn = screen.getByRole("button", { name: /Recolher/i });
    fireEvent.click(collapseBtn);
    
    // Now should be collapsed (72px)
    expect(aside?.className).toContain("md:w-[72px]");
  });
});
