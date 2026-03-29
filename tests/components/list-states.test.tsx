import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  EmptyState,
  ListErrorState,
  ListLoadingSkeleton,
} from "@/components/shared/list-states";

describe("EmptyState", () => {
  it("renders default message for list variant", () => {
    render(<EmptyState />);
    expect(screen.getByText(/nenhum registro/i)).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<EmptyState message="Sem dados disponíveis" />);
    expect(screen.getByText("Sem dados disponíveis")).toBeInTheDocument();
  });

  it("renders search variant message", () => {
    render(<EmptyState variant="search" />);
    expect(screen.getByText(/nenhum resultado/i)).toBeInTheDocument();
  });

  it("renders action node when provided", () => {
    render(<EmptyState action={<button>Criar novo</button>} />);
    expect(screen.getByText("Criar novo")).toBeInTheDocument();
  });
});

describe("ListErrorState", () => {
  it("renders error message string", () => {
    render(<ListErrorState error="Falha na conexão" />);
    expect(screen.getByText(/falha na conexão/i)).toBeInTheDocument();
  });

  it("renders retry button when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ListErrorState error="Erro" onRetry={onRetry} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("does not render retry button without onRetry", () => {
    render(<ListErrorState error="Erro" />);
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("has role alert and aria-live assertive", () => {
    render(<ListErrorState error="Erro" />);
    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });
});

describe("ListLoadingSkeleton", () => {
  it("renders default 5 rows", () => {
    render(<ListLoadingSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    // 5 rows of skeleton elements
    const skeletons = status.querySelectorAll("[class*='animate-pulse']");
    expect(skeletons.length).toBeGreaterThanOrEqual(5);
  });

  it("renders custom number of rows", () => {
    render(<ListLoadingSkeleton rows={3} />);
    const status = screen.getByRole("status");
    const rows = status.querySelectorAll("[class*='animate-pulse']");
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it("has aria-live polite", () => {
    render(<ListLoadingSkeleton />);
    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
  });
});
