# Perfil do Cliente v3 — Proposta de Adoção do Novo Layout

**Autor:** @po (Pax, the Balancer)
**Data:** 2026-04-20
**Status:** Draft — aguardando validação do Product
**Escopo:** academia-app · `src/app/(portal)/clientes/[id]/`
**Insumo de design:** `design perfil/` (V1 Dashboard, V2 Editorial, V6 Laptop)
**Predecessor:** Perfil v2 (Waves 1-3, entregue em 2026-04-19)

---

## 1. Contexto

O perfil do cliente (`/clientes/[id]`) foi refeito há 1 semana na **v2** em 3 Waves:

- **Wave 1 —** layout 2 colunas, sidebar "Sobre", 7 banners de status, contatos clicáveis.
- **Wave 2 —** menu expandido (LGPD, bloquear acesso), WhatsApp no header, drawer de edição.
- **Wave 3 —** tab Relacionamento (timeline), tab Atividades (placeholder), mesclar clientes.

A pasta `design perfil/` traz **3 direções de layout** novas para iteração posterior, com foco em densidade de informação, priorização de ações e legibilidade para recepção com alto volume de atendimentos.

---

## 2. Visão das direções propostas

O design traz **uma** estrutura central (V1 Dashboard denso), adaptada para laptop em V6 (mesmo layout em 1512×982, com drawer "Próximas Ações" lateral). V2 Editorial é uma alternativa estilística descartada.

Todas compartilham: `UnidadeHeader` escuro, `HeroAvatar` com halo de status, rail de sinais, `TabBar` com 10 abas, `FrequenciaBars` de 14 dias, `HistoricoItem` tipado, `ContactCard`, `RiskPanel`.

| Direção | Papel na adoção | Footprint | Observação |
|---------|-----------------|-----------|------------|
| **V1 Dashboard denso** | **Layout de referência adotado** | 1920×1080 | Estrutura canônica. |
| **V6 Laptop** | **Mesma estrutura de V1**, responsivo para 1512×982 | 1512×982 | Inclui drawer "Próximas Ações" à direita. |
| **V2 Editorial Card** | ❌ **Descartado** | 1920×1080 | Hero escuro fixo conflita com theme default. |

### Principais adições vs. Perfil v2 atual

1. **Rail de 6 sinais** agregando plano/dias a vencer · frequência · pendência · avaliação · fidelidade · convidados. Substitui parcialmente os 7 banners atuais, mas é **quantitativo** (valores + hints) em vez de alertas binários.
2. **RiskPanel** — score de churn 0-100, sparkline de tendência 7 semanas, principais fatores de peso. **Domínio novo** sem backend hoje.
3. **Drawer "Próximas Ações"** (V6) — sugestões priorizadas (alta/média/baixa) derivadas do estado do aluno (cobrar pendência, renovar plano, reagendar avaliação, retenção ativa, aniversário, convidar amigo).
4. **FrequenciaBars** — mini-sparkline visual de 14 dias.
5. **TabBar ampliada** — de 7 tabs v2 (Dashboard, Relacionamento, Contratos, Financeiro, Atividades, NFS-e, Cartões) para 10 tabs (+ Frequência, Treinos, Avaliações, Mensagens, Fidelidade, Documentos, Notas).
6. **ContactCard consolidado** com ações inline WhatsApp/e-mail por linha.
7. **HeroAvatar** com halo de status (cor do status-badge em anel ao redor do avatar).
8. **Plano destaque com countdown** — "vence em N dias" em tipografia grande.

---

## 3. Recomendação PO

**Adotar o layout V1/V6 (mesma estrutura, breakpoints diferentes), com o drawer "Próximas Ações" presente em ambos. Descartar V2 Editorial.**

### Por quê

| Critério | Avaliação |
|----------|-----------|
| **Theme default** (usuário pediu para manter) | V1/V6 compatível com tokens `gym-*`; V2 exige hero preto fixo (`#111418 + #c8f135` lime) que quebra o theme. |
| **Persona real de uso** (recepção com alto volume/dia) | Densidade > estética. V1 entrega 6-8 cards acima do fold; V6 preserva a mesma grade em laptop. |
| **Responsividade** | V1 (≥ 1728px) e V6 (1512×982) são a mesma árvore; breakpoint decide densidade e drawer ancorado. |
| **Compatibilidade com v2 entregue** | Preserva `ClienteHeader + Tabs + ResumoGrid` — reescrita incremental. |
| **Rollback** | Feature flag por wave permite recuo rápido sem regressão. |

