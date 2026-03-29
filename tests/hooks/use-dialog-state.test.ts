import { describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDialogState } from "@/hooks/use-dialog-state";

describe("useDialogState", () => {
  it("initializes as closed by default", () => {
    const { result } = renderHook(() => useDialogState());
    expect(result.current.isOpen).toBe(false);
  });

  it("initializes as open when initialOpen=true", () => {
    const { result } = renderHook(() => useDialogState(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("open() sets isOpen to true", () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.open());
    expect(result.current.isOpen).toBe(true);
  });

  it("close() sets isOpen to false", () => {
    const { result } = renderHook(() => useDialogState(true));
    act(() => result.current.close());
    expect(result.current.isOpen).toBe(false);
  });

  it("toggle() inverts state", () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.isOpen).toBe(false);
  });

  it("onOpenChange(true) opens dialog", () => {
    const { result } = renderHook(() => useDialogState());
    act(() => result.current.onOpenChange(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("onOpenChange(false) closes dialog", () => {
    const { result } = renderHook(() => useDialogState(true));
    act(() => result.current.onOpenChange(false));
    expect(result.current.isOpen).toBe(false);
  });
});
