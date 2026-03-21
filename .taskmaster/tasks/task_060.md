# Task ID: 60

**Title:** Implementar a operação administrativa migrarClienteParaUnidade no frontend

**Status:** done

**Dependencies:** 58 ✓, 59 ✓

**Priority:** medium

**Description:** Dar suporte visual e operacional ao fluxo administrativo que altera a unidade-base do cliente.

**Details:**

Com o backend expondo `migrarClienteParaUnidade`, o frontend precisa distinguir claramente essa operação estrutural da mera troca de tenant ativo. Esta task cobre a UX administrativa, formulário, confirmação, mensagens de risco, trilha de auditoria e atualização de tela após a migração.

**Test Strategy:**

Cobrir a UI de migração com testes funcionais e cenários de sucesso, bloqueio e erro operacional.

## Subtasks

### 60.1. Definir o ponto de entrada da ação migrarClienteParaUnidade nas telas administrativas

**Status:** done  
**Dependencies:** None  

Escolher onde a operação deve aparecer sem confundir com troca temporária de contexto.

**Details:**

Posicionar a ação de migração nas telas de cliente/comercial de forma explícita, com rótulo claro e contexto suficiente para o operador.

### 60.2. Construir modal ou fluxo dedicado com origem, destino e justificativa

**Status:** done  
**Dependencies:** 60.1  

Coletar os dados administrativos necessários para a migração estrutural.

**Details:**

Criar o formulário que exibe unidade atual, unidade destino, validações de rede, motivo e efeitos esperados da operação.

### 60.3. Integrar o contrato HTTP de migração e tratar erros canônicos do backend

**Status:** done  
**Dependencies:** 60.2  

Consumir o endpoint novo com mensagens coerentes para o operador.

**Details:**

Adicionar client, mutation e tratamento de erro para rede divergente, unidade inválida, cliente inelegível ou falha de auditoria.

### 60.4. Atualizar detalhe, listagens e caches do cliente após a migração

**Status:** done  
**Dependencies:** 60.3  

Refletir imediatamente a nova unidade-base nas superfícies administrativas.

**Details:**

Recarregar ou invalidar consultas relevantes para mostrar a unidade-base atualizada, histórico e possíveis efeitos operacionais após a migração.

### 60.5. Exibir trilha de auditoria e mensagens de risco da operação

**Status:** done  
**Dependencies:** 60.2, 60.4  

Dar ao gestor clareza sobre permanência e criticidade da migração.

**Details:**

Mostrar resumo da operação, motivação registrada e avisos de que a migração altera a unidade-base estrutural do cliente, não apenas a sessão.

### 60.6. Cobrir a UX de migração com testes de regressão funcional

**Status:** done  
**Dependencies:** 60.3, 60.4, 60.5  

Provar que a operação administrativa está compreensível e estável.

**Details:**

Adicionar cenários automatizados para abertura do fluxo, validação, sucesso, bloqueios e atualização correta da tela após a migração.
