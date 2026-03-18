# PRD - Exclusao Controlada de Cliente no Perfil

## 1. Resumo executivo

Adicionar a acao `Excluir cliente` no menu de 3 pontinhos do perfil do cliente, com governanca forte:

- visivel e executavel apenas para perfil `Alto`;
- justificativa obrigatoria;
- confirmacao explicita em modal;
- trilha de auditoria obrigatoria;
- validacao backend para impedir exclusao indevida.

O objetivo nao e apenas expor um botao novo. O objetivo e permitir uma acao destrutiva controlada, com baixo risco operacional e alta rastreabilidade.

## 2. Contexto atual

O frontend ja possui o menu de acoes do perfil do cliente em `src/components/shared/cliente-header.tsx`, hoje com acoes como `Suspender` e `Reativar`.

O detalhe do cliente em `src/app/(app)/clientes/[id]/page.tsx` ja possui um padrao de acao sensivel com justificativa obrigatoria para `Liberar acesso (catraca)`, usando modal dedicado e envio de `justificativa`.

Apesar disso, ainda nao existe no frontend:

- acao de exclusao de cliente no perfil;
- capacidade/RBAC especifica para exclusao de cliente;
- endpoint de exclusao em `src/lib/api/alunos.ts`;
- service correspondente em `src/lib/comercial/runtime.ts`;
- modelo de resposta para auditoria dessa acao;
- feedback de bloqueio quando o cliente nao puder ser excluido.

## 3. Problema

Hoje a operacao nao consegue excluir um cliente direto do perfil quando houver erro cadastral, duplicidade ou criacao indevida. Ao mesmo tempo, liberar exclusao sem guardrails criaria risco alto:

- remocao de historico relevante;
- perda de rastreabilidade;
- exclusoes por perfis operacionais sem autoridade suficiente;
- divergencia entre frontend e backend sobre quem pode excluir e em quais condicoes.

## 4. Objetivo do produto

Permitir que usuarios com perfil `Alto` executem a exclusao de cliente a partir do perfil do cliente, com justificativa obrigatoria e auditoria completa, sem abrir brecha para que perfis operacionais ou fluxos client-side contornem a governanca.

## 5. Fora de escopo

- exclusao em massa de clientes;
- restauracao de cliente excluido na V1;
- exclusao iniciada por listagem ou outras telas;
- exclusao parcial de historico financeiro, presencas, contratos ou documentos;
- implementacao frontend-only sem enforcement no backend.

## 6. Principios de desenho

### 6.1 Backend como fonte de verdade

O frontend pode esconder ou desabilitar a acao para quem nao tem permissao, mas a autorizacao final precisa ser feita no backend.

### 6.2 Acao destrutiva com friccao adequada

Excluir cliente exige mais friccao do que suspender ou editar:

- CTA em menu secundario;
- modal de confirmacao;
- justificativa obrigatoria;
- bloqueio quando houver dependencias impeditivas.

### 6.3 Auditoria obrigatoria

Toda tentativa relevante precisa ser rastreavel, inclusive falha por falta de permissao ou por regra de negocio impeditiva.

## 7. Requisitos funcionais

### 7.1 Descoberta da acao

No perfil do cliente, o menu de 3 pontinhos deve passar a exibir `Excluir cliente` abaixo das demais acoes.

### 7.2 Regra de visibilidade

O item deve aparecer apenas quando a sessao atual tiver capacidade explicita para exclusao de cliente.

Recomendacao de contrato:

- expor capability booleana no bootstrap/me, por exemplo `canDeleteClient`;
- evitar inferir isso apenas por `role.includes("ADMIN")`, porque o pedido funcional fala em perfil `Alto`, nao em qualquer papel administrativo.

### 7.3 Fluxo de confirmacao

Ao clicar em `Excluir cliente`, abrir modal com:

- nome do cliente;
- alerta de irreversibilidade no frontend;
- campo `Justificativa` obrigatorio;
- contador de caracteres;
- botoes `Cancelar` e `Excluir cliente`.

O botao de confirmacao deve permanecer desabilitado sem justificativa valida.

### 7.4 Envio da exclusao

Ao confirmar, o frontend deve chamar um endpoint dedicado de exclusao de cliente, enviando:

- `tenantId`;
- `alunoId`;
- `justificativa`;
- metadados de origem, por exemplo `issuedBy: "frontend"`.

### 7.5 Comportamento de sucesso

Em caso de sucesso:

- fechar o modal;
- exibir feedback de sucesso;
- redirecionar para `/clientes`;
- remover o cliente da experiencia atual sem exigir refresh manual.

### 7.6 Comportamento de erro

Em caso de erro:

- manter o modal aberto quando fizer sentido;
- exibir mensagem de erro normalizada;
- diferenciar `403` de permissao e `409` de bloqueio por regra de negocio;
- mostrar motivo de bloqueio quando o backend retornar dependencias impeditivas.

## 8. RBAC e seguranca

### 8.1 Perfil autorizado

Somente perfil `Alto` pode excluir cliente.

Como o frontend atual ainda nao possui um conceito explicito de `perfil Alto`, sera necessario evoluir a sessao para expor essa informacao de forma confiavel. Duas opcoes validas:

1. capability booleana `canDeleteClient`;
2. role/perfil canonico claramente mapeado para `ALTO`.

A opcao recomendada e capability dedicada, porque desacopla a UI do nome textual do perfil.

### 8.2 Enforcement

O backend deve negar a operacao para qualquer sessao sem a permissao exigida, mesmo que o frontend tente disparar a chamada manualmente.

### 8.3 Regras impeditivas recomendadas

