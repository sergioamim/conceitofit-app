# PRD - Conceito Fit Frontend de Gestão para Academias

## 1. Visão Geral do Produto
- O repositório atual implementa um frontend Next.js (App Router) para operação multiunidade de academias, com foco em rotina comercial, cadastro, financeiro, grade, treinos, segurança e monitoramento.
- O produto funciona hoje como uma aplicação única que mistura operação da unidade, páginas administrativas, backoffice embutido e telas públicas de monitor/mural.
- A base real de execução atual é majoritariamente client-side: `src/lib/mock/services.ts` centraliza regras e persistência em `localStorage`, com uso seletivo de APIs HTTP reais em módulos específicos.
- O objetivo aparente do produto é centralizar a gestão diária de academias por unidade (`tenant`) com visão adicional de rede/academia e alguns fluxos administrativos globais.
- Usuários inferidos pelo código:
  - Recepção/comercial da unidade.
  - Gestão financeira/gerencial.
  - Administração operacional da unidade.
  - Staff/backoffice da rede.
  - Operadores de segurança/acesso/catraca.
  - Monitores de recepção e mural público.

## 2. Objetivo de Negócio
- O sistema resolve a fragmentação operacional de academias ao concentrar CRM, clientes, matrículas, pagamentos, catálogo, financeiro e agenda em uma única interface.
- O valor entregue hoje está em:
  - manter contexto multiunidade;
  - permitir cadastro e conversão comercial;
  - acompanhar pagamentos e despesas;
  - controlar catálogo, grade e treinos;
  - oferecer telas de apoio para catraca, monitor e backoffice.
- Áreas principais do negócio atendidas:
  - Comercial/CRM.
  - Operação de clientes e matrículas.
  - Financeiro (recebimentos, contas a pagar, DRE).
  - Administração da unidade.
  - Segurança/RBAC.
  - Operação de acesso/catraca.
  - Backoffice de rede e importação legada.

## 3. Escopo Atual Identificado no Código

### Autenticação, sessão e contexto de unidade
- `Implementado`: login, logout, seleção de unidade prioritária, troca de unidade ativa, persistência de sessão e tenant preferido no navegador.
- `Implementado`: suporte a token, refresh token e tenant ativo com backend real.
- `Parcialmente implementado`: o app não expõe APIs próprias (`route.ts`: 0 arquivos); toda autenticação real depende de backend externo.
- `Indício de implementação / precisa validação`: auto-login de desenvolvimento por variáveis de ambiente e sincronização plena de tenant via backend real.

### CRM de prospects
- `Implementado`: listagem paginada, filtros, cadastro, edição, remoção, marcação como perdido, timeline de mensagens, agendamentos e kanban.
- `Implementado`: conversão de prospect em cliente com criação de matrícula e pagamento.
- `Parcialmente implementado`: as regras de avanço de status não são consistentes entre lista, modal de detalhe, kanban e documentação.
- `Indício de implementação / precisa validação`: persistência e contratos reais desses fluxos no backend, pois a UI ainda usa majoritariamente `mock/services`.

### Clientes e cadastro
- `Implementado`: cadastro direto de cliente sem matrícula, cadastro com matrícula no wizard, listagem paginada, busca por nome/CPF/telefone/e-mail, edição, foto por câmera e detalhe do cliente.
- `Implementado`: suspensão, reativação, histórico de suspensões, presenças, pagamentos e matrículas no detalhe.
- `Implementado`: cartões salvos do cliente e escolha de cartão padrão.
- `Parcialmente implementado`: páginas de conta do usuário (`perfil`, `notificações`, `preferências`, `segurança`) têm UI pronta, mas persistência parcial ou inexistente.
- `Indício de implementação / precisa validação`: validações de duplicidade de cliente no backend; o código só evidencia verificação explícita de duplicidade para prospect.

### Matrículas e planos
- `Implementado`: criação de matrícula, renovação, bloqueio por conflito de período/atividade, aplicação de convênio, renovação automática e cobrança recorrente conforme regras do plano.
- `Implementado`: CRUD de planos, destaque, ativação/inativação, benefícios, contrato HTML, anuidade, renovação e cobrança recorrente.
- `Parcialmente implementado`: a tela `/matriculas` não gerencia o ciclo completo de matrículas; ela lista vendas de plano recentes, não o repositório completo de matrículas.
- `Parcialmente implementado`: coexistem dois fluxos de venda de plano, um baseado em matrícula e outro em `venda`, com fronteira funcional inconsistente.

### Vendas, checkout e catálogo comercial
- `Implementado`: nova venda com carrinho unificado de plano, serviço e produto; suggestion box de cliente; leitor de código de barras por câmera; resumo de recibo/contrato imprimível.
- `Implementado`: listagem de vendas com filtros por período, tipo e forma de pagamento.
- `Implementado`: CRUD de produtos, serviços, convênios, vouchers, bandeiras e formas de pagamento.
- `Parcialmente implementado`: a aplicação de voucher/cupom na venda nova é simplificada e não respeita toda a modelagem existente de voucher.
- `Parcialmente implementado`: venda de plano não cria matrícula no fluxo `vendas/nova`, embora exista fluxo separado de matrícula.

### Pagamentos e contas a receber
- `Implementado`: listagem de pagamentos, baixa manual, emissão de NFSe unitária e em lote, importação CSV em lote, filtros por cliente/status/período.
- `Implementado`: página gerencial de contas a receber com visão consolidada de recebimentos planejados/abertos/recebidos.
- `Parcialmente implementado`: criação e ajuste de contas a receber aparecem apenas nas telas marcadas como `experimental`.
- `Parcialmente implementado`: parte do domínio usa `Pagamento`; parte usa adaptação de `ContaReceber` do backend.

### Financeiro gerencial
- `Implementado`: contas a pagar completas com tipos de conta, filtros, criação, edição, baixa, cancelamento, recorrência e DRE gerencial/projeção.
- `Implementado`: cálculo local de DRE com receitas recebidas e despesas pagas.
- `Parcialmente implementado`: coexistem telas maduras e telas `experimental` para contas a pagar, contas a receber e DRE.
- `Indício de implementação / precisa validação`: comportamento do scheduler/geração recorrente no backend; no repositório atual ele é simulado no frontend/mock.

### Administrativo operacional
- `Implementado`: cargos, funcionários, salas, atividades, grade, horários, unidades, academia, vouchers, convênios, produtos, serviços, tipos de conta, formas de pagamento e bandeiras.
- `Implementado`: branding e whitelabel no nível de academia, propagado para todas as unidades via CSS variables.
- `Parcialmente implementado`: parte das rotas administrativas é apenas alias/redirect para outras páginas (`/alunos`, `/administrativo/atividades`, `/gerencial/academia`, etc.).
- `Parcialmente implementado`: contas bancárias, maquininhas e conciliação bancária dependem diretamente de API real; não possuem fallback funcional equivalente ao restante.