### Descartado

- **V2 Editorial** — conflita com theme default. Sem cenário previsto para reabrir.

---

## 4. Escopo por Wave

### Wave 1 — Rail de sinais + HeroAvatar com halo (quick win visual)

**Tamanho:** S · **Dependências:** nenhuma · **Risco:** baixo

**AC1.1** `ClienteHeader` exibe `HeroAvatar` com anel de status colorido (verde ativo / amarelo próximo do vencimento / vermelho vencido ou bloqueado).
**AC1.2** Abaixo do header, nova faixa com **rail de 6 sinais** (grid 6 colunas desktop, 3×2 em laptop < 1440):
 - Plano/dias a vencer · Frequência mês/meta · Pendência (se houver) · Avaliação próxima · Fidelidade (pts/nível) · Convidados (usados/limite).
**AC1.3** Cada sinal mostra: label uppercase · valor grande · hint abaixo; cor herdada de `gym-danger` / `gym-warning` / neutro conforme severidade.
**AC1.4** Rail usa **tokens do theme default** (`--gym-accent`, `--gym-danger`, `--gym-warning`, `--border`, `--muted-foreground`). Proibido hardcode de hex exceto em estados de debug.
**AC1.5** Em mobile (< 768px) o rail vira scroll horizontal com `snap`.
**AC1.6** Banners de status atuais (`cliente-status-banners.tsx`) **permanecem** — rail não substitui alertas acionáveis, apenas agrega métricas.

### Wave 2 — Drawer "Próximas Ações" com regras determinísticas

**Tamanho:** M · **Dependências:** Wave 1 entregue · **Risco:** médio (regras de negócio)

**AC2.1** Botão "Ações" no `ClienteHeader` (com badge de contagem) abre drawer lateral direito (w=380).
**AC2.2** Drawer lista sugestões priorizadas em 3 níveis (alta/média/baixa), ordenadas por prioridade.
**AC2.3** Regras iniciais (determinísticas, **sem ML**):

| Trigger | Prioridade | CTA |
|--------|------------|-----|
| Pendência financeira > 0 | alta | Enviar boleto / cobrar |
| Plano vencido | alta | Reativar matrícula |
| Plano vence ≤ 14 dias | alta | Propor renovação |
| Plano vence ≤ 30 dias | média | Propor renovação |
| Avaliação vencida | média | Reagendar avaliação |
| Frequência < 4 treinos no mês E plano ativo | média | WhatsApp de retenção |
| Aniversário ≤ 30 dias | baixa | Enviar mimo |
| `convidados.usados < convidados.limite` | baixa | Gerar day-pass |

**AC2.4** Cada CTA do drawer dispara o modal/ação existente correspondente (ex.: "Reativar" chama `handleReativar` já existente).
**AC2.5** Drawer fecha com backdrop click, ESC e botão X.
**AC2.6** Badge de contagem no botão reflete quantidade de sugestões em tempo real.
**AC2.7** Feature flag `perfil.drawerAcoes` para rollout gradual.

### Wave 3 — FrequenciaBars + Plano countdown + Risco de Evasão

**Tamanho:** M · **Dependências:** dado de check-ins 14 dias + histórico semanal (7 sem) · **Risco:** médio (depende de dados disponíveis)

**AC3.1** Tab "Dashboard" (ex-"Resumo") ganha card **"Frequência (14 dias)"** com 14 mini-barras verticais e leitura `{mes}/{meta} treinos · última visita {data}`.
**AC3.2** Card "Plano ativo" mostra countdown grande "vence em N dias" ou "venceu há N dias" com cor condicional (verde > 14d, amarelo ≤ 14d, vermelho < 0).
**AC3.3** Linha "Próxima cobrança" com data + valor + forma de pagamento quando `planoAtivo.recorrente`.
**AC3.4** Dados de frequência vêm de endpoint existente (ou do novo endpoint listado em CXO follow-ups). Se indisponível, card exibe skeleton + aviso "sem histórico disponível".

