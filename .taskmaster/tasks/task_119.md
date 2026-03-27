# Task ID: 119

**Title:** Extrair modais inline de contas-a-pagar/page.tsx (1.933 linhas)

**Status:** done

**Dependencies:** None

**Priority:** medium

**Description:** Mover os 3+ modais embutidos diretamente em src/app/(app)/gerencial/contas-a-pagar/page.tsx para componentes shared dedicados, reduzindo o arquivo de 1.933 linhas para algo manejável.

**Details:**

O page.tsx de contas a pagar contém modais de criação de conta, edição de conta, pagamento de conta e possivelmente cancelamento, todos inline com useForm e Dialog. Extrair cada modal para src/components/shared/ (ex: nova-conta-pagar-modal.tsx, editar-conta-pagar-modal.tsx, pagar-conta-modal.tsx) seguindo o padrão CrudModal ou wrappers com react-hook-form + zodResolver. Manter as callbacks onSave/onClose na page e passar como props. Preservar validações e transformações de dados existentes.

**Test Strategy:**

Criar, editar, pagar e cancelar uma conta a pagar. Verificar validações de campos obrigatórios, formatação BRL e atualização da lista após cada ação.

## Subtasks

### 119.1. Extrair modal de criação de conta a pagar

**Status:** done  
**Dependencies:** None  

Mover o Dialog de nova conta com form/validação para src/components/shared/nova-conta-pagar-modal.tsx

### 119.2. Extrair modal de edição de conta a pagar

**Status:** done  
**Dependencies:** None  

Mover o Dialog de edição para src/components/shared/editar-conta-pagar-modal.tsx, reutilizando CrudModal se possível

### 119.3. Extrair modal de pagamento e limpar page.tsx

**Status:** done  
**Dependencies:** 119.1, 119.2  

Mover Dialog de pagar conta para src/components/shared/pagar-conta-modal.tsx. Remover código morto e consolidar a page.tsx final.
