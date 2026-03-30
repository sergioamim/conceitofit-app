import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Trash2, Download } from "lucide-react";
import { BulkActionBar } from "@/components/shared/bulk-action-bar";

describe("BulkActionBar a11y", () => {
  const props = {
    selectedCount: 2,
    actions: [
      { label: "Excluir", icon: Trash2, onClick: vi.fn() },
      { label: "Exportar", icon: Download, onClick: vi.fn() },
    ],
    onClearSelection: vi.fn(),
    selectedIds: ["1", "2"],
  };

  it("has no accessibility violations", async () => {
    const { container } = render(<BulkActionBar {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
