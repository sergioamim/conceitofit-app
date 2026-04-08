# Task ID: 497

**Title:** Utilitário de timestamps relativos (pt-BR)

**Status:** pending

**Dependencies:** None

**Priority:** medium

**Description:** Criar `src/lib/utils/time-format.ts` com `formatRelativeTime(date)` retornando strings como "há 2 minutos" usando `date-fns` com locale pt-BR.

**Details:**

Criar `src/lib/utils/time-format.ts` exportando:

- `formatRelativeTime(date: string | Date): string` — usa `formatDistanceToNow` de `date-fns` com `{ addSuffix: true, locale: ptBR }`. Exemplos: "há 2 minutos", "há 3 horas", "há 1 dia".
- `formatDateTimeBR(date: string | Date): string` — formatação completa: "07/04/2026 14:32". Usa `format` de `date-fns` com `dd/MM/yyyy HH:mm`.
- `formatDateBR(date: string | Date): string` — só data: "07/04/2026".

`date-fns` v4 e `ptBR` já estão instalados no projeto.

**Test Strategy:**

Testes unitários com datas fixas: verificar "há X minutos/horas/dias" para inputs conhecidos. Testar bordas: data futura ("em X minutos"), data muito antiga.
