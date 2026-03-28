/**
 * Domínio: tenant
 * Módulos específicos do contexto de academia/tenant autenticado.
 */
export * from "../tenant-context";
export * from "../tenant-operational-access";
export * from "../tenant-theme";
export * from "../nav-items";
export * from "../administrativo-colaboradores";
export * from "../auth-redirect";

// Comercial
export * from "../comercial/contratos";
export * from "../comercial/matriculas-insights";
export * from "../comercial/plano-flow";
export * from "../comercial/runtime";

// CRM
export * from "../crm/prospect-status";
export * from "../crm/runtime";
export * from "../crm/workspace";

// Treinos
export * from "../treinos/v2-backlog";
export * from "../treinos/v2-domain";
export * from "../treinos/v2-runtime";
export * from "../treinos/workspace";

// Aulas e Reservas
export * from "../aulas/reservas";

// BI e Analytics
export * from "../bi/analytics";

// Financeiro
export * from "../financeiro/recebimentos";

// Planos
export * from "../planos/form";

// RBAC
export * from "../rbac/hooks";
export * from "../rbac/services";

// Schemas de formulário do tenant
export * from "../forms/administrativo-schemas";
export * from "../forms/auth-schemas";
export * from "../forms/security-user-create-schemas";
