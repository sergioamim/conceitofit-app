import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExportMenu } from "@/components/shared/export-menu";

// Mock export utilities
vi.mock("@/lib/export/table-export", () => ({
  exportToCSV: vi.fn(),
  exportToPDF: vi.fn().mockResolvedValue(undefined),
}));

const columns = [
  { label: "Nome", accessor: (r: { nome: string }) => r.nome },
];
const data = [{ nome: "Teste" }];

describe("ExportMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders export button", () => {
    render(<ExportMenu data={data} columns={columns} filename="test" />);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("disables button when data is empty", () => {
    render(<ExportMenu data={[]} columns={columns} filename="test" />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables button when disabled prop is true", () => {
    render(<ExportMenu data={data} columns={columns} filename="test" disabled />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("toggles menu on button click", () => {
    render(<ExportMenu data={data} columns={columns} filename="test" />);
    fireEvent.click(screen.getByText("Exportar"));
    expect(screen.getByText("Exportar CSV")).toBeInTheDocument();
    expect(screen.getByText(/Exportar PDF/)).toBeInTheDocument();
  });

  it("calls exportToCSV on CSV click", async () => {
    const { exportToCSV } = await import("@/lib/export/table-export");
    render(<ExportMenu data={data} columns={columns} filename="test" />);
    fireEvent.click(screen.getByText("Exportar"));
    fireEvent.click(screen.getByText("Exportar CSV"));
    expect(exportToCSV).toHaveBeenCalledWith(data, columns, "test");
  });
});
