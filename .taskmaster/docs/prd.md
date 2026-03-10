# PRD Task Master - WEB | academia-app

## Contexto

O projeto `academia-app` e o frontend web principal da plataforma Academia. O codigo atual cobre operacao diaria, jornada comercial, administrativo contextual e um backoffice global em `src/app/(backoffice)/admin`, mas ainda possui dependencias relevantes de `src/lib/mock/services.ts` e `src/lib/mock/store.ts` em areas importantes.

Este PRD existe para manter o backlog do Task Master alinhado ao estado real do repositorio, sem voltar ao backlog antigo e sem criar trabalho para projetos legados.

## Diretrizes mandatórias

- Nao manter `mock/services` como dependencia estrutural das areas administrativas e de backoffice.
- Nao usar `localStorage` como fonte de verdade para dados transacionais de dominio.
- Convergir contratos e telas ao backend real antes de expandir novas superficies.
- Reaproveitar telas e componentes existentes sempre que fizer sentido.
- Tratar o backoffice global de academias/unidades e a importacao ETL como ondas tardias, depois do saneamento principal.

## Instrucoes obrigatorias de geracao

- Gerar exatamente 10 tasks top-level, na ordem abaixo.
- Cada task top-level representa um epico.
- Expandir cada epico em subtasks verificaveis por fluxo, tela e integracao.
- Nao criar tasks para apps legados ou para frontends fora do repositorio atual.

## Epicos obrigatorios

### 1. Alinhar contrato HTTP e camada de consumo da API
- Revisar clients, services, schemas e tratamento de erro para refletir a API real.

### 2. Consolidar fluxo web de contratos, matricula e venda
- Ajustar telas administrativas e comerciais para o fluxo canonico de venda, contrato e assinatura.

### 3. Corrigir contexto, sessao e experiencia multiunidade
- Tornar consistente a troca de unidade, contexto ativo, permissoes e navegacao.

### 4. Construir CRM operacional com automacoes
- Evoluir o frontend para pipeline, tarefas, playbooks, cadencias e follow-up comercial.

### 5. Construir reservas, vagas e operacao de aulas
- Criar telas de backoffice e portal para reservas, lista de espera, ocupacao e check-in de aula.

### 6. Criar jornada digital web de adesao e checkout
- Implementar paginas e fluxos para trial, signup, checkout, formularios e contratos.

### 7. Expandir modulos administrativos, financeiros e de integracao
- Cobrir configuracoes e operacao de NFSe, agregadores, recebimentos, dashboards e areas administrativas ausentes.

### 8. Criar BI operacional e visao de rede
- Entregar dashboards e visoes consolidadas por unidade e por academia para uso gerencial.

### 9. Estruturar backoffice global de academias e unidades
- Migrar `/admin`, `/admin/academias` e `/admin/unidades` para contratos reais, com cadastro e gestao global nao expostos ao usuario final.

### 10. Consolidar importacao ETL e onboarding de unidades no backoffice
- Completar `/admin/importacao-evo-p0` e integra-la ao cadastro de unidade, com opcao de dados iniciais padrao ou importacao futura.
