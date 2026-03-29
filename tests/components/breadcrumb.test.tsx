import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "@/components/shared/breadcrumb";

describe("Breadcrumb", () => {
  it("renders all items", () => {
    render(
      <Breadcrumb items={[{ label: "Home" }, { label: "Clientes" }, { label: "João" }]} />,
    );
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Clientes")).toBeInTheDocument();
    expect(screen.getByText("João")).toBeInTheDocument();
  });

  it("renders links for items with href", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Clientes", href: "/clientes" },
          { label: "Detalhe" },
        ]}
      />,
    );
    const homeLink = screen.getByText("Home").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");
    const clientesLink = screen.getByText("Clientes").closest("a");
    expect(clientesLink).toHaveAttribute("href", "/clientes");
  });

  it("renders last item as plain text (no link)", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Detalhe" },
        ]}
      />,
    );
    const detalhe = screen.getByText("Detalhe");
    expect(detalhe.closest("a")).toBeNull();
  });

  it("renders separators between items", () => {
    const { container } = render(
      <Breadcrumb items={[{ label: "A" }, { label: "B" }, { label: "C" }]} />,
    );
    // Separators are "/" text between items
    const text = container.textContent ?? "";
    const slashCount = (text.match(/\//g) ?? []).length;
    expect(slashCount).toBe(2);
  });

  it("applies custom className", () => {
    const { container } = render(
      <Breadcrumb items={[{ label: "A" }]} className="mt-4" />,
    );
    expect(container.firstChild).toHaveClass("mt-4");
  });

  it("renders empty when no items", () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.textContent).toBe("");
  });
});
