import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorState } from "@/components/shared/error-state";

// Mock logger to avoid console output
vi.mock("@/lib/shared/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

describe("ErrorState", () => {
  it("renders default title", () => {
    render(<ErrorState error={new Error("Something broke")} />);
    expect(screen.getByText(/algo deu errado|erro/i)).toBeInTheDocument();
  });

  it("renders custom title", () => {
    render(<ErrorState error={new Error("Fail")} title="Falha crítica" />);
    expect(screen.getByText("Falha crítica")).toBeInTheDocument();
  });

  it("renders error message", () => {
    render(<ErrorState error={new Error("Conexão recusada")} />);
    expect(screen.getByText(/conexão recusada/i)).toBeInTheDocument();
  });

  it("renders reset button when reset provided", () => {
    const reset = vi.fn();
    render(<ErrorState error={new Error("Err")} reset={reset} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(reset).toHaveBeenCalledOnce();
  });

  it("does not render reset button without reset prop", () => {
    render(<ErrorState error={new Error("Err")} />);
    expect(screen.queryByRole("button")).toBeNull();
  });
});