### Treinos
- `Implementado`: cadastro/listagem de treinos paginados, filtro por cliente, criação de treinos com itens/séries e CRUD de exercícios.
- `Implementado`: detalhe de treino por cliente.
- `Parcialmente implementado`: o código mostra estrutura mais rica no tipo/API do que o fluxo completo exercitado na UI atual.

### Catraca, acesso e monitoramento
- `Implementado`: dashboard/lista de acessos da catraca, filtros por tipo/status, liberação manual no detalhe do cliente, monitor de boas-vindas e status de conexões por tenant.
- `Implementado`: geração de credencial de catraca por unidade no administrativo.
- `Parcialmente implementado`: esses fluxos dependem fortemente de backend/API real e permissões altas.
- `Indício de implementação / precisa validação`: integração com agentes/tray, WebSocket e hardware físico.

### Segurança e RBAC
- `Implementado`: gestão de perfis, grants, vínculo usuário-perfil, auditoria e acesso por unidade.
- `Parcialmente implementado`: RBAC não usa o mesmo fallback mock do restante; depende de endpoints reais ou de interceptação de rede em testes.
- `Indício de implementação / precisa validação`: cobertura completa de permissões em produção, já que a validação no frontend é pontual.

### Backoffice e importação
- `Implementado`: home admin, cadastro/listagem de academias e unidades globais.
- `Implementado`: tela extensa de importação EVO P0 com upload de pacote, análise, criação de job, polling, histórico e paginação de rejeições.
- `Parcialmente implementado`: o backoffice ainda está embutido na mesma aplicação; a documentação existente descreve um app separado que não existe neste repositório.

## 4. Principais Módulos e Responsabilidades

### Shell da aplicação
- Responsabilidade: autenticação de rota, sidebar, topbar, troca de unidade, busca global por cliente e tema.
- Dependências principais: `src/app/(app)/layout.tsx`, `src/components/layout/*`, `src/lib/api/session.ts`, `src/lib/mock/store.ts`.
- Observações arquiteturais: toda a navegação operacional depende do tenant ativo no navegador.

### Camada de domínio mock/fallback
- Responsabilidade: concentrar regras de negócio, mutações e persistência local.
- Dependências principais: `src/lib/mock/services.ts`, `src/lib/mock/store.ts`, `src/lib/types.ts`.
- Observações arquiteturais: é o verdadeiro backend em runtime para a maior parte do sistema atual.

### Adapters HTTP reais
- Responsabilidade: encapsular chamadas REST por domínio.
- Dependências principais: `src/lib/api/*`, `src/lib/api/http.ts`, `src/lib/api/auth.ts`.
- Observações arquiteturais: a cobertura de adapters é ampla, mas a adoção pelas telas ainda é parcial.

### Contexto organizacional e whitelabel
- Responsabilidade: academia, unidade, branding, tema, impressão de cupom e preferências de contexto.
- Dependências principais: `contexto-unidades`, `tenant-theme`, páginas de academia/unidades/admin.
- Observações arquiteturais: a academia é tratada como entidade forte; unidade é o contexto transacional.

### CRM
- Responsabilidade: prospecção, follow-up, agendamentos, mensagens e conversão.
- Dependências principais: páginas de `prospects`, `crm/prospects-kanban`, modais de prospect e serviços CRM.
- Observações arquiteturais: existem múltiplas superfícies para o mesmo funil, com regras parcialmente divergentes.

### Clientes, matrículas e pagamentos
- Responsabilidade: cadastro, detalhe do cliente, matrículas, pagamentos, cartões e presenças.
- Dependências principais: páginas de clientes, `novo-cliente-wizard`, `nova-matricula-modal`, `receber-pagamento-modal`.
- Observações arquiteturais: o status do cliente é recalculado localmente a partir de matrícula e pagamentos.

### Catálogo e vendas
- Responsabilidade: planos, produtos, serviços, vouchers, convênios, vendas e checkout.
- Dependências principais: páginas `planos`, `vendas`, `vendas/nova`, modais e formulários de catálogo.
- Observações arquiteturais: há sobreposição entre venda de plano e fluxo formal de matrícula.

### Financeiro gerencial
- Responsabilidade: contas a pagar, tipos de conta, recorrência, DRE e contas a receber.
- Dependências principais: `gerencial/*`, `tipos-conta`, `financeiro-gerencial`, `contas-receber`.
- Observações arquiteturais: módulo relativamente maduro no mock, com API real parcialmente endereçada.

### Administrativo operacional
- Responsabilidade: funcionários, cargos, salas, atividades, grade, horários, formas de pagamento e parametrizações.
- Dependências principais: páginas `administrativo/*`, componentes compartilhados e APIs administrativas.
- Observações arquiteturais: mistura módulos 100% mock com módulos 100% API.

### Catraca e monitor
- Responsabilidade: acesso físico, dashboards, status de conexão, credenciais e telas públicas de recepção.
- Dependências principais: `api/catraca`, páginas de catraca, `monitor/boas-vindas`, grade mural.
- Observações arquiteturais: módulo dependente de integrações externas e polling.

### Segurança e RBAC
- Responsabilidade: perfis, grants, vínculo usuário-perfil, auditoria e acesso por unidade.
- Dependências principais: `api/rbac`, `rbac/hooks.ts`, `rbac/services.ts`, páginas de segurança.
- Observações arquiteturais: módulo mais aderente ao backend real que o restante do app.

### Backoffice e importação legada
- Responsabilidade: visão global de academias/unidades e importação EVO P0.
- Dependências principais: `src/app/(backoffice)/admin/*`, `api/importacao-evo.ts`.
- Observações arquiteturais: a documentação fala em app separado, mas a implementação atual está no mesmo frontend.

## 5. Fluxos Funcionais Atuais

### 5.1 Login e seleção de unidade
- Objetivo: autenticar o usuário e definir o tenant operacional.
- Entradas: e-mail, senha, unidade prioritária.
- Regras relevantes:
  - em mock, basta marcar a sessão local;
  - em API real, usa login/refresh e sincroniza tenant ativo da sessão;
  - a unidade prioritária é salva no navegador.
- Saídas: sessão ativa, tenant corrente definido, redirecionamento para `/dashboard`.
- Módulos envolvidos: `login`, `api/auth`, `api/session`, `mock/services`.

### 5.2 Troca de unidade ativa
- Objetivo: mudar o contexto transacional sem trocar de aplicação.
- Entradas: tenant selecionado na topbar ou login.
- Regras relevantes:
  - em mock, só permite trocar para unidade ativa da mesma academia/grupo;
  - em API real, troca via endpoint de contexto/autenticação.
- Saídas: `currentTenantId` atualizado, tema e dados recarregados.
- Módulos envolvidos: `app-topbar`, `contexto-unidades`, `tenant-theme-sync`.

