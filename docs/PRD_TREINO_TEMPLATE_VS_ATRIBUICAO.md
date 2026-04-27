# PRD — Template vs Atribuição vs Customização (Wave C)

**Status:** Wave C.1 + C.2 entregues (2026-04-27)
**Origem:** sessão 2026-04-27 — diretriz do PO sobre separação conceitual

## Modelo conceitual

| Conceito | Escopo | Onde mora hoje |
|---|---|---|
| **Template** | Genérico, recomendado para todos. Define apenas estrutura (nome, sessões A/B/C, exercícios, foco/perfil, descrição genérica). NÃO carrega dados de período do aluno. | `Treino` com `tipoTreino="PRE_MONTADO"`. Editor: `treino-v3-editor.tsx` em modo `template`. |
| **Atribuição** | Personalizada por aluno. Adiciona ao template: `dataInicio`, `frequenciaSemanal`, `quantidadePrevista` (sessões a concluir), `dataFim` (derivada), e contexto pessoal (objetivo, restrições, notas). | `Treino` com `tipoTreino="CUSTOMIZADO"` + `treinoBaseId`. Modal: `AssignmentDialog`. |
| **Customização** | Overrides por aluno sobre o template (alterar séries/reps/carga/descanso/cadência/RIR/observações de exercícios específicos; adicionar, remover ou substituir exercício). Não afeta o template original. | `treino_instancia_customizada` (JSONB de `overrides[]`). API: `treino-instancia.ts`. Editor V3 em modo `instance`. |

## Wave C.1 — Front-only (entregue 2026-04-27)

### Mudanças
1. **Editor V3 header** (`editor-v3/editor-header.tsx`): no modo template, freq aparece como `(sugerida)` para indicar que é apenas default herdado pela atribuição.
2. **AssignmentDialog** (`treinos-dialogs.tsx`): substitui o textarea único "Observações" por 3 sub-campos:
   - **Objetivo individual** — meta específica do aluno (ex.: "perder 5kg em 8 semanas").
   - **Restrições / Lesões** — limitações físicas a respeitar.
   - **Notas do professor** — orientações livres.
3. **Persistência**: serializados em markdown estruturado dentro do mesmo campo `observacoes` do payload, preservando compatibilidade com o backend atual:

   ```
   ## Objetivo
   ...

   ## Restrições
   ...

   ## Notas do professor
   ...
   ```

   Helpers `parseAssignmentNotes` / `serializeAssignmentNotes` em `lib/tenant/treinos/assignment-notes.ts`. Observações antigas (sem headers) são tratadas como conteúdo de "Notas do professor".

### Por que não tocou o backend
Adicionar 3 colunas em `treino_atribuicao` (ou usar JSONB) é mudança de domínio + migration coordenada. O markdown estruturado entrega valor imediato e migra naturalmente para a Wave C.2 quando os campos virarem primeiro-classe.

## Wave C.2 — Backend (entregue 2026-04-27)

### Mudanças
1. **Migration `V100__treinos_atribuicao_campos_individuais.sql`** — adiciona 3 colunas TEXT nullable em `treinos`: `objetivo_individual`, `restricoes`, `notas_professor`. Idempotente (`ADD COLUMN IF NOT EXISTS`).
2. **TreinoEntity** — 3 campos novos com `@Column` mapeado para snake_case.
3. **AtribuirTemplateRequest DTO** — 3 campos novos opcionais.
4. **CloneTreinoCommand record + toCloneCommand mapper** — 3 campos novos no fim do record.
5. **criarTreinoCustomizadoAPartirTemplate** — grava os 3 campos no clone (exclusivos da atribuição, não herdam do template).
6. **TreinoResponse record + toTreinoResponse** — 3 campos novos no fim do record (sempre `null` em template, valores reais em atribuição).
7. **Outros consumers** — `TreinoController.toCloneCommand` (clone manual), `TreinoAtribuicaoLoteService.criarLote` (atribuição em lote) e `TreinoTemplateService` ajustados; clone simples e lote passam `null` (não coletam campos individualizados).
8. **Frontend** — `TreinoApiResponse`, `Treino` interface, `assignTreinoTemplateApi` data, `mapTreinoApiToDomain` e `assignTreinoTemplate` workspace estendidos. `handleAssignTemplate` envia primitivos diretos (não mais markdown).
9. **Compatibilidade** — `buildAssignmentState` lê dos campos primitivos quando presentes; faz fallback no parser markdown apenas se os 3 vierem null (preserva atribuições antigas pré-V100).

### Pendente (futuras waves)
- Editor V3 instance mode: card "Personalização do aluno" mostrando/editando os 3 campos da atribuição via PATCH.
- Backfill SQL opcional: parsear `observacoes` legado em produção e popular as 3 colunas (parseamento markdown em PostgreSQL é frágil; deixar pro próximo "save" naturalmente migrar via UI).

## Decisões pendentes
- **Onde armazenar observações de instance**: `Treino.observacoes` (do treino atribuído) ou `TreinoInstanciaCustomizada` (do overlay)? Recomendação: `Treino.observacoes` — instância é apenas overlay sobre exercícios; contexto pessoal pertence ao treino atribuído.
- **Tags de Foco multi-valor**: hoje `perfilIndicacao` é singular (Wave A entregou pill colorida). Se multi-valor for necessário, requer schema novo.
