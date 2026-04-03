# PRD – Débitos Técnicos e Melhorias Pós-Análise

## Contexto

Análise completa do codebase realizada em 28/03/2026 identificou débitos técnicos e oportunidades de melhoria. Este documento descreve as tasks necessárias para elevar a qualidade do projeto antes do lançamento em produção.

O projeto é um SaaS multi-tenant de gestão de academias (Next.js 16, React 19, TypeScript, TailwindCSS 4). Possui 405 arquivos fonte, 120+ rotas, 44 módulos de API e 163 tasks anteriores concluídas.

---

## 1. Corrigir build quebrado por auth-redirect.ts (CRÍTICO)

**Prioridade:** critical
**Complexidade:** 2

O arquivo `src/lib/tenant/auth-redirect.ts` exporta de `./shared/auth-redirect` que não existe. Isso quebra o build do Next.js.

**Arquivos afetados:**
- `src/lib/tenant/auth-redirect.ts` — importa módulo inexistente
- `src/app/(portal)/layout.tsx` — importa `buildLoginHref`
- `src/app/(portal)/conta/sair/page.tsx` — importa `buildLoginHref`
- `src/components/layout/sidebar.tsx` — importa de auth-redirect
- `src/components/auth/legacy-login-flow.tsx` — importa de auth-redirect
- `src/components/auth/network-access-flow.tsx` — importa `resolvePostLoginPath`

**Ação:** Investigar se o módulo `shared/auth-redirect` foi deletado acidentalmente ou se nunca existiu. Criar o módulo faltante com as funções `buildLoginHref` e `resolvePostLoginPath`, ou corrigir os imports para apontar para o local correto. Validar com `npx next build`.

**Teste:** Build deve completar sem erros relacionados a auth-redirect.

---

## 2. Corrigir type errors em importacao-evo-p0 (CRÍTICO)

**Prioridade:** critical
**Complexidade:** 4

O arquivo `src/app/(backoffice)/admin/importacao-evo-p0/page.tsx` tem 15+ erros de tipo:
- `FILE_UPLOAD_GROUPS` não está definido
- Tipo `PacoteArquivoDisponivel` não tem `historico`, `entidadeFiltro`, `blocoFiltro`
- Parâmetros `group`, `fieldKey`, `field`, `key`, `label` com tipo `any` implícito
- Comparação de tipos sem overlap (`"parcial" | "comErros"` vs `"processando"`)
- `formatJobAliasDate` não encontrado

**Ação:** Corrigir todos os type errors, adicionar tipos faltantes, definir `FILE_UPLOAD_GROUPS`, importar `formatJobAliasDate`. Se o módulo está deprecated, avaliar remoção.

**Teste:** `tsc --noEmit` sem erros neste arquivo. Navegar para `/admin/importacao-evo-p0` deve funcionar.

---

## 3. Corrigir type errors nos formulários de adesão pública (ALTO)

**Prioridade:** high
**Complexidade:** 3

Três arquivos com erros de tipo nos formulários da jornada pública:

1. `src/app/(public)/adesao/cadastro/page.tsx:213` — tipo `Sexo` incompatível (`"M" | "F" | "OUTRO" | "NAO_INFORMADO"` vs `Sexo`)
2. `src/app/(public)/adesao/checkout/page.tsx:53` — `zodResolver` retorna tipo incompatível com `Resolver<CheckoutFormValues>`
3. `src/app/(public)/adesao/checkout/page.tsx:241` — `SubmitHandler` incompatível
4. `src/app/(public)/b2b/lead-form.tsx:32,68` — mesmo problema do zodResolver

**Ação:** Ajustar os tipos do zodResolver nos formulários. Provavelmente atualizar o cast do resolver ou ajustar o schema Zod para alinhar com os tipos esperados pelo react-hook-form. Verificar se o vendor `src/vendor/hookform-resolvers/zod` precisa de atualização.

**Teste:** `tsc --noEmit` sem erros nos arquivos de adesão e b2b.

---

## 4. Eliminar usos de `as any` no codebase (MÉDIO)

**Prioridade:** medium
**Complexidade:** 2

Existem 4 instâncias de `as any` que comprometem type safety:

1. `src/app/(backoffice)/admin/configuracoes/page.tsx:171` — `zodResolver(...) as any`
2. `src/app/(portal)/seguranca/acesso-unidade/page.tsx:75` — `as any`
3. `src/app/(portal)/seguranca/rbac/page.tsx:225` — `as any`
4. `src/components/shared/crud-modal.tsx:101` — `useForm<any>`

**Ação:** Substituir cada `as any` por tipos genéricos corretos. Se causado pelo zodResolver, resolver junto com a task de formulários. Para o `crud-modal.tsx`, usar generic type parameter adequado.

**Teste:** `grep -r "as any" src/` deve retornar zero resultados. Sem regressões.

---

## 5. Remover formatters duplicados (MÉDIO)

**Prioridade:** medium
**Complexidade:** 1

A função `formatCurrency` está definida em 3 lugares:
- `src/lib/shared/formatters.ts` (canônico)
- `src/lib/public/services.ts` (duplicado interno)
- `src/app/(public)/adesao/adesao-landing-content.tsx` (duplicado local)

