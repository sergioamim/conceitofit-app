import { describe, expect, it } from "vitest";
import {
  allGroups,
  allNavItems,
  financeGroup,
  growthGroup,
  operationGroup,
  strategyGroup,
  type NavGroup,
  type NavItem,
} from "@/lib/tenant/nav-items";

describe("nav-items", () => {
  it("exporta 4 grupos na ordem correta", () => {
    expect(allGroups).toHaveLength(5);
    expect(allGroups.map((g) => g.label)).toEqual([
      "Crescimento",
      "Operação",
      "Financeiro",
      "Gestão de Acesso",
      "Estratégico",
    ]);
  });

  it("cada grupo tem label, icon e items válidos", () => {
    for (const group of allGroups) {
      expect(group.label).toBeTruthy();
      expect(group.icon).toBeDefined();
      expect(Array.isArray(group.items)).toBe(true);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it("todos os items têm href, label e icon válidos", () => {
    for (const item of allNavItems) {
      expect(item.href).toMatch(/^\//);
      expect(item.label).toBeTruthy();
      expect(item.icon).toBeDefined();
    }
  });

  it("allNavItems = flatMap de todos os grupos", () => {
    const expected = allGroups.reduce(
      (sum, group) => sum + group.items.length,
      0,
    );
    expect(allNavItems).toHaveLength(expected);
  });

  it("hrefs únicos em allNavItems", () => {
    const hrefs = allNavItems.map((item) => item.href);
    const unique = new Set(hrefs);
    expect(unique.size).toBe(hrefs.length);
  });

  it("growthGroup contém prospects, crm e retenção", () => {
    const hrefs = growthGroup.items.map((i) => i.href);
    expect(hrefs).toContain("/prospects");
    expect(hrefs).toContain("/crm");
    expect(hrefs).toContain("/crm/retencao");
    expect(hrefs).toContain("/retencao/nps");
    expect(hrefs).toContain("/comercial/fidelizacao");
  });

  it("operationGroup contém planos, contratos, treinos e grade", () => {
    const hrefs = operationGroup.items.map((i) => i.href);
    expect(hrefs).toContain("/planos");
    expect(hrefs).toContain("/matriculas");
    expect(hrefs).toContain("/grade");
    expect(hrefs).toContain("/treinos");
    expect(hrefs).toContain("/clientes");
    expect(hrefs).toContain("/atendimento/inbox");
  });

  it("financeGroup contém pagamentos, DRE (não) e billing", () => {
    const hrefs = financeGroup.items.map((i) => i.href);
    expect(hrefs).toContain("/pagamentos");
    expect(hrefs).toContain("/administrativo/billing");
    expect(hrefs).toContain("/administrativo/billing/dashboard");
    expect(hrefs).toContain("/financeiro/dunning");
    expect(hrefs).toContain("/administrativo/conciliacao-bancaria");
  });

  it("strategyGroup contém dashboard, BI e admin", () => {
    const hrefs = strategyGroup.items.map((i) => i.href);
    expect(hrefs).toContain("/dashboard");
    expect(hrefs).toContain("/gerencial/bi");
    expect(hrefs).toContain("/gerencial/dre");
    expect(hrefs).toContain("/administrativo/academia");
  });

  it("Gestão de Acesso substitui o antigo atalho de RBAC", () => {
    const accessGroup = allGroups.find((group) => group.label === "Gestão de Acesso");
    const hrefs = accessGroup?.items.map((item) => item.href) ?? [];
    expect(hrefs).toContain("/gestao-acessos");
    expect(hrefs).toContain("/gestao-acessos/usuarios");
    expect(hrefs).toContain("/gestao-acessos/papeis");
  });

  it("Dashboard é marcado como exact", () => {
    const dash = strategyGroup.items.find((i) => i.href === "/dashboard");
    expect(dash?.exact).toBe(true);
  });

  it("Treinos (raiz) é marcado como exact para não colidir com /treinos/*", () => {
    const treinos = operationGroup.items.find((i) => i.href === "/treinos");
    expect(treinos?.exact).toBe(true);
  });

  it("Workspace CRM é marcado como exact", () => {
    const crm = growthGroup.items.find((i) => i.href === "/crm");
    expect(crm?.exact).toBe(true);
  });

  it("NavItem aceita description opcional", () => {
    const item: NavItem = {
      href: "/teste",
      label: "Teste",
      icon: operationGroup.items[0].icon,
      description: "Descrição",
    };
    expect(item.description).toBe("Descrição");
  });

  it("NavGroup é tipado corretamente", () => {
    const group: NavGroup = growthGroup;
    expect(group.label).toBe("Crescimento");
  });
});
