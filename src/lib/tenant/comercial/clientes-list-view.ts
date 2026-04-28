export const CLIENTE_LIST_VIEW_VALUES = [
  "default",
  "financeiro",
  "operacional",
] as const;

export type ClienteListView = (typeof CLIENTE_LIST_VIEW_VALUES)[number];

export const DEFAULT_CLIENTE_LIST_VIEW: ClienteListView = "default";

export function isClienteListView(value: unknown): value is ClienteListView {
  return (
    typeof value === "string"
    && (CLIENTE_LIST_VIEW_VALUES as readonly string[]).includes(value)
  );
}

export function normalizeClienteListView(value: unknown): ClienteListView | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  return isClienteListView(normalized) ? normalized : undefined;
}

export function getClienteListViewLabel(view: ClienteListView): string {
  switch (view) {
    case "financeiro":
      return "Financeiro";
    case "operacional":
      return "Operacional";
    case "default":
    default:
      return "Padrão";
  }
}

export function resolveClienteListProfileDefault(perfilNome?: string | null): ClienteListView {
  const normalized = typeof perfilNome === "string"
    ? perfilNome.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toLowerCase()
    : "";

  if (!normalized) {
    return DEFAULT_CLIENTE_LIST_VIEW;
  }

  if (
    normalized.includes("financeir")
    || normalized.includes("cobranc")
    || normalized.includes("recebiment")
  ) {
    return "financeiro";
  }

  if (
    normalized.includes("recepc")
    || normalized.includes("operacion")
    || normalized.includes("comercial")
    || normalized.includes("vendas")
  ) {
    return "operacional";
  }

  return DEFAULT_CLIENTE_LIST_VIEW;
}
