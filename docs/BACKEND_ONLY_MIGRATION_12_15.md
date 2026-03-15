# Backend-Only Migration 12-15

## Status final

- Tasks `12`, `13`, `14` e `15` concluídas.
- `src/lib/mock/services.ts` e `src/lib/mock/store.ts` removidos do repositório.
- `src/` e `tests/` não importam mais `@/lib/mock/*`, não usam `getStore()/setStore()` e não escutam `academia-store-updated`.
- `window.localStorage` ficou restrito às exceções documentadas:
  - `src/lib/api/session.ts`
  - `src/lib/api/http.ts`
  - `src/lib/public/storage.ts`
  - `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx`
- Guardrails entraram em `eslint.config.mjs` para bloquear reintrodução de `src/lib/mock/*` e novo uso operacional de `window.localStorage` fora das exceções.

## Fechamento por task

- Task 12: adapters reais e backend-only para `NFSe`, `agregadores` e `integrações operacionais`.
- Task 13: serviços financeiros auxiliares (`recebimentos`, `ajustes`, `importação em lote`) consolidados na camada real.
- Task 14: fechamento da migração residual para API/Session em administrativo, financeiro, BI, mural e contexto de tenant.
- Task 15:
  - bootstrap de sessão/tenant/branding consolidado em `API/Session`;
  - comercial core, CRM, reservas, grade, monitor, catraca, BI, administrativo complementar, jornada pública e treinos operando sem fallback local;
  - testes unitários e e2e focados convertidos para stub HTTP na borda;
  - remoção física de `src/lib/mock/*`.

## Runtime aceito

- Fonte de verdade operacional: `src/lib/api/*` + `session`.
- `localStorage`: apenas sessão, contexto técnico (`http`), drafts públicos transitórios e histórico temporário da importação EVO.
- Testes de integração/e2e: mock de rede na borda da API, nunca runtime mock dentro da aplicação.

## Observações de backend

- Emissão de NFSe por pagamento e em lote segue dependente dos endpoints:
  - `POST /api/v1/comercial/pagamentos/:id/nfse`
  - `POST /api/v1/comercial/pagamentos/nfse/lote`
- Se o backend responder `404`, a UI retorna erro explícito; não há mais fallback local silencioso.
