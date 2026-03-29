# Task ID: 195

**Title:** Migrar jornada pública de adesão para endpoints reais do backend

**Status:** pending

**Dependencies:** None

**Priority:** high

**Description:** O frontend usa services.ts com lógica interna para trial, checkout e pendências. O backend tem 11 endpoints em /api/v1/publico/adesao/* prontos para uso.

**Details:**

O backend oferece: GET /publico/adesao/catalogo, POST /publico/adesao/cadastros, POST /publico/adesao/trials, POST /publico/adesao/{id}/checkout, GET /publico/adesao/{id}, GET /publico/adesao/{id}/pendencias, PATCH /publico/adesao/{id}/pendencias/{codigo}, PUT /publico/adesao/{id}/cadastro, POST /publico/adesao/{id}/contrato/assinaturas, POST /publico/adesao/{id}/contrato/otp, POST /publico/adesao/{id}/pagamento/confirmacao. Criar src/lib/public/adesao-api.ts com clients para cada endpoint. Refatorar src/lib/public/services.ts para chamar esses endpoints em vez de orquestrar APIs internas (alunos, vendas, matrículas). Manter interface pública do services.ts compatível.

**Test Strategy:**

Jornada pública funciona end-to-end: trial, cadastro, checkout, pendências. Sem chamadas diretas a APIs internas de aluno/venda/matrícula no fluxo público.
