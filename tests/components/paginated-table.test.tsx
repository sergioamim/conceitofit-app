
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PaginatedTable } from "@/components/shared/paginated-table";

const mockColumns = [
  { label: "Nome" },
  { label: "Email" },
];

const mockItems = [
  { id: "1", nome: "Item 1", email: "item1@test.com" },
  { id: "2", nome: "Item 2", email: "item2@test.com" },
];

const renderCells = (item: typeof mockItems[0]) => (
  <>
    <td>{item.nome}</td>
    <td>{item.email}</td>
  </>
);

describe("PaginatedTable", () => {
  it("renders table with data", () => {
    render(
      <PaginatedTable 
        columns={mockColumns} 
        items={mockItems} 
        emptyText="Nenhum item encontrado" 
        getRowKey={(i) => i.id}
        renderCells={renderCells}
      />
    );
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders empty state when no items", () => {
    render(
      <PaginatedTable 
        columns={mockColumns} 
        items={[]} 
        emptyText="Nenhum item encontrado" 
        getRowKey={(i) => i.id}
        renderCells={renderCells}
      />
    );
    expect(screen.getByText("Nenhum item encontrado")).toBeInTheDocument();
  });

  it("calls onNext when next button is clicked", () => {
    const onNext = vi.fn();
    render(
      <PaginatedTable 
        columns={mockColumns} 
        items={mockItems} 
        emptyText="Nenhum item encontrado" 
        getRowKey={(i) => i.id}
        renderCells={renderCells}
        onNext={onNext}
        showPagination={true}
        hasNext={true}
      />
    );
    const nextBtn = screen.getByText("Próxima");
    fireEvent.click(nextBtn);
    expect(onNext).toHaveBeenCalled();
  });

  it("disables previous button when at first page", () => {
    render(
      <PaginatedTable 
        columns={mockColumns} 
        items={mockItems} 
        emptyText="Nenhum item encontrado" 
        getRowKey={(i) => i.id}
        renderCells={renderCells}
        showPagination={true}
        disablePrevious={true}
      />
    );
    const prevBtn = screen.getByText("Anterior");
    expect(prevBtn).toBeDisabled();
  });
});
