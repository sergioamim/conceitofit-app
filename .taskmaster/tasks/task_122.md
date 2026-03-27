# Task ID: 122

**Title:** Integrar Lighthouse CI e bundle size gates

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Adicionar Lighthouse CI ao pipeline de CI/CD para monitorar Performance, Acessibilidade e bundle size a cada PR, com thresholds mínimos que bloqueiam merge se não atingidos.

**Details:**

Instalar @lhci/cli como devDependency. Criar lighthouserc.js com configuração de collect (URLs: /, /dashboard, /vendas, /clientes, /adesao) e assert (Performance >= 60, Accessibility >= 85, Best Practices >= 80). Criar/atualizar workflow GitHub Actions (.github/workflows/lighthouse.yml) que roda após o build, coletando métricas e falhando se abaixo dos thresholds. Para bundle size, adicionar step que compara output de next build com baseline salvo e alerta se First Load JS crescer mais que 10%. Salvar relatórios como artefatos do CI.

**Test Strategy:**

Abrir PR de teste e verificar que o workflow roda, gera relatório e passa/falha conforme thresholds. Introduzir regressão intencional (ex: import pesado) e confirmar que o CI falha.

## Subtasks

### 122.1. Configurar Lighthouse CI com thresholds

**Status:** done  
**Dependencies:** None  

Instalar @lhci/cli, criar lighthouserc.js com URLs críticas e thresholds (Performance>=60, A11y>=85, BP>=80).

### 122.2. Criar workflow GitHub Actions para Lighthouse

**Status:** done  
**Dependencies:** 122.1  

Criar .github/workflows/lighthouse.yml que roda após build, coleta métricas e falha se abaixo dos thresholds.

### 122.3. Adicionar bundle size gate no CI

**Status:** done  
**Dependencies:** 122.1  

Comparar output de next build com baseline salvo, alertar se First Load JS crescer >10%. Salvar relatórios como artefatos.
