import { describe, expect, it } from "vitest";
import { buildSystemHealthSnapshot } from "@/lib/status/system-health";

describe("system health snapshot", () => {
  it("normaliza frontend, backend, banco e storage quando o backend responde componentes", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 14,
        data: {
          status: "ok",
          timestamp: "2026-04-01T10:00:00.000Z",
          uptime: 321,
        },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 48,
        data: {
          status: "UP",
          timestamp: "2026-04-01T10:00:01.000Z",
          components: {
            db: { status: "UP" },
            storage: { status: "DOWN" },
          },
        },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    expect(snapshot.checkedAt).toBe("2026-04-01T10:00:01.000Z");
    expect(snapshot.cards.map((card) => [card.id, card.status])).toEqual([
      ["frontend", "UP"],
      ["backend", "UP"],
      ["database", "UP"],
      ["storage", "DOWN"],
    ]);
    expect(snapshot.cards.find((card) => card.id === "frontend")?.detail).toBe("Uptime 321s");
  });

  it("derruba backend, banco e storage quando o health check do backend falha", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 12,
        data: {
          status: "ok",
          timestamp: "2026-04-01T10:00:00.000Z",
        },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: false,
        checkedAt: "2026-04-01T10:00:02.000Z",
        latencyMs: 5000,
        data: null,
        errorMessage: "fetch failed",
        responseStatus: null,
      },
    });

    expect(snapshot.cards.find((card) => card.id === "backend")).toMatchObject({
      status: "DOWN",
      detail: "fetch failed",
    });
    expect(snapshot.cards.find((card) => card.id === "database")).toMatchObject({
      status: "DOWN",
      detail: "fetch failed",
    });
    expect(snapshot.cards.find((card) => card.id === "storage")).toMatchObject({
      status: "DOWN",
      detail: "fetch failed",
    });
  });

  it("marca componentes ausentes como down para expor dependência incompleta do backend", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 8,
        data: {
          status: "UP",
          timestamp: "2026-04-01T10:00:00.000Z",
        },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:05.000Z",
        latencyMs: 25,
        data: {
          status: "UP",
          timestamp: "2026-04-01T10:00:05.000Z",
          components: {},
        },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    expect(snapshot.cards.find((card) => card.id === "database")).toMatchObject({
      status: "DOWN",
      detail: "Componente não retornado pelo backend.",
    });
    expect(snapshot.cards.find((card) => card.id === "storage")).toMatchObject({
      status: "DOWN",
      detail: "Componente não retornado pelo backend.",
    });
  });
});
