# Treinos V2 Technical Spec

## Objetivo
Fechar o recorte tecnico de Treinos V2 antes da implementacao visual pesada, tomando `docs/TREINOS_V2_PRD.md` como fonte funcional e transformando as decisoes em artefatos reutilizaveis para frontend, backend e backlog.

Artefatos desta task:
- `src/lib/treinos/v2-domain.ts`
- `src/lib/api/treinos-v2.ts`
- `src/lib/treinos/v2-backlog.ts`

## 1. Auditoria do modulo atual
O modulo atual cobre uma base operacional de Treinos V1, mas ainda nao atende a V2 descrita no PRD.

### O que existe hoje
- `src/app/(app)/treinos/page.tsx` lista treinos atribuidos e templates na mesma tela.
- `src/components/shared/treino-modal.tsx` usa um modal simples, com itens flat, sem editor denso compartilhado.
- `src/components/shared/exercicio-modal.tsx` cobre cadastro basico de exercicio, mas nao a taxonomia rica da V2.
- `src/lib/treinos/workspace.ts` ja esta API-only e suporta CRUD V1, atribuicao individual, revisao, execucao, encerramento e renovacao.
- `src/lib/api/treinos.ts` expõe contratos V1, sem jobs, snapshots ricos, publicacao formal ou editor unificado.

### Gaps confirmados contra o PRD
- A listagem V1 mistura `Treino Padrao` e `Treino atribuido`; a V2 exige telas separadas.
- Nao existe editor unificado com blocos em abas, grade inline, drag handle, biblioteca lateral e versao simplificada.
- Nao existe governanca formal de template com `RASCUNHO`, `EM_REVISAO`, `PUBLICADO` e `ARQUIVADO`.
- Nao existe snapshot/versionamento explicito na atribuicao.
- A atribuicao em massa ainda nao existe como job operacional assincrono com resumo e conflitos.
- O catalogo de exercicios nao modela codigo, grupo de exercicios, tipo, objetivo padrao, midia, disponibilidade no app ou similares.

## 2. Decisoes fechadas para P0
As perguntas abertas do PRD foram fechadas assim para destravar a implementacao:

- Um cliente nao pode ter mais de um treino `ATIVO` simultaneamente.
- Um cliente pode ter um treino `AGENDADO` futuro, gerado pela politica `AGENDAR_NOVO`.
- A atribuicao em massa sera assincrona, via job com polling e resumo terminal.
- `dataInicio` e obrigatoria na atribuicao; `dataFim` pode ser calculada a partir da vigencia.
- Professor so pode editar treino fora da propria carteira com permissao fina explicita.
- Atualizacao em massa para nova versao do template fica em `P1`, fora do recorte da task 23.
- Exportar treino de cliente como novo template e importar do ADM Geral continuam mapeados como trilhas adjacentes de `P1`.

## 3. Dominio canonico

### Template (`Treino Padrao`)
Entidade institucional reutilizavel.

Campos obrigatorios para publicacao:
- `nome`
- `frequenciaSemanal`
- `totalSemanas`
- ao menos um bloco com um item valido

Estados:
- `RASCUNHO`
- `EM_REVISAO`
- `PUBLICADO`
- `ARQUIVADO`

Regras:
- `PUBLICADO` exige template valido.
- `ARQUIVADO` e terminal no P0; reuso volta por duplicacao.
- `precisaRevisao` deve subir quando houver migracao invalida ou alteracao relevante antes da publicacao.

### Treino atribuido
Instancia operacional derivada de template ou criada manualmente.

Estados:
- `RASCUNHO`
- `AGENDADO`
- `ATIVO`
- `ENCERRADO`
- `SUBSTITUIDO`

Regras:
- toda atribuicao gera snapshot.
- editar a instancia nao altera o template.
- substituir treino atual nao apaga historico; marca a instancia anterior como `SUBSTITUIDO`.

### Snapshot de versao
Congela metadados, blocos, itens, tecnicas especiais e problemas de validacao existentes no momento da atribuicao.

Regras:
- guarda `templateId`, `templateVersion`, `publishedAt`, `publishedBy` e `validationIssues`.
- precisa ser suficiente para reimpressao, auditoria e rastreabilidade mesmo se o template mudar depois.

### Job de atribuicao em massa
Operacao assincrona que processa um template contra uma lista resolvida de clientes.

Estados:
- `PENDENTE`
- `PROCESSANDO`
- `CONCLUIDO`
- `CONCLUIDO_PARCIAL`
- `FALHOU`
- `CANCELADO`

Resumo minimo:
- `totalSelecionado`
- `totalAtribuido`
- `totalIgnorado`
- `totalComErro`
- lista de conflitos e motivos por cliente

## 4. Modelagem operacional

