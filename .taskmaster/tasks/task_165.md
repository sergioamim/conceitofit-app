# Task ID: 165

**Title:** Corrigir type errors em importacao-evo-p0

**Status:** done

**Dependencies:** 164 ✓

**Priority:** high

**Description:** O arquivo importacao-evo-p0/page.tsx tem 15+ erros de tipo: FILE_UPLOAD_GROUPS indefinido, PacoteArquivoDisponivel incompleto, any implicitos, formatJobAliasDate nao encontrado.

**Details:**

Corrigir todos os type errors no arquivo src/app/(backoffice)/admin/importacao-evo-p0/page.tsx e shared.ts. Definir FILE_UPLOAD_GROUPS, adicionar campos faltantes em PacoteArquivoDisponivel (historico, entidadeFiltro, blocoFiltro), importar formatJobAliasDate, tipar parametros implicitos.

**Test Strategy:**

tsc --noEmit sem erros neste arquivo. Navegar para /admin/importacao-evo-p0 funciona.
