import { test, expect } from "@playwright/test";

test.describe("Sincronização de Estado na URL - Clientes", () => {
  test("deve atualizar a URL ao pesquisar e filtrar", async ({ page }) => {
    // 1. Acessar a página
    await page.goto("/clientes");
    
    // Aguardar página carregar
    await expect(page.getByRole("heading", { name: "Clientes" })).toBeVisible();

    // 2. Fazer uma busca e checar URL debounced
    const searchInput = page.getByPlaceholder("Buscar por nome, CPF, telefone ou e-mail...");
    await searchInput.fill("Teste");
    
    // Aguardar o debounce configurado de 500ms
    await page.waitForTimeout(600);
    
    // URL deve conter ?q=Teste
    expect(page.url()).toContain("q=Teste");

    // 3. Modificar o Status
    const inativosBtn = page.getByRole("button", { name: /Inativos/ });
    await inativosBtn.click();
    
    // URL deve conter ?status=INATIVO e manter q=Teste
    expect(page.url()).toContain("status=INATIVO");
    expect(page.url()).toContain("q=Teste");

    // 4. Testando a navegação de histórico (Back button)
    await page.goBack();
    
    // Volta apenas pro filtro de Texto, sem INATIVO
    expect(page.url()).not.toContain("status=INATIVO");
    expect(page.url()).toContain("q=Teste");
    
    // Volta mais uma vez, deve limpar o Texto
    await page.goBack();
    expect(page.url()).not.toContain("q=Teste");

    // 5. Avançando novamente
    await page.goForward();
    await page.goForward();
    expect(page.url()).toContain("status=INATIVO");

    // 6. Botão Limpar Filtros
    const limparBtn = page.getByRole("button", { name: "Limpar" });
    await expect(limparBtn).toBeVisible();
    await limparBtn.click();

    // Verifica limpeza total
    expect(page.url()).not.toContain("status=INATIVO");
    expect(page.url()).not.toContain("q=Teste");
  });
});
