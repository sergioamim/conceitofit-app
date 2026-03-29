# Task ID: 187

**Title:** Testes e2e para fluxos críticos de segurança e tenant

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Fluxos de login, troca de tenant e controle de acesso não têm cobertura e2e dedicada.

**Details:**

Criar testes e2e: 1) Login com credenciais válidas → redirect para dashboard, 2) Login com credenciais inválidas → mensagem de erro, 3) Troca de tenant → dados atualizam, 4) Acesso a rota admin sem permissão → bloqueio, 5) Sessão expirada → redirect para login. Usar mocks de API quando necessário.

**Test Strategy:**

npx playwright test security-flows.spec.ts passa. Cobertura de fluxos críticos de auth.
