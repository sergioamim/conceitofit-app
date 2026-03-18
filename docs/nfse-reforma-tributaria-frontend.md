# NFSe no Frontend - Reforma Tributária

## Escopo

O frontend passou a exigir e exibir os campos fiscais da reforma tributária na configuração da unidade:

- `codigoTributacaoNacional`
- `codigoNbs`
- `classificacaoTributaria`
- `consumidorFinal`
- `indicadorOperacao`

Esses campos ficam em `/administrativo/nfse` e influenciam diretamente a emissão individual e em lote.

## Fluxo operacional

1. Abrir `/administrativo/nfse`.
2. Preencher cadastro fiscal básico, reforma tributária, parâmetros de RPS e integração.
3. Salvar a configuração.
4. Validar a configuração antes de tentar emitir NFSe em `Recebimentos` ou `Pagamentos`.

Enquanto o status não for `Configurada`, o frontend passa a exibir bloqueio fiscal nas superfícies operacionais.

## Superfícies impactadas

- `/administrativo/nfse`
- `/pagamentos`
- `/pagamentos/emitir-em-lote`
- `/gerencial/recebimentos`
- `/clientes/[id]`

## Contratos usados pelo frontend

### Configuração fiscal

- `GET /api/v1/administrativo/nfse/configuracao-atual`
- `PUT /api/v1/administrativo/nfse/configuracao-atual`
- `POST /api/v1/administrativo/nfse/configuracao-atual/validar`

Payload mínimo esperado pelo frontend:

- `prefeitura`
- `inscricaoMunicipal`
- `cnaePrincipal`
- `codigoTributacaoNacional`
- `codigoNbs`
- `classificacaoTributaria`
- `consumidorFinal`
- `indicadorOperacao`
- `serieRps`
- `loteInicial`
- `aliquotaPadrao`
- `provedor`
- `ambiente`
- `regimeTributario`
- `emissaoAutomatica`

### Emissão fiscal

- `POST /api/v1/comercial/pagamentos/:id/nfse`
- `POST /api/v1/comercial/pagamentos/nfse/lote`

Comportamento esperado:

- `200/201`: NFSe emitida e pagamento atualizado com `nfseEmitida`, `nfseNumero` e `dataEmissaoNfse`.
- `400/409/422`: bloqueio fiscal com mensagem acionável, preferencialmente usando `fieldErrors`.
- `404`: ambiente ainda sem suporte real de emissão.

## Smoke/E2E

Cobertura mínima:

- salvar configuração fiscal com os novos campos;
- bloquear salvamento local quando faltarem campos obrigatórios;
- validar configuração com sucesso;
- bloquear emissão em lote quando a configuração voltar para `PENDENTE`;
- manter fluxo feliz de emissão individual.

## Critérios de aceite

- operadores conseguem identificar campos faltantes antes de chamar o backend;
- telas operacionais não deixam a emissão seguir silenciosamente quando a unidade está pendente;
- a aba NFS-e do cliente diferencia emissão concluída de pendência ou bloqueio;
- mensagens do backend fiscal aparecem sem serem mascaradas por textos genéricos.

## Riscos residuais

- o backend pode devolver valores novos para `classificacaoTributaria` e `indicadorOperacao`; o frontend aceita strings adicionais, mas a UX só rotula explicitamente os valores conhecidos;
- durante rollout parcial, algumas unidades podem ter configuração antiga sem os novos campos e permanecerão bloqueadas até validação;
- mensagens fiscais dependem de `message` e `fieldErrors`; se o backend devolver payload inconsistente, o frontend cairá no texto de erro normalizado.
