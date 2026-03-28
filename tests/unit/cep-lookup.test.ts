
import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCep } from "@/lib/shared/cep-lookup";

describe("fetchCep", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("should return null for invalid CEP length", async () => {
    const result = await fetchCep("123");
    expect(result).toBeNull();
  });

  it("should return address data for valid CEP", async () => {
    const mockData = {
      cep: "01001-000",
      logradouro: "Praça da Sé",
      bairro: "Sé",
      localidade: "São Paulo",
      uf: "SP"
    };

    (vi.mocked(fetch) as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });

    const result = await fetchCep("01001000");
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith("https://viacep.com.br/ws/01001000/json/", expect.any(Object));
  });

  it("should return null if ViaCEP returns error", async () => {
    (vi.mocked(fetch) as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ erro: true })
    });

    const result = await fetchCep("99999999");
    expect(result).toBeNull();
  });

  it("should return null on fetch failure", async () => {
    (vi.mocked(fetch) as any).mockRejectedValueOnce(new Error("Network error"));

    const result = await fetchCep("01001000");
    expect(result).toBeNull();
  });
});
