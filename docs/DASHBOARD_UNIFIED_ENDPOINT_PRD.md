# PRD: Endpoint unificado do Dashboard Operacional

## 1. Problema

Hoje a página `/dashboard` monta o painel com múltiplas chamadas:

- `GET /api/v1/academia/prospects`
- `GET /api/v1/comercial/alunos?envelope=true`
- `GET /api/v1/comercial/matriculas` (com fallback para `/api/v1/comercial/adesoes`)
- `GET /api/v1/comercial/pagamentos` (para abas de Vendas/Financeiro)

Isso gera latência alta na primeira renderização, consumo de rede duplicado e risco de inconsistência de filtros (janela mensal, data de referência e regras derivadas de status). Já existe `src/lib/api/dashboard.ts`, mas está praticamente sem uso.

## 2. Objetivo

Consolidar o carregamento do dashboard em **um único endpoint de consulta**, retornando os dados já agregados para preencher:

- Visão de Clientes
- Visão de Vendas
- Visão Financeira
- Listas de apoio da UI (prospects recentes, matrículas vencendo em 7 dias, pagamentos pendentes/vencidos)

Meta de negócio: reduzir tempo até o dashboard ficar utilizável e evitar múltiplas viagens independentes para o mesmo `tenantId` no mesmo `referenceDate`.

## 3. Escopo

### Em escopo

1. Definir e versionar contrato único de resposta para o dashboard.
2. Disponibilizar endpoint no backend para agregação dos dados usados pela UI.
3. Migrar `src/app/(portal)/dashboard/page.tsx` para consumir esse endpoint.
4. Atualizar `src/lib/api/dashboard.ts` e tipos/normalização para suportar o payload novo/legacy.
5. Cobrir a migração com testes e validação de regressão de chamadas de rede.

### Fora de escopo

1. Refazer todos os módulos de BI/analytics por rede.
2. Alterar regra de negócio de cálculo de conversão, inadimplência ou mensalidade além do que está hoje na tela.
3. Refatoração de UI estrutural da dashboard (layout visual).

## 4. Requisitos funcionais

### 4.1 Endpoint

Implementar/ativar rota:

- `GET /api/v1/academia/dashboard`
- manter compatibilidade temporária em `GET /api/v1/dashboard` caso já usado por ambiente legado.

Query params:

- `tenantId` (UUID, obrigatório)
- `referenceDate` (YYYY-MM-DD, obrigatório)
- `scope` (`FULL | CLIENTES | VENDAS | FINANCEIRO`, padrão `FULL`)
- `month` / `year` (opcionais, derivados quando não passar `referenceDate`)

### 4.2 Resposta mínima obrigatória

```json
{
  "tenantId": "uuid",
  "referenceDate": "2026-03-16",
  "scope": "FULL",
  "summary": {
    "clientes": {
      "totalAlunosAtivos": 0,
      "statusAlunoCount": {
        "ATIVO": 0,
        "SUSPENSO": 0,
        "INATIVO": 0,
        "CANCELADO": 0
      },
      "prospectsNovos": 0,
      "prospectsEmAberto": 0,
      "followupPendente": 0,
      "visitasAguardandoRetorno": 0,
      "prospectsRecentes": [],
      "matriculasVencendo": []
    },
    "vendas": {
      "matriculasDoMes": 0,
      "matriculasDoMesAnterior": 0,
      "receitaMensal": 0,
      "receitaMensalAnterior": 0,
      "vendasNovas": 0,
      "vendasRecorrentes": 0,
      "conversoesMes": 0,
      "conversoesMesAnterior": 0,
      "ticketMedioContrato": 0,
      "ticketMedioContratoAnterior": 0
    },
    "financeiro": {
      "pagamentosRecebidosMes": 0,
      "pagamentosRecebidosMesAnterior": 0,
      "ticketMedio": 0,
      "ticketMedioAnterior": 0,
      "inadimplencia": 0,
      "aReceber": 0,
      "pagamentosPendentes": []
    }
  },
  "metadados": {
    "generatedAt": "2026-03-16T18:20:00Z",
    "sourceWindow": {
      "month": 3,
      "year": 2026
    }
  }
}
```

