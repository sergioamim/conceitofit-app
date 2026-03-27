# Task ID: 133

**Title:** Backoffice: impersonation (entrar como usuário) com audit trail

**Status:** done

**Dependencies:** 132 ✓

**Priority:** low

**Description:** Adicionar funcionalidade de impersonation no detalhe de usuário (/admin/seguranca/usuarios/[id]) que permite ao admin do backoffice acessar o sistema com a visão de qualquer usuário para suporte e diagnóstico, com registro completo no audit log.

**Details:**

Adicionar botão "Entrar como este usuário" na página de detalhe do usuário (/admin/seguranca/usuarios/[id]/page.tsx). Ao clicar: (1) Confirmar via dialog com justificativa obrigatória; (2) Chamar endpoint impersonateUser em admin-audit.ts que retorna token temporário; (3) Salvar sessão original em sessionStorage; (4) Iniciar nova sessão com token do usuário impersonado; (5) Exibir banner fixo no topo ("Você está operando como [nome] — Encerrar"); (6) Ao encerrar, restaurar sessão original. Registrar início e fim da impersonation no audit log. Criar componente ImpersonationBanner em src/components/backoffice/.

**Test Strategy:**

Impersonar um usuário, navegar pelo sistema e verificar que os dados são do contexto dele. Encerrar e confirmar retorno ao backoffice. Verificar audit log registra início e fim.

## Subtasks

### 133.1. Criar endpoint e lógica de impersonation

**Status:** done  
**Dependencies:** None  

Endpoint impersonateUser/endImpersonation em admin-audit.ts. Lógica de troca de sessão.

### 133.2. Criar ImpersonationBanner e integrar no layout

**Status:** done  
**Dependencies:** 133.1  

Banner fixo com nome do usuário impersonado e botão encerrar. Integrar no app layout.

### 133.3. Adicionar botão e dialog no detalhe de usuário

**Status:** done  
**Dependencies:** 133.2  

Botão "Entrar como" com dialog de confirmação + justificativa obrigatória no /admin/seguranca/usuarios/[id]
