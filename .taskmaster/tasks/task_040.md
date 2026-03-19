# Task ID: 40

**Title:** Definir capability e RBAC de exclusão no backend

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Criar contrato de capacidade canDeleteClient ligado ao perfil ALTO e expor na sessão/bootstrp para permitir a UI decidir a visibilidade da ação.

**Details:**

Atualizar o payload do bootstrap (ex.: /api/v1/app/bootstrap) ou do me para incluir capabilities.canDeleteClient. Mapear o perfil ALTO para essa capacidade no backend, sem inferir por ADMIN genérico. Pseudo-código: canDeleteClient = user.profile === "ALTO" || permissions.includes("CLIENT_DELETE"). Documentar o contrato para o frontend consumir a flag booleana.

**Test Strategy:**

Testar respostas do bootstrap/me para usuário ALTO e não-ALTO, garantindo canDeleteClient true/false conforme esperado.