Campos de listas:

- `prospectsRecentes`: últimos 5 prospects ativos (`status != CONVERTIDO && status != PERDIDO`)
- `matriculasVencendo`: matrículas com `status = ATIVA` e `dataFim` entre `referenceDate` e `referenceDate + 7 dias`
- `pagamentosPendentes`: pagamentos com `PENDENTE` ou `VENCIDO`, ordenados por vencimento

### 4.3 Regras de consistência

1. `referenceDate` deve ser a data de referência de cálculo (inclusive para contagens de mês corrente).
2. Janela de mês corrente e anterior:
   - mês corrente: primeiro/último dia do mês de `referenceDate`;
   - mês anterior: último mês do dia anterior.
3. Toda data serializada em ISO `YYYY-MM-DD` para datas, ou ISO 8601 em campos dat/time quando aplicável.
4. `scope=CLIENTES` retorna somente agregados/listas de clientes; `scope=VENDAS` e `scope=FINANCEIRO` retornam seus blocos, sem misturar campos.
5. Respostas devem ser cacheáveis com TTL curto (ex.: 60–120s) e incluir `generatedAt`.

## 5. Ajustes no frontend

### 5.1 Consumo único

- Substituir a trilogia de chamadas (`prospects`, `alunos`, `matriculas`, `pagamentos`) por `getDashboardApi`.
- Passar `tenantContext.tenantId`, `scope` e `referenceDate`.
- Renderizar `prospectsRecentes`, `matriculasVencendo` e `pagamentosPendentes` diretamente do payload.

### 5.2 Comportamento de navegação

- Mudar a lógica de mudança de aba para trocar apenas o `scope`.
- Evitar recálculo local de métricas complexas na tela (usar `summary` retornado).
- Manter o filtro de data (input date) como única variável de re-fetch.

### 5.3 Tolerância e fallback

- Se campos novos não vierem disponíveis:
  - manter o `DashboardData` atual de compatibilidade em `src/lib/types.ts`.
  - preencher defaults seguros (`0`, `[]`) sem quebrar render.
- Mostrar estado de erro amigável se o endpoint retornar contrato inválido.

## 6. Requisitos não funcionais

1. Tempo de resposta alvo da página de dashboard: reduzir em pelo menos 60% número de chamadas de rede na primeira carga.
2. Para uma mesma combinação `tenantId + referenceDate + scope`, no UI deve existir no máximo 1 requisição no refresh sem troca de tenant.
3. Compatibilidade com dados mock/local caso ambiente não disponha do endpoint (fallback parcial planejado para versão 2).
4. Telemetria/monitoramento no backend para tempo de resposta e cardinalidade do payload.

## 7. Entregáveis

1. PRD atualizado no repositório com contrato fechado do endpoint.
2. Endpoint no backend implementado e documentado.
3. Dashboard da aplicação consumindo o novo contrato.
4. `src/lib/api/dashboard.ts` atualizado para normalizar novo payload sem regressão.
5. Evidência de redução de chamadas e validação manual/e2e da tela com tabs+data picker.

## 8. Prompt de alinhamento para o backend (usar no repositório Java)

```text
Você é o time backend Java. Gere um PRD equivalente para `academia-java` com os mesmos objetivos:
- reduzir chamadas da tela `/dashboard` para 1 endpoint consolidado
- manter contratos por `tenantId`, `referenceDate` e `scope`
- calcular no backend os mesmos indicadores e listas atuais usados pelo frontend
- preservar compatibilidade com cliente legado e incluir fallback de path se necessário.

Depois, crie as tasks técnicas (com IDs sequenciais locais) para esta implementação:
1) contrato/DTO do endpoint
2) serviço de agregação (clientes, prospects, matrículas, pagamentos)
3) controller/API + openapi
4) testes de integração + performance básica
5) observabilidade de latência e payload
6) documentação e rollout com compatibilidade.

Entregue também plano de migração com critérios de aceite:
- chamadas reduzidas (comparar antes/depois),
- página `/dashboard` carregando com apenas uma chamada por referência,
- validação de status/ordenação nas listas retornadas.
```
