import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { TableSkeleton } from "@/components/shared/table-skeleton";

// Skeleton tables use empty th for checkbox columns — this is expected.
const AXE_SKELETON_OPTS = { rules: { "empty-table-header": { enabled: false } } };

describe("TableSkeleton a11y", () => {
  const columns = [
    { label: "Nome" },
    { label: "Status" },
    { label: "Data" },
  ];

  it("has no accessibility violations", async () => {
    const { container } = render(<TableSkeleton columns={columns} />);
    const results = await axe(container, AXE_SKELETON_OPTS);
    expect(results).toHaveNoViolations();
  });

  it("has no violations with selectable mode", async () => {
    const { container } = render(<TableSkeleton columns={columns} selectable />);
    const results = await axe(container, AXE_SKELETON_OPTS);
    expect(results).toHaveNoViolations();
  });
});
