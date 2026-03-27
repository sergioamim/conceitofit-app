# Backend Evolution: Tasks 146-176 — Guia para Frontend

> Documento de transferencia de conhecimento sobre os novos endpoints, DTOs e features do backend que o frontend precisa consumir.

## Resumo Executivo

Entre as tasks 146-176, o backend ganhou:
- **Sistema de Dunning completo** (cobranças automaticas, retry, suspensao)
- **Dashboard real-time via WebSocket STOMP**
- **Portal do operador** para intervencao manual em inadimplencia
- **Dashboard financeiro do aluno** no app mobile
- **Regua de comunicação configuravel** (templates de mensagem por tenant)
- **Integracao TotalPass** (check-in, validacao, repasse)
- **Circuit breaker** nos gateways de pagamento
- **Observabilidade** com metricas Micrometer

---

## 1. NOVOS ENDPOINTS — O que o frontend precisa implementar

### 1.1 Portal Dunning (Painel Administrativo)

> **Permissao:** Apenas roles `ADMIN` e `FINANCEIRO`
> **Base path:** `/api/v1/financeiro/dunning`

#### GET `/dashboard` — Totalizadores do painel

```typescript
// Response
interface DunningDashboardResponse {
  totalAguardandoIntervencao: number
  totalInadimplente: number
  valorTotalPendente: number // BigDecimal
  matriculasEmRisco7Dias: number
  matriculasParaSuspensao: number
  diasToleranciaConfigurado: number
}
```

**Onde usar:** Card de metricas na tela principal de dunning. Atualizar via polling (10s) ou WebSocket.

---

#### GET `/intervencao` — Lista com filtros e paginacao

```typescript
// Query params
interface IntervencaoFiltros {
  tenantId?: string
  dataVencimentoDe?: string  // ISO date: "2026-03-01"
  dataVencimentoAte?: string
  valorMinimo?: number
  busca?: string  // nome, CPF ou descricao
  page?: number   // default 0
  size?: number   // default 20
}

// Response item
interface IntervencaoItem {
  alunoId: string
  matriculaId: string
  contaReceberId: string
  valor: number
  vencimento: string  // ISO date
  numeroDeFalhas: number
  ultimoMotivo: string | null
  dataPrevistaSuspensao: string  // ISO date
  gatewaysDisponiveis: string[]
}
```

**Onde usar:** Tabela principal do portal de dunning com filtros de busca, data e valor.

---

#### POST `/intervencao/{contaReceberId}/tentar-outro-gateway`

```typescript
// Request
{ gatewayId: string }  // ex: "vindi", "pagarme"

// Response
interface TentarOutroGatewayResult {
  sucesso: boolean
  mensagem: string
  externalId: string | null
}
```

---

#### POST `/intervencao/{contaReceberId}/gerar-link-pagamento`

```typescript
// Request
{ formaPagamento: "PIX" | "BOLETO" }

// Response
interface GerarLinkResult {
  sucesso: boolean
  link: string | null
  externalId: string | null
}
```

---

#### POST `/intervencao/{contaReceberId}/suspender`

```typescript
// Response
{ status: "suspensa", motivo: "Suspensão manual por inadimplência" }
```

---

#### POST `/intervencao/{contaReceberId}/regularizar`

```typescript
// Request (opcional)
{ usuarioId?: string }

// Response
{ status: "regularizado" }
```

---

#### POST `/intervencao/lote/regularizar` — Acao em lote

```typescript
// Request
interface LoteRegularizarRequest {
  contaReceberIds: string[]
  usuarioId?: string
}

// Response
interface LoteRegularizarResponse {
  regularizadas: number
  total: number
}
```

---

### 1.2 Templates de Comunicacao (Regua de Dunning)

> **Base path:** `/api/v1/financeiro/dunning/templates`

#### GET `/` — Listar templates do tenant

```typescript
// Response
interface DunningTemplateResponse {
  id: string
  evento: string   // "cobranca_falha_1" | "cobranca_falha_2" | "cobranca_ultimo_aviso" | "inadimplencia_suspensao"
  canal: string    // "EMAIL" | "PUSH"
  assunto: string
  corpo: string    // suporta {{nomeAluno}}, {{valor}}, {{vencimento}}, {{diasRestantes}}, {{diasAtraso}}
  ativo: boolean
}
```

#### PUT `/{evento}/{canal}` — Editar template

```typescript
// Request
interface AtualizarTemplateCommand {
  assunto?: string
  corpo?: string
  ativo?: boolean
}

// Response: DunningTemplateResponse
```

**Onde usar:** Tela de configuracao de comunicacao em `/administrativo/dunning-templates` (nova).

---

### 1.3 Dashboard Financeiro do Aluno (App Mobile)

> **Base path:** `/api/v1/app-cliente/financeiro`

#### GET `/inadimplencia` — Resumo de inadimplencia do aluno

