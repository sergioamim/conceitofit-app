# PRD - Usuario Canonico por Rede, Identidade de Login e Contexto Multiunidade

## 1. Resumo executivo

A plataforma precisa separar de forma definitiva:

- identidade de acesso;
- cadastro de dominio;
- escopo de autorizacao;
- contexto operacional de sessao.

A decisao de produto para esta fase e:

1. `Usuario` passa a ser a identidade canonica dentro de uma `Rede`.
2. `Grupo` fica fora do nucleo de autenticacao e autorizacao, servindo como agregacao gerencial e visao de leitura.
3. `Unidade` continua sendo o contexto operacional do dia a dia.
4. O app autentica no contexto da `Rede` e opera em um `tenant` ativo de sessao.
5. O mesmo email ou CPF pode existir em redes diferentes como usuarios distintos.
6. `Cliente` continua com `tenantId` estrutural no cadastro.
7. Troca definitiva de unidade-base do cliente deve ocorrer via servico administrativo explicito: `migrarClienteParaUnidade`.

Objetivo final: permitir identidade clara por rede, login contextual, operacao multiunidade controlada no app e governanca consistente entre clientes, funcionarios e usuarios administrativos.

## 2. Hierarquia de negocio

A estrutura alvo do produto fica assim:

- `Grupo`
- `Rede`
- `Unidade`

Interpretacao:

- `Grupo`: camada organizacional e gerencial. Nao e escopo operacional direto de permissao.
- `Rede`: unidade de negocio canonica para identidade, login e acessos amplos do produto.
- `Unidade`: tenant operacional, onde acontecem atendimento, contrato, frequencia, operacao e gestao local.

Decisao de linguagem:

- adotar `Rede` como termo canonico de produto;
- tratar `Academia` como sinonimo legado quando necessario em materiais antigos;
- evitar usar `Grupo` como se fosse escopo de login ou permissao operacional.

## 3. Problema

Hoje existe ambiguidade em quatro niveis.

### 3.1 Identidade

Nao esta formalizado se o ator principal do sistema e o cliente, o funcionario ou um usuario independente.

### 3.2 Fronteira de unicidade

Tambem nao esta formalizado se um mesmo email ou CPF representa:

- a mesma pessoa em toda a plataforma;
- a mesma pessoa em um grupo;
- a mesma pessoa em uma rede;
- ou identidades distintas dependendo do contexto.

### 3.3 Contexto de login

Se o mesmo identificador puder existir em redes diferentes, o sistema precisa resolver a rede antes de autenticar, recuperar senha ou carregar sessao.

### 3.4 Contexto operacional

Mesmo autenticado em uma rede, o usuario ainda precisa operar em uma unidade ativa. Esse tenant ativo de sessao nao pode ser confundido com o `tenantId` estrutural de cadastro.

## 4. Objetivo do produto

Permitir que a plataforma trate identidades e acessos com estes comportamentos:

- um usuario existe dentro de uma `Rede`;
- o mesmo identificador pode existir em redes diferentes sem conflito;
- o app e multiunidade dentro da rede, nao global;
- o cliente autentica na rede e opera em uma unidade ativa de sessao;
- o cadastro do cliente preserva um `tenantId` estrutural;
- alteracao de unidade-base do cliente ocorre por operacao administrativa explicita;
- `Funcionario`, `Cliente` e `Usuario` deixam de ser confundidos entre si.

## 5. Fora de escopo inicial

- unificar identidades entre redes diferentes;
- usar `Grupo` como escopo real de permissao;
- substituir toda a autenticacao atual em um unico big bang;
- permitir permissoes diretas por usuario como caminho principal;
- fundir `Cliente` e `Funcionario` em uma unica entidade;
- criar portal global unico para todas as redes na V1.

## 6. Principios de desenho

### 6.1 Usuario e canonico por Rede

`Usuario` e a identidade canonica de autenticacao, sessao, auditoria e autorizacao dentro de uma `Rede`.