**AC3.5** Tab Resumo ganha card **"Risco de evasão"** (posicionado entre Frequência e Fidelização, NÃO no hero). Exibe:
 - Score 0-100 em tipografia mono grande.
 - Rótulo `Baixo` (< 40) / `Médio` (40-69) / `Alto` (≥ 70) com cor `gym-teal` / `gym-warning` / `gym-danger`.
 - Sparkline de tendência das últimas 7 semanas quando dados disponíveis; caso contrário, ocultar sparkline e manter só o score.
 - Lista dos **3 principais fatores** de peso com rótulo + sinal (+ ou −) + magnitude.

**AC3.6** Score calculado por **heurística determinística** (sem ML), centralizada em `lib/domain/risco-evasao.ts`, baseada em sinais observáveis já disponíveis:

| Fator | Peso máx | Fonte |
|-------|---------|-------|
| Frequência mês < 25% da meta | +30 | check-ins do mês |
| Dias desde última visita > 10 | +25 | check-ins |
| Pendência financeira ativa | +20 | contas a receber |
| Avaliação física vencida | +10 | agendamento de avaliação |
| Plano vence ≤ 14 dias e sem renovação cogitada | +10 | contrato |
| NPS ≤ 6 nos últimos 90 dias | +5 | survey (se existir) |
| Sinais positivos (frequência ≥ meta, NPS ≥ 9) | −15 | check-ins / survey |

Score = clamp(0, soma, 100). Fórmula versionada; mudanças exigem PR com justificativa.

**AC3.7** Card tem link "Ver detalhes" que abre painel lateral com a lista completa dos fatores + tendência semanal tabulada.

**AC3.8** Se algum sinal depender de dado não disponível no momento da renderização, fator é simplesmente omitido (não zera o score). Estado "sem dados suficientes" aparece quando < 2 fatores puderam ser avaliados.

**AC3.9** Score é calculado no cliente a partir do payload já disponível em `useClienteWorkspace`. **Não** cria endpoint novo nesta wave.

### Wave 4 (opcional, a debater após Waves 1-3) — Abas novas + HistoricoItem tipado

**Tamanho:** M · **Dependências:** Waves 1-3 estabilizadas · **Risco:** médio (cada aba nova precisa fonte de dados real)

**AC4.1** Adicionar tabs conforme matriz de abas da Seção 10: Frequência, Treinos, Avaliações, Fidelidade, Documentos. (Mensagens e Notas ficam para próxima iteração.)
**AC4.2** Cada tab recém-adicionada aceita estado vazio ("Sem registros") enquanto backend não expõe dados — **não bloqueia Wave 4**.
**AC4.3** `HistoricoItem` unificado (checkin, venda, aula, pagamento, avaliacao, contrato, suspensao, cadastro) + ícone + cor da categoria. Evolui timeline atual da tab Relacionamento com filtro por tipo no topo.
**AC4.4** Renomear label "Dashboard" → "Resumo" na `ClienteTabs` para alinhar com nomenclatura do design.
**AC4.5** Remover "Edição" como tab visível — já existe `ClienteEditDrawer` acionado via menu; tab é duplicação.
**AC4.6** Mover **apenas "Cartões"** para `ActionMenu` (três pontinhos do header). NFS-e **permanece** como aba do TabBar.

### FORA DE ESCOPO (mover para backlog)

- **Hero editorial V2** — descartado.
- **RiskPanel no hero/rail** — posição do hero é reservada para identidade + ações; risco vai no card do Resumo (AC3.5).
- **Modelo de churn via ML** — Wave 3 usa heurística determinística. ML fica para épico próprio se sinal justificar.
- **ContactCard com ações inline WhatsApp/e-mail por linha** — já existe WhatsApp no header; duplicar depende de feedback de recepção.
- **Aba Mensagens + integração CRM ↔ perfil** — próxima iteração dedicada. Requer rota `/crm/clientes/[id]`, endpoint agregador por cliente no módulo CRM, e a aba consumindo.
- **Aba Notas** — próxima iteração. Depende de backend dedicado de notas internas.

---

## 5. Dependências e integrações

| Item | Status | Responsável |
|------|--------|-------------|
| Endpoint Tab Histórico | Pendente (CXO follow-up) | Backend |
| Endpoint check-ins 14 dias | Verificar se já existe em `useClienteWorkspace` | @dev na fase de spike |
| Feature flag `perfil.drawerAcoes` | Criar | @dev |
| Tokens de tema (`--gym-*`) | Já existem | — |
| Dados de fidelidade/convidados | Verificar se backend já retorna | Spike |

