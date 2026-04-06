# Task ID: 461

**Title:** Expandir portal do aluno: Check-in com QR Code e histórico

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** Completar a página /aluno/check-in com geração de QR Code dinâmico, histórico de check-ins e status de matrícula em tempo real.

**Details:**

A página (aluno)/check-in/page.tsx atual é mínima. Implementar: (1) QR Code dinâmico que refresh a cada 30s (usar qrcode.react já instalada), (2) status da matrícula ativa com badge visual (Ativo/Suspenso/Vencido), (3) histórico dos últimos 30 check-ins com data/hora/unidade, (4) botão de refresh manual, (5) proteção: QR Code só é exibido se matrícula está ATIVA e sem vencimentos. Usar TanStack Query para polling do status. Fallback: exibir mensagem estável no SSR até mount.

**Test Strategy:**

Teste unitário do componente QR Code com diferentes estados de matrícula. Teste E2E: aluno com matrícula ativa vê QR Code, aluno suspenso vê bloqueio. Teste de acessibilidade (a11y) da página.
