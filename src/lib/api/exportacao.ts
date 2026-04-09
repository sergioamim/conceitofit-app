import { getAccessToken, getAccessTokenType, getFetchCredentials } from "./session";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function downloadFile(url: string, defaultFilename: string): Promise<void> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) {
    headers["Authorization"] = `${getAccessTokenType() ?? "Bearer"} ${token}`;
  }

  const response = await fetch(url, {
    credentials: getFetchCredentials(),
    headers,
  });
  if (!response.ok) throw new Error(`Export failed: ${response.status}`);

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition");
  const filename =
    disposition?.match(/filename="?([^"]+)"?/)?.[1] ?? defaultFilename;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function buildExportUrl(
  path: string,
  params: Record<string, string | undefined>,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value.trim() !== "") {
      qs.set(key, value);
    }
  }
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  return `/backend${path}${suffix}`;
}

// ---------------------------------------------------------------------------
// Exportacao - Alunos
// ---------------------------------------------------------------------------

export async function exportarAlunosApi(input: {
  tenantId: string;
  formato?: "csv" | "xlsx";
  status?: string;
}): Promise<void> {
  const formato = input.formato ?? "csv";
  const url = buildExportUrl("/api/v1/exportacao/alunos", {
    tenantId: input.tenantId,
    formato,
    status: input.status,
  });
  await downloadFile(url, `alunos.${formato}`);
}

// ---------------------------------------------------------------------------
// Exportacao - Financeiro / Contas a Receber
// ---------------------------------------------------------------------------

export async function exportarContasReceberApi(input: {
  tenantId: string;
  formato?: "csv" | "xlsx";
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}): Promise<void> {
  const formato = input.formato ?? "csv";
  const url = buildExportUrl("/api/v1/exportacao/financeiro-receber", {
    tenantId: input.tenantId,
    formato,
    status: input.status,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
  });
  await downloadFile(url, `contas-a-receber.${formato}`);
}
