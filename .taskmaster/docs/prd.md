# PRD Task Master - WEB | academia-app

## Contexto

O projeto `academia-app` e o frontend web principal da plataforma de gestao para academias multiunidade. O codigo atual cobre CRM, clientes, vendas, pagamentos, financeiro, grade, treinos, seguranca, catraca e backoffice, mas ainda possui forte dependencia de `src/lib/mock/services.ts`, `src/lib/mock/store.ts` e persistencia transacional em `localStorage`.

Este PRD existe para gerar um backlog executavel no Task Master a partir de tres insumos:
- estado real do codigo revisado em `docs/prd.md`;
- benchmark competitivo em fontes oficiais de mercado;
- diretrizes de produto definidas nesta rodada.

## Diretrizes mandatórias

- Nao manter `src/lib/mock/services.ts` nem `src/lib/mock/store.ts` como fallback de producao.
- Nao usar `localStorage` como fonte de verdade para dados de dominio; somente preferencia local nao transacional pode permanecer se houver justificativa.
- O fluxo operacional de `matricula` deve ser removido.
- A contratacao de plano deve convergir para um fluxo canonico de `venda -> contrato/assinatura -> recebivel/cobranca -> status do cliente`.
- Antes de abrir novas frentes, priorizar eliminacao de duplicidade e divergencia de regras.
- Nao propor reescrita geral do sistema; aproveitar telas, componentes e adapters existentes sempre que fizer sentido.

## Baseline competitivo que faz sentido cobrir

- Reserva de aulas, lista de espera, reagendamento e ocupacao.
- Autoatendimento do aluno e portal/app de membros.
- Contratacao digital, contrato eletronico e adesao self-service.
- Cobranca automatica, recuperacao de receita e regua de inadimplencia.
- CRM com automacoes reais e canais externos.
- Treino digital, avaliacao fisica e evolucao do aluno.
- Integracoes de agregadores e acesso fisico.
- BI operacional por unidade e por rede.

## Instrucoes obrigatorias de geracao

- Gerar exatamente 10 tasks top-level, na ordem abaixo.
- Cada task top-level representa um epico.
- Expandir cada epico em subtasks operacionais por dominio, tela e contrato tecnico.
- Priorizar P0 antes de P1 e P2.
- Evitar subtasks vagas; preferir entregas verificaveis.
- Incluir tarefas de auditoria de codigo quando a regra ainda depender de validacao manual.
- Nao criar tasks para apps legados ou para um frontend separado que nao exista no repositorio atual.

## Epicos obrigatorios

### 1. Remover camada mock e convergir para backend real
- Prioridade: P0.
- Objetivo: tirar `mock/services` e o store local do caminho critico de operacao.
- Entregas obrigatorias:
  - inventario por dominio dos imports de mock;
  - migracao dos fluxos prioritarios para `src/lib/api/*`;
  - eliminacao do store transacional em `localStorage`;
  - padronizacao de erro, loading e tipagem;
  - documentacao de conclusao por dominio.

### 2. Consolidar venda de plano, contrato e ciclo de vida do cliente sem matricula
- Prioridade: P0.
- Objetivo: definir o fluxo canonico de contratacao e extinguir a jornada separada de matricula.
- Entregas obrigatorias:
  - modelo alvo entre cliente, plano, contrato/assinatura, recebivel e pagamento;
  - substituicao de `/matriculas`, `nova-matricula-modal` e conversao de prospect;
  - ajuste de `vendas/nova` para o fluxo canonico;
  - alinhamento do status do cliente.

### 3. Corrigir divergencias do CRM e transformar campanhas em operacao real
- Prioridade: P0.
- Objetivo: tornar funil, conversao e campanhas consistentes.
- Entregas obrigatorias:
  - regra unica de status de prospect;
  - kanban respeitando transicoes validas;
  - deduplicacao prospect x cliente;
  - campanhas fora do mock;
  - tarefas/cadencias/disparos auditaveis quando houver backend/provedor.

### 4. Consolidar cobranca, recebiveis e recuperacao de receita
- Prioridade: P0.
- Objetivo: unir pagamentos e contas a receber em um dominio operacional unico.
- Entregas obrigatorias:
  - fim da dualidade entre telas estaveis e `experimental`;
  - criacao, ajuste, baixa, renegociacao e importacao no fluxo principal;
  - regua de cobranca e aging;
  - NFSe integrada ao ciclo definitivo;
  - criterios claros de reativacao por pagamento.

### 5. Implementar agenda operacional de aulas com reserva, fila e check-in
- Prioridade: P1.
- Objetivo: transformar a grade parametrizada em agenda de operacao do aluno.
- Entregas obrigatorias:
  - reserva, cancelamento e reagendamento;
  - lista de espera;
  - check-in por janela;
  - ocupacao e no-show;
  - tratamento de agregadores e Wellhub somente se houver suporte real.

### 6. Entregar jornada digital do aluno e autoatendimento
- Prioridade: P1.
- Objetivo: oferecer experiencia digital coerente fora do balcao.
- Entregas obrigatorias:
  - area do aluno com agenda, cobrancas, contratos, cartoes e dados cadastrais;
  - persistencia real das paginas de conta;
  - consulta de treino e comprovantes;
  - definicao entre web responsivo, PWA ou app separado;
  - autoatendimento basico apenas apos validacao de backend/hardware.

### 7. Expandir treinos para avaliacao fisica e evolucao
- Prioridade: P1.
- Objetivo: completar o dominio de treinos.
- Entregas obrigatorias:
  - avaliacao fisica e anamnese;
  - metricas corporais e historico;
  - publicacao do treino para o aluno;
  - revisao e feedback de treino;
  - decisao explicita sobre habitos, nutricao e video.

### 8. Completar administrativo operacional, financeiro e integracoes pendentes
- Prioridade: P1.
- Objetivo: fechar lacunas em modulos ja expostos na navegacao.
- Entregas obrigatorias:
  - contas bancarias, maquininhas e conciliacao estabilizadas;
  - contas a pagar, recorrencia e DRE sem caminhos paralelos;
  - revisao de whitelabel, impressao e configuracoes;
  - correcao de aliases e rotas espelho;
  - auditoria de gaps administrativos relevantes.

### 9. Endurecer seguranca, RBAC e acesso fisico
- Prioridade: P1.
- Objetivo: tornar permissoes e acesso dominios confiaveis.
- Entregas obrigatorias:
  - validacao dos contratos reais de RBAC;
  - aplicacao consistente de permissoes;
  - estabilizacao de catraca, credenciais, conexoes e liberacao manual;
  - auditoria das acoes sensiveis;
  - escopo explicito para QR e facial.

### 10. Construir BI operacional, visao de rede e governanca de qualidade
- Prioridade: P2 com trilha transversal de qualidade desde o inicio.
- Objetivo: consolidar indicadores e impedir novo drift estrutural.
- Entregas obrigatorias:
  - dashboards por unidade e rede;
  - indicadores de conversao, ocupacao, inadimplencia, retencao e recuperacao;
  - observabilidade minima de integracoes e jobs;
  - ampliacao de testes unitarios e E2E;
  - sincronizacao continua entre `docs/prd.md` e o backlog.
