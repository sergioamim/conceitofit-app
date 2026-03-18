# PRD - Eventos de Atividade com Ingresso/Serviço Vinculado

## 1. Resumo
- Objetivo: permitir que a academia monetize eventos extras ligados a uma atividade, cobrando um valor para reservar a vaga.
- Exemplo: `Corrida de Rua`, `Aulão Solidário`, `Workshop de Mobilidade`, `Desafio de Bike`, `Torneio interno`.
- Direção principal: reutilizar o domínio existente de `Atividade`, `ReservaAula`, `Servico` e `Pagamento`, evitando criar um módulo financeiro paralelo só para eventos.

## 2. Por que essa ideia faz sentido
- A academia já organiza eventos fora da rotina recorrente e hoje tende a controlar isso em planilhas, grupos de WhatsApp ou cobrança manual.
- O produto já possui:
  - atividades e grade operacional;
  - reservas com capacidade e lista de espera;
  - catálogo de serviços;
  - pagamentos e vendas.
- Isso cria um encaixe natural para um incremento de receita com baixo atrito operacional.

## 3. Hipótese de negócio
- Se o sistema permitir publicar eventos especiais com reserva condicionada a um serviço pago, a academia consegue:
  - monetizar experiências extras sem criar um plano novo;
  - organizar capacidade e lista de espera com mais controle;
  - formalizar cobrança, presença e ocupação;
  - testar novos formatos de receita com risco baixo.

## 4. Problema a resolver
- Hoje `Atividade` e `Grade` cobrem bem a operação recorrente, mas não representam bem eventos pontuais com cobrança específica.
- `Serviço` já existe, mas não está conectado diretamente à necessidade de “comprar um ingresso para reservar”.
- O fluxo de reservas atual foi desenhado para sessões de aula, não para eventos com pagamento obrigatório.

## 5. Proposta de produto

### 5.1 Conceito
- Introduzir o conceito de `Evento de Atividade`.
- Um evento é uma ocorrência especial vinculada a uma `Atividade` existente, com regras próprias de data, capacidade, reserva e eventual cobrança.
- A cobrança deve ser feita por meio de um `Serviço` já cadastrado, ou selecionado no momento da configuração do evento.

### 5.2 Regra central
- Quando o evento estiver configurado com `exigeIngresso=true`, a reserva só é confirmada se houver vínculo com um `Serviço` elegível.
- O serviço funciona como o “ingresso” do evento.

### 5.3 UX administrativa sugerida
- Na criação/edição do evento, incluir:
  - `Atividade base`
  - `Nome do evento`
  - `Descrição`
  - `Data`
  - `Horário`
  - `Capacidade`
  - `Permite lista de espera`
  - `Exige ingresso`
  - `Serviço vinculado`
  - `Valor exibido`
  - `Publicar no app/portal`
- Ao ativar `Exige ingresso`, abrir uma busca de serviços:
  - pesquisar por nome/SKU/categoria;
  - selecionar um serviço já existente;
  - opcionalmente criar um novo serviço sem sair do fluxo no futuro.
- O vínculo recomendado é:
  - `Serviço obrigatório para reservar`
  - não `valor solto` digitado direto no evento.

## 6. Recomendação de modelagem

### 6.1 O que eu recomendo
- Não sobrecarregar `Atividade` com todos os campos de evento.
- Criar uma camada específica para `Evento de Atividade` ou `Sessão Especial`, vinculada a:
  - `atividadeId`
  - opcionalmente `atividadeGradeId`
  - `servicoIngressoId`

### 6.2 Motivo
- `Atividade` representa a modalidade.
- `Grade` representa a recorrência operacional.
- `Evento` representa a exceção comercial/operacional.
- Misturar tudo dentro de `Atividade` tende a poluir o cadastro base e dificultar filtros, relatórios e integrações.

