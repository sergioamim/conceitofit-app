import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { DemoBanner } from "@/components/shared/demo-banner";

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

// Helper to set window.location.search
function setLocationSearch(search: string) {
  Object.defineProperty(window, "location", {
    value: { ...window.location, search },
    writable: true,
    configurable: true,
  });
}

describe("DemoBanner", () => {
  beforeEach(() => {
    sessionStore.clear();
    setLocationSearch("");
  });

  it("renders nothing when demo param is absent", async () => {
    setLocationSearch("");
    const { container } = render(<DemoBanner />);
    // After useEffect, isDemo stays false → returns null
    await act(() => Promise.resolve());
    expect(container.querySelector("[aria-label='Fechar banner']")).toBeNull();
  });

  it("renders nothing when demo param is not '1'", async () => {
    setLocationSearch("?demo=0");
    const { container } = render(<DemoBanner />);
    await act(() => Promise.resolve());
    expect(container.querySelector("[aria-label='Fechar banner']")).toBeNull();
  });

  it("renders banner when demo=1", async () => {
    setLocationSearch("?demo=1");
    render(<DemoBanner />);
    await act(() => Promise.resolve());
    expect(screen.getByText("Conta Demonstracao")).toBeInTheDocument();
  });

  it("dismiss button hides the banner", async () => {
    setLocationSearch("?demo=1");
    render(<DemoBanner />);
    await act(() => Promise.resolve());
    expect(screen.getByText("Conta Demonstracao")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("Fechar banner"));
    expect(screen.queryByText("Conta Demonstracao")).toBeNull();
  });

  it("dismiss persists to sessionStorage", async () => {
    setLocationSearch("?demo=1");
    render(<DemoBanner />);
    await act(() => Promise.resolve());
    fireEvent.click(screen.getByLabelText("Fechar banner"));

    expect(sessionStore.get("academia-demo-banner-dismissed")).toBe("1");
  });

  it("stays hidden when previously dismissed", async () => {
    setLocationSearch("?demo=1");
    sessionStore.set("academia-demo-banner-dismissed", "1");

    const { container } = render(<DemoBanner />);
    await act(() => Promise.resolve());
    expect(container.querySelector("[aria-label='Fechar banner']")).toBeNull();
  });
});