```typescript
// Response
interface ResumoInadimplenciaResponse {
  possuiPendencias: boolean
  totalDevido: number
  quantidadePendencias: number
  diasAtraso: number
  dataPrevistaSuspensao: string | null  // ISO date, null se ja passou
  diasTolerancia: number
  bloqueado: boolean
  statusAluno: string  // "ATIVO" | "BLOQUEADO" | "INATIVO" | "CANCELADO"
  contasPendentes: ContaPendenteResumo[]
}

interface ContaPendenteResumo {
  contaReceberId: string
  descricao: string
  valor: number
  vencimento: string  // ISO date
  diasAtraso: number
  tentativasCobranca: number
}
```

**Onde usar:** Banner de alerta no app mobile quando `possuiPendencias === true`. Detalhe na tela financeira do aluno.

> **Nota:** Os endpoints de listar cobrancas, detalhar e gerar 2a via ja existiam em `/api/v1/app-cliente/cobrancas`. O endpoint `/inadimplencia` e novo e complementa.

---

## 2. WEBSOCKET STOMP — Dashboard Real-Time

### Configuracao

```typescript
// Conectar via SockJS
import SockJS from 'sockjs-client'
import { Client } from '@stomp/stompjs'

const client = new Client({
  webSocketFactory: () => new SockJS('/backend/ws/dashboard'),
  onConnect: () => {
    // Subscribe por tenant
    client.subscribe(`/topic/${tenantId}/financeiro`, (message) => {
      const event = JSON.parse(message.body)
      // event.tipo: "PAGAMENTO_CONFIRMADO" | "INADIMPLENCIA_DETECTADA"
    })

    client.subscribe(`/topic/${tenantId}/alertas`, (message) => {
      const event = JSON.parse(message.body)
      // event.tipo: "ALERTA_INADIMPLENCIA" | "ALERTA_OPERACIONAL"
      // event.severidade: "ALTA" | "MEDIA" | "BAIXA"
    })

    client.subscribe(`/topic/${tenantId}/catraca`, (message) => {
      const event = JSON.parse(message.body)
      // event.tipo: "CHECKIN" | "SAIDA"
    })
  }
})
client.activate()
```

### Eventos recebidos

| Canal | Evento | Quando |
|-------|--------|--------|
| `/topic/{tenantId}/financeiro` | `PAGAMENTO_CONFIRMADO` | Webhook do PSP confirma pagamento |
| `/topic/{tenantId}/financeiro` | `INADIMPLENCIA_DETECTADA` | DunningJob detecta 3+ falhas |
| `/topic/{tenantId}/alertas` | `ALERTA_INADIMPLENCIA` | Junto com INADIMPLENCIA_DETECTADA |
| `/topic/{tenantId}/alertas` | `ALERTA_OPERACIONAL` | Alertas genericos (severidade: ALTA/MEDIA/BAIXA) |
| `/topic/{tenantId}/catraca` | `CHECKIN` / `SAIDA` | Evento de passagem na catraca |
| `/topic/{tenantId}/status` | `PONG` | Resposta ao ping de health check |

### Ping/Pong (health check)

```typescript
client.publish({
  destination: '/app/dashboard/' + tenantId + '/ping',
  body: '{}'
})
// Resposta chega em /topic/{tenantId}/status com tipo: "PONG"
```

**Dependencias npm necessarias:**
```bash
npm install @stomp/stompjs sockjs-client
npm install -D @types/sockjs-client
```

---

## 3. INTEGRACAO TOTALPASS (nova)

> **Base path:** `/api/v1/integracoes/agregadores/TOTALPASS`

Os endpoints de agregadores ja existiam para Wellhub. Agora TotalPass funciona nos mesmos paths com `tipo=TOTALPASS`:

| Endpoint | Descricao |
|----------|-----------|
| POST `/{tipo}/validate` | Valida elegibilidade do usuario |
| POST `/{tipo}/checkin-webhook` | Recebe webhook de check-in |
| POST `/{tipo}/credencial` | Gerencia codigo customizado |
| GET `/{tipo}/status` | Status da integracao para o tenant |

---

## 4. GAPS NO FRONTEND — Paginas e Componentes Necessarios

### Novas Paginas

| Pagina | Rota sugerida | Prioridade | Endpoints |
|--------|--------------|:----------:|-----------|
| Portal Dunning | `/gerencial/dunning` | **ALTA** | GET dashboard + GET intervencao + acoes |
| Templates Dunning | `/administrativo/dunning-templates` | MEDIA | GET/PUT templates |
| Banner Inadimplencia (aluno) | componente no app-cliente | **ALTA** | GET /app-cliente/financeiro/inadimplencia |

### Componentes Novos

| Componente | Descricao |
|------------|-----------|
| `DunningDashboard` | Cards com totais (aguardando, valor, risco 7d) — atualiza via WS |
| `IntervencaoTable` | Tabela filtrada/paginada com acoes em linha |
| `IntervencaoActions` | Dropdown: tentar gateway, gerar link, suspender, regularizar |
| `LoteRegularizarDialog` | Modal para selecionar multiplas contas e regularizar |
| `DunningTemplateEditor` | Form com preview de variaves {{nomeAluno}} etc |
| `InadimplenciaBanner` | Alert no app mobile: "Voce tem X pendencias" |
| `WebSocketProvider` | Context/Provider para conexao STOMP global |
| `RealtimeNotification` | Toast/snackbar para eventos WS (pagamento confirmado, alerta) |