Nao existe, por padrao, uma identidade canonica global da plataforma.

### 6.2 Grupo e agregacao gerencial

`Grupo` representa agrupamento simbolico ou societario de varias redes.

Seu papel inicial e:

- visao consolidada;
- leitura gerencial;
- governanca de nivel superior.

`Grupo` nao entra no login do app nem na autorizacao operacional base.

### 6.3 Unidade ativa e contexto de sessao

A unidade ativa nao e atributo estrutural de identidade.

Ela e contexto temporario da sessao e pode variar conforme:

- contrato vigente;
- selecao do usuario;
- regra comercial de multiunidade.

### 6.4 tenantId do Cliente e estrutural

O `Cliente` continua com `tenantId` no cadastro.

Esse campo representa a unidade-base do cliente e nao deve ser confundido com a unidade ativa de sessao.

### 6.5 Login nao deriva do dominio

O sistema nao deve inferir que:

- todo usuario com app e um `Cliente`;
- todo usuario administrativo e um `Funcionario`;
- CPF ou email sao a identidade de produto.

A identidade e o `Usuario` dentro da `Rede`. Email e CPF sao identificadores de autenticacao.

## 7. Modelo conceitual alvo

### 7.1 Usuario

`Usuario` representa a identidade canonica dentro de uma rede.

Campos conceituais minimos:

- `id`;
- `redeId`;
- `tipo` = `HUMANO` ou `SERVICE_ACCOUNT`;
- `nomeExibicao`;
- `status`;
- `identificadores de login`;
- `metadata de seguranca`;
- `timestamps`;
- `audit metadata`.

### 7.2 Identificadores de login

Um mesmo usuario pode autenticar por mais de um identificador dentro da mesma rede.

Tipos iniciais:

- `EMAIL`;
- `CPF`.

Cada identificador deve carregar:

- valor normalizado;
- valor de exibicao;
- status de verificacao;
- se e principal para backoffice;
- se e principal para app;
- data de confirmacao;
- status de bloqueio, quando aplicavel.

### 7.3 Escopos de acesso

Os escopos canônicos da autorizacao sao:

- `UNIDADE`;
- `REDE`;
- `GLOBAL`.

Interpretacao:

- `UNIDADE`: acesso local a uma unidade especifica;
- `REDE`: acesso transversal dentro da rede inteira;
- `GLOBAL`: acesso total de plataforma, excepcional e altamente sensivel.

### 7.4 Cliente

`Cliente` permanece como entidade de dominio/comercial dentro da rede.

Decisoes relevantes:

- `Cliente` mantem `tenantId` como unidade-base estrutural;
- o cliente pode ter contratos que permitam operacao em mais de uma unidade da mesma rede;
- a unidade ativa do app e contexto de sessao, nao substitui o `tenantId` estrutural do cadastro.

### 7.5 Funcionario

`Funcionario` permanece entidade de dominio operacional.

Diretriz atual:

- nasce em uma unidade/tenant;
- pode atuar em multiplos tenants da mesma rede;
- esses vinculos adicionais devem ser modelados explicitamente, e nao inferidos por permissao.

### 7.6 Grupo

`Grupo` representa agregacao de varias redes para:

- dashboards gerenciais;
- comparativos;
- leitura consolidada;
- governanca de donos e gestores corporativos.

Na V1, `Grupo` nao deve ser usado como fronteira canônica de login do app nem como escopo operacional base.

## 8. Fronteira de unicidade

A unicidade de identidade deve ser por `Rede`.

Consequencia:

- o mesmo email pode existir em duas redes diferentes como usuarios distintos;
- o mesmo CPF pode existir em duas redes diferentes como usuarios distintos;
- dentro da mesma rede, o identificador deve ser unico.

Diretriz recomendada:

- unicidade por `(rede_id, identifier_type, value_normalized)`.

Isso significa que a mesma pessoa pode ter acessos independentes em redes diferentes, inclusive com credenciais de uso separadas por contexto.

