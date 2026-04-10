import { afterEach, describe, expect, it, vi } from "vitest";
import { playNewMessageSound } from "@/lib/utils/notification-sound";

describe("playNewMessageSound (Task #517)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("não lança quando AudioContext indisponível (silently fail)", () => {
    vi.stubGlobal("AudioContext", undefined);
    vi.stubGlobal("webkitAudioContext", undefined);

    expect(() => playNewMessageSound()).not.toThrow();
  });

  it("cria oscillator e gain, conecta e inicia em 300ms", () => {
    const stop = vi.fn();
    const start = vi.fn();
    const connect = vi.fn();
    const setValueAtTime = vi.fn();
    const exponentialRampToValueAtTime = vi.fn();
    const close = vi.fn().mockResolvedValue(undefined);

    const fakeCtx = {
      currentTime: 0,
      destination: {},
      close,
      createOscillator: () => ({
        type: "",
        frequency: { setValueAtTime, exponentialRampToValueAtTime },
        connect,
        start,
        stop,
        onended: null as (() => void) | null,
      }),
      createGain: () => ({
        gain: { setValueAtTime, exponentialRampToValueAtTime },
        connect,
      }),
    };

    // Usa `function` (não arrow) para permitir chamada via `new`.
    const ctorSpy = vi.fn();
    function FakeCtor(this: unknown): unknown {
      ctorSpy();
      return fakeCtx;
    }
    const g = globalThis as unknown as Record<string, unknown>;
    const prev = g.AudioContext;
    g.AudioContext = FakeCtor as unknown;
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).AudioContext =
        FakeCtor as unknown;
    }

    try {
      playNewMessageSound();
      expect(ctorSpy).toHaveBeenCalledTimes(1);
      expect(start).toHaveBeenCalledWith(0);
      expect(stop).toHaveBeenCalledWith(0.3);
      expect(connect).toHaveBeenCalled();
    } finally {
      g.AudioContext = prev;
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).AudioContext = prev;
      }
    }
  });

  it("tolera erro na criação do contexto (silently fail)", () => {
    function ThrowingCtor() {
      throw new Error("audio not allowed");
    }
    const g = globalThis as unknown as Record<string, unknown>;
    const prev = g.AudioContext;
    g.AudioContext = ThrowingCtor as unknown;
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).AudioContext =
        ThrowingCtor as unknown;
    }

    try {
      expect(() => playNewMessageSound()).not.toThrow();
    } finally {
      g.AudioContext = prev;
      if (typeof window !== "undefined") {
        (window as unknown as Record<string, unknown>).AudioContext = prev;
      }
    }
  });
});
