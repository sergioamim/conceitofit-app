# Task ID: 516

**Title:** E2E test — Fluxo completo de inbox de atendimento

**Status:** done

**Dependencies:** 508

**Priority:** medium

**Description:** Criar teste Playwright cobrindo o fluxo completo: abrir inbox → selecionar conversa → ver thread → enviar mensagem → verificar envio.

**Details:**

Criar `tests/e2e/atendimento-inbox.spec.ts`:

**Cenário 1: Listar e selecionar conversa**
1. Login com usuário com acesso ao tenant.
2. Navegar para `/atendimento/inbox`.
3. Verificar que lista de conversas carrega.
4. Clicar em uma conversa.
5. Verificar que navega para `/atendimento/inbox/{id}`.

**Cenário 2: Ver thread de mensagens**
1. Na página de detalhe, verificar que thread de mensagens carrega.
2. Verificar que mensagens estão ordenadas (mais antigas no topo).
3. Verificar que ConversationHeader mostra nome e status.
4. Verificar que ContactCard mostra dados do contato.

**Cenário 3: Enviar mensagem**
1. Digitar mensagem no MessageInput.
2. Clicar "Enviar".
3. Verificar que mensagem aparece no thread.
4. Verificar que input é limpo após envio.
5. Verificar toast de sucesso.

**Cenário 4: Mudar status da conversa**
1. Clicar no status badge.
2. Selecionar "Encerrada".
3. Verificar toast de sucesso.
4. Verificar que badge atualiza.

**Cenário 5: Filtros**
1. Aplicar filtro de status.
2. Verificar que lista filtra corretamente.
3. Limpar filtro → verificar que lista restaura.

**Configuração:**
- Usar `BACKEND_PROXY_TARGET=http://localhost:8080` para testes com backend real.
- Seed de dados: garantir que existam conversas e mensagens no banco de teste.

**Test Strategy:**

Executar `npx playwright test tests/e2e/atendimento-inbox.spec.ts --project=chromium`. Todos os cenários devem passar.