## 9. Login e recuperacao de senha

### 9.1 Login contextual por Rede

O login deve acontecer no contexto explicito da rede.

Direcao recomendada:

- rota ou dominio resolve a rede;
- o backend autentica `identifier + password` dentro daquela rede;
- o app carrega as unidades disponiveis dentro da rede autenticada.

Exemplo de UX inspirado no comportamento do EVO:

- `/acesso/{redeSlug}/autenticacao`
- `/acesso/{redeSlug}/recuperar-senha`
- `/acesso/{redeSlug}/primeiro-acesso`

### 9.2 Contrato de login

Contrato recomendado para a V1:

```json
{
  "identifier": "12345678901",
  "password": "******",
  "channel": "APP"
}
```

A `Rede` deve ser resolvida pelo contexto da URL, dominio ou subdominio.

Fallback tecnico permitido quando o canal nao carregar dominio dedicado:

```json
{
  "redeIdentifier": "rede-alpha",
  "identifier": "cliente@exemplo.com",
  "password": "******",
  "channel": "APP"
}
```

### 9.3 Recuperacao de senha

A recuperacao deve sempre acontecer no contexto da `Rede`.

Isso evita conflito quando o mesmo email ou CPF existir em redes diferentes.

## 10. Contexto do app

### 10.1 App por Rede

O app e multi-tenant dentro da rede, mas nao global.

### 10.2 Unidade ativa

A unidade ativa do app deve ser um contexto de sessao.

Ela pode ser definida por:

- unidade-base do cliente;
- unidade derivada do contrato vigente;
- selecao do usuario quando houver multiunidade permitida.

### 10.3 Regra de elegibilidade operacional

O cliente nao deve conseguir frequentar ou operar em qualquer unidade da rede por simples fato de existir nela.

A elegibilidade deve respeitar:

- contratos vigentes;
- politicas de multiunidade;
- regras comerciais da rede.

## 11. Cliente, contrato e unidade

### 11.1 tenantId estrutural do Cliente

O `Cliente.tenantId` continua existindo e representa a unidade-base do cadastro.

### 11.2 Contrato como regra de acesso multiunidade

`ClienteContrato` continua sendo a fonte de verdade para:

- status;
- vencimento;
- validade;
- elegibilidade operacional em outras unidades.

### 11.3 Unidade ativa de sessao

A unidade ativa da sessao nao deve ser persistida como substituta do `Cliente.tenantId`.

Ela e temporaria e pode mudar conforme o uso do app.

### 11.4 Migracao de cliente entre unidades

Quando a unidade-base do cliente realmente precisar mudar, a operacao correta deve ser um servico administrativo explicito:

- `migrarClienteParaUnidade`

Esse fluxo e diferente de:

- trocar unidade ativa da sessao;
- autorizar uso multiunidade por contrato;
- permitir leitura em outra unidade da mesma rede.

## 12. Cenarios que o modelo precisa suportar

### 12.1 Usuario administrativo sem Cliente e sem Funcionario

Exemplos:

- auditor;
- consultor;
- suporte;
- operador corporativo.

### 12.2 Usuario com vinculo apenas a Cliente

Exemplo:

- cliente que acessa o app.

### 12.3 Usuario com vinculo apenas a Funcionario

Exemplo:

- colaborador interno sem experiencia de app-cliente.

### 12.4 Usuario com vinculo duplo

Exemplo:

- colaborador que tambem e cliente da rede.

### 12.5 Usuario com acesso a multiplas unidades da mesma rede

Exemplo:

- cliente multiunidade ou gestor operacional com varias unidades.

### 12.6 Usuario com acesso de Rede

Exemplo:

- dono, gestor corporativo ou supervisor regional dentro de uma rede especifica.

### 12.7 Mesmo identificador em redes diferentes

Exemplo:

- a mesma pessoa usando o mesmo email em duas redes diferentes, com identidades separadas e independentes.

## 13. Regras de negocio

