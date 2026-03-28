function normalizeText(value?: string | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSubdomain(value?: string | null): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
