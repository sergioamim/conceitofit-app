# RBAC v2 — Discovery & Gap Analysis

**Status:** Wave 0 / Story #1 — concluído 2026-04-25
**Origem:** redesign de `/admin/gestao-acessos/*` baseado no bundle Claude Design `gestao-de-acesso-rbac` (9 telas + tweaks).
**Decisão chave:** **construir UI nova em cima do modelo backend existente**. Não criar abstração paralela.

---

## TL;DR

O modelo de domínio de RBAC já está implementado em produção no `modulo-auth` (entities + controllers + migrações V5–V9 + V16/V20/V21). O que falta é UI rica e ~5 endpoints de leitura/agregação. **Não precisamos de novas tabelas para a Wave 0** — o trabalho redobra em frontend e em pequenas extensões dos controllers existentes.

Tudo o que eu propus inicialmente como modelo novo (`user_rede_access`, "feature module com 2 famílias de endpoints irmãs") é redundante ou redundantemente complexo. O backend já tem `UserTenantMembership` (multi-tenant) e o filtro por contexto já é só um parâmetro `dominio` ("ACADEMIA" vs "PLATAFORMA") + `tenantId` (opcional).

---

## Modelo de domínio existente

### Entities (modulo-auth, schema `auth`)

| Entity | Tabela | Função |
|---|---|---|
| `PerfilAcessoEntity` | `perfil_acesso` | **Papel** (Role). PK uuid; unique `(dominio, tenant_id, nome)`. Campos: `tipo` (PADRAO/CUSTOMIZADO), `copiadoDe` (clone tracking), `ativo` (soft delete). `tenant_id` nullable → templates do sistema. |
| `CapacidadeEntity` | `capacidade` | **Permissão** granular. PK string `key`. Campos: `dominio`, `modulo`, `nome`, `descricao`, `grupo`, `ordem`. |
| `PerfilCapacidadeEntity` | `perfil_capacidade` | N:N papel↔permissão (a **matriz**). |
| `UsuarioPerfilEntity` | `usuario_perfil` | Atribuição `(userId, tenantId) → perfilId`. **Mesmo user pode ter perfis diferentes em redes diferentes** — multi-tenant nativo. |
| `UsuarioCapacidadeOverrideEntity` | `usuario_capacidade_override` | Override individual GRANT/DENY por usuário. **Não previsto no design** — feature avançada que pode virar tweak no detalhe do usuário. |
| `UserTenantMembership` | `user_tenant_membership` | Multi-tenant access. Já existe — substitui o `user_rede_access` que eu havia proposto. |
| `UserInvite` + status | `user_invite` | Convites. |
| `AuthorizationAuditEvent` | — | Auditoria de mudanças. |
| `StandardProfileDefinition` + versions | — | Versionamento de perfis padrão. **Não usado pela UI atual**; pode habilitar "papéis sistema versionados" no futuro. |
| `User` | `users` | Tem `userKind` (PLATAFORMA/OPERADOR/CLIENTE), `tenantId` default, `redeId`, set legacy de `roles` (a matar). |

### Endpoints já expostos (`/api/v1/auth/gestao-acessos/*`)

**`/perfis`** (PerfilAcessoController):
- `GET ?dominio=&tenantId=` — lista
- `GET /templates?dominio=` — perfis-template do sistema (sem tenant)
- `GET /{id}` — detalhe + capacidades
- `POST` — criar custom
- `PUT /{id}` — atualizar nome/descrição
- `DELETE /{id}` — soft delete (`ativo=false`)
- `POST /{id}/capacidades` — adicionar 1
- `DELETE /{id}/capacidades/{key}` — remover 1
- `PUT /{id}/capacidades` — **bulk replace** (toda a matriz)
- `POST /importar` — clonar template para tenant

**`/capacidades`** (CapacidadeController):
- `GET ?dominio=` — agrupado por `grupo`
- `GET /por-modulo?dominio=` — agrupado por `modulo`

