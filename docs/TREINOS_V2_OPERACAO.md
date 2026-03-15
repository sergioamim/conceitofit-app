# Treinos V2 Operacao

## Escopo P0

O modulo de Treinos V2 separa claramente:

- `Treino Padrao`: template governado, reutilizavel e versionado
- `Treino atribuido`: instancia operacional por cliente, com snapshot preservado

Nao fazem parte deste P0:

- exportar treino de cliente como novo template
- importar templates do ADM Geral
- segmentacao funcional da aba `Segmento`

## Ciclo de vida do template

Estados suportados:

- `RASCUNHO`: template em montagem inicial
- `EM_REVISAO`: template enviado para triagem tecnica
- `PUBLICADO`: versao liberada para atribuicao
- `ARQUIVADO`: template retirado da operacao

Regras operacionais:

- publicacao so deve ocorrer com validacao tecnica sem bloqueios
- toda publicacao incrementa a versao operacional do template
- jobs de atribuicao ficam vinculados ao template e preservam a versao aplicada
- backlog de revisao e mostrado na listagem principal, sem misturar com treinos atribuidos

## Listagem de templates

Tela: `/treinos`

Uso esperado:

- localizar templates por nome ou professor
- acompanhar backlog de revisao
- visualizar versao, clientes impactados e jobs de atribuicao por template
- abrir montagem, atribuir ou arquivar sem sair da listagem

Indicadores principais:

- fila de revisao
- templates publicados na pagina atual
- pendencias tecnicas que bloqueiam publicacao
- clientes impactados e jobs registrados

## Editor unificado

Tela: `/treinos/[id]`

No editor de template:

- montar blocos, itens e tecnicas especiais
- salvar rascunho
- enviar para revisao
- publicar nova versao
- arquivar template
- atribuir individualmente ou em massa
- consultar historico de jobs com solicitante, politica, vigencia e resultado por cliente

No editor de treino atribuido:

- preservar snapshot da versao aplicada
- exibir template origem, versao, snapshot e origem operacional
- registrar quando houve customizacao local da instancia

## Operacao pos-atribuicao

Tela: `/treinos/atribuidos`

Objetivo:

- operar somente instancias atribuidas, sem poluir a biblioteca de templates

Filtros disponiveis:

- cliente
- status
- origem
- professor
- vigencia
- unidade ativa

Acoes disponiveis:

- abrir treino atribuido
- encerrar instancia
- duplicar treino atribuido
- reatribuir a partir do template de origem

## Rastreabilidade

Cada treino atribuido deve expor:

- template origem
- id do template de origem
- versao aplicada
- id do snapshot vinculado
- origem operacional (`TEMPLATE`, `MASSA`, `MANUAL`, `RENOVACAO`)
- indicacao de customizacao local

Cada template deve expor:

- versao atual
- quantidade de clientes impactados
- quantidade de jobs de atribuicao
- historico consultavel por job e por cliente

## Checklist de operacao

Antes de publicar:

- validar bloqueios tecnicos no editor
- confirmar que o template saiu de `RASCUNHO` ou `EM_REVISAO`
- revisar categoria, frequencia, semanas e blocos

Depois de atribuir:

- consultar o resumo terminal do job
- revisar ignorados e erros por cliente
- usar `/treinos/atribuidos` para acompanhar vigencia e encerramento
- reatribuir sempre a partir do template de origem, e nao por copia manual do treino atribuido
