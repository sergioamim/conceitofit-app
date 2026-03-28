/**
 * Domínio: shared
 * Módulos utilitários e tipos compartilhados por todos os domínios.
 */
export * from "./access-control";
export * from "./formatters";
export * from "./types";
export * from "./utils";
export * from "./ui-motion";
export * from "./business-date";
export * from "./feature-flags";
export * from "./network-subdomain";
export * from "./auth-redirect";

// Utils especializados
export * from "./utils/api-error";
export * from "./utils/cnpj";
export * from "./utils/subdomain";

// Helpers de formulário compartilhados
export * from "../forms/zod-helpers";

// Exportação de dados
export * from "../export/table-export";

// Ícones compartilhados
export * from "../icons/activity-icons";
