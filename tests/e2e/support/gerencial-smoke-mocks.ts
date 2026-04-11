import type { Page } from "@playwright/test";

/**
 * Catch-all de fallback para "smoke tests" de páginas gerenciais.
 *
 * Resposta padrão para qualquer rota `/api/v1/*` que não foi interceptada
 * explicitamente por outro handler:
 *   - GET sem query → array vazio `[]`
 *   - GET com `envelope=true` → `{ items: [], page: 0, size: 20, hasNext: false }`
 *   - GET com `tenantId` → objeto vazio `{}`
 *   - POST/PUT/PATCH/DELETE → 200 vazio `{}`
 *   - 404 → mantém o default (404 amigável)
 *
 * Usado em specs que só precisam garantir que a tela renderiza sem quebrar
 * com um dataset vazio (cenário feliz do happy path "lista carrega vazia").
 */
export async function installGerencialCatchAll(page: Page): Promise<void> {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());

    if (method === "GET") {
      // Heurística simples: se o path contém palavras-chave que sugerem
      // "dashboard/snapshot/config" retornamos objeto vazio, senão array.
      const path = url.pathname;
      const looksLikeSingleton =
        /dashboard|snapshot|status|config|resumo|contexto|preferencias/.test(
          path,
        );
      const envelope = url.searchParams.get("envelope");

      if (envelope === "true") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            items: [],
            page: 0,
            size: 20,
            total: 0,
            hasNext: false,
          }),
        });
      }

      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: looksLikeSingleton ? "{}" : "[]",
      });
    }

    // Escrita → 200 vazio
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: "{}",
    });
  });
}
