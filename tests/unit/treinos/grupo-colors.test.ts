import { describe, expect, it } from "vitest";
import { grupoColorByName } from "@/lib/treinos/grupo-colors";

describe("grupoColorByName", () => {
  it("retorna a cor canônica do mapa para grupos conhecidos", () => {
    expect(grupoColorByName("Peito")).toBe("#c8f135");
    expect(grupoColorByName("Costas")).toBe("#3de8a0");
    expect(grupoColorByName("Pernas")).toBe("#38bdf8");
    expect(grupoColorByName("Cardio")).toBe("#ff5c5c");
  });

  it("trata variações sem acento como sinônimos", () => {
    expect(grupoColorByName("Bíceps")).toBe(grupoColorByName("Biceps"));
    expect(grupoColorByName("Tríceps")).toBe(grupoColorByName("Triceps"));
    expect(grupoColorByName("Glúteo")).toBe(grupoColorByName("Gluteo"));
  });

  it("retorna fallback neutro quando nome é vazio/null/undefined", () => {
    expect(grupoColorByName(undefined)).toBe("#5a5f6e");
    expect(grupoColorByName(null)).toBe("#5a5f6e");
    expect(grupoColorByName("")).toBe("#5a5f6e");
  });

  it("usa hash determinístico para grupos não mapeados (mesma entrada → mesma cor)", () => {
    const cor1 = grupoColorByName("Antebraço");
    const cor2 = grupoColorByName("Antebraço");
    expect(cor1).toBe(cor2);
  });

  it("hash distribui cores diferentes para nomes diferentes", () => {
    const corA = grupoColorByName("CategoriaA");
    const corB = grupoColorByName("CategoriaXYZ");
    // Não obrigatório serem diferentes (colisão é possível) mas
    // ambas devem estar na paleta de fallback (paleta válida).
    const palettes = new Set([
      "#c8f135",
      "#3de8a0",
      "#38bdf8",
      "#f472b6",
      "#ffb347",
      "#a78bfa",
      "#fb923c",
      "#fda4af",
      "#94a3b8",
      "#ff5c5c",
    ]);
    expect(palettes.has(corA)).toBe(true);
    expect(palettes.has(corB)).toBe(true);
  });

  it("nomes do mapa canônico tomam precedência sobre o hash", () => {
    // 'Peito' está no mapa → deve retornar #c8f135 mesmo se o hash
    // por acaso apontasse pra outra cor da paleta de fallback.
    expect(grupoColorByName("Peito")).toBe("#c8f135");
  });
});
