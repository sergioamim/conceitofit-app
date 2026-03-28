# Task ID: 193

**Title:** Rodar knip e resolver dead code identificado

**Status:** in-progress

**Dependencies:** []

**Priority:** low

**Description:** knip está instalado mas nunca foi executado. Rodar e limpar exports não utilizados e arquivos órfãos.

**Details:**

Rodar npm run dead-code. Analisar relatório. Remover exports não importados por nenhum arquivo. Remover arquivos órfãos (se houver). Documentar exceções legítimas no knip.json (ignoreExportsUsedInFile, etc). Fazer commit com resultado.

**Subtasks:**

- [ ] Rodar knip e analisar relatório
- [ ] Resolver exports não utilizados
- [ ] Resolver arquivos órfãos
- [ ] Documentar exceções no knip.json

**Test Strategy:**

npm run dead-code retorna zero ou apenas exceções documentadas. Build OK. Testes passam.
