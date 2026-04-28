import { describe, expect, it } from "vitest";
import {
  normalizeClienteListView,
  resolveClienteListProfileDefault,
} from "@/lib/tenant/comercial/clientes-list-view";

describe("clientes-list-view", () => {
  it("normaliza valores válidos", () => {
    expect(normalizeClienteListView(" FINANCEIRO ")).toBe("financeiro");
    expect(normalizeClienteListView("operacional")).toBe("operacional");
  });

  it("ignora valores inválidos", () => {
    expect(normalizeClienteListView("livre")).toBeUndefined();
    expect(normalizeClienteListView(undefined)).toBeUndefined();
  });

  it("resolve default do perfil", () => {
    expect(resolveClienteListProfileDefault("Financeiro")).toBe("financeiro");
    expect(resolveClienteListProfileDefault("Recepção")).toBe("operacional");
    expect(resolveClienteListProfileDefault("Admin")).toBe("default");
  });
});
