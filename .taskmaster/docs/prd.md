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

- O backlog inicial de 10 epicos ja foi expandido no Task Master e deve continuar evoluindo sem perder aderencia ao codigo real.
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

## Complemento 2026-03-13 - Seguranca Global do Backoffice

O backend passou a formalizar uma nova trilha administrativa de seguranca em `/api/v1/admin/seguranca/*`. No frontend, isso nao deve reaproveitar integralmente as paginas contextuais em `src/app/(app)/seguranca/*`, porque elas operam por tenant e nao cobrem a visao global de rede. A diretriz e criar telas novas no shell `/admin`, reaproveitando componentes, hooks e padroes visuais das telas atuais quando fizer sentido.

### 16. Criar area global de seguranca no backoffice administrativo
- Adicionar navegacao, listagem global de usuarios administrativos e detalhe consolidado de acessos em `/admin/seguranca/*`.

### 17. Operar usuarios, unidades e perfis pelo backoffice global
- Permitir associar usuario a unidade, remover acesso, trocar unidade padrao e gerir perfis administrativos por unidade no path `/admin`.

### 18. Integrar politica de novas unidades ao administrativo e onboarding
- Exibir e operar a elegibilidade de usuarios para novas unidades, alem de refletir acesso herdado/manual nas telas de seguranca e de unidades.

## Complemento 2026-03-19 - Perfil do cliente e aba NFS-e

No detalhe do cliente em `src/app/(app)/clientes/[id]/page.tsx`, a aba `NFS-e` nao deve depender de `GET /api/v1/administrativo/nfse/configuracao-atual` no carregamento inicial da pagina. O comportamento esperado e carregar sob demanda apenas quando o usuario abrir a aba e priorizar a exibicao das NFS-e ja emitidas e dos estados fiscais refletidos nos pagamentos, sem introduzir fetch fiscal global desnecessario no perfil.
