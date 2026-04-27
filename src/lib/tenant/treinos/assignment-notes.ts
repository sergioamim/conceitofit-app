/**
 * Helpers para serializar/parsear notas estruturadas de atribuição (Wave C.1).
 *
 * O backend hoje aceita apenas um campo `observacoes` (string) na atribuição.
 * Para evitar migration imediata, serializamos 3 sub-campos em markdown
 * estruturado dentro do mesmo campo. A leitura faz split nos headers.
 *
 * Compatibilidade: observações antigas sem headers são tratadas como
 * conteúdo de `notasProfessor`. Headers desconhecidos são preservados em
 * `notasProfessor` para não perder dado humano.
 */

const HEADERS = {
  objetivoIndividual: "## Objetivo",
  restricoes: "## Restrições",
  notasProfessor: "## Notas do professor",
} as const;

export interface AssignmentNotes {
  objetivoIndividual: string;
  restricoes: string;
  notasProfessor: string;
}

const EMPTY: AssignmentNotes = {
  objetivoIndividual: "",
  restricoes: "",
  notasProfessor: "",
};

export function parseAssignmentNotes(raw?: string | null): AssignmentNotes {
  const text = raw?.trim();
  if (!text) return { ...EMPTY };

  const hasAnyHeader = Object.values(HEADERS).some((h) => text.includes(h));
  if (!hasAnyHeader) {
    // Compatibilidade: texto livre antigo vai para "notas do professor".
    return { ...EMPTY, notasProfessor: text };
  }

  const result: AssignmentNotes = { ...EMPTY };
  // Quebra em blocos por header conhecido. Texto antes do primeiro header
  // (se houver) também vira "notasProfessor" como fallback.
  const positions: Array<{ key: keyof AssignmentNotes; start: number; headerLen: number }> = [];
  for (const [key, header] of Object.entries(HEADERS) as Array<[keyof AssignmentNotes, string]>) {
    const idx = text.indexOf(header);
    if (idx !== -1) positions.push({ key, start: idx, headerLen: header.length });
  }
  positions.sort((a, b) => a.start - b.start);

  const preamble = text.slice(0, positions[0].start).trim();
  if (preamble) result.notasProfessor = preamble;

  positions.forEach((pos, index) => {
    const next = positions[index + 1];
    const end = next ? next.start : text.length;
    const body = text.slice(pos.start + pos.headerLen, end).trim();
    if (body) {
      result[pos.key] = result[pos.key] ? `${result[pos.key]}\n\n${body}` : body;
    }
  });

  return result;
}

export function serializeAssignmentNotes(notes: AssignmentNotes): string {
  const blocks: string[] = [];
  if (notes.objetivoIndividual.trim()) {
    blocks.push(`${HEADERS.objetivoIndividual}\n${notes.objetivoIndividual.trim()}`);
  }
  if (notes.restricoes.trim()) {
    blocks.push(`${HEADERS.restricoes}\n${notes.restricoes.trim()}`);
  }
  if (notes.notasProfessor.trim()) {
    blocks.push(`${HEADERS.notasProfessor}\n${notes.notasProfessor.trim()}`);
  }
  return blocks.join("\n\n");
}