### 5.3 Cadastro direto de cliente
- Objetivo: criar cliente sem matrícula imediata.
- Entradas: nome, telefone, CPF e dados opcionais.
- Regras relevantes:
  - wizard exige nome, telefone e CPF para avançar/finalizar;
  - o cliente nasce com `pendenteComplementacao=true` e status inicial `INATIVO`.
- Saídas: novo cliente visível na listagem e no detalhe.
- Módulos envolvidos: `clientes`, `novo-cliente-wizard`, `mock/services`.

### 5.4 Cadastro de cliente com matrícula
- Objetivo: criar cliente já vinculado a um plano.
- Entradas: dados pessoais, plano, data de início, forma de pagamento, desconto opcional.
- Regras relevantes:
  - cria cliente, matrícula e pagamento no mesmo fluxo;
  - no cadastro direto com matrícula, o cliente nasce `ATIVO`;
  - o pagamento inicial é criado como `PENDENTE`.
- Saídas: cliente ativo, matrícula `ATIVA`, pagamento inicial.
- Módulos envolvidos: `novo-cliente-wizard`, `criarAlunoComMatricula`, `planos`, `formas-pagamento`.

### 5.5 Conversão de prospect
- Objetivo: transformar prospect em cliente com matrícula.
- Entradas: prospect, CPF, data de nascimento, sexo, plano, data de início, forma de pagamento, desconto.
- Regras relevantes:
  - o prospect é marcado como `CONVERTIDO` e recebe item no `statusLog`;
  - cria aluno, matrícula e pagamento;
  - no fluxo local atual, o aluno convertido nasce `INATIVO` apesar da matrícula ativa.
- Saídas: prospect convertido, cliente criado, matrícula criada, pagamento criado.
- Módulos envolvidos: `prospects/[id]/converter`, `crm`, `clientes`, `matriculas`.

### 5.6 Gestão do funil CRM
- Objetivo: acompanhar leads e evoluir status comercial.
- Entradas: filtros, atualização de status, mensagens, agendamentos, motivo de perda.
- Regras relevantes:
  - há kanban, lista tabular e modal de detalhe;
  - o modal de detalhe aplica fluxo diferente para origem presencial;
  - marcar perdido registra motivo;
  - duplicidade explícita só é checada para prospect.
- Saídas: leads atualizados, histórico de status, agenda e conversa registrados.
- Módulos envolvidos: `prospects`, `crm/prospects-kanban`, `prospect-detail-modal`, serviços CRM.

### 5.7 Nova matrícula
- Objetivo: adicionar ou renovar matrícula de cliente existente.
- Entradas: cliente, plano, data de início, forma de pagamento, desconto, convênio, renovação automática.
- Regras relevantes:
  - gera pagamento automaticamente;
  - bloqueia plano igual ou atividades conflitantes em período vigente;
  - convênio precisa estar ativo e compatível com o plano;
  - cobrança recorrente/renovação dependem da configuração do plano.
- Saídas: nova matrícula e novo pagamento.
- Módulos envolvidos: `nova-matricula-modal`, `clientes/[id]`, `planos`, `convênios`.

### 5.8 Nova venda
- Objetivo: registrar venda de plano, serviço ou produto em carrinho único.
- Entradas: cliente opcional/obrigatório conforme tipo, itens, cupom, acréscimo e pagamento.
- Regras relevantes:
  - cliente é obrigatório para plano e serviço;
  - produto pode ser vendido sem cliente identificado;
  - cupom é buscado por código nos vouchers ativos de venda;
  - a venda gera um pagamento para o cliente quando ele está identificado.
- Saídas: venda fechada, recibo/contrato imprimível e pagamento associado quando aplicável.
- Módulos envolvidos: `vendas/nova`, `checkout-payment`, `sale-receipt-modal`, catálogo.

### 5.9 Pagamentos e recebimentos
- Objetivo: acompanhar, receber, importar e faturar cobranças.
- Entradas: filtros, baixa manual, CSV de importação, seleção de cliente, lote de NFSe.
- Regras relevantes:
  - pagamento pendente com vencimento passado vira `VENCIDO`;
  - receber pagamento altera status e pode reativar cliente;
  - importação em lote valida descrição, valor, desconto e datas;
  - emissão de NFSe é marcada no pagamento.
  - o perfil do cliente não deve consultar configuração fiscal no carregamento inicial apenas para exibir a aba `NFS-e`;
  - a aba `NFS-e` do perfil do cliente carrega sob demanda e prioriza listar documentos emitidos e estados fiscais já refletidos nos pagamentos.
- Saídas: pagamentos atualizados, títulos recebidos e NFSe marcada/emitida.
- Módulos envolvidos: `pagamentos`, `pagamentos/emitir-em-lote`, `receber-pagamento-modal`, `mock/services`.

### 5.10 Contas a receber gerenciais
- Objetivo: visualizar recebíveis planejados no período.
- Entradas: período, status, busca.
- Regras relevantes:
  - a tela estável é analítica/listagem;
  - criação e ajuste estão nas telas `experimental`.
- Saídas: resumo planejado/recebido/em aberto e lista filtrada.
- Módulos envolvidos: `gerencial/contas-a-receber`, `gerencial/contas-a-receber-experimental`.

### 5.11 Contas a pagar e recorrência
- Objetivo: registrar despesas, pagar contas e gerar recorrências.
- Entradas: tipo de conta, fornecedor, categoria, grupo DRE, competência, vencimento, valores, recorrência, forma de pagamento.
- Regras relevantes:
  - forma de pagamento é obrigatória para baixa;
  - conta pendente vencida vira `VENCIDA`;
  - recorrência pode ser mensal ou por intervalo de dias;
  - regra pode ou não criar o lançamento inicial.
- Saídas: contas pagas/canceladas, regras recorrentes e títulos gerados.
- Módulos envolvidos: `gerencial/contas-a-pagar`, `tipos-conta`, `financeiro-gerencial`.

### 5.12 DRE e projeção
- Objetivo: consolidar receita e despesa em visão gerencial.
- Entradas: mês/ano ou intervalo customizado.
- Regras relevantes:
  - DRE realizado considera somente pagamentos recebidos e despesas pagas no período;
  - projeção usa aberto de contas a receber e pagar.
- Saídas: blocos de DRE, ticket médio, inadimplência e despesas agrupadas.
- Módulos envolvidos: `gerencial/dre`, `mock/services`, `financeiro-gerencial`.

### 5.13 Grade, mural e monitor de recepção
- Objetivo: exibir agenda operacional e monitor de boas-vindas.
- Entradas: tenant, data, registros de grade, eventos de catraca.
- Regras relevantes:
  - grade semanal usa atividades `PREVIAMENTE` agendadas;
  - vagas só são expostas no check-in quando a janela está aberta;
  - monitor de recepção usa polling frequente e tenta enriquecer nome/foto/aniversário/plano.