**Ação:** Remover as definições duplicadas e importar de `@/lib/shared/formatters` ou `@/lib/formatters`. Verificar se há outros formatters duplicados no codebase.

**Teste:** Build + grep para `function formatCurrency` deve retornar apenas 1 resultado.

---

## 6. Commitar tasks.json automaticamente ao fechar tasks (MÉDIO)

**Prioridade:** medium
**Complexidade:** 2

Mudanças de status no Task Master alteram `.taskmaster/tasks/tasks.json` mas não commitam automaticamente. O status reverte entre sessões do Claude Code.

**Ação:** Documentar no CLAUDE.md que ao finalizar tasks deve-se incluir `tasks.json` no commit. Avaliar criar um hook ou script que faça auto-commit do tasks.json ao mudar status.

**Teste:** Após fechar uma task e commitar, o status persiste em nova sessão.

---

## 7. Avaliar e atualizar vendor hookform-resolvers (MÉDIO)

**Prioridade:** medium
**Complexidade:** 3

O projeto usa um fork vendored em `src/vendor/hookform-resolvers/zod` em vez do pacote oficial `@hookform/resolvers`. Isso pode estar causando os type mismatches com zodResolver.

**Ação:** Verificar se a versão oficial `@hookform/resolvers@3.10.0` (já no package.json) resolve os problemas de tipo com Zod 4. Se sim, remover o vendor e usar o pacote oficial. Se não, documentar o motivo do fork.

**Teste:** Formulários de adesão, B2B e backoffice funcionam sem erros de tipo.

---

## 8. Implementar logger estruturado para produção (MÉDIO)

**Prioridade:** medium
**Complexidade:** 3

Existem 9 instâncias de `console.warn`/`console.error` espalhadas pelo código. Para produção, é necessário um logger estruturado com níveis, contexto e possibilidade de integração com serviços de observabilidade.

**Ação:** Criar `src/lib/shared/logger.ts` com funções `logger.warn()`, `logger.error()`, `logger.info()` que encapsulem console.* com metadata (timestamp, módulo, context). Substituir os 9 console.* existentes. Preparar para futura integração com serviço externo (Sentry, Datadog, etc).

**Teste:** Nenhum `console.warn` ou `console.error` direto no código (exceto no logger). Logger funciona em dev e build.

---

## 9. Melhorar acessibilidade (a11y) dos formulários e modais (BAIXO)

**Prioridade:** low
**Complexidade:** 4

A acessibilidade está em 7/10. Gaps identificados:
- Formulários complexos sem `aria-describedby` para mensagens de erro
- Falta `aria-live="polite"` em regiões com atualizações dinâmicas (status, loading)
- Modais sem focus trap completo
- Falta skip navigation link no layout principal
- Inputs sem labels associados em alguns formulários

**Ação:** Adicionar `aria-describedby` nos campos de formulários com erro. Adicionar `aria-live` em status badges e loading states. Implementar skip-to-content link no layout `(portal)`. Auditar com axe-core ou Lighthouse Accessibility.

**Teste:** Lighthouse Accessibility score >= 90 nas páginas principais.

---

## 10. Ampliar cobertura de testes unitários com Testing Library (BAIXO)

**Prioridade:** low
**Complexidade:** 6

`@testing-library/react` e `@testing-library/jest-dom` estão instalados mas subutilizados. Os 3 testes unitários existentes testam apenas utilitários, não componentes React.

**Ação:** Criar testes de componentes para:
- `StatusBadge` — renderiza corretamente cada status
- `PlanoSelectorCard` — exibe valores, destaque, seleção
- `DemoBanner` — aparece com `?demo=1`, dismiss funciona
- `LeadB2bForm` — validação de campos, estado de sucesso
- `DemoForm` — validação, toggle de senha
- `PublicJourneyShell` — renderiza steps, tenant switcher
- Formatters — `formatBRL`, `formatDate`, `formatPercent`

Cada componente deve ter pelo menos 3-5 cenários de teste.

**Teste:** `npx vitest run` passa com todos os novos testes. Cobertura de componentes > 30%.

---

## 11. Adicionar testes e2e para fluxo de conta demo (BAIXO)

**Prioridade:** low
**Complexidade:** 4

O fluxo de conta demo (`/b2b/demo`) foi implementado mas não tem teste e2e.

**Ação:** Criar `tests/e2e/demo-account.spec.ts` com cenários:
- Acessar `/b2b/demo` e verificar formulário renderizado
- Validação de campos (nome vazio, email inválido, senha curta)
- Submissão com dados válidos (mock da API)
- Redirecionamento para `/dashboard?demo=1`
- Banner "Conta Demonstração" visível no dashboard
- Dismiss do banner persiste na sessão

**Teste:** `npx playwright test demo-account.spec.ts` passa.

---

## Ordem de execução sugerida

1. Task: Corrigir build (auth-redirect) — BLOQUEANTE
2. Task: Corrigir type errors importacao-evo-p0
3. Task: Corrigir type errors formulários adesão
4. Task: Eliminar `as any`
5. Task: Remover formatters duplicados
6. Task: Commitar tasks.json
7. Task: Avaliar vendor hookform-resolvers
8. Task: Logger estruturado
9. Task: Acessibilidade (a11y)
10. Task: Testes unitários com Testing Library
11. Task: Testes e2e conta demo
