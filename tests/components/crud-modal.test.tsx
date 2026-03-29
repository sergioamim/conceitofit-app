
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CrudModal } from "@/components/shared/crud-modal";
import { z } from "zod";

// Mock Dialog to avoid Radix UI complexities in unit tests
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <div>{children}</div>,
  DialogDescription: ({ children }: any) => <div>{children}</div>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

describe("CrudModal", () => {
  const schema = z.object({
    nome: z.string().min(1, "Obrigatório"),
  });

  const fields = [
    { name: "nome", label: "Nome completo", type: "text" as const, required: true },
  ];

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    title: "Novo Item",
    description: "Preencha os campos abaixo",
    fields: fields,
    schema: schema,
  };

  it("renders with correct title and fields", () => {
    render(<CrudModal {...defaultProps} />);
    expect(screen.getByText("Novo Item")).toBeInTheDocument();
    expect(screen.getByLabelText("Nome completo")).toBeInTheDocument();
  });

  it("calls onClose when cancel button is clicked", () => {
    render(<CrudModal {...defaultProps} />);
    const cancelBtn = screen.getByText("Cancelar");
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave with data when valid", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<CrudModal {...defaultProps} onSave={onSave} />);
    
    const input = screen.getByLabelText("Nome completo");
    fireEvent.change(input, { target: { value: "Teste Item" } });
    
    const saveBtn = screen.getByText("Criar");
    fireEvent.click(saveBtn);
    
    // Wait for submit handler
    await vi.waitFor(() => expect(onSave).toHaveBeenCalledWith({ nome: "Teste Item" }, undefined));
  });
});
