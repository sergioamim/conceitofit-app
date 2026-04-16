import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SuggestionInput,
  type SuggestionOption,
} from "@/components/shared/suggestion-input";

const OPTIONS: SuggestionOption[] = [
  { id: "1", label: "Academia Centro" },
  { id: "2", label: "Academia Norte" },
  { id: "3", label: "Academia Sul" },
];

describe("SuggestionInput", () => {
  function ControlledSuggestionInput() {
    const [value, setValue] = useState("");

    return (
      <SuggestionInput
        value={value}
        onValueChange={setValue}
        onSelect={vi.fn()}
        options={OPTIONS}
        minCharsToSearch={2}
        showAllOnFocus
      />
    );
  }

  it("mostra opcoes ao focar quando showAllOnFocus estiver ativo", () => {
    render(
      <SuggestionInput
        value=""
        onValueChange={vi.fn()}
        onSelect={vi.fn()}
        options={OPTIONS}
        minCharsToSearch={2}
        showAllOnFocus
      />
    );

    fireEvent.focus(screen.getByRole("combobox"));

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Academia Centro" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Academia Norte" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Academia Sul" })).toBeInTheDocument();
  });

  it("volta a filtrar normalmente ao digitar depois de abrir preview geral", () => {
    render(<ControlledSuggestionInput />);

    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "nor" } });

    expect(screen.getByRole("option", { name: "Academia Norte" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Academia Centro" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Academia Sul" })).not.toBeInTheDocument();
  });
});