### 6.3 Campos mínimos sugeridos para `EventoAtividade`
- `id`
- `tenantId`
- `atividadeId`
- `atividadeGradeId?`
- `nome`
- `descricao?`
- `tipoEvento`: `PONTUAL | SERIE_LIMITADA`
- `dataInicio`
- `dataFim?`
- `horaInicio`
- `horaFim`
- `capacidade`
- `waitlistHabilitada`
- `exigeIngresso`
- `servicoIngressoId?`
- `valorIngressoSnapshot?`
- `publicado`
- `status`: `RASCUNHO | PUBLICADO | ESGOTADO | ENCERRADO | CANCELADO`

### 6.4 Campos mínimos sugeridos para a reserva do evento
- `eventoId`
- `alunoId`
- `statusReserva`: `PENDENTE_PAGAMENTO | CONFIRMADA | LISTA_ESPERA | CANCELADA | CHECKIN`
- `vendaId?`
- `pagamentoId?`
- `servicoIngressoId?`
- `origem`

## 7. Regras de negócio

### 7.1 Reserva sem ingresso
- Se `exigeIngresso=false`, o fluxo se comporta como reserva de aula especial.
- Reserva pode ser confirmada diretamente, respeitando capacidade e lista de espera.

### 7.2 Reserva com ingresso obrigatório
- Se `exigeIngresso=true`, a reserva não deve ir direto para `CONFIRMADA` sem lastro comercial.
- Fluxo recomendado:
  1. operador ou cliente tenta reservar;
  2. sistema valida se existe venda/pagamento elegível para o `servicoIngressoId`;
  3. se não existir, cria jornada de compra/cobrança;
  4. reserva fica `PENDENTE_PAGAMENTO` ou redireciona para checkout;
  5. após pagamento confirmado, reserva vira `CONFIRMADA`.

### 7.3 Capacidade
- `PENDENTE_PAGAMENTO` não deve segurar vaga por tempo indefinido.
- Recomenda-se TTL de reserva pendente:
  - ex.: 10 a 20 minutos no fluxo online;
  - no backoffice, permitir override manual.

### 7.4 Lista de espera
- Se houver lista de espera:
  - participantes pagos/confirmados ocupam primeiro;
  - vaga liberada pode promover o próximo da fila;
  - se o evento exigir ingresso, a promoção deve respeitar regra comercial.

### 7.5 Cancelamento
- Cancelar a reserva não implica necessariamente estorno automático.
- Estorno/recrédito deve seguir política da academia.
- No MVP, separar:
  - cancelamento operacional da vaga;
  - decisão financeira manual.

## 8. Fluxos principais

### 8.1 Backoffice cria evento pago
1. Acessa `Atividade` ou `Eventos`.
2. Cria evento especial vinculado a uma atividade.
3. Marca `Exige ingresso`.
4. Sistema abre pesquisa de `Serviços`.
5. Operador seleciona o serviço que representa o ingresso.
6. Publica o evento.

### 8.2 Cliente reserva evento pago
1. Cliente acessa evento publicado.
2. Clica em reservar.
3. Sistema verifica elegibilidade/pagamento.
4. Se não houver ingresso pago:
   - abre checkout do serviço; ou
   - gera pendência de pagamento.
5. Após pagamento confirmado, reserva vira `CONFIRMADA`.

### 8.3 Operador reserva para o aluno no backoffice
1. Seleciona evento e aluno.
2. Sistema verifica se já existe ingresso elegível.
3. Se não existir, oferece:
   - `Criar cobrança`
   - `Registrar como cortesia`
   - `Reservar sem cobrança` apenas se perfil/permissão permitir.

## 9. Superfícies de UI recomendadas

### 9.1 MVP mais seguro
- Nova página administrativa:
  - `/administrativo/eventos-atividade`
- Motivo:
  - evita poluir a tela atual de `Atividades` com conceitos de recorrência e evento no mesmo formulário;
  - permite rollout gradual.

### 9.2 Integrações de UI
- Tela de atividade:
  - CTA secundário `Criar evento`.
- Tela de reservas:
  - aba ou filtro `Eventos`.
