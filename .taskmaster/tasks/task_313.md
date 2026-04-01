# Task ID: 313

**Title:** Criar componente OnboardingChecklist

**Status:** done

**Dependencies:** 56 ✓, 64 ✓

**Priority:** high

**Description:** Desenvolver um componente React reutilizável OnboardingChecklist que consome a API GET /api/v1/onboarding/status para exibir um checklist progressivo de configuração inicial da academia.

**Details:**

1.  **Criação do Cliente API:** Em `src/lib/api/onboarding-api.ts`, criar uma função assíncrona `getOnboardingStatus()` que faz uma requisição GET para `/api/v1/onboarding/status`. Esta função deve manipular a autenticação existente (e.g., token do localStorage/cookies) e retornar o status do onboarding, incluindo as etapas, seus status e as rotas de configuração.
2.  **Criação do Componente:** Criar o componente `OnboardingChecklist.tsx` em `src/components/shared/onboarding/`.
3.  **Estrutura do Componente:**
    *   O componente deve receber uma prop `onDismiss?: () => void` para permitir o fechamento.
    *   No topo, renderizar uma barra de progresso (`ProgressBar` do `src/components/ui/` ou similar) que reflete o percentual de etapas concluídas.
    *   Iterar sobre a lista de etapas recebidas da API, exibindo para cada uma:
        *   O título da etapa.
        *   Um ícone de 'check verde' para etapas completadas ou um ícone indicando pendência.
        *   Para etapas pendentes, um botão 'Configurar agora' com um `href` (usando `next/link`) para a rota de configuração especificada pela API.
    *   Utilizar componentes UI existentes (botões, ícones, etc.) de `src/components/ui/` ou `src/components/shared/` para manter a consistência visual.
4.  **Estado e Carregamento:** Gerenciar o estado de carregamento e erro da requisição API. Exibir um skeleton loader (se disponível em `src/components/shared/`) ou uma mensagem de 'Carregando...' enquanto aguarda a resposta da API.
5.  **Reutilização:** O componente deve ser agendado para inclusão nas páginas `src/app/(app)/dashboard/page.tsx` ou em um modal global pós-login para academias com onboarding pendente.

DEPENDÊNCIA CROSS-REPO: Requer backend task academia-java#368 (GET /api/v1/onboarding/status) implementada primeiro.

**Test Strategy:**

1.  **Testes de Unidade/Integração (Jest/React Testing Library):**
    *   Verificar se o `getOnboardingStatus()` em `src/lib/api/onboarding-api.ts` faz a chamada correta para a API e trata respostas de sucesso/erro.
    *   Testar a renderização do `OnboardingChecklist` em diferentes estados: carregando, com todas as etapas pendentes, com algumas etapas completadas, e com todas as etapas completadas.
    *   Verificar se a barra de progresso reflete corretamente o número de etapas completadas.
    *   Assegurar que os botões 'Configurar agora' possuem os `href` corretos para as rotas de configuração.
    *   Testar o comportamento da prop `onDismiss` quando fornecida.
2.  **Testes Manuais:**
    *   Simular diferentes estados de onboarding via dados mockados ou ambiente de desenvolvimento com dados reais (se possível).
    *   Verificar visualmente se o componente se integra bem na UI, se os ícones e a barra de progresso são exibidos corretamente.
    *   Clicar nos botões 'Configurar agora' para confirmar que a navegação ocorre para as páginas corretas.
    *   Confirmar que o componente pode ser fechado corretamente via `onDismiss` (se implementado na interface que o usa).
