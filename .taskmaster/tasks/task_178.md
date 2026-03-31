# Task ID: 178

**Title:** Auditar e sanitizar usos de dangerouslySetInnerHTML

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** 4 arquivos usam dangerouslySetInnerHTML. 1 confirmado seguro (JSON-LD). 3 precisam verificação: pendencias/page.tsx, checkout/page.tsx e b2b/layout.tsx.

**Details:**

Verificar se os dados passados para dangerouslySetInnerHTML em adesao/pendencias/page.tsx e adesao/checkout/page.tsx vêm de input do usuário ou do backend. Se vêm do backend (contratoHtml), avaliar sanitização com DOMPurify ou similar. Documentar cada uso com comentário explicando por que é seguro. O uso em b2b/layout.tsx é JSON.stringify — já seguro.

**Test Strategy:**

Cada uso de dangerouslySetInnerHTML tem comentário de segurança ou sanitização. Teste manual com payload XSS em campos de contrato.
