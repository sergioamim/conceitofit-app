/**
 * Constantes centralizadas para filtros e status usados em listagens/selects.
 *
 * Uso:  import { FILTER_ALL } from "@/lib/shared/constants/filters";
 */

/** Valor sentinela para "sem filtro" em selects e tabs de filtro */
export const FILTER_ALL = "TODOS" as const;

/** Tipo utilitário: union de T com o valor sentinela FILTER_ALL */
export type WithFilterAll<T extends string> = T | typeof FILTER_ALL;
