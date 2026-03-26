# Task ID: 92

**Title:** Implementar Rascunhos e Auto-save em Formulários Críticos

**Status:** done

**Dependencies:** 91 ✓

**Priority:** medium

**Description:** Proteger o usuário contra perda acidental de dados em cadastros extensos.

**Details:**

Criar o hook customizado useFormDraft para persistência em localStorage. Implementar política de expiração de rascunhos. Adicionar um pequeno indicador de Salvo no rascunho no topo do formulário. Criar o modal Continuar preenchimento? ao reabrir um formulário inacabado. Implementar em: Cadastro de Cliente, Cadastro de Plano e Matrícula.

**Test Strategy:**

Digitar em um formulário e fechar a aba mantém os dados ao reabrir. O sistema oferece restaurar os dados detectados no localStorage. Limpeza correta após sucesso.
