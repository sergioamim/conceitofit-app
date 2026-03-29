import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SuspenseFallback } from "@/components/shared/suspense-fallback";

describe("SuspenseFallback", () => {
  it("renders default message", () => {
    render(<SuspenseFallback />);
    expect(screen.getByText("Carregando...")).toBeInTheDocument();
  });

  it("renders custom message", () => {
    render(<SuspenseFallback message="Carregando dados..." />);
    expect(screen.getByText("Carregando dados...")).toBeInTheDocument();
  });

  it("applies page variant classes", () => {
    const { container } = render(<SuspenseFallback variant="page" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("min-h-screen");
    expect(div.className).toContain("bg-background");
  });

  it("applies section variant classes (default)", () => {
    const { container } = render(<SuspenseFallback />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("min-h-[60vh]");
  });

  it("applies inline variant classes", () => {
    const { container } = render(<SuspenseFallback variant="inline" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("py-8");
    expect(div.className).not.toContain("min-h-screen");
    expect(div.className).not.toContain("min-h-[60vh]");
  });

  it("accepts custom className", () => {
    const { container } = render(<SuspenseFallback className="mt-10" />);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain("mt-10");
  });
});
