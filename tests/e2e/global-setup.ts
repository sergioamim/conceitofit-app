import type { FullConfig } from "@playwright/test";

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Falha ao configurar ${url}: ${response.status} ${response.statusText}`);
  }
}

export default async function globalSetup(config: FullConfig) {
  const baseURL = config.projects[0]?.use.baseURL;

  if (!baseURL) return;

  try {
    await postJson(`${baseURL}/__nextjs_devtools_config`, {
      disableDevIndicator: true,
    });
  } catch (error) {
    console.warn("[playwright] Nao foi possivel desabilitar o Next.js Dev Tools:", error);
  }
}