**`/usuarios-perfil`** (UsuarioPerfilController):
- `GET /{userId}` — perfis em **todos** os tenants do user (alimenta a aba "Acesso a outras redes" do design)
- `GET /{userId}/tenant/{tenantId}` — perfil + overrides
- `GET /{userId}/tenant/{tenantId}/capacidades` — capacidades efetivas (perfil + overrides)
- `POST /{userId}/tenant/{tenantId}/atribuir` — atribuir/trocar perfil
- `POST /{userId}/tenant/{tenantId}/override` — GRANT/DENY individual
- `DELETE /{userId}/tenant/{tenantId}/override/{capacidadeKey}` — remover override

### Modelo legacy convivendo (`Role` + `feature_catalog` + `role_feature_grants`)

V5–V9 bootstrapou um RBAC v1 mais grosseiro (Role com nomes ADMIN/CUSTOMER/RECEPCAO/GERENTE/FINANCEIRO/INSTRUTOR/VIEWER/SUPER_ADMIN; FeatureCatalog com 8 features grossas; permission VIEW/EDIT/MANAGE). **Não vamos consumir nem estender** — apenas mapear quem ainda lê (Story #19, enforcement) e migrar gradualmente.

---

## UI atual

| Rota | Arquivo | Estado |
|---|---|---|
| `/admin/gestao-acessos/operadores` | `operadores-content.tsx` | Tabela simples (Operador / Email / Perfil / Ações). Modal "Alterar Perfil" + Modal "Detalhes" com chips de capacidades. **Filtro por `userKind === "CLIENTE"` é client-side** (gambiarra). Botão "Novo Operador" está `disabled`. |
| `/admin/gestao-acessos/perfis` | `perfis-content.tsx` | Lista de perfis com badge `PADRAO/CUSTOMIZADO`. Modais de "Novo Perfil" e "Importar template". **Sem editor de matriz**. |
| `/admin/gestao-acessos/perfis/[id]` | (existe rota) | Verificar — provavelmente exibe capacidades. |
| `/admin/audit-log/` | — | Existe rota separada do RBAC. Precisa investigar se vai virar a aba Auditoria do design ou continuar separada. |
| `/admin/seguranca/` | — | Existe. Mesma decisão. |

---

## Gap matrix — design × backend × UI atual

✅ existe e atende · 🔧 existe parcial · ❌ falta

| Tela do design | Backend | UI atual | Verdict |
|---|---|---|---|
| **1. Visão geral** (4 KPIs + 2 cards) | 🔧 dados existem espalhados; falta endpoint de agregação | ❌ | Build endpoint `/admin/stats` + UI |
| **2. Usuários (lista)** com filtros papel/status/escopo | 🔧 `listUsersApi` existe mas filtros server-side fracos; filtro de `userKind` é client | 🔧 simples | Estender backend + redesenhar UI |
| **3. Detalhe do usuário** (3 tabs) | ✅ `/usuarios-perfil/{id}/...` cobre permissões+overrides; falta sessões+atividade-do-user | 🔧 modal | Refazer como page com 3 tabs; aba "outras redes" usa `GET /usuarios-perfil/{userId}` |
| **4. Convidar** (wizard 4 steps) | 🔧 `UserInvite` entity existe; precisa endpoint de envio | ❌ botão disabled | Expor `POST /convites`, build wizard |
| **5. Papéis (lista)** com cards + KPIs | ✅ `GET /perfis` + count por papel via SQL | 🔧 lista textual | Redesenhar como cards |
| **6. Editor de papel — matriz** (3 layouts) | ✅ `PUT /{id}/capacidades` (bulk) + `GET /capacidades?dominio=` | ❌ | Build os 3 layouts |
| **7. Catálogo de permissões** (read-only) | ✅ `GET /capacidades?dominio=` | ❌ | Build UI |
| **8. Auditoria** (categorias + filtros + stream) | 🔧 `AuthorizationAuditEvent` existe; `audit-log/` rota separada precisa unificar; stream é spike | 🔧 outro lugar | Migrar `audit-log/` para `/gestao-acessos/auditoria` |
| **9. Senha & MFA** (política) | 🔧 `seguranca/` rota existe; falta endpoint da política | 🔧 outro lugar | Conectar |

### Tweaks (o protótipo expõe; viramos features)

| Tweak | Status |
|---|---|
| Tema light/dark | ✅ projeto inteiro |
| 3 layouts da matriz (tabela/cards/árvore) | Story #11 |
| Densidade compacta/arejada | Apenas na tabela de usuários |
| Escopo por unidade on/off | Já temos via `unidades` (UserScopeAccess) |
| Dados de exemplo | Apenas dev |

---

## Decisões tomadas (autonomia delegada pelo usuário)

1. **Não criar tabelas novas na Wave 0.** O modelo backend cobre tudo que o design pede. Migrações ficam para *seed* de capacidades (se faltar) e *seed* de papéis-template PLATAFORMA.

2. **Eliminar story #22** (user_rede_access). `UserTenantMembership` já cumpre o papel, com mais riqueza (`access_origin`, `defaultTenant`, `originTenantId`). Marcar `deleted`.

3. **Repivotar story #2** (backend contract). Em vez de "criar 2 famílias irmãs de endpoints", o trabalho é:
   - **Documentar** os contratos existentes em OpenAPI canônico
   - **Adicionar** 5 endpoints novos (lista de usuários com filtros server-side; convites; auditoria filtrada; política de segurança GET/PUT; stats da overview)
   - **Padronizar** o vocabulário: o parâmetro `dominio` discrimina contexto (ACADEMIA vs PLATAFORMA), `tenantId` discrimina rede (null no contexto PLATAFORMA).

4. **Repivotar story #21** (feature module). Continua válida como organização do código frontend, mas consome os clients HTTP que já existem em `lib/api/gestao-acessos.ts`. O componente raiz é `<RbacApp dominio="ACADEMIA" tenantId={...} />` — o nome da prop alinha com o vocabulário backend.

5. **Story #23** (catálogo PLATAFORMA) é seed de migration nova mais review do meu rascunho de 8 papéis × 22 permissões. Vou conferir se já existem capacidades com `dominio="PLATAFORMA"` antes de propor a migração.

6. **Vocabulário UI:** "Papel" para a UI (mais reconhecível) ↔ `PerfilAcessoEntity` no backend. "Permissão" UI ↔ `Capacidade` backend. Não vamos renomear nada no backend — o tradutor mora no client (`gestao-acessos.types.ts`).

7. **Rotas finais:**
   - OPERADOR: `/admin/gestao-acessos/{usuarios|papeis|permissoes|convidar|auditoria|seguranca}` (substitui `operadores/` e `perfis/`).
   - PLATAFORMA: `/admin/saas/gestao-acessos/{usuarios|papeis|...}` (mesma estrutura, prop `dominio="PLATAFORMA"`).

8. **Rotas legadas viram redirect 308:** `/operadores → /usuarios`, `/perfis → /papeis`. Migração off (story #18) apenas após canary 100%.

9. **Filtro de `userKind` migra para server-side** (parte de story #2). Hoje está client-side em `operadores-content.tsx:86`.

10. **`UsuarioCapacidadeOverrideEntity` (GRANT/DENY individual) vira tweak avançado** na aba Permissões do detalhe do usuário (Wave 2 / story #7). Não está no design original, mas é uma capacidade real que vale aproveitar — chip "+ override" próximo ao papel + dialog para justificar.

---

## Próximas ações (Wave 0 restante)

| Story | O que faz | Bloqueia |
|---|---|---|
| #2 (repivotada) | Documentar contratos + propor 5 endpoints faltantes | Wave 1+ |
| #3 | Primitives shadcn + tokens | Wave 1+ |
| #21 (repivotada) | Feature module wrapper | Wave 1+ |
| #23 | Validar/seedar catálogo PLATAFORMA | Wave 4 #13 |

Esta discovery doc fecha story #1.