---

## 6. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Regras do drawer evoluírem caóticas | Alto — duplicação de lógica com modais existentes | Centralizar em `hooks/use-sugestoes-cliente.ts`, testado isoladamente. |
| Rail saturar em mobile | Médio | Scroll horizontal com snap + breakpoint. |
| Perfil v2 entregue há 7 dias ter regressão | Alto | Rollout com feature flag por wave; PR pequeno por AC. |
| Dado de frequência indisponível | Médio | Skeleton + fallback textual; não bloqueia merge. |
| Heurística de risco enviesar ou caducar | Médio | Fórmula versionada em `risco-evasao.ts`; PR obrigatório para ajuste; testes unitários dos cenários-chave (ativo, risco, inadimplente, novo). |
| Dado histórico semanal (7 sem) indisponível | Médio | AC3.5 prevê ocultar sparkline e manter só score; não bloqueia Wave 3. |

---

## 7. Métricas de sucesso

1. **Tempo médio de atendimento na recepção** (medir antes e depois via telemetria ou entrevista com 3 unidades).
2. **Taxa de cliques em sugestões do drawer** (logar por tipo).
3. **% de renovações originadas via drawer** em comparação com fluxo atual de "Nova venda".
4. **Zero regressões P0/P1** em testes Playwright existentes do perfil.

---

## 8. Handoff para próximos agentes

| Próximo passo | Agente | Comando |
|---------------|--------|---------|
| Quebrar em épico formal | @pm (Morgan) | `*create-epic` usando este PRD |
| Criar stories por Wave | @sm (River) | `*draft` (uma story por AC numerado) |
| Spike técnico (dados disponíveis?) | @dev (Dex) | Verificar `useClienteWorkspace` para frequência, fidelidade, convidados |
| Revisão visual | @ux-design-expert (Uma) | Confirmar tokens e ajustar breakpoint do rail |
| Validação pós-stories | @po (Pax) | `*validate-story-draft` por story |

---

## 9. Decisões registradas (ADR-style)

- **[D1]** V1 e V6 são o **mesmo layout** em breakpoints diferentes (V6 = versão 1512×982 de V1). Adoção é única: uma árvore de componentes responsiva. V2 Editorial **descartado** para preservar theme default.
- **[D2]** `RiskPanel` entra no **card do Resumo** (AC3.5–3.9) via heurística determinística baseada em sinais observáveis já presentes no payload. **Não** no hero, **não** via ML, **não** cria endpoint novo. Evolução para modelo estatístico fica em épico próprio se houver sinal de uso.
- **[D3]** Banners de status atuais (`cliente-status-banners.tsx`) **permanecem** junto ao rail de sinais. *Motivo: banners são alertas acionáveis (suspensão, bloqueio, pendência crítica); rail é métrica quantitativa. Propósitos distintos.*
- **[D4]** Rollout **wave por wave com feature flag**. *Motivo: perfil v2 em prod há 7 dias; preservar recuo rápido.*
- **[D5]** Lógica de sugestões do drawer é **determinística, não ML**. *Motivo: complexidade baixa, resultado explicável para recepção; ML pode vir depois se houver sinal.*

---

---

## 10. Mapa de abas — estado atual vs proposto

### 10.1 Abas atuais do Perfil v2 (`cliente-tabs.tsx`)

| # | Key | Label atual | Arquivo/Componente | Conteúdo |
|---|-----|-------------|--------------------|----------|
| 1 | `resumo` | Dashboard | `page.tsx:194` (inline) | Cards de plano, compras, frequência básica, contato |
| 2 | `relacionamento` | Relacionamento | `cliente-tab-relacionamento.tsx` | Timeline (contrato, pagamento, suspensão, cadastro, venda) |
| 3 | `matriculas` | Contratos | `page.tsx:292` | Lista de matrículas/contratos |
| 4 | `financeiro` | Financeiro | `page.tsx:323` | Pagamentos, cobranças, recebimentos |
| 5 | `atividades` | Atividades | `cliente-tab-atividades.tsx` | **Placeholder** (CXO follow-up) |
| 6 | `nfse` | NFS-e | `page.tsx:347` | Notas fiscais |
| 7 | `cartoes` | Cartões | `page.tsx:310` | Cartões de pagamento salvos |
| 8 | `editar` | Edição | condicional | Redireciona pra drawer (duplicado) |

