import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { StatusBadge } from "@/components/shared/status-badge";

vi.mock("framer-motion", () => ({
  motion: {
    span: ({
      children,
      className,
      role,
      "aria-label": ariaLabel,
      "aria-live": ariaLive,
    }: Record<string, unknown>) => (
      <span
        className={className as string}
        role={role as string}
        aria-label={ariaLabel as string}
        aria-live={ariaLive as string}
      >
        {children as React.ReactNode}
      </span>
    ),
  },
  useReducedMotion: () => false,
}));

describe("StatusBadge a11y", () => {
  it("has no accessibility violations for ATIVO", async () => {
    const { container } = render(<StatusBadge status="ATIVO" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for PENDENTE", async () => {
    const { container } = render(<StatusBadge status="PENDENTE" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no accessibility violations for CANCELADO", async () => {
    const { container } = render(<StatusBadge status="CANCELADO" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
