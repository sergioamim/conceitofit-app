# PRD - Ocorrências Sob Demanda para Atividades

## 1. Resumo
- Objetivo: transformar `SOB_DEMANDA` em um modo de catálogo para gerar ocorrências avulsas, sem tratar essas atividades como slots recorrentes da grade semanal.
- Exemplo: `Corrida de Rua`, `Aulão especial`, `Treino outdoor`, `Evento sazonal`, `Aula extra de feriado`.
- Direção principal: separar com clareza três conceitos:
  - `Atividade`: modalidade base;
  - `Grade`: recorrência operacional previsível;
  - `Ocorrência`: sessão avulsa criada a partir de uma atividade ou grade `SOB_DEMANDA`.

## 2. Problema

Hoje a aplicação já distingue `PREVIAMENTE` e `SOB_DEMANDA` no cadastro de `AtividadeGrade`, mas o comportamento ainda está incompleto:

- `PREVIAMENTE` entra na grade semanal e alimenta a agenda normalmente;
- `SOB_DEMANDA` fica cadastrado, mas não possui fluxo explícito para gerar uma sessão real;
- a tela de `Reservas` depende de sessões já existentes vindas do backend;
- a UI atual não oferece "criar ocorrência" manual a partir de uma atividade `SOB_DEMANDA`.

Resultado:

- o operador consegue configurar uma atividade como `SOB_DEMANDA`;
- mas não consegue transformá-la em ocorrência concreta para uma data específica;
- o conceito de produto fica ambíguo entre "uso único", "evento esporádico" e "atividade recorrente".

## 3. Modelo mental proposto

### 3.1 `PREVIAMENTE`
- representa recorrência fixa;
- exige dia e horário previsíveis;
- aparece na grade semanal;
- pode gerar sessões a partir da recorrência.

### 3.2 `SOB_DEMANDA`
- representa atividade sem agenda fixa;
- não deve aparecer como slot recorrente da grade semanal;
- funciona como "catálogo habilitado" para criar ocorrências avulsas;
- pode ser usada tanto para evento único quanto para evento esporádico recorrente de forma não fixa.

### 3.3 `Ocorrência`
- é a sessão concreta que acontece em uma data específica;
- tem data, hora, capacidade, local, instrutor e regras de reserva/check-in;
- pode nascer de:
  - uma grade `PREVIAMENTE`, de forma recorrente;
  - uma grade `SOB_DEMANDA`, por ação manual do operador.

## 4. Decisão de produto

`SOB_DEMANDA` não deve significar "uso único".

`SOB_DEMANDA` deve significar:

- sem recorrência fixa na grade;
- com possibilidade de gerar quantas ocorrências avulsas forem necessárias.

Isso cobre:

- evento único;
- evento esporádico;
- atividade eventual que depende de decisão operacional.

## 5. Proposta funcional

### 5.1 Cadastro de grade
- manter o cadastro de `AtividadeGrade` com `definicaoHorario = SOB_DEMANDA`;
- essa configuração passa a ser elegível para criação de ocorrências avulsas;
- a grade deixa de ser tratada como a própria sessão.

### 5.2 Nova ação administrativa
- adicionar ação `Criar ocorrência` para itens `SOB_DEMANDA`;
- essa ação deve abrir um fluxo/modal com:
  - data da ocorrência;
  - hora início;
  - hora fim;
  - capacidade;
  - sala;
  - instrutor;
  - flags operacionais e de reserva herdadas/ajustáveis;
  - observações opcionais.

### 5.3 Sessão gerada
- ao confirmar, o sistema cria uma sessão real da agenda;
- essa sessão passa a aparecer em `Reservas`;
- essa sessão pode ser reservada pelo backoffice e pelo portal/app, conforme flags de exposição.

### 5.4 Grade semanal
- a grade semanal continua exibindo apenas `PREVIAMENTE`;
- `SOB_DEMANDA` não ocupa slot fixo na matriz semanal;
- ocorrências geradas manualmente podem aparecer:
  - na agenda de reservas;
  - no mural/app/portal quando publicadas;
  - em uma listagem administrativa de ocorrências futuras/passadas.

## 6. Superfícies de frontend sugeridas

### 6.1 `Atividades - Grade`
- manter a listagem atual;
- para registros `SOB_DEMANDA`, trocar a expectativa de "horário recorrente" por "catálogo de ocorrências";
- incluir CTA por linha:
  - `Criar ocorrência`;
  - opcionalmente `Ver ocorrências`.

### 6.2 `Reservas`
- continuar consumindo sessões concretas;
- não listar diretamente grades `SOB_DEMANDA` sem ocorrência;
- ao criar uma ocorrência, ela deve surgir na agenda via backend.

### 6.3 Futuro opcional
- página própria:
  - `/administrativo/atividades-ocorrencias`
- útil para histórico, filtros, cancelamento e duplicação de ocorrências.

## 7. Contrato esperado com backend

O backend precisa suportar explicitamente a criação de ocorrência avulsa.

Alternativas aceitáveis:

1. Novo endpoint de criação de sessão sob demanda
- exemplo conceitual:
  - `POST /api/v1/agenda/aulas/sessoes`
  - ou `POST /api/v1/administrativo/atividades-grade/{id}/ocorrencias`

2. Reaproveitamento de endpoint existente com contrato expandido
- desde que o contrato deixe claro:
  - origem em grade `SOB_DEMANDA`;
  - override de data/horário/capacidade/local/instrutor;
  - retorno da sessão criada.

## 8. Regras de negócio

1. `PREVIAMENTE` continua sendo recorrência.
2. `SOB_DEMANDA` não entra na matriz semanal como slot fixo.
3. Sessão sob demanda só existe após criação explícita de ocorrência.
4. Reservas só podem acontecer em sessões concretas.
5. Check-in e waitlist continuam operando sobre a sessão, não sobre a grade.
6. Deve existir rastreabilidade entre a sessão criada e a grade/origem que a gerou.

## 9. Critérios de aceite

1. Operador consegue criar uma ocorrência avulsa a partir de uma grade `SOB_DEMANDA`.
2. A ocorrência criada aparece na agenda de reservas.
3. `PREVIAMENTE` continua funcionando como hoje na grade semanal.
4. `SOB_DEMANDA` deixa de parecer "cadastro incompleto" e passa a ter um fluxo operacional claro.
5. Frontend e backend usam o mesmo modelo mental: grade recorrente vs ocorrência concreta.

## 10. Sequência recomendada

1. Fechar contrato backend para criação/listagem de ocorrências sob demanda.
2. Adaptar types e clients no frontend.
3. Implementar CTA e modal de criação de ocorrência na tela de `Atividades - Grade`.
4. Integrar a agenda de reservas ao novo fluxo.
5. Cobrir com testes e documentação operacional.
