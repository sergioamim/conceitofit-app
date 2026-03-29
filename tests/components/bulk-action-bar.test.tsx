import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Trash2, Download } from "lucide-react";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";

describe("BulkActionBar", () => {
  const defaultActions = [
    { label: "Excluir", icon: Trash2, onClick: vi.fn(), variant: "destructive" as const },
    { label: "Exportar", icon: Download, onClick: vi.fn() },
  ];

  const defaultProps = {
    selectedCount: 3,
    actions: defaultActions,
    onClearSelection: vi.fn(),
    selectedIds: ["1", "2", "3"],
  };

  it("renders when items are selected", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText("selecionados")).toBeInTheDocument();
  });

  it("does not render when no items selected", () => {
    const { container } = render(
      <BulkActionBar {...defaultProps} selectedCount={0} selectedIds={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows singular text for one item", () => {
    render(<BulkActionBar {...defaultProps} selectedCount={1} selectedIds={["1"]} />);
    expect(screen.getByText("selecionado")).toBeInTheDocument();
  });

  it("displays selected count", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders action buttons", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByText("Excluir")).toBeInTheDocument();
    expect(screen.getByText("Exportar")).toBeInTheDocument();
  });

  it("calls action onClick with selectedIds", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByText("Excluir"));
    expect(defaultActions[0].onClick).toHaveBeenCalledWith(["1", "2", "3"]);
  });

  it("calls onClearSelection when X is clicked", () => {
    render(<BulkActionBar {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Limpar seleção"));
    expect(defaultProps.onClearSelection).toHaveBeenCalled();
  });

  it("has correct aria-label for accessibility", () => {
    render(<BulkActionBar {...defaultProps} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "3 items selecionados",
    );
  });
});
