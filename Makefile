.DEFAULT_GOAL := help

NPM := npm

.PHONY: help install dev dev-mock dev-api dev-api-scan build preview start start-prod prod lint audit-api test e2e e2e-admin-crud e2e-ui e2e-report coverage-clean coverage-unit coverage-smoke coverage-report coverage-report-full coverage-baseline coverage-baseline-full coverage-gate

help:
	@printf "\nComandos disponíveis:\n\n"
	@printf "  make install                 Instala dependências\n"
	@printf "  make dev                     Sobe o app em modo dev padrão\n"
	@printf "  make dev-mock                Sobe o app mockado em 127.0.0.1:3000\n"
	@printf "  make dev-api                 Sobe o app apontando para backend local em 3001\n"
	@printf "  make dev-api-scan            Sobe o app com React Scan + backend local\n"
	@printf "  make build                   Gera build de produção\n"
	@printf "  make preview                 Gera build de preview\n"
	@printf "  make start                   Inicia o app com next start\n"
	@printf "  make start-prod              Inicia produção local em 0.0.0.0:3000\n"
	@printf "  make prod                    Build + start de produção local\n"
	@printf "  make lint                    Executa lint\n"
	@printf "  make audit-api               Audita clientes de API\n"
	@printf "  make test                    Alias para e2e\n"
	@printf "  make e2e                     Executa todos os testes Playwright\n"
	@printf "  make e2e-admin-crud          Executa a suíte administrativa de CRUD\n"
	@printf "  make e2e-ui                  Abre Playwright UI\n"
	@printf "  make e2e-report              Abre relatório do Playwright\n"
	@printf "  make coverage-clean          Limpa artefatos de cobertura\n"
	@printf "  make coverage-unit           Roda cobertura unit\n"
	@printf "  make coverage-smoke          Roda cobertura smoke\n"
	@printf "  make coverage-report         Gera relatório de cobertura core\n"
	@printf "  make coverage-report-full    Gera relatório de cobertura full\n"
	@printf "  make coverage-baseline       Gera baseline de cobertura core\n"
	@printf "  make coverage-baseline-full  Gera baseline de cobertura full\n"
	@printf "  make coverage-gate           Executa gate de cobertura core\n\n"

install:
	$(NPM) install

dev:
	$(NPM) run dev

dev-mock:
	$(NPM) run dev:mock

dev-api:
	$(NPM) run dev:api

dev-api-scan:
	$(NPM) run dev:api:scan

build:
	$(NPM) run build

preview:
	$(NPM) run build:preview

start:
	$(NPM) run start

start-prod:
	$(NPM) run start:prod

prod:
	$(NPM) run prod:local

lint:
	$(NPM) run lint

audit-api:
	$(NPM) run audit:api

test: e2e

e2e:
	$(NPM) run e2e

e2e-admin-crud:
	./node_modules/.bin/playwright test tests/e2e/admin-backoffice-global-crud.spec.ts tests/e2e/admin-unidade-base-equipe.spec.ts tests/e2e/admin-catalogo-crud.spec.ts tests/e2e/admin-financeiro-operacional-crud.spec.ts --workers=1 --reporter=line

e2e-ui:
	$(NPM) run e2e:ui

e2e-report:
	$(NPM) run e2e:report

coverage-clean:
	$(NPM) run coverage:clean

coverage-unit:
	$(NPM) run coverage:unit

coverage-smoke:
	$(NPM) run coverage:smoke

coverage-report:
	$(NPM) run coverage:report

coverage-report-full:
	$(NPM) run coverage:report:full

coverage-baseline:
	$(NPM) run coverage:baseline

coverage-baseline-full:
	$(NPM) run coverage:baseline:full

coverage-gate:
	$(NPM) run coverage:gate
