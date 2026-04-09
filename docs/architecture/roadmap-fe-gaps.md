# Roadmap: Gaps FE ← BE (APIs disponiveis nao consumidas)

**Gerado:** 2026-04-09
**Metodo:** Cruzamento de 959 endpoints backend vs 232 consumidos pelo frontend
**Backend:** academia-java (16 modulos Maven, 2411 arquivos Java)
**Frontend:** academia-app (Next.js 16, ~730 arquivos TS/TSX)

---

## Resumo

O backend oferece **~100 endpoints** que o frontend **nao consome**. Esses endpoints representam features prontas no servidor que so precisam de UI.

---

## TIER 1: Quick Wins (API pronta, < 3 dias FE)

| # | Feature | Endpoints | Dias | Audiencia | Categoria |
|---|---------|-----------|------|-----------|-----------|
| 1.1 | **Export server-side** (alunos + financeiro) | 2 | 1-2 | Portal | Operacoes |
| 1.2 | **Preferencias de notificacao** | 3 | 2 | Portal | UX |
| 1.3 | **Retry de notificacao** (outbox resend) | 1 | 0.5 | Backoffice | Operacoes |
| 1.4 | **Dashboard de retencao CRM** | 1 | 2 | Portal | Retencao |
| 1.5 | **Storage/Upload centralizado** | 3 | 2 | Portal+BO | Operacoes |

**Total Tier 1: ~7.5 dias**

---

## TIER 2: Alto Impacto (API pronta, 1-2 semanas FE)

| # | Feature | Endpoints | Dias | Audiencia | Categoria |
|---|---------|-----------|------|-----------|-----------|
| 2.1 | **Dunning (cobranca/recuperacao)** | 8 | 8-10 | Portal | Receita |
| 2.2 | **NPS / Campanhas de retencao** | 6 | 7-8 | Portal | Retencao |
| 2.3 | **Fidelizacao (indicacoes + recompensas)** | 10 | 8-10 | Portal | Receita+Retencao |
| 2.4 | **BI Analytics avancado** (receita, retencao, inadimplencia) | 3 | 5-7 | Portal | Receita+Retencao |
| 2.5 | **PIX Integration** (cobrancas, QR, devolucao) | 5 | 5-6 | Portal | Receita |

**Total Tier 2: ~35-40 dias**

---

## TIER 3: Estrategico (API pronta, diferencial competitivo)

| # | Feature | Endpoints | Dias | Audiencia | Categoria |
|---|---------|-----------|------|-----------|-----------|
| 3.1 | **App Cliente completo** (carteirinha, contratos, loja, push, referral, rewards) | ~30 | 15-20 | Cliente | UX+Receita+Retencao |
| 3.2 | **Totem self-service** (kiosk mode) | 5 | 8-10 | Portal+Publico | Operacoes |
| 3.3 | **Gestao de visitantes** | 4 | 4-5 | Portal | Operacoes |

**Total Tier 3: ~27-35 dias**

---

## TIER 4: Futuro (menor prioridade)

| # | Feature | Endpoints | Dias | Nota |
|---|---------|-----------|------|------|
| 4.1 | Admin BI Resumo consolidado | 1 | 1-2 | Otimizacao de calls existentes |
| 4.2 | Professor Aulas (visao instrutor) | 1+ | 3-5 | API shape precisa ser confirmada |
| 4.3 | Identidade Digital (validacao KYC) | 1 | 1-2 | Nicho para compliance |
| 4.4 | Onboarding Provision | 1 | 0.5 | Verificar se ja esta wired |

---

## Plano de Sprints Sugerido

| Sprint | Foco | Features | Dias |
|--------|------|----------|------|
| Sprint 1 (2 sem) | Quick Wins | Export, Notificacoes, Retencao CRM, Storage | ~7.5 |
| Sprint 2-3 (4 sem) | Receita | Dunning + PIX | ~14-16 |
| Sprint 4-5 (4 sem) | Retencao | NPS + Fidelizacao + BI Analytics | ~20-25 |
| Sprint 6-8 (6 sem) | Experiencia Cliente | App Cliente (4 fases) | ~15-20 |
| Sprint 9+ | Operacoes | Totem + Visitantes + Futuro | ~13-17 |

**Esforco total estimado: ~75-95 dias FE**

---

## Detalhamento por Feature

### 1.1 Export Server-Side
O FE ja tem export client-side via `src/lib/export/table-export.ts`. O backend oferece export de datasets grandes que o client-side nao suporta. Adicionar opcao "Exportar do servidor" no `ExportMenu` existente.

### 2.1 Dunning (Cobranca)
Workflow completo de recuperacao de inadimplencia: dashboard com metricas, fila de intervencao com acoes (gerar link PIX, regularizar, suspender, trocar gateway), regularizacao em lote, e templates de mensagem por canal. Impacto direto na receita.

### 2.3 Fidelizacao
Programa de indicacao + recompensas: campanhas de referral, tracking de indicacoes com conversao em matricula, saldo de pontos por aluno, resgate de recompensas. Motor de crescimento organico.

### 2.5 PIX
Geracao de cobrancas PIX (QR code), acompanhamento de status, processamento de devolucoes. PIX e o meio de pagamento dominante no Brasil.

### 3.1 App Cliente
30 endpoints prontos no backend. O FE atual tem 9 paginas basicas na area do cliente. O backend suporta: carteirinha digital, contratos com assinatura eletronica (OTP), faturas com 2a via, loja com catalogo e pedidos, push notifications, programa de indicacao, recompensas, portabilidade entre unidades.

---

*Analise gerada por cruzamento automatico BE (academia-java) x FE (academia-app)*
