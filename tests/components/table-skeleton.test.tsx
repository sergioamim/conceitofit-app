import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TableSkeleton } from "@/components/shared/table-skeleton";

describe("TableSkeleton", () => {
  const columns = [
    { label: "Nome" },
    { label: "Status" },
    { label: "Data" },
  ];

  it("renders column headers", () => {
    render(<TableSkeleton columns={columns} />);
    expect(screen.getByText("Nome")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Data")).toBeInTheDocument();
  });

  it("renders default 5 rows", () => {
    render(<TableSkeleton columns={columns} />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
  });

  it("renders custom row count", () => {
    const { container } = render(<TableSkeleton columns={columns} rowCount={3} />);
    const tbody = container.querySelector("tbody");
    expect(tbody?.children.length).toBe(3);
  });

  it("shows pagination by default", () => {
    const { container } = render(<TableSkeleton columns={columns} />);
    const paginationBar = container.querySelector(".flex.items-center.justify-between");
    expect(paginationBar).toBeInTheDocument();
  });

  it("hides pagination when showPagination is false", () => {
    const { container } = render(<TableSkeleton columns={columns} showPagination={false} />);
    const paginationBar = container.querySelector(".flex.items-center.justify-between");
    expect(paginationBar).not.toBeInTheDocument();
  });

  it("renders sr-only loading text", () => {
    render(<TableSkeleton columns={columns} />);
    expect(screen.getByText("Carregando tabela…")).toBeInTheDocument();
  });

  it("applies column className", () => {
    render(<TableSkeleton columns={[{ label: "Col1", className: "w-32" }]} />);
    const th = screen.getByText("Col1");
    expect(th.className).toContain("w-32");
  });
});
