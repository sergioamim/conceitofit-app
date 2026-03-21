# Task ID: 82

**Title:** Migrar formulários para react-hook-form com Zod

**Status:** done

**Dependencies:** 81

**Priority:** high

**Description:** Migrar progressivamente os formulários relevantes do frontend para usar `react-hook-form` com schemas `zod` e `zodResolver` como padrão de validação.

**Details:**

Revisar os formulários já migrados para `react-hook-form` e substituir validações manuais, `validate` inline repetitivo e parsing ad hoc por schemas `zod` coesos, mantendo a UX atual de erros, submit e reset.
Priorizar fluxos críticos ou já padronizados em `react-hook-form`, como autenticação, jornada pública, segurança/RBAC e CRUDs administrativos.
Extrair schemas por domínio quando houver reaproveitamento real, evitando um arquivo monolítico de validações.
Garantir compatibilidade com componentes customizados (`Select`, `SuggestionInput`, editores ricos, modais Radix) e preservar segurança de hidratação no primeiro render.

**Test Strategy:**

Executar lint e testes unitários/E2E dos fluxos migrados, cobrindo submit válido, mensagens de erro, reset e casos condicionais importantes. Sempre validar que a troca para `zodResolver` não altera payloads nem regressa a UX atual.

## Subtasks

### 82.1. Migrar fluxos de autenticação e jornada pública

**Status:** done  
**Dependencies:** 81  

Aplicar schemas `zod` aos formulários de login, primeiro acesso, recuperação de senha, cadastro, trial e checkout.

### 82.2. Migrar segurança operacional e administrativa

**Status:** done  
**Dependencies:** 81  

Aplicar schemas `zod` aos formulários de `acesso-unidade`, `rbac` e criação global de usuários no backoffice.

### 82.3. Migrar modais e CRUDs administrativos com maior volume

**Status:** done  
**Dependencies:** 81  

Cobrir modais e telas administrativas que hoje usam `react-hook-form` com validação manual, como planos, produtos, serviços, vouchers, colaboradores e catálogos correlatos.

### 82.4. Eliminar validações duplicadas e alinhar payloads

**Status:** done  
**Dependencies:** 82.1, 82.2, 82.3  

Remover validações redundantes em handlers/helpers quando o schema já for fonte de verdade e garantir que os payloads finais permaneçam compatíveis com a API.

### 82.5. Atualizar cobertura automatizada das migrações

**Status:** done  
**Dependencies:** 82.1, 82.2, 82.3, 82.4  

Expandir testes unitários e E2E para validar erros por campo, regras condicionais e fluxos de sucesso dos formulários migrados para `zodResolver`.