- Tela de pagamentos/vendas:
  - indicação de que o pagamento está vinculado a um evento.
- Detalhe do cliente:
  - histórico de eventos reservados/comprados.

## 10. Integração com serviços

### 10.1 Regra recomendada para o serviço vinculado
- Reaproveitar `Servico` existente em vez de criar entidade `Ingresso` separada no MVP.
- Adicionar metadados de elegibilidade no backend no futuro, por exemplo:
  - `tipoUso: EVENTO_ATIVIDADE`
  - `agendavel: false`
  - `permiteVoucher`
  - `validadeDias`

### 10.2 Busca de serviços no formulário
- Quando `Exige ingresso` for ativado:
  - abrir pesquisa assíncrona de serviços ativos;
  - filtrar por categoria ou flag compatível no futuro;
  - persistir `servicoIngressoId` e um snapshot do valor/descrição para auditoria visual.

## 11. Incremento recomendado

### Fase 1 - MVP operacional pago no backoffice
- Criar `Evento de Atividade` administrativo.
- Permitir vincular um `Serviço` como ingresso.
- Permitir reserva no backoffice com:
  - validação de ingresso existente; ou
  - geração manual de cobrança/pagamento.
- Sem automação completa de checkout no app.

### Fase 2 - Jornada integrada de compra + reserva
- Cliente consegue reservar e pagar no mesmo fluxo.
- Introduzir `PENDENTE_PAGAMENTO` com expiração.
- Confirmação automática da vaga após pagamento.

### Fase 3 - Evolução comercial
- Cupons/lotes promocionais.
- Cortesias e convidados extras.
- Check-in por QR Code.
- Relatórios por evento:
  - inscritos;
  - pagos;
  - presentes;
  - receita;
  - taxa de ocupação.

## 12. Não objetivos do MVP
- Marketplace público completo de eventos.
- Estorno financeiro automático com regras complexas.
- Multi-ingresso por reserva.
- Assentos numerados.
- Combos e kits com produto + evento no mesmo fluxo.

## 13. Dependências técnicas já existentes no frontend
- `Atividade` e `AtividadeGrade` em `src/lib/types.ts`
- `AulaSessao` e `ReservaAula` em `src/lib/types.ts`
- catálogo de `Servico` em `src/lib/types.ts`
- APIs de serviços em `src/lib/api/comercial-catalogo.ts`
- APIs de reservas em `src/lib/api/reservas.ts`
- telas de reservas em `src/app/(app)/reservas/page.tsx`

## 14. Riscos
- Misturar evento pago com aula recorrente no mesmo modelo pode gerar regressão operacional.
- Confirmar vaga antes do pagamento pode criar overbooking.
- Acoplar demais ao serviço sem distinguir contexto de evento pode gerar ruído em catálogo e relatórios.
- Política de cancelamento e estorno precisa ser explícita para não gerar conflito com recepção/financeiro.

## 15. Decisões recomendadas
- Preferir `Evento de Atividade` como entidade nova, não um toggle escondido em `Atividade`.
- Preferir `Serviço vinculado` como ingresso no MVP.
- Preferir rollout começando pelo backoffice antes do app do cliente.
- Separar claramente:
  - `reserva operacional`
  - `confirmação comercial`
  - `presença/check-in`

## 16. Open questions
- A academia poderá vender mais de um ingresso por aluno para convidados?
- O ingresso precisa ser nominal ou pode ser transferível?
- O evento aceita alunos sem matrícula ativa?
- O pagamento obrigatório deve ser via `Venda`, `Pagamento avulso` ou ambos?
- Haverá política de cortesia por perfil/permissão?
- O serviço do ingresso precisa gerar NFSe?

## 17. Opinião de produto
- A ideia é forte.
- O melhor caminho não é transformar toda atividade em item cobrável, e sim criar uma camada de `evento especial` vinculada a uma atividade.
- Isso preserva o modelo atual de aulas e reservas e abre um trilho novo de monetização com risco controlado.
