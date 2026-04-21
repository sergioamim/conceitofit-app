# PRD — Unificação de Vendas no ConceitoFit

> **Autor:** Pax (AIOX PO · Balancer)
> **Data:** 2026-04-20
> **Escopo:** brownfield · frontend + backend + catraca
> **Fases:** 5 entregas independentes mergeables

---

## 1. Resumo executivo

Consolidar os três caminhos de venda hoje existentes (modal `nova-matricula-modal`, wizard `novo-cliente-wizard` e tela `/vendas/nova`) num único **cockpit unificado** em `app/(portal)/vendas/nova`. O cockpit combina PLANO, SERVIÇO e PRODUTO no mesmo carrinho, usa busca universal (⌘K) e recibo térmico reusável, e remove duplicação entre wizard e modal. Em paralelo, modelar no backend a **taxonomia definitiva de cliente** (Prospect / Aluno ativo / Aluno inativo), **três modalidades de acesso** (Plano recorrente, Pacote de visitas, Agregador B2B) com seus lifecycles distintos, e a **validação síncrona de catraca** via webhook + `POST /access/v1/validate` da Wellhub.

Entregáveis:

- cockpit 3-colunas com combo livre (PLANO + SERVIÇO + PRODUTO no mesmo carrinho);
- recibo térmico reusável (carrinho + modal pós-venda);
- consolidação do wizard de cadastro (3 CTAs: Salvar / Vender / Vincular agregador);
- remoção completa de `nova-matricula-modal` e do `wizard-step-plano`;
- entidades e jobs no backend para vínculo agregador, check-in pendente e purge facial;
- endpoint síncrono `POST /catraca/validar-entrada` consumido por `academia-gestao-acesso`.

Resultado esperado: um único ponto de venda, UX consistente, LGPD respeitada (facial só para aluno ativo) e zero regressão nos fluxos financeiros atuais.

---

## 2. Contexto atual

### 2.1 Fragmentação hoje

Existem **três caminhos** para iniciar uma venda de plano:

1. **`/vendas/nova`** — tela dedicada com tabs PLANO/SERVIÇO/PRODUTO, hoje em `src/app/(portal)/vendas/nova/page.tsx`. Tabs trocam **e zeram o carrinho** (não é combo livre), ver `hooks/use-venda-workspace.ts` linha 82-90.
2. **Modal `nova-matricula-modal.tsx`** — dispara em listagens de clientes e no detalhe do aluno. Duplica lógica do wizard.
3. **Wizard `novo-cliente-wizard`** — passo-a-passo em `src/components/shared/novo-cliente-wizard/novo-cliente-wizard.tsx` com 3 passos já implementados:
   - `wizard-step-dados.tsx` (dados do cliente);
   - `wizard-step-plano.tsx` (seleção de plano);
   - `wizard-step-pagamento.tsx` (pagamento, 15 KB — concentra grande parte da lógica comercial hoje).

O wizard **já tem 3 CTAs no Step 1** (`Apenas pré-cadastro`, `Pré-cadastro + venda`, `Continuar com plano`) — ver `novo-cliente-wizard.tsx` linhas 94-106. A unificação redireciona o caminho de venda para o cockpit ao invés de levar o usuário pelo wizard-step-plano + wizard-step-pagamento.

### 2.2 Handoff de design

Foi recebido handoff de alta fidelidade em `design_handoff_nova_venda/README.md` definindo:

