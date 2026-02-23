# Validação de Integração Frontend x Backend Real

Data: 2026-02-23

## Escopo validado
- Frontend:
  - `/Users/sergioamim/dev/pessoal/academia-app/src/lib/types.ts`
  - `/Users/sergioamim/dev/pessoal/academia-app/src/lib/mock/services.ts`
- Backend:
  - `/Users/sergioamim/dev/pessoal/academia-java/modulo-app/src/main/resources/static/openapi.yaml`
  - implementação Java (controllers/exception handler)

## Resultado objetivo
1. **Contrato OpenAPI**: boa cobertura e alinhamento para os fluxos críticos solicitados.
2. **Integração real executável**: **bloqueada** no backend por erro de compilação.
3. **Frontend em runtime**: ainda não consome API real (continua importando `@/lib/mock/services`).

---

## 1) Compatibilidade 1:1 (services.ts x endpoints)

Estado atual:
- `services.ts`: 133 funções públicas.
- OpenAPI atual: 100+ paths e cobre os fluxos críticos:
  - contexto/unidade (`/api/v1/context/*`, `/api/v1/unidades*`)
  - financeiro gerencial completo
  - mural (`/api/v1/grade/mural/{tenantId}`)
  - CRM/comercial/administrativo em boa parte dos casos.

Conclusão:
- Para os fluxos críticos pedidos, a OpenAPI está aderente.
- Para afirmar 1:1 total de todas as 133 funções em runtime, ainda depende da correção da build backend e ligação do adapter HTTP no frontend.

---

## 2) Quebras de assinatura encontradas

### 2.1 Bloqueio de execução backend (crítico)
Ao rodar:
- `./mvnw -pl modulo-app -Dtest=ApiIntegrationTest test -q`

Falhou compilação com múltiplos erros, principais:
- `Tenant#getAcademiaId()` ausente em vários serviços/controllers.
- `Tenant.TenantBuilder#academiaId(...)` ausente.
- métodos de repositório ausentes, ex.:
  - `FormaPagamentoRepository#findByIdAndTenantId(...)`
  - `AtividadeRepository#findByIdAndTenantId(...)`
  - `ProspectRepository#findByIdAndTenantId(...)`

Impacto:
- Não é possível validar integração real end-to-end enquanto o backend não compilar.

### 2.2 Frontend ainda não integrado com API real (crítico)
- Há 45 imports diretos de `@/lib/mock/services` nas telas/componentes.
- Não há client HTTP/api adapter ativo em `src/lib`.

Impacto:
- Mesmo com OpenAPI alinhada, a aplicação continua rodando em mock/localStorage.

---

## 3) Fluxos críticos solicitados

### 3.1 Contexto/Unidade
OpenAPI contempla:
- `GET /api/v1/context/unidade-ativa`
- `PUT /api/v1/context/unidade-ativa/{tenantId}`
- `GET/POST /api/v1/unidades`
- `PUT/DELETE /api/v1/unidades/{id}`
- `PATCH /api/v1/unidades/{id}/toggle`

Status: **contrato OK**.

### 3.2 Financeiro gerencial
OpenAPI contempla:
- Tipos de conta (`GET/POST/PUT/PATCH toggle`)
- Contas a pagar (`GET/POST/PUT/PATCH pagar/PATCH cancelar`)
- Recorrência (`GET regras`, `PATCH pausar/retomar/cancelar`, `POST gerar`)
- DRE (`GET /dre`)
- Formas de pagamento (`GET/POST/PUT/PATCH toggle/DELETE`)
- Labels (`GET /formas-pagamento/labels`)

Status: **contrato OK**.

### 3.3 Mural
OpenAPI contempla:
- `GET /api/v1/grade/mural/{tenantId}`

Com metadados úteis (`tenant`, `academia`, `days`, `horarioDia`).

Status: **contrato OK**.

---

## 4) Erro padronizado

Implementação backend (`ApiExceptionHandler`) e OpenAPI (`ApiError`) estão alinhadas com:
- `timestamp`
- `status`
- `error`
- `message`
- `path`
- `fieldErrors` (quando validação)

Status: **OK**.

---

## 5) Texto pronto para revalidação no backend

```
A OpenAPI está bem alinhada com o frontend nos fluxos críticos, mas a integração real está bloqueada por build quebrada.

Por favor, corrigir primeiro os erros de compilação no modulo-app:
- referências a Tenant#getAcademiaId() e TenantBuilder#academiaId(...)
- métodos ausentes de repositórios (findByIdAndTenantId em FormaPagamentoRepository, AtividadeRepository, ProspectRepository, etc.)

Depois, rodar e enviar evidências:
1) ./mvnw -pl modulo-app -Dtest=ApiIntegrationTest test
2) status de sucesso dos cenários:
   - contexto/unidade ativa e CRUD de unidades
   - financeiro (tipos conta, contas pagar, recorrência, dre, formas + labels)
   - mural /api/v1/grade/mural/{tenantId}
   - payload de erro padrão com fieldErrors em validação

Manter contratos exatamente compatíveis com:
- /Users/sergioamim/dev/pessoal/academia-app/src/lib/types.ts
- /Users/sergioamim/dev/pessoal/academia-app/src/lib/mock/services.ts

Sem refatorar telas frontend.
```
