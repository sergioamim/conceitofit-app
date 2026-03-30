# PRD — Sistema de Onboarding com Seeds Seletivos

## Contexto

Quando uma nova academia (rede) contrata a plataforma, é necessário configurar a estrutura inicial: unidades, planos, formas de pagamento, atividades, cargos, etc. Hoje esse processo é manual e repetitivo.

O sistema de onboarding deve permitir:
1. Configuração guiada de nova academia/unidade
2. Aplicação seletiva de seeds (dados pré-configurados)
3. Importação de dados de sistemas legados (EVO, etc.)
4. Acompanhamento do progresso do onboarding

## Público-alvo

- **Operador backoffice** (admin global da plataforma) — configura novas academias
- **Gestor da academia** (admin da rede) — completa o setup da sua academia

## Fluxo proposto

### 1. Criação da Academia (Backoffice)
O operador backoffice cria a academia com dados básicos:
- Nome, razão social, CNPJ, contato
- Subdomínio para storefront
- Plano da plataforma contratado

### 2. Criação de Unidades (Tenants)
Para cada unidade da rede:
- Nome, endereço, contato
- Subdomínio
- Configuração de branding (tema, cores, logo)

### 3. Tela de Seeds Seletivos
Após criar a academia/unidade, o operador acessa uma tela de "Carga Inicial" onde pode selecionar quais seeds aplicar:

#### Seeds disponíveis (checkboxes):

| Seed | Descrição | Dados inseridos |
|------|-----------|----------------|
| **Planos padrão** | 4 planos base (Mensal, Trimestral, Semestral, Anual) | Planos com valores sugeridos, editáveis depois |
| **Formas de pagamento** | PIX, Cartão Crédito/Débito, Dinheiro, Boleto | Formas com taxas padrão |
| **Atividades base** | Musculação, Spinning, Yoga, Funcional, Pilates | Atividades com categorias |
| **Salas padrão** | Sala de Musculação, Sala Cardio, Sala Multiuso | Salas com capacidade padrão |
| **Cargos** | Professor, Recepcionista, Gerente, Coordenador | Cargos operacionais |
| **Exercícios** | Catálogo de ~50 exercícios por grupo muscular | Exercícios com descrição e equipamento |
| **Grupos musculares** | Superior, Inferior, Core, Funcional | Grupos para organizar exercícios |
| **Bandeiras de cartão** | Visa, Mastercard, Elo, Amex, Hipercard | Bandeiras com taxas padrão |
| **Tipos de conta** | Folha, Aluguel, Marketing, Fornecedores | Categorias para contas a pagar |
| **Horários padrão** | Grade semanal 6h-22h com slots de 1h | Horários operacionais |
| **Dados demo** | 10 alunos fictícios + matrículas + pagamentos | Para testes e demonstração |

#### Opções adicionais:
- **Importar do EVO** — redireciona para a tela de importação existente
- **Começar do zero** — não aplica nenhum seed
- **Aplicar todos** — seleciona todos os seeds de uma vez

### 4. Progresso do Onboarding
Dashboard mostrando o status de cada etapa:
- [ ] Academia criada
- [ ] Unidade(s) configurada(s)
- [ ] Seeds aplicados
- [ ] Primeiro usuário criado
- [ ] Primeiro plano ativo
- [ ] Primeira matrícula registrada
- [ ] Formas de pagamento configuradas
- [ ] NFS-e configurado (opcional)

### 5. Usuário de Setup
- O backoffice cria um usuário com perfil "SETUP" para a academia
- Esse usuário tem acesso temporário para completar o onboarding
- Após conclusão, pode ser convertido para perfil "ADMIN" ou removido

## Arquitetura técnica

### Backend (endpoints necessários)
```
POST /api/v1/admin/onboarding/academias          → Criar academia + primeiro tenant
POST /api/v1/admin/onboarding/tenants             → Adicionar tenant a academia existente
POST /api/v1/admin/onboarding/seeds               → Aplicar seeds seletivos
GET  /api/v1/admin/onboarding/{academiaId}/status → Status do onboarding
PUT  /api/v1/admin/onboarding/{academiaId}/step   → Marcar etapa como concluída
```

### Frontend (páginas)
```
/admin/onboarding                    → Lista de academias em onboarding
/admin/onboarding/nova               → Wizard de criação (academia + unidade + seeds)
/admin/onboarding/[academiaId]       → Dashboard de progresso
/admin/onboarding/[academiaId]/seeds → Tela de seeds seletivos
```

### Seed Engine (backend)
Cada seed é um módulo independente que:
1. Recebe o `tenantId` como parâmetro
2. Insere dados com UUIDs gerados
3. É idempotente (ON CONFLICT DO NOTHING)
4. Retorna relatório: { inseridos, ignorados, erros }

```java
public interface SeedModule {
    String name();
    String description();
    SeedResult apply(UUID tenantId);
}
```

### Banco de dados
Tabela de controle:
```sql
CREATE TABLE onboarding_progress (
    id UUID PRIMARY KEY,
    academia_id UUID NOT NULL REFERENCES academias(id),
    step VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
    completed_at TIMESTAMP,
    completed_by BIGINT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE onboarding_seed_execution (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    seed_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    items_inserted INTEGER DEFAULT 0,
    items_skipped INTEGER DEFAULT 0,
    errors JSONB,
    executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    executed_by BIGINT
);
```

## Priorização

### Fase 1 — MVP (seeds via SQL no backoffice)
- Tela simples no backoffice com checkboxes de seeds
- Seeds executados via endpoint REST que roda SQL
- Sem wizard, sem progresso — apenas "selecione e aplique"

### Fase 2 — Wizard completo
- Wizard de 4 etapas (academia → unidade → seeds → usuário)
- Dashboard de progresso
- Importação do EVO integrada

### Fase 3 — Self-service
- Gestor da academia faz o setup sozinho
- Wizard público pós-contrato
- Integração com billing (contrato → onboarding automático)

## Dependências
- Backend: endpoints de onboarding + seed engine
- Frontend: páginas de onboarding no backoffice
- Seed SQL validados e testados por entidade

## Riscos
| Risco | Mitigação |
|-------|-----------|
| Seeds desatualizados com schema | Testes automatizados de seeds no CI |
| Seed duplicado em re-execução | ON CONFLICT DO NOTHING em todos os INSERTs |
| Performance com seeds grandes (exercícios) | Execução assíncrona com status polling |
| Importação EVO conflita com seeds | Seed detecta dados existentes e pula |
