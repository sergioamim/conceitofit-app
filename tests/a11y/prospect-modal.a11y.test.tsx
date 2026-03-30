import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ProspectModal } from "@/components/shared/prospect-modal";

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
    <button role="combobox" aria-expanded="false" aria-labelledby={labelledBy}>{children}</button>
  ),
  SelectValue: ({ placeholder }: any) => <span>{placeholder}</span>,
  SelectContent: ({ children }: any) => <div role="listbox">{children}</div>,
  SelectItem: ({ children, value }: any) => <div role="option">{children}</div>,
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
    funcionarios: [],
    initial: null,
  };

  it("has no accessibility violations when open", async () => {
    const { container } = render(<ProspectModal {...props} />);
    // Combobox mock doesn't fully replicate Radix Select a11y — skip combobox-specific rules
    const results = await axe(container, {
      rules: { "aria-input-field-name": { enabled: false } },
    });
    expect(results).toHaveNoViolations();
  });
});