O backend deve decidir se a exclusao sera permitida. Como baseline de governanca, o PRD recomenda bloquear exclusao quando houver historico operacional que nao pode ser perdido, como:

- matriculas;
- pagamentos;
- presencas;
- NFS-e emitida;
- vinculacoes obrigatorias de compliance.

Quando houver bloqueio, o sistema pode orientar o operador a usar `Cancelar`/`Inativar` em vez de excluir.

## 9. Auditoria

### 9.1 Evento obrigatorio

Toda exclusao bem-sucedida deve gerar evento de auditoria.

Nome recomendado do evento:

- `CLIENTE_EXCLUIDO`

Payload minimo recomendado:

- `eventType`;
- `tenantId`;
- `alunoId`;
- `alunoNome`;
- `justificativa`;
- `executadoPorUsuarioId`;
- `executadoPorEmail` ou `executadoPorNome`;
- `perfilEfetivo`;
- `origem = frontend`;
- `timestamp`;
- `requestId` ou `auditId`.

### 9.2 Eventos de tentativa negada

Tambem e recomendado auditar tentativas negadas:

- `CLIENTE_EXCLUSAO_NEGADA_SEM_PERMISSAO`;
- `CLIENTE_EXCLUSAO_NEGADA_POR_REGRA`.

Isso ajuda a identificar mau uso, gaps de treinamento e tentativas de bypass.

## 10. Contrato tecnico esperado

### 10.1 Endpoint

Criar endpoint dedicado, em vez de reaproveitar `PUT /alunos/{id}` com status:

- `DELETE /api/v1/comercial/alunos/{id}`

ou, se o backend quiser explicitar a natureza governada:

- `POST /api/v1/comercial/alunos/{id}/excluir`

O importante e o contrato aceitar corpo ou parametros suficientes para justificar e auditar a acao.

### 10.2 Request

Exemplo recomendado:

```json
{
  "tenantId": "uuid",
  "justificativa": "Cadastro duplicado criado por engano durante atendimento.",
  "issuedBy": "frontend"
}
```

### 10.3 Response

Resposta recomendada:

```json
{
  "success": true,
  "auditId": "uuid",
  "eventType": "CLIENTE_EXCLUIDO"
}
```

### 10.4 Erros esperados

- `403` quando a sessao nao tiver permissao;
- `404` quando o cliente nao existir no tenant;
- `409` quando houver impeditivo de negocio para exclusao;
- `422` quando a justificativa estiver vazia ou invalida.

## 11. Alteracoes necessarias no frontend

### 11.1 Sessao e permissao

Evoluir o estado exposto por `src/hooks/use-session-context.tsx` para incluir uma capability explicita de exclusao de cliente, derivada do bootstrap/me.

### 11.2 Componente do header

Evoluir `src/components/shared/cliente-header.tsx` para:

- aceitar prop de permissao para exclusao;
- aceitar callback `onExcluir`;
- renderizar a entrada `Excluir cliente` no menu de 3 pontinhos;
- manter a arvore SSR estavel, sem depender de estado client-only para decidir estrutura inicial.

### 11.3 Pagina de detalhe

Evoluir `src/app/(app)/clientes/[id]/page.tsx` para:

- controlar o modal de exclusao;
- capturar justificativa;
- chamar o novo service;
- tratar loading, sucesso e erro;
- redirecionar para `/clientes` quando a exclusao concluir.

### 11.4 Camada API/service

Adicionar na camada frontend:

- client em `src/lib/api/alunos.ts`;
- service em `src/lib/comercial/runtime.ts`;
- tipos auxiliares em `src/lib/types.ts` se o backend responder `auditId`, `eventType` ou payload de bloqueio.

### 11.5 Tela de cartoes

`src/app/(app)/clientes/[id]/cartoes/page.tsx` reutiliza `ClienteHeader`. O novo contrato de props deve manter compatibilidade para essa tela tambem, inclusive escondendo a acao quando nao aplicavel.

## 12. UX proposta

1. Usuario abre perfil do cliente.
2. Abre menu de 3 pontinhos.
3. Visualiza `Excluir cliente` apenas se tiver perfil `Alto`.
4. Clica na acao.
5. Modal exige justificativa.
6. Ao confirmar, frontend envia request ao backend.
7. Backend valida permissao e regras de negocio.
8. Backend registra auditoria.
9. Frontend exibe sucesso e redireciona para a listagem.

## 13. Criterios de aceite

- O menu do perfil do cliente exibe `Excluir cliente` apenas para perfil `Alto`.
- A acao exige justificativa obrigatoria antes de enviar.
- O frontend nao consegue concluir a operacao sem endpoint dedicado.
- O backend impede exclusao sem permissao, mesmo com chamada manual.
- O backend registra evento de auditoria para sucesso.
- O frontend trata `403`, `409` e `422` com mensagens adequadas.
- O usuario e redirecionado para `/clientes` apos sucesso.
- A tela de cartoes continua funcionando com o `ClienteHeader` atualizado.

## 14. Dependencias de backend

Este item nao pode ser considerado concluido apenas no frontend. A entrega completa depende de:

- capability ou role canonica exposta pela sessao;
- endpoint de exclusao de cliente;
- regra de negocio para permitidos vs bloqueados;
- emissao de evento de auditoria;
- retorno consistente de erros e `auditId`.

## 15. Diretriz para o Task Master

Ao adicionar este PRD ao backlog atual, gerar 1 unico epico top-level focado em `Exclusao controlada de cliente no perfil`, quebrado em subtasks para:

1. contrato/RBAC;
2. UX e modal de justificativa;
3. integracao API/service;
4. auditoria e tratamento de erros;
5. testes e regressao.