- header escuro 56px (`--ink`) + grid de 3 colunas (cliente/tabs ~360px + catálogo flex + painel pagamento ~400px);
- target 1440×900 (estação de recepção);
- busca universal ⌘K (shadcn `Command`) com resultados agrupados + scanner inline;
- recibo térmico reusável em papel creme (`--receipt-paper` #faf8f3) — mesmo componente visual no carrinho da cockpit e no modal pós-venda;
- modal de recibo 820×560 (térmico esquerda + ações direita).

Protótipos em `references/` são HTML/JSX vanilla — devem ser recriados com os tokens existentes em `app/globals.css` e componentes shadcn já instalados.

### 2.3 Backend — módulos existentes

Verificado na árvore `academia-java/`:

| Módulo | Responsabilidade relevante |
|---|---|
| `modulo-comercial` | Vendas, contratos, matrículas, prospects. Inclui `ProspectService.java` e `ConversaoService.java` já implementados. |
| `modulo-academia` | Entidade `Aluno`, unidades, taxonomia base. |
| `modulo-agregadores` | DEDICADO: `AgregadorEntity`, `AgregadorPassEntity`, `AgregadorVisitaEntity`, `AgregadorConfigEntity`, `AgregadorUsuarioEntity`, `AgregadorRegraEntity`. Adapters `WellhubAdapter.java` e `TotalPassAdapter.java`. Webhooks HMAC via `WellhubCheckinSink.java` / `WellhubCheckinAppSink.java` / `WellhubBookingSink.java`. |
| `modulo-catraca` | Integração com iDFace, purge facial, heartbeat. |
| `modulo-financeiro` | Pagamentos, conciliação, parcelas. |

> **Decisão arquitetural (auditoria 2026-04-20):** `AgregadorUsuarioEntity.java` já possui `tenantId`, `agregador`, `externalUserId`, `customCode`, `status` e `lastCheckinAt`. Será **evoluída** (migração aditiva) para carregar o contrato de vínculo B2B permanente, adicionando `aluno_id`, `data_inicio`, `data_fim`, `ciclo_expira_em` e `metadata_json`. Decisão evita entidade nova, preserva dados existentes e mantém compatibilidade com `WellhubAdapter.java` / `TotalPassAdapter.java` que já consomem a entidade via `AgregadorUsuarioRepository.findFirstByTenantIdAndAgregadorAndExternalUserId`.

Validate síncrono já está implementado no `WellhubAdapter.java` (método que chama `POST /access/v1/validate` com `trigger=gate_trigger`).

### 2.4 Catraca standalone

O repo `academia-gestao-acesso/` é um Java standalone (SQLite local `gymaccess.db`) que controla catracas iDFace. Ele hoje consulta o backend principal para autorizar entrada, mas ainda não tem o endpoint síncrono de validação agregador. Gap descrito na seção 8.3.

---

## 3. Problema

### 3.1 Fricção na recepção

Atendente abre 3 telas diferentes para o mesmo fluxo (listagem → modal, ou cliente → wizard, ou menu → /vendas/nova). Transições lentas em horário de pico quebram o ritmo de atendimento.

### 3.2 Duplicação de código e deriva funcional

`nova-matricula-modal`, `wizard-step-pagamento` e `sale-summary` da cockpit implementam lógicas sobrepostas de convênio, parcelamento e recibo. Fixes aplicados em um fluxo não se propagam para os outros — risco constante de regressão silenciosa.

### 3.3 UX inconsistente

Tabs que zeram o carrinho (limitação atual do cockpit) impedem combo livre; cliente não consegue levar "plano anual + 1 avaliação física + 2 shakes" numa única venda.

### 3.4 Inatividade sem limpeza LGPD

Hoje não há job confiável que purgue a biometria facial ao vencer o plano / ao aluno agregador ficar N dias sem visita. Isso:

- gera risco legal (dado sensível mantido além do necessário);
- satura o limite de 10.000 faces do iDFace MAX.

### 3.5 Catraca sem validação síncrona de agregador

Quando um aluno Gympass/TotalPass passa a facial, o sistema não consegue hoje validar em tempo real contra a Wellhub que o check-in é legítimo. Fraude e conflito de horário não são detectados.

---

## 4. Objetivo do produto

- **Outcome primário:** reduzir para um único fluxo o registro de qualquer venda (plano, serviço, produto ou combinação) a partir da recepção.
- **Outcome secundário:** eliminar acoplamento facial × aluno inativo, eliminar duplicação entre wizard/modal/cockpit, e elevar a integração agregadora para nível B2B sincronizado.
- **Métrica:** tempo médio de venda em recepção < 90 s (hoje > 3 minutos quando há troca de tela). Zero cliente-ativo com facial inexistente; zero cliente-inativo com facial presente.

---

## 5. Fora de escopo

V1 **não** contempla:

- integração com NFe/NFS-e automática pós-venda (permanece manual);
- migração ou reprocessamento de vendas históricas pré-cockpit;
- venda pelo `academia-mobile` (app é CLIENTE-only);
- read model unificado `DireitoAcesso` — descrito na seção 8.4 como **Fase 2** futura;
- pagamento recorrente com gateway (tela marca "Recorrente" mas não cobra);
- política `GRACE_PERIOD` para catraca agregadora (inicial = `STRICT`, ver Open Questions);
- integração com impressora real via driver (impressão usa mock com aria-live em V1);
- upload/importação em lote de prospects.

---

## 6. Princípios de desenho

1. **Backend como fonte de verdade.** Frontend esconde/desabilita; backend valida e audita.
2. **Combo livre.** Tabs são filtros de catálogo, não contextos mutuamente exclusivos. Cliente leva qualquer combinação num único checkout.
3. **Validação dupla na catraca.** Webhook HMAC cria check-in pendente (TTL configurável); validate síncrono consome no gate_trigger. Política default `STRICT` — sem check-in pendente, nega.
4. **Facial é marco de conversão.** Só cliente com vínculo ativo recebe facial. Purge automática na inativação.
5. **Read model gradual.** Fase 1 usa service agregador local; Fase 2 migra para `direitos_acesso` event-driven.
6. **Reuso > reimplementação.** Recibo térmico é componente único usado no carrinho e no modal.
7. **Observabilidade na borda.** Toda negação de catraca, toda purge facial, toda criação de vínculo gera evento auditável.

---

## 7. Taxonomia de cliente e modalidades

### 7.1 Tipos de cliente

| Tipo | Tem venda? | Tem facial? | Lifecycle ativo/inativo? |
|---|---|---|---|
| **Prospect** | Não | Não (liberação manual) | Não tem; permanece prospect até converter |
| **Aluno ativo** | Sim, com vínculo válido | Sim (cadastrada automaticamente) | Ativo enquanto houver vínculo válido |
| **Aluno inativo** | Tinha vínculo, todos venceram | **Não** (purgada automaticamente) | Reativa na próxima venda/vínculo |

Conversão **Prospect → Aluno** é automática na primeira venda/vínculo fechado. Executada pelo `ConversaoService.java` já existente em `modulo-comercial`.

### 7.2 Modalidades de acesso

| Modalidade | Dura enquanto | Reseta? | Preço entra no caixa? |
|---|---|---|---|
| Plano recorrente | `dataFim ≥ hoje` | Não | Sim |
| Pacote N visitas | `visitasUsadas < N` E `dataFim ≥ hoje` | Não | Sim |
| Agregador (Wellhub/TotalPass) | `ultimaVisita + N dias ≥ hoje` (N configurável por agregador × unidade) | Sim (a cada visita) | **Não (B2B)** |
| Diária avulsa (1 visita) | Single-use, QR Code único | Não | Sim |

### 7.3 Triggers de inativação

| Evento | Trigger | Ação |
|---|---|---|
| Plano recorrente vence | Job @Scheduled diário `PlanoInativacaoJob` | Marca inativo, dispara purge facial via `modulo-catraca` |
| Pacote esgota visitas OU data vence | Job @Scheduled | Marca inativo, purge facial |
| Agregador sem visita há N dias | Job @Scheduled diário `AgregadorCicloJob` | Marca inativo, purge facial (se sem outros vínculos) |
| Manual — recepção suspende cliente | Ação no perfil | Marca inativo, purge facial |

---

## 8. Arquitetura proposta

### 8.1 Frontend — nova estrutura do cockpit

Base: `src/app/(portal)/vendas/nova/`. Componentes novos (convivem com atuais durante a Fase 1, substituem a partir da Fase 2):

```text
app/(portal)/vendas/nova/
├── page.tsx                         # troca Suspense para usar CockpitShell
├── components/
│   ├── cockpit-shell.tsx            # NOVO · header escuro 56px + grid 3 colunas
│   ├── universal-search.tsx         # NOVO · Command shadcn ⌘K + scanner inline
│   ├── catalog-planos.tsx           # NOVO · grid 2×2 com destaque + ribbon
│   ├── catalog-servicos.tsx         # NOVO · lista vertical
│   ├── catalog-produtos.tsx         # NOVO · grid 3×2 com thumbnail
│   ├── payment-panel.tsx            # NOVO · carrinho + total + formas + parcelas + NSU
│   ├── thermal-receipt.tsx          # NOVO · reusado no carrinho e no modal
│   └── [componentes legados são removidos na Fase 2]
│       # cart-items.tsx, sale-summary.tsx, client-and-item-selector.tsx,
│       # plano-details.tsx, sale-type-selector.tsx, sale-header.tsx
├── hooks/
│   ├── use-venda-workspace.ts       # expandido: parcelas, autorizacao, canFinalize
│   └── use-barcode-scanner.ts       # mantido
```

Modal pós-venda: reescrita de `src/components/shared/sale-receipt-modal.tsx` (Fase 4) para layout 820×560 reusando `thermal-receipt`.

Consolidação (Fase 5):

- **Deletar** `src/components/shared/nova-matricula-modal.tsx` completamente + todas as referências.
- **Remover** `src/components/shared/novo-cliente-wizard/wizard-step-plano.tsx` e a etapa 2 correspondente em `novo-cliente-wizard.tsx` (step 1 → step pagamento direto quando fluxo não envia pro cockpit; CTA alternativa redireciona para `/vendas/nova?clienteId=X`).
- Reconfigurar Step 1 do wizard para 3 CTAs finais:
  - `Salvar` → cria Prospect, fecha wizard, retorna à listagem;
  - `Vender` → cria Prospect + redirect `/vendas/nova?clienteId=X`;
  - `Vincular agregador` → cria Prospect + modal "Vincular agregador" (select tipo + ID externo + confirmar).

### 8.2 Backend — entidades, jobs e endpoints novos

Em `modulo-agregadores`:

- **Evolução de `AgregadorUsuarioEntity`** (migração aditiva — decisão 2.3):
  - Campos já existentes: `id`, `tenantId`, `agregador`, `externalUserId`, `customCode`, `status`, `lastCheckinAt`, `createdAt`, `updatedAt`;
  - **Adicionar**: `aluno_id` (FK `Aluno`, nullable no primeiro release para backfill, NOT NULL no release seguinte), `data_inicio`, `data_fim` (nullable = sem prazo), `ciclo_expira_em` (derivado de `lastCheckinAt + N dias`), `metadata_json`;
  - Campo `status` ganha semântica explícita `ATIVO|INATIVO|SUSPENSO` (antes estava sem constraint);
  - A entidade passa a representar o vínculo B2B permanente entre aluno e agregador, mantendo compatibilidade com adapters atuais.
- **`AgregadorCheckinPendenteEntity`**:
  - `id`, `vinculo_id`, `agregador_id`, `usuario_externo_id`, `criado_em`, `expira_em` (TTL configurável, default 60 min), `status` (`PENDENTE|CONSUMIDO|EXPIRADO`);
  - criada nos sinks de webhook (`WellhubCheckinSink`, `TotalPassAdapter`).
- **Job `CheckinExpiradoJob`** (`@Scheduled` cada 5 min): move `PENDENTE → EXPIRADO` ao ultrapassar TTL.
- **Job `AgregadorCicloJob`** (`@Scheduled` diário): marca vínculo inativo quando `ultima_visita + N dias < hoje`, dispara purge facial se aluno não tiver outros vínculos.
- **Endpoint `POST /api/v1/agregadores/vinculos`**: cria vínculo B2B (consumido pelo wizard CTA "Vincular agregador").
- **Endpoint `POST /catraca/validar-entrada`**: validação síncrona consumida por `academia-gestao-acesso` (ver 8.3).

Em `modulo-comercial`:

- Reusar `ConversaoService.java` existente (briefing confirmado). Nenhuma entidade nova.

Em `modulo-academia`:

- **Fase 1** — service agregador `DireitoAcessoQueryService` (opção B do briefing): consulta `modulo-comercial`, `modulo-pacote` e `modulo-agregadores` via ports e agrega resposta "aluno X tem vínculo ativo? qual?".

Em `modulo-catraca`:

- **Job `PlanoInativacaoJob`** (`@Scheduled` diário): detecta planos com `dataFim < hoje`, marca inativo, dispara purge facial.
- Endpoint interno `POST /catraca/purge-facial/{alunoId}` (idempotente) chamado pelos jobs.

### 8.3 Integração catraca — webhook + validate síncrono

Sequência completa (happy path agregador):

```text
1. Aluno abre app Wellhub/TotalPass → faz check-in no estabelecimento.
2. Wellhub envia webhook HMAC → modulo-agregadores/WellhubCheckinSink.java:
     - valida HMAC
     - cria AgregadorCheckinPendenteEntity(status=PENDENTE, expira_em = now+60min)
     - publica evento "CheckinPendenteCriado" (SSE/WebSocket para cockpit)
3. Aluno chega na catraca iDFace → academia-gestao-acesso identifica alunoId local.
4. academia-gestao-acesso chama POST /catraca/validar-entrada { alunoId }:
     4a. Backend consulta CheckinPendente válido:
         - NÃO existe → NEGA (retorna 403 "sem check-in no app")
         - EXISTE → segue 4b
     4b. Backend chama WellhubAdapter.validate(gate_trigger):
         - 200 → cria AgregadorVisitaEntity, marca CheckinPendente=CONSUMIDO, retorna 200 LIBERA
         - 404/5xx → política STRICT: NEGA + notifica cockpit (toast lateral para recepção)
5. Catraca libera ou bloqueia conforme resposta.
```

Sad path 1 — aluno Gympass sem check-in no app:

- passo 4a: não acha `CheckinPendente`
- backend retorna 403 com código `MISSING_CHECKIN`
- frontend cockpit NÃO recebe nada (não há pendência); catraca mostra mensagem "abra o app Wellhub antes de entrar".

Sad path 2 — aluno Gympass com check-in, Wellhub validate falha 5xx:

- passo 4b: validate retorna 5xx
- política STRICT: backend retorna 403 com código `VALIDATE_FAILED`
- cockpit recebe evento `CheckinValidacaoFalhou(vinculo_id, aluno_id, error)` e mostra toast lateral na recepção com ação "Liberar manualmente" (autorização alto nível).

### 8.4 Read Model `DireitoAcesso` (Fase 2, fora do escopo V1)

Futura generalização dos vínculos:

```sql
CREATE TABLE direitos_acesso (
  id UUID PRIMARY KEY,
  aluno_id UUID NOT NULL,
  origem VARCHAR(32) NOT NULL,  -- MATRICULA | PACOTE | AGREGADOR
  origem_id UUID NOT NULL,
  ativo_desde TIMESTAMP NOT NULL,
  ativo_ate TIMESTAMP,
  status VARCHAR(16) NOT NULL,  -- ATIVO | EXPIRADO | SUSPENSO
  metadata_json JSONB,
  atualizado_em TIMESTAMP NOT NULL
);
```

Write models de cada módulo publicam eventos; listener popula tabela unificada. Catraca consulta 1 tabela em <50ms. Job de purge facial faz 1 query: `SELECT ... WHERE aluno_id = ? AND status = 'ATIVO' LIMIT 1`.

**Fase 1** começa com opção B (service agregador local); **Fase 2** migra para opção C (read model event-driven). Descrito aqui apenas para garantir que a Fase 1 não bloqueie a evolução.

---

## 9. Fluxos críticos

### 9.1 Atendente vende plano + produto para aluno ativo

1. Atendente na cockpit usa ⌘K para buscar cliente "Maria Silva".
2. Seleciona → card cliente preenche coluna esquerda ("Aluna ativa").
3. Tab PLANO (default) → clica "Plano Anual" (card com ribbon "Recomendado").
4. Tab PRODUTO → adiciona "Shake Whey × 2".
5. Painel direito: cupom "ALUNO10" aplicado, parcelamento 12×.
6. NSU do cartão digitado (≥4 dígitos) → botão "Finalizar · 12× R$ X" habilita.
7. Clica → backend registra venda → modal recibo 820×560 abre.
8. E-mail pré-preenchido → "Enviar" → recibo enviado, print mock, "Nova venda" reseta cockpit.

### 9.2 Atendente cria prospect via wizard e manda para cockpit

1. Menu Clientes → "Novo cliente" abre wizard.
2. Preenche dados (Step 1). Os três CTAs finais aparecem:
   - `Salvar` (cria prospect, volta para listagem);
   - `Vender` (cria prospect, redireciona `/vendas/nova?clienteId=<id>`);
   - `Vincular agregador` (cria prospect, abre modal de vínculo).
3. Escolhe `Vender` → prospect criado no backend → redirect → cockpit abre com cliente pré-preenchido na coluna esquerda, tab PLANO ativa por default.

### 9.3 Aluno Gympass chega na catraca — happy path

1. Maria abre Gympass 10 min antes, faz check-in na Conceito Fit Pinheiros.
2. Webhook HMAC chega → `AgregadorCheckinPendenteEntity` criada (TTL 60 min).
3. Cockpit recepção recebe toast lateral "Maria fez check-in Gympass — chegando em breve".
4. Maria chega na catraca → iDFace identifica `alunoId=M-42`.
5. `academia-gestao-acesso` chama `POST /catraca/validar-entrada`.
6. Backend acha pendente válido → chama Wellhub validate → 200 OK.
7. Cria `AgregadorVisitaEntity`, marca pendente como `CONSUMIDO`, retorna LIBERA.
8. Catraca abre. Cockpit atualiza contador "Visitas Gympass hoje: 4".

### 9.4 Aluno Gympass chega sem check-in — sad path

1. João chega direto na catraca sem abrir o app.
2. iDFace identifica `alunoId=J-18` → chama validar-entrada.
3. Backend não acha pendente → retorna 403 `MISSING_CHECKIN`.
4. Catraca exibe mensagem "Abra o Gympass antes de entrar".
5. Cockpit **não** recebe toast (não é anomalia; é fluxo esperado).

### 9.5 Aluno com plano vencido → job inativa → facial purgada

1. 00:05 da madrugada → `PlanoInativacaoJob` roda.
2. Detecta plano de "Carlos" com `dataFim = ontem`.
3. Marca aluno como inativo em `modulo-academia` (via service).
4. Chama `DireitoAcessoQueryService.temVinculoAtivo(alunoId)` → retorna `false`.
5. Chama `modulo-catraca/POST /catraca/purge-facial/{alunoId}` → remove facial do iDFace, registra evento `FacialPurgadaPorInativacao`.
6. Próxima manhã, Carlos tenta entrar → iDFace não reconhece → recepção oferece renovação.

---

## 10. Design system

### 10.1 Tokens novos (em `src/app/globals.css`)

```css
:root {
  --ink: oklch(0.19 0.01 240);           /* zinc-900 p/ header escuro */
  --receipt-paper: #faf8f3;              /* papel creme do recibo */
}
.dark {
  --ink: oklch(0.14 0.01 240);           /* zinc-950 no dark */
}
```

Mapeamento do handoff (§2.2) para tokens existentes:

| Handoff | Token |
|---|---|
| `#6b8c1a` | `--primary` |
| `#1ea06a` | `--gym-teal` (já existe; setado dinamicamente via `src/lib/tenant/tenant-theme.ts`) |
| `#f0f1f4` | `--muted` |
| `#64697a` | `--muted-foreground` |
| `#dfe1e6` | `--border` |

### 10.2 Tipografia

- Sans padrão via `next/font` (Inter).
- Mono JetBrains Mono via `next/font` (adicionar no layout raiz). Usada em: valores, CPF, códigos, recibo, labels uppercase.
- Escala usada: 9 / 10 / 11 / 12 / 13 / 14 / 15 / 18 / 22 / 28 / 32.

### 10.3 Componentes shadcn reusados

`Button`, `Input`, `Select`, `Badge`, `Card`, `Separator`, `Dialog`, `Sheet`, `Command` (busca universal). Ícones via `lucide-react` — `Zap`, `ScanLine`, `CreditCard`, `Banknote`, `Package`, `ShoppingCart`, `User`, `Shield`, `Check`, `X`. Ícone PIX é SVG custom (não existe em lucide).

---

## 11. Regras de negócio

| ID | Regra |
|---|---|
| RN-001 | Facial só é cadastrada no iDFace para cliente com pelo menos 1 vínculo ATIVO. |
| RN-002 | Facial é **purgada automaticamente** do iDFace quando o aluno fica sem nenhum vínculo ativo. Propagação via `modulo-catraca`. |
| RN-003 | Limite do iDFace MAX é 10.000 faces por unidade. Job de purge é **pré-requisito** para sustentabilidade. |
| RN-004 | Configuração "dias sem visita para inativar" é **por agregador × unidade** (`AgregadorConfigEntity`). Não é global. |
| RN-005 | NSU de autorização de crédito/débito é **obrigatório** com no mínimo 4 dígitos. Botão Finalizar fica desabilitado até satisfazer. |
| RN-006 | Parcelamento é **sem juros** — a academia absorve. Valor da parcela = `total / n`. Recibo mostra apenas `12× de R$ X`, não montante. |
| RN-007 | Prospect **não** tem status ativo/inativo. Ou é prospect, ou virou aluno. |
| RN-008 | Plano vencido é inativado **imediatamente no vencimento** (job @Scheduled diário). Sem período de graça. |
| RN-009 | Catraca agregadora usa política **STRICT** por default: webhook + validate síncrono obrigatórios. Sem check-in pendente OU validate falhou → NEGA. Política `GRACE_PERIOD` opcional fica para V2. |
| RN-010 | Wizard Novo Cliente termina com **3 CTAs**: `Salvar`, `Vender`, `Vincular agregador`. Nenhum deles force o usuário a continuar para o wizard-step-plano. |
| RN-011 | Cockpit tem **combo livre**: tabs PLANO/SERVIÇO/PRODUTO trocam o catálogo, **não zeram o carrinho**. |
| RN-012 | QR Code de uso único é emitido para: diária avulsa, visita/convidado, prospect em aula experimental, e pacote de visitas com saldo abaixo do threshold `qr_code_threshold` (configurável, ver Open Questions). |
| RN-013 | Cockpit permite iniciar venda sem cliente selecionado **apenas para produto avulso**. Plano e serviço exigem cliente. |
| RN-014 | Se cliente não existe ao digitar CPF na busca universal, cockpit abre inline o fluxo de criação rápida de Prospect (mínimo: nome + CPF) antes de permitir adicionar plano. |
| RN-015 | Check-in pendente tem TTL configurável por agregador × unidade, default **60 minutos**. Após TTL, é marcado EXPIRADO e não serve mais para validate. |
| RN-016 | Conversão Prospect → Aluno é **automática** na primeira venda/vínculo, executada pelo `ConversaoService.java` existente. Não requer ação manual do atendente. |
| RN-017 | Recibo térmico é componente único (`thermal-receipt.tsx`). Carrinho no cockpit e modal pós-venda compartilham a mesma renderização; divergência é bug. |
| RN-018 | Botão Finalizar exibe dinâmico: `Finalizar · R$ X` (à vista) ou `Finalizar · 12× R$ Y` (parcelado). |
| RN-019 | Ação destrutiva "Liberar manualmente" no cockpit (após sad path validate) exige autorização de perfil `Alto` e registra evento auditado. |
| RN-020 | Nenhum dado de facial ou código QR é enviado ao backend do agregador. O aluno fica identificado externamente apenas por `usuario_externo_id`. |

---

## 12. Fases de implementação

### Fase 1 — Fundação visual (mergeable)

**Objetivo:** montar a casca do cockpit sem tocar lógica comercial.

**Entregáveis:**

- fonte mono (JetBrains Mono) via `next/font` no layout raiz;
- tokens `--ink` e `--receipt-paper` em `globals.css`;
- novo componente `cockpit-shell.tsx` (header escuro 56px + grid 3 colunas);
- `page.tsx` migrada para usar `CockpitShell` mantendo os componentes atuais dentro das colunas (sem refatorar hook).

**Acceptance criteria:**

- tela `/vendas/nova` renderiza com header escuro + 3 colunas visuais;
- todas as vendas continuam funcionando exatamente como antes (zero regressão comercial);
- testes visuais 1280×800 e 1920×1080 OK.

### Fase 2 — Catálogo + busca universal

**Entregáveis:**

- `universal-search.tsx` (Command shadcn, ⌘K, resultados agrupados Clientes/Planos/Produtos, scanner inline);
- `catalog-planos.tsx` (grid 2×2, ribbon "Recomendado" dourado, card invertido para destaque);
- `catalog-servicos.tsx` (lista vertical com botão `+`);
- `catalog-produtos.tsx` (grid 3×2 com thumbnail placeholder);
- tab segmented substitui `sale-type-selector.tsx` e **não zera o carrinho** ao trocar (remove `clearCart` do effect atual em `use-venda-workspace.ts` linha 82-90, exceto para PLANO→outro).

**Acceptance:**

- ⌘K abre busca, acha cliente+plano+produto na mesma query;
- scanner inline adiciona produto ao carrinho;
- trocar tab PLANO→PRODUTO preserva o plano no carrinho (combo livre);
- RN-011 validada por teste E2E.

### Fase 3 — Painel pagamento + recibo térmico

**Entregáveis:**

- `thermal-receipt.tsx` (carrinho visual + cupom picotado, reusado em modal);
- `payment-panel.tsx` (convênio/cupom colapsáveis, total, grid 12 parcelas, NSU obrigatório ≥4 dígitos);
- hook `use-venda-workspace.ts` expandido com `parcelas`, `autorizacao`, `canFinalize`;
- botão Finalizar dinâmico (RN-018).

**Acceptance:**

- NSU < 4 dígitos → Finalizar desabilitado (RN-005);
- parcelamento troca o label do botão corretamente;
- recibo térmico no carrinho renderiza com bordas picotadas.

### Fase 4 — Modal Recibo upgrade

**Entregáveis:**

- reescrita de `src/components/shared/sale-receipt-modal.tsx` layout 820×560;
- coluna esquerda reusa `thermal-receipt.tsx`;
- coluna direita: badge "Venda Aprovada", valor grande, parcelamento visível, input e-mail + envio mock, card impressora + print mock, atalhos PDF/WhatsApp/2ª via;
- `aria-live` nos estados de envio/impressão;
- "Nova venda" limpa tudo e foca a busca universal.

**Acceptance:**

- modal 820×560 pixel-perfect handoff;
- a11y: labels, aria-live, foco gerenciado ao abrir/fechar;
- mesmo recibo em tela e modal (RN-017).

### Fase 5 — Consolidação comercial + agregador

**Entregáveis frontend:**

- **deletar** `src/components/shared/nova-matricula-modal.tsx` + todas referências (grep + remove imports);
- **remover** `wizard-step-plano.tsx` do wizard;
- wizard com 3 CTAs finais (RN-010);
- modal "Vincular Agregador" (select tipo + ID externo + confirmar);
- endpoint cliente `POST /api/v1/agregadores/vinculos` consumido via novo service em `src/lib/api/`;
- cockpit recebe WebSocket/SSE "CheckinPendenteCriado" → toast lateral recepção.

**Entregáveis backend:**

- Evolução de `AgregadorUsuarioEntity` (migração aditiva com `aluno_id`, `data_inicio`, `data_fim`, `ciclo_expira_em`, `metadata_json`) + service `AgregadorVinculoService` + endpoint;
- `AgregadorCheckinPendenteEntity` + repository;
- atualizar `WellhubCheckinSink.java` e sink TotalPass para criar `CheckinPendente` ao receber webhook;
- novo endpoint `POST /catraca/validar-entrada` consumido por `academia-gestao-acesso`;
- `CheckinExpiradoJob` @Scheduled 5 min;
- `AgregadorCicloJob` @Scheduled diário;
- `PlanoInativacaoJob` @Scheduled diário em `modulo-catraca`;
- `DireitoAcessoQueryService` local em `modulo-academia` (Fase 1 da opção B).

**Acceptance:**

- zero referência a `nova-matricula-modal` em `src/**` (grep confirma);
- wizard não abre mais step-plano;
- vínculo agregador criado via modal aparece imediatamente no perfil do aluno;
- catraca valida síncrono em produção (teste manual recepção);
- aluno sem check-in no app é negado com mensagem correta (RN-009);
- job de inativação purga facial e libera slot no iDFace.

---

## 13. Riscos e mitigações

| Risco | Impacto | Mitigação |
|---|---|---|
| Wellhub API indisponível no validate síncrono | Bloqueia entrada de alunos Gympass na recepção | Política STRICT é default; "Liberar manualmente" via perfil Alto (RN-019) desbloqueia caso a caso + auditoria. Fase futura: política `GRACE_PERIOD` com cache local. |
| Limite 10.000 faces no iDFace MAX | Perda de capacidade quando base crescer | Purge automática (RN-002) + monitoramento do head-room via endpoint de status do `modulo-catraca`. |
| Webhook atrasado vs facial chegando antes | Aluno com check-in legítimo é negado | TTL do check-in pendente é 60 min (RN-015); mensagem da catraca instrui a abrir o app → aluno faz check-in → tenta novamente. |
| LGPD — biometria mantida além do necessário | Risco legal + reputacional | RN-001/002/003 tornam a purge automática e auditada; evento `FacialPurgadaPorInativacao` fica retido 5 anos. |
| Migração dos fluxos antigos com regressão em venda | Quebra financeira direta | Fase 1 não mexe em lógica; Fases 2-4 mantêm fallback; Fase 5 remove `nova-matricula-modal` só depois das anteriores estarem em prod ≥14 dias. |
| Backfill de `aluno_id` em `AgregadorUsuarioEntity` existente inconsistente | Vínculos órfãos após migração | Fase 5 inclui script de backfill via `externalUserId → AgregadorVisitaEntity.visitanteId → Aluno`; linhas sem match ficam com `aluno_id NULL` e são reconciliadas manualmente pela recepção no próximo check-in. |
| Webhook HMAC mal validado → check-in forjado | Fraude na catraca | Validate síncrono é camada extra (RN-009) — webhook sozinho não libera. |

---

## 14. Métricas de sucesso

| Métrica | Baseline | Meta V1 |
|---|---|---|
| Tempo médio de venda na recepção | > 3 min | < 90 s |
| Número de cliques até "Finalizar" | 12-15 | ≤ 6 |
| % de check-ins Gympass validados via validate síncrono | 0% | ≥ 98% |
| % de alunos inativos com facial presente no iDFace | ~30% (estimado) | < 2% |
| Regressão em vendas existentes | — | 0 |
| Head-room médio iDFace MAX | variável | ≥ 15% livre |

---

## 15. Open questions

1. **Threshold mínimo de visitas em pacote para cadastrar facial.** Briefing sugere "ex: 5 visitas". Valor final? Proposta: configurável em `unidade.config` com default 5. Decisor: user.
2. **Política `GRACE_PERIOD` vs `STRICT` default inicial.** PRD assume `STRICT` (RN-009). Há cenário operacional que justifique `GRACE_PERIOD` (ex: Wellhub 5xx permitir entrada por 24h se aluno tem vínculo ativo)? Se sim, dimensionar para V2 + definir critérios.

---

## 16. Glossário

| Termo | Definição |
|---|---|
| **Prospect** | Cliente cadastrado sem venda ou vínculo. Sem lifecycle ativo/inativo. Sem facial. Liberação de catraca apenas manual. |
| **Aluno ativo** | Cliente com ≥1 vínculo válido (plano vigente, pacote com visitas/prazo ou agregador no ciclo). Tem facial cadastrada. |
| **Aluno inativo** | Ex-cliente com todos os vínculos expirados. Facial purgada automaticamente (LGPD). Reativa na próxima venda. |
| **Agregador** | Plataforma B2B (Wellhub/Gympass, TotalPass) que paga pela visita do seu usuário à academia. Integração via webhook HMAC + validate síncrono. |
| **Vínculo** | Relação permanente Aluno × Agregador (persistido em `AgregadorUsuarioEntity` evoluída). Diferente da visita, que é evento singular. |
| **Check-in pendente** | Registro criado no recebimento do webhook de check-in do agregador. TTL default 60 min. Consumido no validate síncrono da catraca. |
| **Visita** | Evento único de entrada validada (`AgregadorVisitaEntity`). Reseta o ciclo do agregador. |
| **Direito de Acesso** | Abstração de qualquer vínculo que libera catraca (matrícula, pacote ou agregador). Fase 1 é calculada via service; Fase 2 vira read model. |
| **Cockpit** | Tela unificada de venda em `/vendas/nova`, layout 3 colunas, target 1440×900. |
| **Pacote de visitas** | Modalidade "N visitas pré-pagas com prazo máximo". Inativa por esgotamento OU prazo. |
| **Diária avulsa** | Venda de 1 visita única, single-use, liberada por QR Code temporário. |
| **NSU** | Número Sequencial Único de autorização da maquininha de cartão. Obrigatório ≥4 dígitos (RN-005). |
| **Recibo térmico** | Componente visual estilo papel creme picotado, reusado em carrinho e modal. |
| **Validate síncrono** | Chamada `POST /access/v1/validate` ao agregador no momento do `gate_trigger` da catraca, antes de liberar a entrada. |

---

*Fim do PRD. Próxima ação recomendada: `@po *validate-story-draft` na primeira story da Fase 1 assim que `@sm` a criar.*
