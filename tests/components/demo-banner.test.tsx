import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DemoBanner } from "@/components/shared/demo-banner";

// Mock next/navigation
const mockGet = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: mockGet,
  }),
}));

// Mock sessionStorage
const sessionStore = new Map<string, string>();
const mockSessionStorage = {
  getItem: (key: string) => sessionStore.get(key) ?? null,
  setItem: (key: string, value: string) => sessionStore.set(key, value),
  removeItem: (key: string) => sessionStore.delete(key),
  clear: () => sessionStore.clear(),
  get length() { return sessionStore.size; },
  key: (i: number) => [...sessionStore.keys()][i] ?? null,
};

Object.defineProperty(window, "sessionStorage", {
  value: mockSessionStorage,
  writable: true,
  configurable: true,
});

describe("DemoBanner", () => {
  beforeEach(() => {
    mockGet.mockReset();
    sessionStore.clear();
  });

  it("renders nothing when demo param is absent", () => {
    mockGet.mockReturnValue(null);
    const { container } = render(<DemoBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when demo param is not '1'", () => {
    mockGet.mockReturnValue("0");
    const { container } = render(<DemoBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders banner when demo=1", () => {
    mockGet.mockReturnValue("1");
    render(<DemoBanner />);
    expect(screen.getByText("Conta Demonstracao")).toBeInTheDocument();
  });

  it("dismiss button hides the banner", () => {
    mockGet.mockReturnValue("1");
    render(<DemoBanner />);
    expect(screen.getByText("Conta Demonstracao")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Fechar banner"));
    expect(screen.queryByText("Conta Demonstracao")).toBeNull();
  });

  it("dismiss persists to sessionStorage", () => {
    mockGet.mockReturnValue("1");
    render(<DemoBanner />);
    fireEvent.click(screen.getByLabelText("Fechar banner"));

    expect(sessionStore.get("academia-demo-banner-dismissed")).toBe("1");
  });

  it("stays hidden when previously dismissed", () => {
    mockGet.mockReturnValue("1");
    sessionStore.set("academia-demo-banner-dismissed", "1");

    const { container } = render(<DemoBanner />);
    expect(container.firstChild).toBeNull();
  });
});
