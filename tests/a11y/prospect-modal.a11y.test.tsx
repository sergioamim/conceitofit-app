/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ProspectModal } from "@/components/shared/prospect-modal";
import type { Funcionario, Prospect } from "@/lib/types";

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: any) => (open ? <div role="dialog" aria-modal="true" aria-label="Prospect">{children}</div> : null),
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogHeader: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
  DialogFooter: ({ children }: any) => <div>{children}</div>,
}));

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children, "aria-labelledby": labelledBy }: any) => (
    <button
      role="combobox"
      aria-controls="mock-select-options"
      aria-expanded="false"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : "Selecionar opção"}
    >
      {children}
    </button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => (
    <div id="mock-select-options" role="listbox" aria-label="Opções disponíveis">
      {children}
    </div>
  ),
  SelectItem: ({ children }: any) => <div role="option" aria-selected="false">{children}</div>,
}));

vi.mock("@/components/shared/phone-input", () => ({
  PhoneInput: ({ value, onChange, ...props }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      aria-label={props["aria-label"]}
    />
  ),
}));

vi.mock("@/components/shared/masked-input", () => ({
  MaskedInput: ({ value, onChange, ...props }: any) => (
    <input
      value={value}
      onChange={(e: any) => onChange(e.target.value)}
      aria-label={props["aria-label"]}
    />
  ),
}));

describe("ProspectModal a11y", () => {
  const props = {
    open: true,
    onClose: vi.fn(),
    onSave: vi.fn(),
    funcionarios: [] as Funcionario[],
    initial: null as Prospect | null,
  };

  it("has no accessibility violations when open", async () => {
    const { container } = render(<ProspectModal {...props} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