### 10.2 Abas do design novo (`TABS_COMUNS` em `shared-perfil.jsx`)

`resumo · financeiro · contratos · frequencia · treinos · avaliacoes · comunicacoes · fidelidade · documentos · notas` — 10 abas.

### 10.3 Matriz de gap + decisão PO

| Aba atual | Aba proposta | Status | Decisão |
|-----------|--------------|--------|---------|
| Dashboard (`resumo`) | Resumo | ✓ manter | **Renomear label** "Dashboard" → "Resumo". Conteúdo enriquecido pelas Waves 1-3 (rail de sinais + RiskPanel + FrequenciaBars + Plano countdown). |
| Relacionamento | — / Mensagens | ✓ manter | **Manter** Relacionamento (timeline unificada). Mensagens recebe tratamento próprio — ver linha "Mensagens" abaixo. |
| Contratos (`matriculas`) | Contratos | ✓ manter | Label e rota OK. Renomear key `matriculas` → `contratos` apenas se `@dev` avaliar baixo risco; caso contrário manter key legacy. |
| Financeiro | Financeiro | ✓ manter | Sem ajuste. |
| Atividades | — (dissolvida) | ⚠️ absorver | **Remover aba "Atividades"** (placeholder). Conteúdo previsto dela passa a viver em **Frequência + Treinos + Avaliações** (3 abas novas). |
| NFS-e | — | ✓ manter | **Permanecer no TabBar** (decisão revista). Operação recorrente o suficiente para justificar o slot. |
| Cartões | — | ⚠️ mover | **Remover do TabBar**; acessar via `ActionMenu` ("Mais ações → Cartões"). Já é acionado via botão dedicado no header; redundante como tab. |
| — | **Mensagens** | ⏭️ próxima iteração | Aba adiada. Fonte canônica será o módulo CRM interno (`/crm` — cadências, campanhas, retenção), que hoje não tem visão "por cliente". Entrega requer iteração dedicada: (1) rota `/crm/clientes/[id]` no módulo CRM, (2) endpoint agregador por `clienteId`, (3) aba consumindo. Fora do escopo das Waves 1-4. |
| Edição | — | ❌ remover | Já existe `ClienteEditDrawer`. Aba é duplicação; remover. |
| — | **Frequência** | ➕ criar | Wave 3 introduz o card; aba full mostra histórico completo de check-ins com filtros por período. Depende de endpoint de frequência. |
| — | **Treinos** | ➕ criar | Treinos designados. Dado e spec já existem em `TREINOS_V2_PRD.md` e `TREINOS_V2_OPERACAO.md`. Reusar componentes de `meus-treinos-client.tsx` adaptados à visão do operador. |
| — | **Avaliações** | ➕ criar | Histórico de avaliações físicas (IMC, %BF, agendamentos). Requer confirmação de disponibilidade de dado no backend. |
| — | **Fidelidade** | ➕ criar | Saldo de pontos, nível, histórico de resgates, próximos benefícios. Requer confirmação de backend de fidelidade. |
| — | **Documentos** | ➕ criar | Contratos assinados, termos LGPD, anexos. Depende de repositório de arquivos por cliente. |
| — | **Notas** | ➕ criar | Notas internas da recepção sobre o cliente (observações de atendimento). Requer tabela nova no backend. |

### 10.4 Conjunto final de abas (após Wave 4)

Ordem recomendada no `TabBar` (10 abas efetivas na Wave 4, com Mensagens e Notas reservadas para iterações seguintes):

```
Resumo · Relacionamento · Contratos · Financeiro · NFS-e · Frequência · Treinos · Avaliações · Fidelidade · Documentos
```

**Reservadas para próxima iteração** (não entram na Wave 4):
- `Mensagens` — requer integração com módulo CRM interno (`/crm`) e endpoint agregador por cliente.
- `Notas` — requer backend dedicado de notas internas.

Obs.: 10 abas cabem confortavelmente em 1366. Quando Mensagens e Notas entrarem, reavaliar agrupamento com `@ux-design-expert`.

`Cartões` e `Edição` saem do TabBar e viram entradas do `ActionMenu` no header.

### 10.5 Pré-requisitos de dado por aba nova

