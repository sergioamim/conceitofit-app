---
name: spring-module-boundary-review
description: Use esta skill quando a tarefa envolver novos serviços, integrações entre módulos, contratos, portas/adapters, repositories ou mudanças de arquitetura em projeto Spring Boot multimódulo.
---

## Verificações obrigatórias
- A regra de dependência entre módulos foi respeitada?
- O domínio ficou isolado de detalhes de infraestrutura?
- Existe interface/porta onde deveria haver?
- Algum módulo final passou a depender de outro indevidamente?
- Houve vazamento de DTO externo para domínio?
- Alguma mudança exige teste de contrato ou integração?

## Saída esperada
- módulos impactados
- risco arquitetural
- dependências novas
- violação encontrada ou "sem violação"