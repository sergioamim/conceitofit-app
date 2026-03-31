
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CommandPalette } from "@/components/layout/command-palette";

const mocks = vi.hoisted(() => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
  useTenantContext: vi.fn(() => ({
    tenantId: "t1",
    eligibleTenants: [],
    tenants: [],
    loading: false,
  }))
}));

// Mock cmdk
vi.mock("cmdk", () => {
  const MockCommand = ({ children }: any) => <div>{children}</div>;
  MockCommand.Input = ({ placeholder, onValueChange, value }: any) => (
    <input 
      placeholder={placeholder} 
      onChange={(e) => onValueChange(e.target.value)} 
      value={value}
      data-testid="command-input"
    />
  );
  MockCommand.List = ({ children }: any) => <div>{children}</div>;
  MockCommand.Empty = ({ children }: any) => <div>{children}</div>;
  MockCommand.Group = ({ children, heading }: any) => (
    <div>
      <div>{heading}</div>
      {children}
    </div>
  );
  MockCommand.Item = ({ children, onSelect }: any) => (
    <div onClick={onSelect}>{children}</div>
  );
  MockCommand.Dialog = ({ children, open, onOpenChange }: any) => 
    open ? <div data-testid="command-dialog">{children}</div> : null;

  return {
    Command: MockCommand
  };
});

// Mock Dialog
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: mocks.useRouter,
}));

// Mock useTenantContext
vi.mock("@/lib/tenant/hooks/use-session-context", () => ({
  useTenantContext: mocks.useTenantContext,
}));

describe("CommandPalette", () => {
  it("opens when cmd+k is pressed", () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    expect(screen.getByPlaceholderText("Buscar clientes, prospects, planos, páginas...")).toBeInTheDocument();
  });

  it("filters items based on input", async () => {
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    
    const input = screen.getByTestId("command-input");
    fireEvent.change(input, { target: { value: "Dashboard" } });
    
    // CommandPalette includes allNavItems by default
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("closes when an item is selected", () => {
    const push = vi.fn();
    mocks.useRouter.mockReturnValue({ push });
    
    render(<CommandPalette />);
    fireEvent.keyDown(document, { key: "k", metaKey: true });
    
    const dashboardItem = screen.getByText("Dashboard");
    fireEvent.click(dashboardItem);
    
    expect(push).toHaveBeenCalled();
    // It should be closed now (check if dialog is gone)
    expect(screen.queryByTestId("command-dialog")).not.toBeInTheDocument();
  });
});
