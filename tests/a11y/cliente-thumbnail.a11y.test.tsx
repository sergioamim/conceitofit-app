import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ClienteThumbnail } from "@/components/shared/cliente-thumbnail";

vi.mock("next/image", () => ({
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

describe("ClienteThumbnail a11y", () => {
  it("has no violations with initials", async () => {
    const { container } = render(<ClienteThumbnail nome="Ana Costa" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("has no violations with photo", async () => {
    const { container } = render(
      <ClienteThumbnail nome="Ana Costa" foto="/photo.jpg" />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
