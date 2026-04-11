import { describe, expect, it } from "vitest";
import {
  buildSystemHealthSnapshot,
  formatHealthTimestamp,
} from "@/lib/status/system-health";

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

  it("frontend sem uptime retorna detail null", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 10,
        data: { status: "UP", timestamp: "2026-04-01T10:00:00.000Z" },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 20,
        data: { status: "UP", components: {} },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    expect(snapshot.cards.find((c) => c.id === "frontend")?.detail).toBeNull();
  });

  it("frontend com falha tem detail do errorMessage", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: false,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 5000,
        data: null,
        errorMessage: "timeout",
        responseStatus: null,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 20,
        data: { status: "UP", components: { db: { status: "UP" } } },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    const frontCard = snapshot.cards.find((c) => c.id === "frontend");
    expect(frontCard?.status).toBe("DOWN");
    expect(frontCard?.detail).toBe("timeout");
  });

  it("normaliza status não reconhecido para DOWN", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 10,
        data: { status: "weird-value" },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 20,
        data: { status: "UP", components: {} },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    expect(snapshot.cards.find((c) => c.id === "frontend")?.status).toBe("DOWN");
  });

  it("aceita variações de status OK/ONLINE/HEALTHY", () => {
    const makeBackend = (status: string) => ({
      ok: true,
      checkedAt: "2026-04-01T10:00:01.000Z",
      latencyMs: 20,
      data: { status, components: {} },
      errorMessage: null,
      responseStatus: 200,
    });

    for (const status of ["OK", "UP", "ONLINE", "HEALTHY", "ok", "Online"]) {
      const snapshot = buildSystemHealthSnapshot({
        frontend: {
          ok: true,
          checkedAt: "2026-04-01T10:00:00.000Z",
          latencyMs: 10,
          data: { status: "UP" },
          errorMessage: null,
          responseStatus: 200,
        },
        backend: makeBackend(status),
      });
      expect(snapshot.cards.find((c) => c.id === "backend")?.status).toBe("UP");
    }
  });

  it("encontra componentes por aliases alternativos (database, postgres, s3)", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 10,
        data: { status: "UP" },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 20,
        data: {
          status: "UP",
          components: {
            postgres: { status: "UP" },
            s3: { status: "UP" },
          },
        },
        errorMessage: null,
        responseStatus: 200,
      },
    });

    expect(snapshot.cards.find((c) => c.id === "database")?.status).toBe("UP");
    expect(snapshot.cards.find((c) => c.id === "storage")?.status).toBe("UP");
  });

  it("backend com HTTP status mas sem errorMessage usa 'HTTP N' como detail", () => {
    const snapshot = buildSystemHealthSnapshot({
      frontend: {
        ok: true,
        checkedAt: "2026-04-01T10:00:00.000Z",
        latencyMs: 10,
        data: { status: "UP" },
        errorMessage: null,
        responseStatus: 200,
      },
      backend: {
        ok: false,
        checkedAt: "2026-04-01T10:00:01.000Z",
        latencyMs: 30,
        data: null,
        errorMessage: null,
        responseStatus: 503,
      },
    });

    expect(snapshot.cards.find((c) => c.id === "backend")?.detail).toBe("HTTP 503");
  });

  it("formatHealthTimestamp formata ISO pt-BR", () => {
    const result = formatHealthTimestamp("2026-04-10T14:30:45.000Z");
    // Varia por timezone mas contém dígitos e separadores
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
  });
});
