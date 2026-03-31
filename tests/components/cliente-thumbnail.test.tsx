import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";

vi.mock("next/image", () => ({
  default: ({ alt, src }: any) => <img alt={alt} src={src} data-testid="next-image" />,
}));

describe("ClienteThumbnail", () => {
  it("renders initials when no photo is provided", () => {
    render(<ClienteThumbnail nome="João Silva" />);
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("renders single initial for single name", () => {
    render(<ClienteThumbnail nome="Maria" />);
    expect(screen.getByText("M")).toBeInTheDocument();
  });

  it("renders fallback initials for empty name", () => {
    render(<ClienteThumbnail nome="" />);
    expect(screen.getByText("CL")).toBeInTheDocument();
  });

  it("renders fallback for null name", () => {
    render(<ClienteThumbnail nome={null} />);
    expect(screen.getByText("CL")).toBeInTheDocument();
  });

  it("renders image when foto is provided", () => {
    render(<ClienteThumbnail nome="Ana" foto="/photo.jpg" />);
    expect(screen.getByTestId("next-image")).toBeInTheDocument();
  });

  it("uses custom alt text when provided", () => {
    render(<ClienteThumbnail nome="Ana" foto="/photo.jpg" alt="Custom alt" />);
    expect(screen.getByAltText("Custom alt")).toBeInTheDocument();
  });

  it("uses name as alt text when no alt provided", () => {
    render(<ClienteThumbnail nome="Ana Costa" foto="/photo.jpg" />);
    expect(screen.getByAltText("Ana Costa")).toBeInTheDocument();
  });

  it("takes first two words for initials", () => {
    render(<ClienteThumbnail nome="Ana Maria Costa" />);
    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<ClienteThumbnail nome="X" className="my-class" />);
    expect(container.firstChild).toHaveClass("my-class");
  });
});