- Saídas: calendário operacional, mural público e monitor visual de acessos.
- Módulos envolvidos: `grade`, `grade/mural`, `monitor/boas-vindas`, `api/catraca`.

### 5.14 Operação de catraca
- Objetivo: monitorar acessos, status de conexão e liberar entrada manual.
- Entradas: filtros de período/status/liberação, justificativa de liberação, tenant.
- Regras relevantes:
  - liberação manual no detalhe do cliente exige justificativa;
  - status de conexões depende de permissão alta em modo real;
  - geração de credencial exige token administrativo.
- Saídas: acessos listados, dashboards de frequência e credenciais de integração.
- Módulos envolvidos: `gerencial/catraca-acessos`, `administrativo/catraca-status`, `administrativo/unidades`.

### 5.15 Backoffice e importação EVO P0
- Objetivo: operar a rede e importar dados legados.
- Entradas: academia, unidade, arquivos/pacote EVO, flags de dry-run, limite de rejeições.
- Regras relevantes:
  - há análise prévia do pacote;
  - jobs são acompanhados por polling;
  - histórico do job e contexto ficam em `localStorage`.
- Saídas: academias/unidades cadastradas, job de importação criado, rejeições e resumos de execução.
- Módulos envolvidos: `admin/*`, `api/importacao-evo`, `mock/services`.

## 6. Regras de Negócio Identificadas
- Todo dado transacional relevante carrega `tenantId`.
- Troca de unidade em mock só ocorre entre unidades ativas da mesma academia/grupo.
- Tema e branding são aplicados no nível de `Academia`, não no nível de `Tenant`.
- Cliente `CANCELADO` permanece cancelado; cliente `SUSPENSO` tem prioridade sobre cálculo automático de status.
- Cliente com pagamento `VENCIDO` fica `INATIVO`.
- Cliente só é tratado como `ATIVO` quando possui matrícula `ATIVA` vigente na data atual e não tem título vencido.
- Pagamentos `PENDENTE` com vencimento anterior a hoje são convertidos automaticamente para `VENCIDO`.
- Criação de matrícula sempre gera pagamento.
- `dataFim` de matrícula é calculada por `dataInicio + duracaoDias` do plano.
- Convênio inativo bloqueia matrícula/renovação; convênio com escopo por plano só vale para planos vinculados.
- Não é permitido criar matrícula com plano igual em período vigente do mesmo cliente.
- Não é permitido criar matrícula com sobreposição de atividades no período vigente do mesmo cliente.
- Renovação automática e cobrança recorrente só podem ser usadas se o plano permitir.
- Planos `AVULSO` desabilitam renovação automática, cobrança recorrente e anuidade.
- Dia padrão de cobrança recorrente de plano é normalizado para faixa de 1 a 28.
- Parcelamento máximo de anuidade é normalizado para faixa de 1 a 24.
- Prospect criado nasce em `NOVO` com `statusLog` inicial.
- Atualização de status de prospect acrescenta item em `statusLog`.
- Prospect `PERDIDO` registra `motivoPerda`.
- No modal de detalhe, prospects de origem `VISITA_PRESENCIAL` pulam `AGENDOU_VISITA` ao avançar de `NOVO`.
- Cadastro direto de cliente marca `pendenteComplementacao=true`.
- Primeiro cartão salvo de cliente vira cartão padrão; o padrão é exclusivo por cliente.
- Baixa de conta a pagar exige forma de pagamento.
- Valor líquido de conta a pagar é `valorOriginal - desconto + jurosMulta`.
- Regras de recorrência de conta a pagar podem gerar lançamentos automaticamente até uma data limite.
- DRE realizado usa apenas receitas pagas e despesas pagas dentro do período.
- Liberação manual de acesso na catraca exige justificativa textual.
- Upload EVO usa cabeçalho `X-Tenant-Id` e aceita pacote grande via proxy local configurável.

## 7. Integrações Externas

### Backend Java via REST
- Finalidade: autenticação, contexto de unidade, RBAC, catraca, financeiro, catálogo e importação.
- Ponto de uso: `src/lib/api/*` e fallback dentro de `src/lib/mock/services.ts`.
- Risco/observação: o frontend não expõe APIs próprias; toda integração real depende de serviço externo e ainda não é consumida uniformemente pelas telas.

### Persistência local no navegador
- Finalidade: armazenar store mock, sessão, tenant ativo/preferido, histórico de job EVO e contexto.
- Ponto de uso: `src/lib/mock/store.ts`, `src/lib/api/session.ts`, páginas/admin importação.
- Risco/observação: estado é local ao navegador; não há garantia de consistência multiusuário nem trilha transacional real.

### ViaCEP
- Finalidade: autofill de endereço por CEP.
- Ponto de uso: `novo-cliente-wizard`, `cliente-edit-form`.
- Risco/observação: dependência pública externa sem camada de retry/observabilidade dedicada.

### Câmera do navegador
- Finalidade: captura de foto de cliente e leitura de código de barras.
- Ponto de uso: `novo-cliente-wizard`, `cliente-photo-modal`, `vendas/nova`.
- Risco/observação: requer permissão local do navegador/dispositivo; não há fallback avançado além de input manual.

### Impressão do navegador
- Finalidade: recibo e contrato.
- Ponto de uso: `sale-receipt-modal`.
- Risco/observação: depende de `window.print()` e comportamento do browser/ambiente.

### Google Fonts e script opcional de React Scan
- Finalidade: tipografia e profiling visual em desenvolvimento.
- Ponto de uso: `src/app/layout.tsx`.
- Risco/observação: não afeta regra de negócio, mas adiciona dependências externas em runtime.

### Integração EVO P0
- Finalidade: importar dados legados e acompanhar jobs administrativos.
- Ponto de uso: `admin/importacao-evo-p0`, `api/importacao-evo.ts`.
- Risco/observação: depende de contrato backend, polling e cabeçalho explícito de tenant.

