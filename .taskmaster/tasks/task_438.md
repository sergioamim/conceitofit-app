# Task ID: 438

**Title:** Migrar campos de academia em CrudModal de Cobranças e Contratos para suggestion

**Status:** done

**Dependencies:** 431 ✓, 433 ✓

**Priority:** medium

**Description:** Converter campos de academia nos CrudModals de /admin/financeiro/cobrancas e contratos para usar o novo tipo suggestion.

**Details:**

Em /admin/financeiro/cobrancas e /admin/financeiro/contratos, os CrudModals de criação/edição usam FormFieldConfig com type select para campo de academia. Migrar para type suggestion usando onFocusOpen do useAcademiaSuggestion. Garantir que validação Zod funcione (campo obrigatório, ID válido). Testar modo de edição (campo pre-preenchido com academia existente).

**Test Strategy:**

Testes unitários: renderizar CrudModal de cobrança com campo suggestion, verificar que SuggestionInput monta, que valor pre-preenchido funciona em modo edição, e que submit envia ID correto.
