import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  TenantPicker,
  type TenantOption,
} from "@/components/admin/agregadores/tenant-picker";

const TENANTS: TenantOption[] = [
  { id: "t1", nome: "Conceito Fit Centro", academiaNome: "Rede A" },
  { id: "t2", nome: "Conceito Fit Norte", academiaNome: "Rede A" },
  { id: "t3", nome: "Power Gym", academiaNome: "Rede B" },
];

describe("AG-7.7 — TenantPicker", () => {
  it("renderiza lista de tenants acessíveis ao admin", () => {
    render(<TenantPicker tenants={TENANTS} onSelect={vi.fn()} />);

    expect(screen.getByTestId("tenant-picker-grid")).toBeInTheDocument();
    expect(screen.getByText("Conceito Fit Centro")).toBeInTheDocument();
    expect(screen.getByText("Conceito Fit Norte")).toBeInTheDocument();
    expect(screen.getByText("Power Gym")).toBeInTheDocument();
  });

  it("filtra tenants pelo input de busca", () => {
    render(<TenantPicker tenants={TENANTS} onSelect={vi.fn()} />);

    const search = screen.getByTestId("tenant-picker-search");
    fireEvent.change(search, { target: { value: "norte" } });

    expect(screen.getByText("Conceito Fit Norte")).toBeInTheDocument();
    expect(screen.queryByText("Conceito Fit Centro")).not.toBeInTheDocument();
    expect(screen.queryByText("Power Gym")).not.toBeInTheDocument();
  });

  it("chama onSelect com o id do tenant ao clicar no card", () => {
    const onSelect = vi.fn();
    render(<TenantPicker tenants={TENANTS} onSelect={onSelect} />);

    fireEvent.click(screen.getByTestId("tenant-option-t2"));

    expect(onSelect).toHaveBeenCalledWith("t2");
  });

  it("exibe empty state quando nenhuma academia esta disponivel", () => {
    render(<TenantPicker tenants={[]} onSelect={vi.fn()} />);

    expect(screen.getByTestId("tenant-picker-empty")).toBeInTheDocument();
    expect(screen.getByText("Sem academias acessíveis.")).toBeInTheDocument();
  });
});