## 8. Requisitos Funcionais
- O sistema deve permitir autenticar usuário e manter sessão com tenant ativo.
- O sistema deve permitir definir e reutilizar uma unidade prioritária no login.
- O sistema deve permitir trocar a unidade ativa durante a navegação.
- O sistema deve permitir cadastrar prospects, editá-los, marcá-los como perdidos e removê-los.
- O sistema deve registrar histórico de status, mensagens e agendamentos de prospects.
- O sistema deve permitir converter prospect em cliente com matrícula e pagamento.
- O sistema deve permitir cadastrar cliente sem matrícula e sinalizar cadastro pendente de complementação.
- O sistema deve permitir cadastrar cliente já com matrícula.
- O sistema deve listar clientes com paginação, filtros por status e busca textual/dígitos.
- O sistema deve permitir editar dados cadastrais, foto, suspensão, cartões e visualizar presenças de clientes.
- O sistema deve validar conflitos de matrícula por período, plano e atividades.
- O sistema deve gerar pagamento ao criar matrícula.
- O sistema deve permitir cadastrar, editar, ativar/inativar e destacar planos.
- O sistema deve permitir cadastrar e manter produtos, serviços, convênios, vouchers, bandeiras e formas de pagamento.
- O sistema deve permitir registrar vendas de plano, serviço e produto em checkout único.
- O sistema deve permitir buscar cliente por suggestion box e itens por nome/SKU/código de barras.
- O sistema deve listar e receber pagamentos, além de emitir NFSe individualmente ou em lote.
- O sistema deve importar pagamentos em lote por CSV/texto colado.
- O sistema deve listar contas a receber por período e status.
- O sistema deve permitir cadastrar, editar, pagar, cancelar e recorrenciar contas a pagar.
- O sistema deve calcular DRE gerencial e projeções por período.
- O sistema deve permitir gerenciar cargos, funcionários, salas, atividades, grade e horários.
- O sistema deve permitir visualizar a grade semanal e o mural público por tenant.
- O sistema deve permitir cadastrar treinos, exercícios e consultar treinos por cliente.
- O sistema deve permitir monitorar acessos de catraca, status de conexão e liberar acesso manual.
- O sistema deve permitir gerenciar perfis RBAC, grants, vínculos usuário-perfil e acesso por unidade.
- O sistema deve permitir cadastrar academias/unidades em backoffice e iniciar importação EVO P0.

## 9. Requisitos Não Funcionais Inferidos
- Multi-tenant: o sistema deve respeitar escopo por `tenantId` na maioria dos dados transacionais.
- Autenticação: o sistema deve suportar `Bearer token`, `refresh token` e tenant ativo em sessão.
- Rastreabilidade mínima: chamadas HTTP podem enviar `X-Context-Id`; importação EVO usa `X-Tenant-Id`.
- Resiliência de desenvolvimento: vários domínios devem continuar operando com fallback local quando a API real falha.
- Persistência local: o sistema deve preservar estado mock e sessão entre reloads via `localStorage`.
- Upload: o proxy local suporta corpo grande para pacote EVO (configuração padrão de 150 MB).
- Responsividade: as páginas principais usam layout responsivo com tabelas, cards e modais.
- Observabilidade limitada: erros são tratados via `ApiRequestError`, `fieldErrors`, toasts e `console.warn/error`; não há stack de telemetria própria no repositório.
- Compatibilidade web: funcionalidades de câmera e impressão dependem de APIs nativas do navegador.
- Testabilidade atual: há Playwright e testes unitários, mas com cobertura restrita.

## 10. Gaps, Débitos e Inconsistências
- A arquitetura real continua centrada em `mock/services` e `localStorage`; hoje há 69 arquivos importando `@/lib/mock/services` e apenas adoção parcial da camada `src/lib/api/*`.
- O repositório não contém backend nem route handlers próprios; toda execução real depende de serviços externos não versionados aqui.
- Módulos administrativos de contas bancárias, maquininhas, conciliação bancária, RBAC e EVO P0 dependem de API real e não possuem fallback equivalente ao restante.
- A página de lista de prospects usa ordem de avanço `NOVO -> EM_CONTATO -> AGENDOU_VISITA -> VISITOU`, enquanto o modal de detalhe aplica outro fluxo e a documentação descreve outro ainda.
- O kanban permite arrastar prospect diretamente para qualquer coluna, contornando regras de progressão guiada.
- A conversão de prospect cria matrícula ativa, mas o aluno nasce `INATIVO` no fluxo local, divergindo do cadastro direto com matrícula.
- O fluxo `vendas/nova` registra venda de plano sem criar matrícula; já o fluxo de matrícula cria pagamento separado. O sistema tem duas fontes de verdade concorrentes para “venda de plano”.
- A página `/matriculas` lista vendas com item `PLANO`, não o conjunto real de matrículas do cliente/unidade.
- A aplicação de cupom em `vendas/nova` é simplificada: desconto fixo de 10% para tipos contendo `DESCONTO`, sem uso explícito de `quantidade`, `umaVezPorCliente`, `planoIds`, `aplicarEm` ou marcação de uso do código.
- As páginas de conta do usuário (`notificações`, `preferências`, `segurança`) têm botão de salvar, mas não mostram persistência real no código.
- A rota `grade/img` redireciona para o mural semanal, apesar de existir um componente dedicado de imagem diária (`GradeDayImageBoard`) não conectado às rotas atuais.
- Há aliases de navegação por redirect (`/alunos`, `/administrativo/atividades`, `/gerencial/academia`, `/gerencial/formas-pagamento`, etc.), indicando drift de arquitetura de informação.
- O módulo de contas a receber “estável” é apenas consulta; criação/ajuste permanecem em rotas `experimental`.
- Testes automatizados cobrem apenas cadastro de cliente e RBAC; não há evidência de cobertura para vendas, pagamentos, financeiro, catraca, admin ou importação EVO.
- Há uso recorrente de `alert`, `confirm` e `prompt` em fluxos críticos, o que empobrece UX e dificulta automação/consistência.
- A documentação `docs/BACKEND_REAL_INTEGRATION_VALIDATION.md` fala em 45 imports diretos de mock; o código atual aponta 69 arquivos, indicando documentação desatualizada.
- A documentação de backoffice/totem descreve apps separados (`apps/admin`, `apps/totem`), mas a implementação atual permanece dentro do mesmo app Next.js.

## 11. Oportunidades de Evolução

### 11.1 Diretrizes de produto assumidas nesta revisão
- Prioridade absoluta: eliminar duplicidade funcional e divergência de regras antes de abrir novas frentes.
- `src/lib/mock/services.ts` e `src/lib/mock/store.ts` deixam de ser arquitetura aceitável para fluxos transacionais.
- `localStorage` deixa de ser fallback de dados de domínio; no máximo pode permanecer para preferências estritamente locais e não transacionais.
- O fluxo operacional de `matrícula` deve ser descontinuado como jornada separada.
- A contratação de plano deve convergir para um fluxo canônico de `venda -> contrato/assinatura -> recebível/cobrança -> status do cliente`.
- Regras de prospect, cliente, contrato, agenda, cobrança e acesso devem ter uma única fonte de verdade por domínio.

