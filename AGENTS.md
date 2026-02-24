# AGENTS.md

## Objetivo
Este arquivo define padrões para evolução do frontend (`Next.js`) da aplicação de academia, mantendo integração natural com backend Java e consistência de arquitetura.

## Stack e prioridades
- Framework principal: `Next.js` (App Router) + `TypeScript`.
- UI prioritária: componentes de `shadcn/ui` e componentes nativos do Next.js.
- Estilo: Tailwind + tokens do tema atual da aplicação.
- Evitar criar componentes visuais do zero quando houver equivalente em `shadcn/ui`.

## Diretrizes de UI/UX
- Reutilizar componentes de `src/components/ui/*` antes de criar novos.
- Preferir composição de componentes (`Card`, `Table`, `Dialog`, `Form`, `Select`, `Tabs`) para manter padrão visual.
- Manter acessibilidade básica:
  - labels visíveis para campos.
  - estados de foco.
  - contraste adequado.
- Garantir comportamento responsivo (mobile first).

## Integração com backend Java
- Fonte de verdade do contrato: OpenAPI do backend Java.
- Sempre preservar assinatura funcional das telas existentes.
- Estratégia de migração:
  - manter `services.ts` como facade/adapter.
  - implementação HTTP por domínio em `src/lib/api/*`.
  - fallback controlado para mock/localStorage quando apropriado.
- Cabeçalho de contexto quando aplicável: `X-Context-Id`.
- Multi-tenant: respeitar `tenantId` (unidade ativa) em operações de dados.

## Organização e segregação de código
- `src/app`: rotas e composição de páginas.
- `src/components`:
  - `ui/` componentes base (shadcn).
  - `shared/` componentes transversais de negócio.
  - componentes de domínio em pastas específicas.
- `src/lib`:
  - `api/` integração HTTP e mapeamento de contratos.
  - `mock/` dados locais e fallback.
  - `types.ts` tipos de domínio compartilhados.
- Evitar lógica de negócio complexa diretamente em componentes de página.

## Padrões de implementação (SOLID quando aplicável)
- S (Responsabilidade única): separar UI, transformação de dados e acesso HTTP.
- O (Aberto/Fechado): preferir extensão por novos adapters/mappers em vez de alterar comportamento consolidado.
- L (Substituição): manter contratos estáveis para permitir troca de mock por API sem quebrar telas.
- I (Segregação de interface): tipos de request/response pequenos e específicos por caso de uso.
- D (Inversão de dependência): telas dependem de funções de serviço/facade, não de `fetch` direto.

## Regras de evolução
- Não quebrar contratos públicos já usados pela UI sem plano de migração.
- Priorizar mudanças incrementais por domínio (CRUD a CRUD).
- Sempre tratar estados:
  - loading
  - sucesso
  - erro
  - vazio
- Garantir feedback de erro amigável ao usuário.

## Regra de integração API real (anti-loop)
- Quando `NEXT_PUBLIC_USE_REAL_API=true`, evitar listeners globais de store (`academia-store-updated` e `storage`) em páginas que já carregam dados via API e cujo service sincroniza `setStore`.
- Motivo: o fluxo `API -> setStore -> evento global -> reload` cria tempestade de requisições e pode causar `net::ERR_INSUFFICIENT_RESOURCES`.
- Para essas páginas, prefira refresh explícito por ação de usuário (`onDone`, `onSave`, troca de filtro/página) em vez de refresh por evento global.

## Qualidade e validação
- Rodar `npm run lint` após alterações.
- Em integrações, validar:
  - nomes de campos/enums (case-sensitive)
  - nullability
  - status HTTP esperado
  - payload de erro padronizado

## Convenções práticas
- Comentários apenas quando agregam contexto não óbvio.
- Evitar duplicação de lógica entre páginas.
- Preferir utilitários e funções puras para transformações.
- Manter código legível e modular antes de otimizações prematuras.