### 13.1 Permissao nao deriva de Cliente ou Funcionario

`Cliente` e `Funcionario` nao concedem permissao automaticamente.

Permissao continua vindo de:

- escopo;
- perfil;
- politica;
- excecao auditavel.

### 13.2 Acesso no app depende da Rede e da elegibilidade por Unidade

O login autentica a identidade na rede. A operacao concreta depende das unidades permitidas naquele momento.

### 13.3 Grupo e somente agregacao gerencial na V1

Visao de grupo pode existir para usuarios especificos, mas como leitura gerencial e consolidacao, nao como escopo operacional base.

### 13.4 Global e excepcional

`GLOBAL` deve ser restrito a poucos usuarios sistêmicos, com trilha reforcada, revisao periodica e postura de alto risco.

## 14. Requisitos funcionais

### RF-01

O sistema deve permitir criar `Usuario` sem obrigar criacao simultanea de `Cliente` ou `Funcionario`.

### RF-02

O sistema deve permitir autenticacao por `email` ou `CPF` dentro do contexto de uma `Rede`.

### RF-03

O sistema deve permitir que o mesmo email ou CPF exista em redes diferentes como identidades distintas.

### RF-04

O sistema deve manter `tenantId` no `Cliente` como unidade-base estrutural.

### RF-05

O sistema deve suportar unidade ativa de sessao no app, distinta do `tenantId` estrutural do `Cliente`.

### RF-06

O sistema deve permitir operar em multiplas unidades da mesma rede quando o contrato ou regra comercial autorizar.

### RF-07

O sistema deve oferecer um servico administrativo `migrarClienteParaUnidade` para troca definitiva da unidade-base do cliente.

### RF-08

O sistema deve permitir funcionarios com vinculos em multiplos tenants da mesma rede.

### RF-09

O sistema deve expor escopos `UNIDADE`, `REDE` e `GLOBAL` de forma clara na leitura administrativa.

## 15. Requisitos nao funcionais

- unicidade forte por rede e identificador normalizado;
- protecao de CPF como dado sensivel;
- compatibilidade gradual com os fluxos atuais;
- suporte a rollout por feature flag;
- coerencia entre sessao ativa e contexto de tenant;
- trilha de auditoria nas mutacoes sensiveis de identidade e acesso.

## 16. Riscos

### 16.1 Misturar tenant estrutural com tenant ativo de sessao

Isso pode corromper a semantica do cadastro do cliente.

### 16.2 Duplicar clientes para resolver troca de unidade

Isso degrada historico, contratos e a experiencia de rede.

### 16.3 Tentar usar Grupo como fronteira primaria de autenticacao cedo demais

Isso tende a misturar camada gerencial com camada operacional.

### 16.4 Permitir acesso amplo silencioso dentro da Rede

Acesso de `REDE` precisa continuar visivel, auditavel e excepcionalmente claro.

## 17. Rollout sugerido

1. Formalizar `Usuario` como identidade canonica por rede.
2. Introduzir identificadores de login independentes da entidade de dominio.
3. Manter `Cliente.tenantId` como unidade-base estrutural.
4. Explicitar a unidade ativa de sessao no app.
5. Permitir login contextual por rede.
6. Evoluir escopos para `UNIDADE`, `REDE` e `GLOBAL`.
7. Criar o fluxo administrativo `migrarClienteParaUnidade`.
8. Fechar a camada de leitura gerencial por grupo sem acoplar auth ao grupo.

## 18. Criterios de aceite

- e possivel autenticar por email ou CPF dentro de uma rede;
- o mesmo identificador pode existir em redes diferentes sem conflito;
- o cliente continua com `tenantId` estrutural;
- a unidade ativa do app e contexto de sessao;
- a troca definitiva de unidade-base do cliente ocorre por `migrarClienteParaUnidade`;
- usuarios de rede e usuarios globais aparecem com escopo explicito e auditavel;
- grupo permanece como agregacao gerencial, e nao como escopo operacional base.
