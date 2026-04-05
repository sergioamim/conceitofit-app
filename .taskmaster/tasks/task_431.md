# Task ID: 431

**Title:** Adicionar tipo suggestion ao FormFieldConfig do CrudModal

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Estender CrudModal para suportar campos com SuggestionInput, permitindo busca async de entidades como Academia/Rede/Unidade.

**Details:**

O CrudModal (src/components/shared/crud-modal.tsx) usa FormFieldConfig com tipos text, number, select, textarea, date, checkbox. Adicionar tipo "suggestion" que renderiza SuggestionInput em vez de <Select>. Deve aceitar onFocusOpen (async loader) e options (SuggestionOption[]). Atualizar autoSchemaFromFields para gerar schema Zod correto para campos suggestion (string obrigatória representando o ID selecionado). Incluir testes unitários para o novo tipo de campo.

**Test Strategy:**

Testes unitários: renderizar CrudModal com campo tipo suggestion, verificar que SuggestionInput é montado, que onFocusOpen é chamado, que seleção popula o form corretamente, e que validação Zod rejeita valor vazio.
