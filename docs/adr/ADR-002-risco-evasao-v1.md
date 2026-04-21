# ADR-002 — Risco de Evasão v1.0 (heurística determinística)

**Data:** 2026-04-20
**Status:** Accepted
**Módulo:** Perfil do Cliente v3 — Wave 3 (PRD `docs/PERFIL_CLIENTE_V3_ADOCAO_PRD.md`)
**Fórmula versionada:** `v1.0-2026-04-20` (constante `RISCO_VERSION` em `src/lib/domain/risco-evasao.ts`)

---

## Contexto

O redesenho do perfil do cliente (Wave 3) introduz o card **"Risco de evasão"** no Resumo. O PRD original (AC3.5–3.9) previa:

- score 0–100 com rótulo Baixo/Médio/Alto;
- sparkline de tendência das últimas 7 semanas;
- lista dos principais fatores de peso;
- painel lateral com detalhes completos.

O contexto operacional não dispõe, nesta iteração, de modelo estatístico treinado nem de backend dedicado ao cálculo do score. A Constitution do projeto (Artigo IV — No Invention) impede construir métricas especulativas sem dado real. A decisão foi optar por uma **heurística determinística** que usa exclusivamente sinais já presentes no payload do `useClienteWorkspace`, mantendo o comportamento previsível, explicável e testável.

---

## Decisão

Foi implementada a função pura `computeRiscoEvasao` em `src/lib/domain/risco-evasao.ts` com fórmula estável e versionada.

### Entrada

```ts
interface RiscoEvasaoInput {
  aluno: Aluno;
  suspenso: boolean;
  pendenteFinanceiro: boolean;
  planoAtivo?: { dataFim: string } | null;
  pagamentos: Pagamento[];
  presencas: Presenca[];
  hoje?: Date; // injetável para testes
}
```

### Fórmula v1.0

Cada fator contribui com um peso fixo. O score final é `clamp(0, Σ_negativos − Σ_positivos, 100)`.

| # | Fator | Peso | Sinal | Fonte |
|---|-------|------|-------|-------|
| 1 | Cliente suspenso (status `SUSPENSO` ou flag `suspenso`) | +50 | negativo | `aluno.status` / workspace |
| 2 | Contrato vencido (`dataFim < hoje`) | +40 | negativo | `planoAtivo.dataFim` |
| 3 | Frequência mensal < 3 treinos | +30 | negativo | `presencas[]` no mês corrente |
| 4 | Última visita > 10 dias | +25 | negativo | `max(presencas.data)` |
| 5 | Pendência financeira ativa (`pendenteFinanceiro`) | +20 | negativo | workspace |
| 6 | Contrato vence em ≤ 14 dias | +10 | negativo | `planoAtivo.dataFim` |
| 7 | Frequência mensal ≥ 12 treinos | −15 | positivo | `presencas[]` no mês corrente |

### Fatores omitidos nesta versão

Fatores previstos no desenho mas **suspensos por ausência de dado** (AC3.8):

| Fator previsto | Peso | Motivo |
|----------------|------|--------|
| Avaliação física vencida | +10 | backend de avaliações não retorna histórico |
| NPS ≤ 6 nos últimos 90 dias | +5 | sem survey de NPS |
| NPS ≥ 9 | −15 | sem survey de NPS |

### Rótulo por faixa de score

| Faixa | Rótulo | Cor |
|-------|--------|-----|
| `score >= 70` | Alto | `gym-danger` |
| `40 <= score < 70` | Médio | `gym-warning` |
| `score < 40` | Baixo | `gym-teal` |

### Estados especiais

- **Cliente `INATIVO` ou `CANCELADO`** → retorna `{ score: 0, label: "Baixo", fatores: [], temDadosSuficientes: false }`. Rationale: não calculamos risco para cliente fora do ciclo operacional.
- **Menos de 2 fatores avaliáveis** → `temDadosSuficientes = false`. A UI esconde sparkline e mostra mensagem "Sem dados suficientes".
- **Fatores retornados** → ordenados por peso decrescente (mais impactantes primeiro). Slice `.slice(0, 3)` produz os top-3 exibidos no card.

### Tendência 7 semanas (`computeTendenciaRisco`)

Proxy baseado apenas em frequência semanal:
- janela: últimos 49 dias agrupados em 7 semanas consecutivas (fim da semana em `hoje`);
- score semanal: `max(20, 60 − (treinos_na_semana × 12))`;
- retorna `null` se `presencas.length === 0` (consumidor oculta sparkline, AC3.5).

Motivo do proxy simplificado: não há histórico temporal dos outros fatores (pendência retroativa, suspensão retroativa). Expandir a tendência exige backend dedicado com snapshots históricos, fora do escopo v1.0.

---

## Consequências

### Positivas

- **Explicabilidade completa** — operador vê os fatores exatos e seus pesos.
- **Zero dependência de backend novo** — usa apenas o payload já carregado.
- **Testável 100%** — 20 casos em `tests/unit/risco-evasao.test.ts` cobrindo cada fator, faixas, clamps e estados especiais.
- **Versionada** — constante `RISCO_VERSION` permite tracking de evolução ao longo do tempo.
- **Reverter é trivial** — função pura, sem estado, sem side effect.

### Negativas

- **Linearidade** — pesos fixos não capturam interações entre fatores (ex.: pendência + baixa frequência deveria ter peso combinado maior que a soma).
- **Proxy da tendência** — sparkline usa apenas frequência; pode dar falsa impressão de estabilidade quando outros fatores mudaram.
- **Fatores omitidos** — score atual subestima risco de clientes com NPS baixo ou avaliação vencida (quando existirem dados reais desses sinais).

### Mitigações

- Todos os fatores são documentados na UI do painel lateral "Ver detalhes", incluindo indicação da versão da fórmula.
- Mudanças na fórmula exigem PR com justificativa e atualização dos testes unitários.

---

## Evolução

### v2 — fatores omitidos entram

Quando backend expuser avaliações físicas e NPS, os três fatores omitidos são reabilitados sem mudança de peso. Bump de versão: `v2.0-AAAA-MM-DD`.

### v3 — modelo estatístico

Se houver sinal de uso suficiente (métrica: `% de renovações originadas via drawer` da §7 do PRD), abrir épico dedicado para:

1. Coletar snapshot histórico de sinais (backend de eventos).
2. Treinar modelo de churn (logística ou gradient boosting simples).
3. Substituir `computeRiscoEvasao` mantendo a mesma assinatura de retorno.

A heurística v1 permanece como fallback em caso de indisponibilidade do modelo.

---

## Testes de regressão

Testes unitários no arquivo `tests/unit/risco-evasao.test.ts` cobrem:

- rótulos por faixa (Baixo/Médio/Alto)
- cada fator individualmente
- clamps superior (score ≤ 100) e inferior (score ≥ 0)
- compensação positiva (frequência alta reduz)
- cliente INATIVO/CANCELADO
- `temDadosSuficientes` com menos de 2 fatores
- ordenação decrescente por peso
- `computeTendenciaRisco`: retorna `null` sem presenças, 7 valores entre 20-60, e score decrescente quando presenças aumentam

---

## Referências

- PRD `docs/PERFIL_CLIENTE_V3_ADOCAO_PRD.md` § Wave 3
- Épico `docs/stories/epic-2-perfil-cliente-v3.md` (stories 2.11–2.14)
- Implementação `src/lib/domain/risco-evasao.ts`
- Testes `tests/unit/risco-evasao.test.ts`
- UI `src/app/(portal)/clientes/[id]/cliente-risco-card.tsx`
