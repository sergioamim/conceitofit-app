import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/components/shared/status-badge";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    span: (props: Record<string, unknown>) => {
      const { children, className, role, "aria-label": ariaLabel, "aria-live": ariaLive, ...rest } = props;
      return (
        <span
          className={className as string}
          role={role as string}
          aria-label={ariaLabel as string}
          aria-live={ariaLive as React.AriaAttributes["aria-live"]}
        >
          {children as React.ReactNode}
        </span>
      );
    },
  },
  useReducedMotion: () => false,
}));

describe("StatusBadge", () => {
  it("renders the correct label for ATIVO status", () => {
    render(<StatusBadge status="ATIVO" />);
    expect(screen.getByText("Ativo")).toBeInTheDocument();
  });

  it("renders the correct label for PENDENTE status", () => {
    render(<StatusBadge status="PENDENTE" />);
    expect(screen.getByText("Pendente")).toBeInTheDocument();
  });

  it("renders the correct label for PAGO status", () => {
    render(<StatusBadge status="PAGO" />);
    expect(screen.getByText("Pago")).toBeInTheDocument();
  });

  it("renders the correct label for CANCELADO status", () => {
    render(<StatusBadge status="CANCELADO" />);
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
  });

  it("renders the correct label for NOVO prospect status", () => {
    render(<StatusBadge status="NOVO" />);
    expect(screen.getByText("Novo")).toBeInTheDocument();
  });

  it("renders the correct label for CONVERTIDO status", () => {
    render(<StatusBadge status="CONVERTIDO" />);
    expect(screen.getByText("Convertido")).toBeInTheDocument();
  });

  it("renders the correct label for PERDIDO status", () => {
    render(<StatusBadge status="PERDIDO" />);
    expect(screen.getByText("Perdido")).toBeInTheDocument();
  });

  it("has correct aria-label", () => {
    render(<StatusBadge status="ATIVO" />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Status: Ativo",
    );
  });

  it("falls back to raw status for unknown values", () => {
    // @ts-expect-error testing unknown status
    render(<StatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("UNKNOWN_STATUS")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<StatusBadge status="ATIVO" className="extra-class" />);
    const badge = screen.getByRole("status");
    expect(badge.className).toContain("extra-class");
  });
});