| Aba | Dado necessário | Existe? | Fonte | Fallback |
|-----|-----------------|---------|-------|----------|
| Frequência | Check-ins 30/60/90 dias | A confirmar em `useClienteWorkspace` | Catraca/Control iD | Skeleton + estado vazio |
| Treinos | Treinos atribuídos (Treinos v2) | Sim (PRD existe) | `meus-treinos-client.tsx` | — |
| Avaliações | Histórico de avaliações físicas | A confirmar | Backend de avaliações | Estado vazio |
| Fidelidade | Saldo, nível, histórico | A confirmar | Backend de fidelidade | Estado vazio |
| Documentos | Arquivos por cliente | A confirmar | Storage (MinIO?) | Estado vazio |
| Notas | Notas internas | Não existe | **Backend novo necessário** | Bloquear aba até backend; ou liberar CRUD local temporário |

### 10.6 Ajustes obrigatórios na implementação atual

Mapeamento do delta a ser executado em `@sm *draft`:

1. **`cliente-tabs.tsx`** — ampliar `ClienteTabKey` com `frequencia | treinos | avaliacoes | fidelidade | documentos`. Remover `atividades | cartoes | editar`. **Manter** `nfse`. `mensagens` e `notas` ficam reservadas para iterações seguintes. Renomear label `"Dashboard"` → `"Resumo"`. Ícones do design (`bolt`, `dumbbell`, `edit`, `gift`, `card`).
2. **`page.tsx`** — remover blocos `w.tab === "atividades" | "cartoes" | "editar"`; bloco `cartoes` vira componente renderizado via modal/drawer acionado do `ActionMenu`. Bloco `nfse` permanece.
3. **`cliente-header.tsx`** — adicionar no menu de três pontinhos a entrada "Cartões". NFS-e continua como tab (não entra no ActionMenu).
4. **`cliente-tab-atividades.tsx`** — **remover arquivo** após absorção em Frequência + Treinos + Avaliações.
5. **`cliente-tab-relacionamento.tsx`** — adicionar filtro de tipo no topo da timeline; expandir tipos para incluir `checkin | aula` (comunicações vão para a aba Mensagens dedicada).
6. **Criar arquivos novos** (Wave 4): `cliente-tab-frequencia.tsx`, `cliente-tab-treinos.tsx`, `cliente-tab-avaliacoes.tsx`, `cliente-tab-fidelidade.tsx`, `cliente-tab-documentos.tsx`. **`cliente-tab-mensagens.tsx` e `cliente-tab-notas.tsx` ficam para próxima iteração** (dependem respectivamente de integração CRM e backend de notas).
7. **Roteamento** — se hoje houver URLs com `?tab=cartoes|editar|atividades`, manter redirect/alias por 1 sprint para preservar links salvos; depois remover. `?tab=nfse` permanece.

### 10.7 Decisões registradas sobre abas

- **[D6]** Renomear "Dashboard" → "Resumo" para alinhar com o design e com a nomenclatura do mercado.
- **[D7]** Mover **somente Cartões** do `TabBar` para o `ActionMenu`. **NFS-e permanece como aba** (operação recorrente suficiente). *Decisão revista em 2026-04-20 após feedback do Product.*
- **[D8]** **Aba Mensagens fica para próxima iteração.** Fonte canônica é o módulo CRM interno (`/crm`), que ainda não tem visão por cliente. Iteração futura dedicada entrega: rota `/crm/clientes/[id]`, endpoint agregador por `clienteId`, e a aba Mensagens consumindo. Não fabricar histórico local no perfil.
- **[D9]** Aba "Atividades" atual é dissolvida em Frequência + Treinos + Avaliações. *Motivo: é placeholder; granularidade maior entrega mais valor operacional.*
- **[D10]** Remover aba "Edição" — já existe drawer. *Motivo: duplicação.*
- **[D11]** Aba "Notas" só entra quando houver backend dedicado. *Motivo: Artigo IV (No Invention) — não criar CRUD no cliente que não persiste de forma confiável.*
- **[D12]** Alvo de integração = **módulo CRM interno** (`src/app/(portal)/crm/` + `academia-java/modulo-crm`). Integração perfil ↔ CRM fica para **próxima iteração** (fora das Waves 1-4).

---

*— Pax, equilibrando prioridades 🎯*
