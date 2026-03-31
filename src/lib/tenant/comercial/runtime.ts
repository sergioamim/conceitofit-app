/**
 * Barrel re-export — mantém compatibilidade com todos os consumers existentes.
 *
 * Cada domínio agora vive em seu próprio arquivo:
 *   clients-runtime.ts   — clientes, cartões, presenças, catraca
 *   enrollments-runtime.ts — matrículas e contratos
 *   sales-runtime.ts      — vendas, catálogo, pagamentos, vouchers
 */
export * from "./clients-runtime";
export * from "./enrollments-runtime";
export * from "./sales-runtime";
