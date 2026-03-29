import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MaskedInput } from "@/components/shared/masked-input";

describe("MaskedInput", () => {
  it("applies CPF mask on change", () => {
    const onChange = vi.fn();
    render(<MaskedInput mask="cpf" value="" onChange={onChange} placeholder="CPF" />);
    const input = screen.getByPlaceholderText("CPF");
    fireEvent.change(input, { target: { value: "12345678901" } });
    expect(onChange).toHaveBeenCalledWith("123.456.789-01");
  });

  it("applies phone mask on change", () => {
    const onChange = vi.fn();
    render(<MaskedInput mask="phone" value="" onChange={onChange} placeholder="Tel" />);
    const input = screen.getByPlaceholderText("Tel");
    fireEvent.change(input, { target: { value: "11999887766" } });
    expect(onChange).toHaveBeenCalledWith("(11) 99988-7766");
  });

  it("applies CEP mask on change", () => {
    const onChange = vi.fn();
    render(<MaskedInput mask="cep" value="" onChange={onChange} placeholder="CEP" />);
    const input = screen.getByPlaceholderText("CEP");
    fireEvent.change(input, { target: { value: "01310100" } });
    expect(onChange).toHaveBeenCalledWith("01310-100");
  });

  it("renders with controlled value", () => {
    render(<MaskedInput mask="cpf" value="123.456.789-01" onChange={vi.fn()} placeholder="CPF" />);
    const input = screen.getByPlaceholderText("CPF") as HTMLInputElement;
    expect(input.value).toBe("123.456.789-01");
  });

  it("forwards additional props", () => {
    render(
      <MaskedInput mask="cpf" value="" onChange={vi.fn()} placeholder="CPF" disabled aria-label="campo cpf" />,
    );
    const input = screen.getByPlaceholderText("CPF");
    expect(input).toBeDisabled();
    expect(input).toHaveAttribute("aria-label", "campo cpf");
  });
});