### Servicos API (novos arquivos em `/src/lib/api/`)

```typescript
// src/lib/api/dunning.ts
export async function getDunningDashboard(): Promise<DunningDashboardResponse>
export async function getIntervencoes(filtros: IntervencaoFiltros): Promise<IntervencaoItem[]>
export async function tentarOutroGateway(contaReceberId: string, gatewayId: string): Promise<TentarOutroGatewayResult>
export async function gerarLinkPagamento(contaReceberId: string, forma: "PIX" | "BOLETO"): Promise<GerarLinkResult>
export async function suspender(contaReceberId: string): Promise<void>
export async function regularizar(contaReceberId: string, usuarioId?: string): Promise<void>
export async function regularizarEmLote(contaReceberIds: string[], usuarioId?: string): Promise<LoteRegularizarResponse>

// src/lib/api/dunning-templates.ts
export async function listarTemplates(): Promise<DunningTemplateResponse[]>
export async function atualizarTemplate(evento: string, canal: string, cmd: AtualizarTemplateCommand): Promise<DunningTemplateResponse>

// src/lib/api/app-cliente-financeiro.ts (adicionar ao existente)
export async function getResumoInadimplencia(): Promise<ResumoInadimplenciaResponse>
```

---

## 5. TIPOS TYPESCRIPT (adicionar em types.ts)

```typescript
// ===== Dunning =====

interface DunningDashboardResponse {
  totalAguardandoIntervencao: number
  totalInadimplente: number
  valorTotalPendente: number
  matriculasEmRisco7Dias: number
  matriculasParaSuspensao: number
  diasToleranciaConfigurado: number
}

interface IntervencaoItem {
  alunoId: string
  matriculaId: string
  contaReceberId: string
  valor: number
  vencimento: string
  numeroDeFalhas: number
  ultimoMotivo: string | null
  dataPrevistaSuspensao: string
  gatewaysDisponiveis: string[]
}

interface TentarOutroGatewayResult {
  sucesso: boolean
  mensagem: string
  externalId: string | null
}

interface GerarLinkResult {
  sucesso: boolean
  link: string | null
  externalId: string | null
}

interface LoteRegularizarRequest {
  contaReceberIds: string[]
  usuarioId?: string
}

interface LoteRegularizarResponse {
  regularizadas: number
  total: number
}

// ===== Dunning Templates =====

type DunningEvento = "cobranca_falha_1" | "cobranca_falha_2" | "cobranca_ultimo_aviso" | "inadimplencia_suspensao"
type DunningCanal = "EMAIL" | "PUSH"

interface DunningTemplateResponse {
  id: string
  evento: DunningEvento
  canal: DunningCanal
  assunto: string
  corpo: string
  ativo: boolean
}

interface AtualizarTemplateCommand {
  assunto?: string
  corpo?: string
  ativo?: boolean
}

// ===== App Cliente Inadimplencia =====

interface ResumoInadimplenciaResponse {
  possuiPendencias: boolean
  totalDevido: number
  quantidadePendencias: number
  diasAtraso: number
  dataPrevistaSuspensao: string | null
  diasTolerancia: number
  bloqueado: boolean
  statusAluno: "ATIVO" | "BLOQUEADO" | "INATIVO" | "CANCELADO"
  contasPendentes: ContaPendenteResumo[]
}

interface ContaPendenteResumo {
  contaReceberId: string
  descricao: string
  valor: number
  vencimento: string
  diasAtraso: number
  tentativasCobranca: number
}

// ===== WebSocket Events =====

interface WsDashboardEvent {
  tipo: string
  timestamp: string
  [key: string]: unknown
}

interface WsPagamentoConfirmado extends WsDashboardEvent {
  tipo: "PAGAMENTO_CONFIRMADO"
  contaReceberId: string
  pagamentoIntegracaoId: string
  dataPagamento: string | null
}

interface WsInadimplenciaDetectada extends WsDashboardEvent {
  tipo: "INADIMPLENCIA_DETECTADA"
  alunoId: string
  matriculaId: string
  contaReceberId: string
  numeroDeFalhas: number
  dataPrevistaDeSuspensao: string
}

interface WsAlerta extends WsDashboardEvent {
  tipo: "ALERTA_INADIMPLENCIA" | "ALERTA_OPERACIONAL"
  severidade: "ALTA" | "MEDIA" | "BAIXA"
  mensagem: string
}
```

---

## 6. PRIORIDADES DE IMPLEMENTACAO

### P0 — Critico (proximo sprint)
1. **Portal Dunning** (`/gerencial/dunning`) — dashboard + tabela + acoes
2. **Banner inadimplencia no app aluno** — GET `/inadimplencia`
3. **Servico API dunning.ts** — todos os endpoints

### P1 — Importante (proximo mes)
4. **WebSocket STOMP** — provider global + notificacoes real-time
5. **Templates dunning** — tela de edicao
6. **Lote regularizar** — selecao multipla na tabela

### P2 — Desejavel
7. **Integracao TotalPass na UI de agregadores**
8. **Catraca real-time** via WebSocket (ja tem endpoint)
