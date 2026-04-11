# Onboarding Status Badge - Implementação

## O que foi feito

### Backend (academia-java) ✅
O backend já estava completo com:
- **Endpoint:** `GET /api/v1/onboarding/status`
- **Serviço:** `OnboardingService` que verifica 7 steps automaticamente
- **Controller:** `OnboardingStatusController`
- **DTOs:** `OnboardingStatusResponse`
- **Migrations:** `V2026_05_01` e `V2026_05_02` para criar tabelas necessárias

### Frontend (academia-app) ✅

#### 1. Componente Criado
**Arquivo:** `src/components/layout/onboarding-status-badge.tsx`

**Funcionalidades:**
- Badge com ícone de alerta (⚠️) aparece no header quando há pendências
- Contador vermelho mostra número de steps pendentes
- Ao clicar, abre Sheet (drawer lateral) com checklist completo
- Cada step mostra:
  - ✅ Ícone de check se concluída
  - ⚠️ Ícone de alerta se pendente
  - Link "Configurar agora →" para steps não concluídos
- Barra de progresso mostra percentual de conclusão
- Esconde automaticamente quando onboarding está 100% completo

#### 2. Integração no Layout
**Arquivo modificado:** `src/components/layout/app-topbar.tsx`

- Adicionado `<OnboardingStatusBadge />` ao lado direito do topbar
- Aparece apenas quando há pendências (não renderiza se concluído)
- Faz fetch do status ao montar componente

## Checklist de Onboarding (7 steps)

O backend verifica automaticamente:

| Step | Critério | Route |
|------|----------|-------|
| 1. Dados da academia | nome preenchido | `/configuracoes/academia` |
| 2. Horários de funcionamento | ao menos 1 funcionário com horários | `/configuracoes/horarios` |
| 3. Plano | ao menos 1 plano ativo | `/cadastro/planos` |
| 4. Forma de pagamento | ao menos 1 pagamento registrado | `/financeiro/formas-pagamento` |
| 5. Funcionário | ao menos 1 funcionário ativo | `/cadastro/funcionarios` |
| 6. Cliente | ao menos 1 aluno | `/cadastro/clientes` |
| 7. Storefront | branding theme configurado | `/configuracoes/storefront` |

## Como Testar

1. **Provisionar nova academia** com 2 unidades vazias
2. **Acessar o portal** da academia
3. **Verificar no header** - deve aparecer ícone de alerta com badge vermelho mostrando "7"
4. **Clicar no badge** - abre drawer lateral com checklist
5. **Configurar cada step** - clicar em "Configurar agora" vai para página correta
6. **Voltar ao dashboard** - badge deve atualizar mostrando número menor de pendências
7. **Completar todos** - badge desaparece quando onboarding está 100%

## Próximos Melhoramentos (Opcional)

- [ ] Adicionar polling para atualizar status a cada 30s
- [ ] Mostrar notificação toast quando completar onboarding
- [ ] Adicionar botão "Pular etapa" para steps opcionais
- [ ] Persistir preferência de "fechar checklist" no localStorage
- [ ] Adicionar animação de confete quando completar 100%

## Arquivos Modificados/Criados

### Criados:
- `src/components/layout/onboarding-status-badge.tsx`

### Modificados:
- `src/components/layout/app-topbar.tsx` (adicionado import e componente)

### Dependências Utilizadas:
- `lucide-react` (AlertCircle, CheckCircle2) - já instalada
- `@/components/ui/sheet` - já existente
- `@/components/ui/badge` - já existente
- `@/lib/api/onboarding-api` - já existente
- `@/lib/shared/types/tenant` - já existente

---

**Data:** 2026-04-11  
**Status:** ✅ Implementado e pronto para teste