### Bloco
- representa a aba principal do editor
- tem `nome`, `ordem`, `objetivo`, `observacoes` e itens ordenados

### Item de exercicio
- referencia exercicio do catalogo
- guarda parametros inline
- suporta tecnicas especiais:
  - `CONJUGADO`
  - `PROGRESSIVO`
  - `DROP_SET`
  - `REPLICAR_SERIE`

### Campo numerico migrado
Series, repeticoes, carga e intervalo passam a aceitar:
- `raw`
- `numericValue`
- `status`

Isso permite bloquear publicacao quando a migracao trouxer texto nao numerico, sem perder o valor bruto para revisao humana.

## 5. Contratos frontend/backend
Os contratos tipados ficam em `src/lib/api/treinos-v2.ts`.

### Superficies obrigatorias de API
- listagem paginada de templates
- leitura do editor unificado
- create/update de template
- transicoes de revisao/publicacao/arquivamento
- CRUD do catalogo de exercicios
- atribuicao individual
- atribuicao em massa via job
- consulta do job e do historico de atribuicoes
- listagem operacional de treinos atribuidos

### Decisoes de contrato
- a listagem de template so retorna templates
- a ordenacao padrao da listagem e `UPDATED_AT_DESC`
- a atribuicao em massa aceita filtros por contrato, niveis e genero, mas a lista final de clientes precisa ficar explicita no request
- a resposta do editor retorna `allowedActions`, `validationIssues` e `permissions`, para o frontend nao reimplementar regras opacas
- a listagem de treinos atribuidos expõe origem, snapshot e contagem de clientes impactados pelo template

## 6. Governanca e permissoes
As permissoes finas canonicas ficam normalizadas em `src/lib/treinos/v2-domain.ts`.

### Perfis base
- `PROFESSOR`: cria/edita proprio template, envia para revisao, atribui individualmente, ajusta treino atribuido dentro da propria carteira
- `COORDENADOR_TECNICO`: revisa, publica, acompanha qualidade, pode operar atribuicao em massa
- `ADMINISTRADOR`: acesso total
- `OPERACAO`: consulta templates publicados e so atribui se houver permissao fina explicita

### Permissoes finas canonicas
- `EXERCICIOS`
- `TREINO_PADRAO`
- `TREINO_PADRAO_PRESCREVER`
- `TREINOS_PRESCREVER`
- `TREINOS_PRESCREVER_OUTRAS_CARTEIRAS`
- `TREINOS_PERSONALIZAR_EXERCICIO`
- `TREINOS_SOMENTE_EDITAR_CARGA`
- `TREINOS_CONSULTAR_OUTRAS_CARTEIRAS`
- `TREINO_EXIBIR_QTD_RESULTADOS`

### Guardas de status
- `RASCUNHO -> EM_REVISAO`: requer submissao para revisao
- `EM_REVISAO -> PUBLICADO`: requer permissão de publicacao e template valido
- `PUBLICADO -> EM_REVISAO`: permite reabrir ciclo de revisao
- `* -> ARQUIVADO`: requer permissão de arquivamento

## 7. Alinhamento do backlog 20-24
O backlog dependente foi validado com os contratos acima.

### Task 20
Escopo validado:
- listagem so de templates
- busca por nome/professor
- recencia como ordenacao padrao
- quick filter de revisao apenas quando existir backlog

### Task 21
Escopo validado:
- editor unico para template e treino atribuido
- metadados obrigatorios no topo
- blocos em abas com reorder
- grade inline densa
- versao simplificada
- tecnicas especiais no proprio item

### Task 22
Escopo validado:
- biblioteca lateral
- catalogo com codigo, grupo, tipo, objetivo padrao, unidade, midia, app flag e similares

### Task 23
Escopo validado:
- drawer/modal com abas `1 cliente` e `Varios clientes`
- `Segmento` fica apenas preparado para futuro
- job assincrono de atribuicao em massa
- snapshot obrigatorio
- politicas de conflito `MANTER_ATUAL`, `SUBSTITUIR_ATUAL`, `AGENDAR_NOVO`

### Task 24
Escopo validado:
- fila de revisao e indicadores
- listagem operacional de treinos atribuidos
- rastreabilidade por origem, versao e historico

Itens explicitamente fora do P0 de Treinos V2:
- reatribuir em massa uma nova versao do template
- exportar treino de cliente como novo template
- importar template do ADM Geral
- analytics de adocao

## 8. Criterio de conclusao da task 19
Task 19 so e considerada concluida quando:
- a auditoria do V1 estiver documentada
- o dominio V2 estiver tipado em codigo
- as regras de permissao e publicacao forem testaveis
- o backlog 20-24 estiver coerente com o recorte aprovado
