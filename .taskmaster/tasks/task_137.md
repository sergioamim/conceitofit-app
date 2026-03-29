# Task ID: 137

**Title:** Redirecionar para /dashboard ao trocar de unidade ativa

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Ao trocar de unidade ativa (tenant) via ActiveTenantSelector no topbar, redirecionar o usuário para /dashboard com o novo tenant. Atualmente a URL permanece a mesma após a troca, o que causa confusão em páginas com dados contextuais (ex: /clientes/[id], modais abertos).

**Details:**

No handler handleChangeTenant em src/components/layout/app-topbar.tsx, após await setTenant(nextId) completar com sucesso, chamar router.push('/dashboard') para forçar navegação ao dashboard da nova unidade. Isso garante que o usuário sempre veja o dashboard atualizado e evita dados stale de outra unidade. Verificar que: (1) o redirect só acontece após a troca ser confirmada com sucesso; (2) se a troca falhar, o usuário permanece na página atual; (3) modais abertos são fechados ou irrelevantes após o redirect; (4) o dashboard carrega corretamente com o novo tenantId ativo.

**Test Strategy:**

Navegar até /clientes/[id] com um perfil aberto, trocar de unidade via selector no topbar, verificar que o redirect vai para /dashboard com dados do novo tenant. Testar também em outras páginas contextuais (/matriculas, /pagamentos) para garantir o comportamento consistente. Testar cenário de erro: simular falha na troca e verificar que o usuário permanece na página atual.

## Subtasks

### 137.137. Adicionar router.push('/dashboard') após troca de tenant bem-sucedida

**Status:** done  
**Dependencies:** None  

Em app-topbar.tsx, importar useRouter e após await setTenant(nextId) redirecionar para /dashboard

### 137.137. Garantir que redirect só ocorre em caso de sucesso

**Status:** done  
**Dependencies:** 137.1  

Verificar que se setTenant falhar (throw), o redirect não acontece e o usuário permanece na página atual com feedback de erro