### 11.2 Benchmark competitivo orientado a cobertura
- `Reservas de aula, lista de espera, reagendamento e ocupação`: baseline observado em [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [W12 / EVO](https://w12.com.br/); no código atual existem apenas sinais de parametrização em `AtividadeGrade` (`permiteReserva`, `desabilitarListaEspera`, `permitirEscolherNumeroVaga`, `exibirNoAppCliente`, `exibirWellhub`), sem jornada operacional do aluno para reservar, entrar em fila, cancelar, reagendar ou fazer check-in de aula. Faz sentido incorporar.
- `Autoatendimento do aluno e portal/app de membros`: baseline observado em [ABC Ignite](https://abcfitness.com/ignite/), [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [W12 / EVO](https://w12.com.br/); o repositório atual só mostra páginas de conta parcialmente persistidas, cartões do cliente, telas públicas de monitor e um plano documental de totem em `docs/TOTEM_SELF_SERVICE.md`. Faz sentido incorporar.
- `Contratação digital, contrato eletrônico e adesão self-service`: baseline observado em [ABC Ignite](https://abcfitness.com/ignite/), [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [Mindbody](https://www.mindbodyonline.com/business/education/software/fitness); hoje o sistema tem `contratoTemplateHtml`, modo de assinatura e impressão/envio simulado no frontend, mas não há assinatura eletrônica persistida, jornada pública de adesão ou checkout online canônico. Faz sentido incorporar.
- `Cobrança automática, recuperação de receita e régua de inadimplência`: baseline observado em [ABC Ignite](https://abcfitness.com/ignite/), [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [W12 / EVO](https://w12.com.br/); o código atual cobre pagamentos, contas a receber experimentais e DRE, mas não evidencia retentativa, régua multi-canal, recuperação automática de cobrança ou link/QR de pagamento como fluxo principal. Faz sentido incorporar.
- `CRM com automações reais e canais externos`: baseline observado em [W12 / EVO](https://w12.com.br/) e [Next Fit](https://nextfit.com.br/sistema-para-academia/); hoje há `crm/campanhas` e campanhas com audiência estimada, porém toda a execução é mock/local e não há integração real com WhatsApp, e-mail, SMS, playbooks ou tarefas comerciais. Faz sentido incorporar.
- `Treino digital, avaliação física e evolução do aluno`: baseline observado em [Next Fit](https://nextfit.com.br/sistema-para-academia/), [Trainerize](https://www.trainerize.com/) e [W12 / EVO](https://w12.com.br/); o código atual cobre treinos e exercícios, mas não traz avaliação física, anamnese, métricas corporais, histórico de evolução, hábitos ou experiência digital do aluno consumindo o treino. Faz sentido incorporar.
- `Integrações de agregadores e acesso`: baseline observado em [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [W12 / EVO](https://w12.com.br/); o código atual já expõe sinais de intenção com `exibirWellhub`, catraca, credenciais e monitor, mas não há evidência de fluxo completo para agregadores, QR/facial ou autoatendimento operacional. Faz sentido incorporar quando os contratos backend estiverem definidos.
- `BI de rede, performance comercial e retenção`: baseline observado em [ABC Ignite](https://abcfitness.com/ignite/) e [W12 / EVO](https://w12.com.br/); hoje há DRE local, dashboards isolados e visão de acessos, sem camada consolidada de conversão, retenção, ocupação, inadimplência e performance por rede/unidade. Faz sentido incorporar.
- `Comunidade, gamificação e social`: aparece em [Next Fit](https://nextfit.com.br/sistema-para-academia/) e [Trainerize](https://www.trainerize.com/), mas não há sinais concretos no código além de CRM de indicação. É oportunidade opcional e não prioritária neste momento.

### 11.3 Oportunidades por horizonte

#### Curto prazo
- Remover `mock/services.ts` e o store transacional em `localStorage`, migrando os domínios já mapeados para os adapters HTTP reais.
- Eliminar o fluxo de `matrícula` como jornada independente e convergir toda contratação de plano para venda/contrato/cobrança.
- Unificar a progressão de prospect entre lista, modal, kanban e conversão.
- Consolidar `Pagamento` e `ContaReceber` em um ciclo financeiro mais claro, promovendo o que hoje está em `experimental`.
- Corrigir ou retirar páginas com persistência inexistente (`conta/notificacoes`, `conta/preferencias`, `conta/seguranca`) e rotas ociosas/alias.

#### Médio prazo
- Implementar reserva, lista de espera, cancelamento, reagendamento e check-in de aulas com base na grade já existente.
- Entregar jornada digital do aluno em web responsivo ou PWA, cobrindo agenda, pagamentos, contratos, check-in e autoatendimento básico.
- Expandir treinos para avaliação física, evolução e histórico do aluno.
- Evoluir campanhas CRM para automação real por canais externos, com tarefas e cadências.
- Fechar integrações pendentes de contas bancárias, maquininhas, conciliação, catraca e agregadores.

#### Estrutural / arquitetural
- Transferir regras críticas hoje embutidas no frontend para contratos backend estáveis.
- Reorganizar bounded contexts para que CRM, vendas/contratos, recebíveis, agenda, treinos e acesso tenham fronteiras mais claras.
- Reavaliar a separação entre app operacional, backoffice e experiências públicas apenas depois da convergência funcional principal.
- Instituir uma estratégia de testes e observabilidade por domínio antes de ampliar cobertura funcional de rede.

## 12. Backlog Inicial Recomendado

### Épico: Remover camada mock e convergir para backend real
- Prioridade: `P0`.
- Objetivo: tirar `mock/services.ts` e o store local do caminho crítico de operação.
- Valor entregue: uma única fonte de verdade para dados transacionais e redução de divergência entre frontend e backend.
- Principais tasks sugeridas:
  - inventariar por domínio os imports de `@/lib/mock/services` e classificá-los em leitura, escrita e regra de negócio;
  - definir sequência de migração por domínio: contexto/sessão, CRM, clientes, vendas/contratos, recebíveis, financeiro e treinos;
  - completar e padronizar a camada `src/lib/api/*`, incluindo tratamento de erro, paginação, filtros e tipagem;
  - substituir o uso de `localStorage` como persistência de domínio por cache transitório de consulta, mantendo no navegador apenas preferências locais se realmente necessárias;
  - remover `src/lib/mock/store.ts`, eventos globais de sincronização e lógica de fallback transacional;
  - atualizar documentação técnica e mapa de dependências ao final de cada domínio migrado.

### Épico: Consolidar venda de plano, contrato e ciclo de vida do cliente sem matrícula
- Prioridade: `P0`.
- Objetivo: definir e implementar o fluxo canônico de contratação de plano sem o conceito operacional separado de matrícula.
- Valor entregue: eliminação da principal duplicidade funcional do produto.
- Principais tasks sugeridas:
  - definir o modelo alvo entre `cliente`, `plano`, `contrato/assinatura`, `recebível`, `pagamento` e `status do cliente`;
  - substituir a jornada atual de `nova-matricula-modal`, `/matriculas` e conversão de prospect por uma única jornada comercial;
  - transformar `/matriculas` em tela de contratos/assinaturas ou removê-la da navegação;
  - ajustar `/vendas/nova` para tratar contratação de plano como fluxo canônico;
  - revisar regras de status do cliente, hoje derivadas de matrícula + pagamentos, para passarem a refletir contrato + cobrança;
  - alinhar recibo, contrato, renovação, convênio e recorrência ao novo domínio.

### Épico: Corrigir divergências do CRM e transformar campanhas em operação real
- Prioridade: `P0`.
- Objetivo: tornar CRM, conversão e campanhas coerentes e auditáveis.
- Valor entregue: previsibilidade comercial e menor perda por regra inconsistente.
- Principais tasks sugeridas:
  - consolidar enum, ordem e regras de transição de prospect em um único contrato;
  - restringir o kanban para respeitar transições válidas e registrar exceções quando necessário;
  - unificar o comportamento da conversão de prospect para cliente no fluxo canônico de contratação;
  - implementar deduplicação consistente entre prospect e cliente por CPF, telefone e e-mail;
  - migrar `crm/campanhas` do mock para backend real;
  - acrescentar tarefas comerciais, cadências, lembretes e disparo real por canal externo quando o backend/provedor existir.

### Épico: Consolidar cobrança, recebíveis e recuperação de receita
- Prioridade: `P0`.
- Objetivo: transformar pagamentos e contas a receber em um domínio financeiro único e operacional.
- Valor entregue: menos telas paralelas, menor inadimplência e melhor previsibilidade de caixa.
- Principais tasks sugeridas:
  - unificar os conceitos de `Pagamento` e `ContaReceber` e remover o dualismo entre telas estáveis e `experimental`;
  - trazer criação, ajuste, baixa, renegociação e importação de recebíveis para o fluxo principal;
  - implementar régua de cobrança, lembretes, aging e reativação do cliente baseada em evento financeiro real;
  - integrar emissão de NFSe ao ciclo definitivo de recebimento;
  - incluir link/QR de pagamento quando isso fizer parte do backend/plataforma;
  - formalizar critérios de cobrança recorrente, falha de cobrança e recuperação de receita.

### Épico: Implementar agenda operacional de aulas com reserva, fila e check-in
- Prioridade: `P1`.
- Objetivo: sair de uma grade parametrizada para uma operação real de agenda do aluno.
- Valor entregue: cobertura de um gap competitivo importante reaproveitando a grade já existente.
- Principais tasks sugeridas:
  - criar jornada do aluno para reservar vaga, cancelar, reagendar e consultar agenda;
  - implementar lista de espera respeitando `desabilitarListaEspera` e capacidade;
  - suportar regras de check-in por janela, no-show, bloqueio e ocupação;
  - tratar `permitirEscolherNumeroVaga`, agregadores e Wellhub apenas se houver contrato backend;
  - criar visão operacional de ocupação por aula, sala, instrutor e unidade;
  - conectar mural, monitor e agenda do aluno quando o contexto fizer sentido.

### Épico: Entregar jornada digital do aluno e autoatendimento
- Prioridade: `P1`.
- Objetivo: oferecer uma experiência digital coerente para o aluno fora do balcão.
- Valor entregue: alinhamento com baseline de mercado sem abrir outro produto desnecessariamente cedo.
- Principais tasks sugeridas:
  - consolidar uma área do aluno responsiva com agenda, cobranças, contratos, cartões e dados cadastrais;
  - transformar as páginas de conta em fluxos reais de preferências, notificações e segurança;
  - disponibilizar consulta de treino, status financeiro e comprovantes para o aluno;
  - definir se o primeiro passo será web responsivo, PWA ou app separado; o código atual aponta mais para web/PWA;
  - implementar autoatendimento básico com base em `docs/TOTEM_SELF_SERVICE.md` apenas após validar backend e hardware;
  - criar a jornada pública de interesse/adesão quando o fluxo comercial canônico estiver estável.

### Épico: Expandir treinos para avaliação física e evolução
- Prioridade: `P1`.
- Objetivo: completar o domínio de treinos para além do cadastro de ficha.
- Valor entregue: maior aderência ao que o mercado entrega no digital do aluno e do professor.
- Principais tasks sugeridas:
  - incluir avaliação física, anamnese, PAR-Q e métricas corporais;
  - registrar evolução por período com histórico comparativo;
  - permitir publicação/entrega do treino para o aluno no canal digital escolhido;
  - estruturar feedback de execução, observações e revisão de treino;
  - validar se hábitos, nutrição e conteúdo em vídeo entram no escopo ou ficam fora do web atual.

### Épico: Completar administrativo operacional, financeiro e integrações pendentes
- Prioridade: `P1`.
- Objetivo: fechar módulos já expostos na navegação, mas ainda híbridos, parciais ou dependentes demais do mock.
- Valor entregue: redução de lacunas em áreas administrativas e financeiras críticas.
- Principais tasks sugeridas:
  - estabilizar contas bancárias, maquininhas e conciliação bancária na API real;
  - consolidar contas a pagar, recorrência, DRE e dashboards financeiros sem telas paralelas experimentais;
  - revisar whitelabel por academia, impressão e configuração de unidade;
  - auditar necessidade de comissão comercial, performance da equipe e outros desdobramentos administrativos que aparecem como baseline em concorrentes, mas não no produto atual;
  - corrigir aliases de navegação e rotas espelho que hoje mascaram a arquitetura de informação real.

### Épico: Endurecer segurança, RBAC e acesso físico
- Prioridade: `P1`.
- Objetivo: transformar permissões e operação de acesso em domínio confiável e rastreável.
- Valor entregue: redução de risco operacional e alinhamento com integrações físicas reais.
- Principais tasks sugeridas:
  - validar todos os contratos reais de RBAC e acesso por unidade;
  - aplicar permissões de forma consistente em navegação, ações e APIs;
  - estabilizar dashboard de acessos, status de conexão, credenciais e liberação manual de catraca;
  - definir escopo de QR, facial e autoatendimento somente após validação de hardware e backend;
  - garantir trilha de auditoria para ações de acesso e administração sensível.

### Épico: Construir BI operacional, visão de rede e indicadores de retenção
- Prioridade: `P2`.
- Objetivo: consolidar indicadores executivos a partir dos domínios operacionais estabilizados.
- Valor entregue: leitura gerencial por unidade e rede, com foco em conversão, retenção e eficiência.
- Principais tasks sugeridas:
  - criar dashboards por unidade e rede para comercial, recebíveis, ocupação, treinos e acesso;
  - medir conversão de prospect, inadimplência, retenção, churn e recuperação de receita;
  - acompanhar ocupação de aulas, no-show e utilização de agenda;
  - consolidar relatórios dinâmicos e comparativos entre academias/unidades;
  - adicionar observabilidade mínima de integrações e jobs administrativos.

### Épico: Qualidade, testes e governança documental
- Prioridade: `P0` transversal.
- Objetivo: impedir novo drift entre código, PRD, backlog e contratos backend.
- Valor entregue: maior previsibilidade para o Task Master e para a execução técnica.
- Principais tasks sugeridas:
  - ampliar a suíte Playwright para jornadas de CRM, contratação, recebimento, agenda e acesso;
  - adicionar testes unitários para regras de prospect, contrato, cobrança, agenda e status do cliente;
  - revisar documentação desatualizada sobre mock, backoffice separado e totem;
  - mapear placeholders, páginas incompletas e flags de intenção que ainda não têm fluxo real;
  - sincronizar `docs/prd.md` e `.taskmaster/docs/prd.md` sempre que houver mudança estrutural relevante.

## 13. Critérios de Aceite Iniciais
- Convergência arquitetural:
  - nenhum fluxo transacional prioritário (`login/contexto`, CRM, clientes, venda de plano, recebíveis) pode depender de `src/lib/mock/services.ts`;
  - recarregar a página não pode alterar o estado de domínio por depender de store local;
  - erros de API devem ter tratamento padronizado e rastreável.
- Contratação de plano sem matrícula:
  - vender um plano deve gerar apenas os artefatos do fluxo canônico definido, sem criar ou exigir uma jornada separada de matrícula;
  - a navegação não pode expor telas duplicadas para o mesmo objetivo comercial;
  - o status do cliente deve refletir contrato/cobrança conforme regra única definida.
- CRM:
  - lista, kanban e detalhe devem compartilhar a mesma ordem de status e as mesmas validações;
  - converter prospect deve gerar cliente e contratação coerentes com o fluxo canônico;
  - campanhas só podem ser marcadas como disparadas quando houver registro auditável do disparo.
- Cobrança e recebíveis:
  - criação, ajuste, baixa e acompanhamento de recebíveis devem existir fora das rotas `experimental`;
  - títulos vencidos, renegociados e recebidos devem refletir o mesmo contrato financeiro em todas as telas;
  - reativação do cliente por pagamento deve depender de evento financeiro real e documentado.
- Agenda e reservas:
  - aluno deve conseguir reservar, cancelar e entrar em lista de espera quando a atividade permitir;
  - capacidade, janela de check-in e ocupação devem ser respeitadas na operação;
  - no-show, cancelamento e fila devem deixar trilha operacional consultável.
- Jornada digital do aluno:
  - páginas de conta devem persistir preferências e dados reais ou ser removidas da navegação;
  - aluno deve conseguir consultar status financeiro, treino e agenda em um fluxo coerente;
  - contratos e comprovantes devem ser acessíveis no canal digital definido.
- Treinos e avaliação:
  - professor deve conseguir registrar avaliação física e evolução;
  - aluno deve conseguir visualizar sua ficha/treino vigente;
  - revisões de treino precisam manter histórico mínimo.
- Segurança e acesso:
  - permissões devem bloquear telas e ações incompatíveis com o perfil;
  - liberação manual de catraca deve exigir motivo e registrar auditoria;
  - status de conexão e credenciais devem refletir o estado real da integração.

## 14. Itens que Precisam de Validação Manual
- Contrato backend definitivo para substituir `mock/services` nos domínios de CRM, clientes, vendas, recebíveis, financeiro e treinos.
- Nome e modelagem do domínio canônico que substituirá `matrícula` no backend e no frontend.
- Escopo real de assinatura eletrônica, guarda de contrato, prova de aceite e envio por e-mail.
- Provedor ou estratégia de cobrança recorrente, retentativa, link/QR de pagamento e emissão de NFSe.
- Provedor e escopo de canais externos para CRM: WhatsApp, e-mail, SMS e tarefas automatizadas.
- Escopo operacional de Wellhub/agregadores, inclusive se o campo `exibirWellhub` deve permanecer.
- Escopo de autoatendimento, QR e reconhecimento facial em produção, incluindo hardware e compliance.
- Se a experiência digital do aluno será web responsivo/PWA ou aplicativo separado.
- Se a separação entre app operacional, backoffice e totem seguirá no mesmo repositório ou em apps distintos.
- Escopo real de comunidade, gamificação, hábitos e nutrição, que aparecem no benchmark, mas não têm sinais concretos no produto atual.

## Resumo Executivo
1. O sistema hoje aparenta ser um frontend operacional amplo para academias multiunidade, mas ainda com forte dependência de `mock/services.ts`, `localStorage` e duplicidade entre fluxos comerciais.
2. O que está mais maduro no código é a base operacional da unidade: clientes, vendas, pagamentos, contas a pagar, DRE, grade administrativa, treinos básicos, RBAC parcial e catraca/monitor.
3. O que está incompleto ou inconsistente é a convergência para backend real, a separação equivocada entre venda de plano e matrícula, o CRM com regras divergentes, a cobrança/recebíveis híbrida e a ausência de jornadas digitais competitivas para aluno, agenda e contrato.
4. A prioridade para o Task Master deve ser: remover mock/localStorage do núcleo transacional, extinguir o fluxo de matrícula, consolidar venda/contrato/cobrança, corrigir CRM e só então expandir agenda, self-service e evolução do aluno.

## Sugestão de próximos passos no Task Master

### Épicos para criar primeiro
- Remover camada mock e convergir para backend real.
- Consolidar venda de plano, contrato e ciclo de vida do cliente sem matrícula.
- Corrigir divergências do CRM e transformar campanhas em operação real.
- Consolidar cobrança, recebíveis e recuperação de receita.
- Criar o épico transversal de qualidade, testes e governança documental já no início.

### Tarefas que parecem já concluídas
- Login com tenant prioritário e troca básica de unidade.
- CRUD base de clientes, prospects, planos, produtos, serviços, convênios, vouchers, cargos, funcionários, salas e atividades.
- Vendas presenciais básicas com recibo/contrato impresso.
- Contas a pagar com recorrência e DRE local.
- Home admin e cadastro básico de academias/unidades.

### Tarefas que precisam ser auditadas no código
- Tudo que ainda importa `@/lib/mock/services`.
- Regra oficial de status e progressão do prospect.
- Uso real de contrato eletrônico, envio por e-mail e aceite.
- Relação definitiva entre venda de plano, cobrança e status do cliente após a extinção da matrícula.
- Dependência efetiva de backend real em RBAC, catraca, conciliação, contas bancárias, maquininhas, EVO e campanhas.
- Persistência real das páginas de conta, agenda do aluno e experiência digital pós-venda.

### Tarefas candidatas a expansão em subtasks
- Migração de domínio para API: quebrar por contexto, CRM, clientes, vendas/contratos, recebíveis, financeiro, treinos e acesso.
- Contratação canônica: quebrar em modelo de domínio, telas, CTA, contratos, convênios, recorrência e status do cliente.
- Agenda operacional: quebrar em reserva, fila de espera, cancelamento, reagendamento, check-in, ocupação, agregadores e mural.
- Jornada digital do aluno: quebrar em área do aluno, cartões, cobranças, contratos, treino, autoatendimento e preferências.
- Cobrança: quebrar em títulos, importação, baixa, régua, reativação, NFSe, recorrência e recuperação de receita.
- Qualidade: quebrar em contratos HTTP, testes unitários por regra, E2E por jornada e sincronização documental.
