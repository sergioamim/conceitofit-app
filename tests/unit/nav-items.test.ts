import { describe, expect, it } from "vitest";
import {
  administrativoItems,
  allNavItems,
  atividadeItems,
  crmItems,
  gerencialItems,
  mainNavItems,
  segurancaItems,
  treinoItems,
} from "@/lib/tenant/nav-items";

describe("nav-items", () => {
  it("mainNavItems contem Dashboard como exact", () => {
    const dash = mainNavItems.find((item) => item.href === "/dashboard");
    expect(dash).toBeDefined();
    expect(dash?.exact).toBe(true);
  });

  it("todos os items têm href, label e icon", () => {
    for (const item of allNavItems) {
      expect(item.href).toMatch(/^\//);
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeDefined();
    }
  });

  it("allNavItems = concat de todas as seções", () => {
    const expected =
      mainNavItems.length +
      atividadeItems.length +
      treinoItems.length +
      crmItems.length +
      segurancaItems.length +
      administrativoItems.length +
      gerencialItems.length;
    expect(allNavItems).toHaveLength(expected);
  });

  it("hrefs únicos em allNavItems", () => {
    const hrefs = allNavItems.map((item) => item.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("treinoItems contém Treinos como exact (raiz)", () => {
    const root = treinoItems.find((item) => item.href === "/treinos");
    expect(root?.exact).toBe(true);
  });

  it("crmItems contém Workspace CRM como exact", () => {
    const root = crmItems.find((item) => item.href === "/crm");
    expect(root?.exact).toBe(true);
  });

  it("mainNavItems inclui pelo menos prospects, clientes, matriculas, pagamentos", () => {
    const hrefs = mainNavItems.map((i) => i.href);
    expect(hrefs).toEqual(
      expect.arrayContaining([
        "/prospects",
        "/clientes",
        "/matriculas",
        "/pagamentos",
      ]),
    );
  });

  it("administrativoItems inclui NFS-e, billing, integracoes", () => {
    const hrefs = administrativoItems.map((i) => i.href);
    expect(hrefs).toContain("/administrativo/nfse");
    expect(hrefs).toContain("/administrativo/billing");
    expect(hrefs).toContain("/administrativo/integracoes");
  });

  it("gerencialItems inclui BI, DRE, contabilidade", () => {
    const hrefs = gerencialItems.map((i) => i.href);
    expect(hrefs).toContain("/gerencial/bi");
    expect(hrefs).toContain("/gerencial/dre");
    expect(hrefs).toContain("/gerencial/contabilidade");
  });

  it("segurancaItems tem exatamente 2 itens", () => {
    expect(segurancaItems).toHaveLength(2);
  });
});
