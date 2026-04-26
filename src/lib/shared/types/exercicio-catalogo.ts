/**
 * Tipos do catálogo global de exercícios (ExerciseDB).
 *
 * Espelham os contratos do BE em
 * `feat/exercisedb-integration-be`:
 * - GET  /api/v1/exercicios/catalogo-global
 * - POST /api/v1/exercicios/catalogo-global/importar
 */

export interface CatalogoExercicio {
  exerciseIdExterno: string;
  /** Nome original (inglês). Use `nomePt ?? nome` para exibir. */
  nome: string;
  /** Tradução PT-BR. Pode ser null se ainda não traduzido. */
  nomePt: string | null;
  imageUrl: string | null;
  gifUrl: string | null;
  videoUrl: string | null;
  bodyParts: string[];
  targetMuscles: string[];
  equipments: string[];
  exerciseType: string | null;
  overview: string | null;
  /** Instruções originais (inglês). */
  instructions: string[] | null;
  /** Tradução PT-BR das instruções. */
  instructionsPt: string[] | null;
}

export interface CatalogoExercicioPage {
  content: CatalogoExercicio[];
  totalElements: number;
  totalPages: number;
  /** Página atual (0-based, padrão Spring `Page`). */
  number: number;
  size: number;
}

export interface ImportarExercicioPayload {
  exerciseIdExterno: string;
}

export interface ImportarExercicioResponse {
  /** UUID do `ExercicioEntity` criado na biblioteca local. */
  exercicioId: string;
  nome: string;
}
