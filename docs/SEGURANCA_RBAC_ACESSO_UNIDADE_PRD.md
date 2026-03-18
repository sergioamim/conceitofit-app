# PRD - Seguranca, Acesso por Unidade e RBAC

## 1. Resumo executivo

O produto ja tem base tecnica para controle de acesso multiunidade e RBAC, mas a experiencia atual ainda expõe conceitos internos demais para o operador:

- acesso por unidade;
- membership;
- perfil;
- grant por feature;
- politica de novas unidades;
- auditoria.

Hoje esses conceitos aparecem fragmentados e com vocabulario tecnico, o que aumenta risco operacional e reduz confianca de quem administra acessos.

Este PRD propoe reorganizar a area de seguranca em torno de um modelo mental mais simples:

1. Quem e a pessoa.
2. Em quais unidades ela atua.
3. Qual perfil ela tem em cada unidade.
4. O que esse perfil permite fazer.
5. Quais excecoes foram abertas e por que.

Objetivo final: permitir que um gestor nao tecnico consiga conceder, revisar, restringir e auditar acessos com seguranca, previsibilidade e baixo risco de erro.

## 2. Contexto e diagnostico

### 2.1 Estado atual no frontend

Leitura das telas atuais indica tres problemas principais.

#### A. A tela de acesso por unidade concede acesso via perfil implicito

Em [src/app/(app)/seguranca/acesso-unidade/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(app)/seguranca/acesso-unidade/page.tsx#L57) o acesso e concedido com um `defaultPerfil` inferido automaticamente. Isso simplifica tecnicamente, mas oculta a decisao mais importante para o operador: qual papel esta sendo dado ao usuario e com qual alcance.

Efeito pratico:

- o operador pode achar que esta apenas "liberando uma unidade";
- na pratica ele esta vinculando um perfil inteiro;
- isso dificulta explicar o impacto real da operacao.

#### B. A tela de RBAC usa linguagem de implementacao, nao linguagem de produto

Em [src/app/(app)/seguranca/rbac/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(app)/seguranca/rbac/page.tsx#L163) a navegacao principal esta dividida em `Perfis`, `Usuário x Perfis`, `Grants por Feature` e `Auditoria`.

E ainda expõe termos como:

- `roleName`;
- `featureKey`;
- `grant`;
- `VIEW`, `EDIT`, `MANAGE`.

Esses termos fazem sentido para engenharia, mas nao para gestao operacional. O usuario precisa responder perguntas do tipo:

- esse gerente pode mexer em financeiro?
- a recepcao consegue cancelar venda?
- esse supervisor enxerga so a unidade dele ou a rede?

Hoje a interface nao responde isso de forma imediata.

#### C. O detalhe global do usuario mistura governanca e execucao numa unica superficie

Em [src/app/(backoffice)/admin/seguranca/usuarios/[id]/page.tsx](/Users/sergioamim/dev/pessoal/academia-app/src/app/(backoffice)/admin/seguranca/usuarios/[id]/page.tsx#L196) a tela concentra:

- memberships por unidade;
- perfis por unidade;
- unidade padrao;
- origem do acesso;
- politica de novas unidades.

Tudo isso e importante, mas ainda falta uma camada de sintese:

- "qual e o acesso efetivo desta pessoa agora?";
- "por que ela tem esse acesso?";
- "qual o menor ajuste possivel para corrigir excesso de privilegio?".

### 2.2 Diagnostico de produto

O problema nao e apenas de layout. E de modelagem visivel.

Hoje o sistema mistura tres perguntas diferentes:

1. Escopo: em quais unidades a pessoa pode atuar.
2. Papel: qual perfil ela exerce em cada unidade.
3. Autorizacao fina: quais funcionalidades esse perfil libera.

Enquanto essas tres dimensoes nao forem separadas na experiencia, o operador continuara tendo dificuldade para prever consequencias.

## 3. Referencias externas consideradas

As recomendacoes abaixo foram alinhadas com referencias consolidadas de IAM e AppSec:

- [OWASP Developer Guide - Enforce Access Controls](https://devguide.owasp.org/en/04-design/02-web-app-checklist/07-access-controls/)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [NIST RBAC FAQ](https://csrc.nist.gov/projects/role-based-access-control/faqs)
- [Google Cloud IAM - Using resource hierarchy for access control](https://cloud.google.com/iam/docs/resource-hierarchy-access-control)
- [Microsoft Entra - What are access reviews?](https://learn.microsoft.com/en-us/entra/id-governance/access-reviews-overview)

Principios aplicados ao contexto do produto:

- `deny by default`: nada fica liberado por ausencia de configuracao.
- `least privilege`: conceder apenas o necessario no menor escopo possivel.
- `all access through roles`: permissao deve ser concedida via perfis, nao diretamente ao usuario como regra geral.
- `role hierarchy and constraints`: perfis podem herdar capacidade, mas com regras explicitas e separacao de funcoes.
- `smallest scope needed`: conceder acesso na menor unidade/escopo possivel.
- `audit and recurring review`: acessos sensiveis precisam de trilha e recertificacao periodica.

## 4. Objetivo de negocio

Permitir que a rede:

- padronize acessos por perfil;
- atribua perfis a usuarios com poucos cliques e baixa ambiguidade;
- liste claramente quais funcionalidades existem e quem pode usá-las;
- ajuste permissoes por perfil sem editar usuario por usuario;
- trate excecoes de forma controlada, auditavel e temporaria;
- reduza risco de privilegio excessivo e erro operacional em expansao multiunidade.

## 5. Objetivos do produto

- Tornar compreensivel para gestor e operador o que cada pessoa pode fazer.
- Separar visualmente escopo, perfil e permissao.
- Reduzir dependencia de termos tecnicos como `grant`, `featureKey` e `roleName`.
- Criar perfis padronizados reaproveitaveis.
- Exibir impacto efetivo antes de salvar alteracoes sensiveis.
- Manter flexibilidade sem abrir uma superficie insegura de permissoes diretas por usuario.

## 6. Fora de escopo inicial

- Reescrever toda a seguranca do backend.
- Migrar o sistema para ABAC completo.
- Criar motor generico de politicas condicionais complexas na V1.
- Liberar edicao irrestrita de permissao diretamente por usuario.

## 7. Principios de desenho

### 7.1 Modelo mental unico

Toda tela de seguranca deve responder sempre as mesmas perguntas, na mesma ordem:

1. Quem.
2. Onde.
3. Como entra.
4. O que pode fazer.
5. Por que pode fazer.

### 7.2 Perfis primeiro, excecoes depois

O caminho padrao deve ser:

- vincular usuario a uma ou mais unidades;
- atribuir um perfil padronizado;
- revisar o acesso efetivo;
- abrir excecao apenas quando estritamente necessario.

### 7.3 Linguagem de negocio

Substituir linguagem tecnica por termos mais claros:

- `Perfil` no lugar de `roleName`.
- `Funcionalidade` no lugar de `feature`.
- `Ação permitida` no lugar de `grant`.
- `Acesso efetivo` no lugar de `origem herdada + permissao + membership`.

### 7.4 Menor escopo possivel

A interface deve induzir a conceder acesso:

- primeiro por unidade;
- depois por academia/rede apenas quando justificavel;
- com aviso claro quando o escopo for amplo.

### 7.5 Seguranca explicavel

Toda concessao relevante precisa mostrar:

- origem do acesso;
- escopo atingido;
- perfil aplicado;
- funcionalidades criticas liberadas;
- justificativa quando houver excecao.

## 8. Modelo conceitual proposto

## 8.1 Entidades visiveis ao usuario

### Usuario

Pessoa que recebera acesso.

### Escopo de acesso

Onde o usuario pode operar:

- unidade especifica;
- academia;
- rede inteira.

### Perfil padronizado

Conjunto de permissoes orientado a funcao de negocio.

Exemplos:

- Recepcao
- Gerente de Unidade
- Financeiro Operacional
- Supervisor Regional
- Administrador de Rede
- Auditor

### Funcionalidade

Capacidade de negocio listada no sistema, organizada por modulo.

Exemplos:

- Alunos > visualizar cadastro
- Alunos > editar cadastro
- Financeiro > registrar pagamento
- Financeiro > estornar pagamento
- Comercial > conceder desconto acima do limite
- Administrativo > gerenciar funcionarios
- Segurança > alterar perfis e acessos

### Excecao

Ajuste pontual fora do perfil padrao.

Regra: permitido apenas com justificativa, rastreio e opcionalmente prazo de validade.

## 8.2 Regras estruturais

- Usuarios nao recebem permissoes soltas por padrao.
- Usuarios recebem perfis dentro de um escopo.
- Perfis recebem funcionalidades.
- Excecoes ficam em camada separada e visivel.
- O sistema calcula e mostra acesso efetivo resultante.

## 9. Taxonomia de permissao recomendada

Padronizar o catalogo de funcionalidades em tres niveis:

### 9.1 Modulo

Exemplos:

- Comercial
- Financeiro
- Alunos
- Administrativo
- Segurança
- Relatorios

### 9.2 Funcionalidade

Exemplos:

- Contratos
- Pagamentos
- Funcionarios
- Unidades
- Perfis e acessos

### 9.3 Acoes

Padrao sugerido:

- Visualizar
- Criar
- Editar
- Aprovar
- Cancelar
- Exportar
- Excluir
- Administrar

Observacao: `VIEW/EDIT/MANAGE` e pouco expressivo para o produto. A V2 pode manter esses codigos internamente, mas a UI deve traduzi-los para a taxonomia de negocio.

## 10. Catalogo minimo de funcionalidades

O sistema precisa ter uma tela catalogo de funcionalidades, com busca, filtro e criticidade.

Estrutura recomendada para cada item:

- modulo;
- funcionalidade;
- acao;
- descricao simples;
- nivel de risco: baixo, medio, alto, critico;
- dependencia: exige outra permissao?;
- escopo suportado: unidade, academia, rede;
- visivel em perfis padrao?;
- auditavel obrigatoriamente?;

### Exemplo de catalogo inicial

#### Comercial

- Visualizar leads e prospects
- Criar venda
- Aplicar desconto ate limite padrao
- Aplicar desconto excepcional
- Cancelar venda fechada
- Exportar relatorio comercial

#### Financeiro

- Visualizar contas
- Registrar recebimento
- Registrar pagamento
- Estornar recebimento
- Editar configuracao fiscal
- Exportar relatorio financeiro

#### Administrativo

- Visualizar funcionarios
- Criar funcionario
- Editar funcionario
- Inativar funcionario
- Gerenciar unidades
- Gerenciar parametros da unidade

#### Segurança

- Visualizar acessos
- Atribuir perfil por unidade
- Remover perfil por unidade
- Criar perfil padronizado
- Editar perfil padronizado
- Editar permissoes de perfil
- Conceder excecao
- Aprovar excecao
- Gerenciar politica de novas unidades

#### Relatorios

- Ver indicadores da propria unidade
- Ver indicadores da academia
- Ver indicadores da rede
- Exportar base completa

## 11. Perfis padronizados recomendados

Os perfis abaixo devem nascer como templates oficiais, editaveis por administradores de rede.

### Recepcao

- foco em atendimento e operacao basica;
- sem permissoes financeiras criticas;
- sem gestao de seguranca;
- escopo padrao: unidade.

### Consultor Comercial

- foco em vendas, leads, contratos e follow-up;
- pode aplicar descontos dentro de limite;
- nao pode cancelar operacoes sensiveis sem aprovacao.

### Gerente de Unidade

- gestao operacional e administrativa da unidade;
- pode gerenciar equipe local;
- acesso ampliado a relatorios da propria unidade;
- nao pode alterar politica global de seguranca.

### Financeiro Operacional

- execucao financeira da unidade ou academia;
- registrar, conciliar e exportar;
- estornos e configuracoes fiscais sob controle reforcado.

### Supervisor Regional

- visao multiunidade de academias designadas;
- leitura ampla e alteracoes seletivas;
- sem direitos globais irrestritos por padrao.

### Administrador de Rede

- pode gerenciar perfis, acesso, unidades e politicas amplas;
- acesso mais sensivel;
- sujeito a revisao periodica obrigatoria.

### Auditor

- leitura ampla;
- sem poder de alteracao;
- foco em rastreabilidade e conformidade.

## 12. Nova arquitetura de informacao da area de seguranca

Substituir a experiencia atual fragmentada por cinco areas principais.

### 12.1 Visao geral

Objetivo:

- mostrar risco e saude do modelo de acesso.

Widgets sugeridos:

- usuarios com acesso administrativo;
- usuarios sem revisao recente;
- perfis padrao ativos;
- excecoes ativas;
- acessos amplos em nivel rede;
- usuarios elegiveis para novas unidades.

### 12.2 Usuarios e acessos

Objetivo:

- ser a tela principal de operacao.

A lista precisa responder:

- quem e a pessoa;
- em quantas unidades atua;
- qual perfil principal possui;
- se tem excecao;
- se tem acesso amplo;
- se a revisao esta vencida.

Colunas sugeridas:

- usuario;
- escopo atual;
- perfis ativos;
- excecoes;
- ultima revisao;
- risco;
- acoes.

### 12.3 Perfis padronizados

Objetivo:

- governar papeis reutilizaveis.

Cada perfil deve exibir:

- nome amigavel;
- objetivo;
- modulos cobertos;
- quantidade de funcionalidades;
- criticidade;
- ultima alteracao;
- quantos usuarios usam;
- versao do perfil.

### 12.4 Catalogo de funcionalidades

Objetivo:

- listar tudo que pode ser liberado no sistema.

Essa tela e essencial para resolver a demanda do negocio de "ter as funcionalidades listadas no sistema".

### 12.5 Revisoes e auditoria

Objetivo:

- recertificar acessos;
- rastrear mudancas;
- identificar excesso de privilegio;
- monitorar excecoes vencidas.

## 13. Redesenho de fluxos

## 13.1 Fluxo: conceder acesso a usuario

Fluxo ideal:

1. Buscar usuario.
2. Escolher escopo.
3. Escolher perfil padronizado.
4. Ver resumo do acesso efetivo.
5. Confirmar.

Resumo antes de salvar:

- unidades atingidas;
- modulos liberados;
- funcionalidades criticas liberadas;
- origem do acesso;
- se cria acesso em novas unidades;
- se o escopo e maior que o habitual.

### Melhorias em relacao ao atual

- deixar de conceder via perfil implicito;
- tornar obrigatorio escolher o perfil conscientemente;
- mostrar impacto antes da gravacao.

## 13.2 Fluxo: editar permissoes de um perfil

Fluxo ideal:

1. Abrir perfil padronizado.
2. Ver matriz de funcionalidades por modulo.
3. Filtrar por risco, modulo e tipo de acao.
4. Alterar permissoes.
5. Visualizar impacto.
6. Publicar nova versao do perfil.

Impacto exibido:

- usuarios afetados;
- unidades afetadas;
- funcionalidades criticas adicionadas/removidas;
- recomendacao de revisao manual se a mudanca for sensivel.

## 13.3 Fluxo: tratar excecao

Fluxo ideal:

1. Abrir usuario.
2. Clicar em "Adicionar excecao".
3. Escolher funcionalidade especifica.
4. Informar justificativa.
5. Informar prazo final opcional ou obrigatorio conforme criticidade.
6. Salvar.

Regras:

- excecao nunca fica misturada ao perfil base;
- excecao aparece destacada no acesso efetivo;
- excecao pode exigir aprovacao para itens criticos.

## 13.4 Fluxo: revisar acesso de usuario

Fluxo ideal:

1. Abrir usuario.
2. Ver cartao de acesso efetivo.
3. Ver origem de cada permissao.
4. Ver ultimo uso de modulos criticos.
5. Confirmar manutencao, reduzir ou remover acesso.

## 13.5 Fluxo: novas unidades

Hoje essa regra existe, mas esta dificil de entender. A nova UX deve tratar isso como politica separada:

- "Recebe automaticamente acesso a novas unidades?"
- "Em qual escopo?"
- "Com qual perfil?"
- "Qual a justificativa?"

Regra de UX:

- esse controle nao deve ficar misturado com o fluxo diario de concessao local;
- ele pertence a governanca global.

## 14. Proposta de telas

## 14.1 Tela "Usuarios e acessos"

Resumo:

- busca por nome/e-mail;
- filtros por unidade, academia, perfil, risco, excecao e status de revisao;
- tabela com leitura humana;
- CTA principal: `Conceder acesso`.

Card expandido ou detalhe rapido:

- unidades do usuario;
- perfil por unidade;
- excecoes ativas;
- riscos detectados.

## 14.2 Tela "Detalhe do usuario"

Organizacao sugerida:

### Bloco 1. Resumo efetivo

- nome, e-mail, status;
- unidades ativas;
- perfil principal por unidade;
- nivel de acesso;
- proxima revisao;
- acessos criticos.

### Bloco 2. Escopo

- lista de unidades;
- unidade padrao;
- origem do acesso;
- botao para adicionar/remover unidade.

### Bloco 3. Perfis

- um perfil principal por unidade;
- perfis adicionais apenas quando permitido pela regra;
- explicacao textual do que cada perfil libera.

### Bloco 4. Excecoes

- funcionalidades fora do perfil;
- justificativa;
- criador;
- expiracao;
- status.

### Bloco 5. Politica de novas unidades

- separado do resto;
- sem competir visualmente com as operacoes do dia a dia.

### Bloco 6. Auditoria e revisoes

- ultimas alteracoes;
- revisao pendente;
- ultimo login;
- ultimo uso de modulos sensiveis, quando disponivel.

## 14.3 Tela "Perfis padronizados"

Lista:

- nome;
- descricao;
- escopo recomendado;
- criticidade;
- usuarios impactados;
- ultima revisao.

Detalhe do perfil:

- resumo executivo;
- matriz de funcionalidades;
- dependencias;
- restricoes de segregacao;
- usuarios afetados;
- historico de versoes.

## 14.4 Tela "Catalogo de funcionalidades"

Lista com:

- busca;
- filtros por modulo, acao, criticidade e escopo;
- definicao de cada funcionalidade;
- indicador se esta atribuida a algum perfil.

Para cada funcionalidade:

- nome amigavel;
- codigo tecnico interno;
- descricao simples;
- risco;
- exige auditoria?;
- exige MFA/aprovacao?;
- disponivel para qual escopo?;

## 14.5 Tela "Revisoes e auditoria"

Abas sugeridas:

- Revisoes pendentes
- Excecoes vencendo
- Mudancas recentes
- Acessos amplos
- Perfis sem dono claro

## 15. Requisitos funcionais

### RF-01

O sistema deve listar todas as funcionalidades permissiveis de forma pesquisavel e categorizada.

### RF-02

O sistema deve permitir criar, editar, ativar e inativar perfis padronizados.

### RF-03

O sistema deve permitir atribuir um perfil padronizado a um usuario em um escopo definido.

### RF-04

O sistema deve permitir remover um perfil de um usuario sem perder trilha de auditoria.

### RF-05

O sistema deve exibir acesso efetivo consolidado por usuario, incluindo origem e excecoes.

### RF-06

O sistema deve permitir excecoes por funcionalidade apenas em fluxo proprio, com justificativa.

### RF-07

O sistema deve suportar expiracao de excecao para funcionalidades sensiveis.

### RF-08

O sistema deve permitir definir politica de acesso automatico a novas unidades de forma explicita.

### RF-09

O sistema deve mostrar impacto da alteracao antes da confirmacao em operacoes sensiveis.

### RF-10

O sistema deve indicar quando um usuario possui acesso mais amplo que o recomendado para o perfil.

### RF-11

O sistema deve permitir revisao periodica de acessos privilegiados.

### RF-12

O sistema deve permitir identificar usuarios com acesso por unidade, por academia e por rede.

## 16. Requisitos de seguranca

### RS-01

A aplicacao deve operar em `deny by default` para novas funcionalidades nao mapeadas em catalogo.

### RS-02

Toda funcionalidade sensivel deve ter verificacao no backend; a UI so representa a regra.

### RS-03

Permissoes nao devem ser atribuiveis diretamente a usuarios como caminho principal.

### RS-04

Toda mudanca de acesso deve registrar:

- quem alterou;
- o que mudou;
- antes e depois;
- escopo;
- justificativa, quando aplicavel;
- data e hora.

### RS-05

Operacoes de alto risco devem exigir confirmacao reforcada e, quando possivel, MFA ou step-up auth.

Exemplos:

- editar perfis de seguranca;
- liberar acesso global;
- conceder excecao critica;
- alterar politica de novas unidades.

### RS-06

Permissoes criticas devem suportar segregacao de funcoes.

Exemplos:

- quem aprova excecao nao deveria ser o mesmo que a consome em alguns cenarios;
- quem ajusta politica global nao deveria ser confundido com gerente de unidade.

### RS-07

Acesso amplo em nivel rede deve ser excepcional, visivel e periodicamente revisto.

### RS-08

Excecoes devem ser recertificadas e poder expirar automaticamente.

## 17. Requisitos de UX

### UX-01

Evitar termos tecnicos na navegacao principal.

### UX-02

Toda tela de seguranca deve mostrar um resumo textual antes dos detalhes tecnicos.

### UX-03

Toda acao sensivel deve exibir impacto esperado antes de salvar.

### UX-04

Toda permissao deve ser apresentavel em linguagem de negocio.

### UX-05

O usuario deve conseguir responder em menos de 10 segundos:

- em quais unidades a pessoa atua;
- qual perfil ela tem;
- quais riscos especiais existem.

### UX-06

Alertas de risco devem ser priorizados por severidade, nao por ordem cronologica.

### UX-07

O fluxo comum de atribuicao deve caber em uma unica jornada curta, sem navegar por multiplas abas tecnicas.

## 18. Regras de negocio

- Um usuario pode ter escopos diferentes em unidades diferentes.
- O sistema deve preferir um perfil principal por unidade.
- Multiplos perfis por unidade devem ser excepcionais e visiveis.
- Excecao por usuario nao substitui governanca de perfil.
- Politica de novas unidades deve ser independente do acesso cotidiano.
- Remover uma unidade nao deve remover historico de auditoria.
- Trocar permissoes de um perfil deve considerar usuarios impactados.
- Acesso herdado deve aparecer explicitamente como herdado.
- Acesso direto excepcional deve aparecer explicitamente como excecao.

## 19. Proposta de evolucao tecnica

Sem romper a base atual, a recomendacao e evoluir para as seguintes camadas:

### 19.1 Catalogo canonico de funcionalidades

Novo registro canonico das capacidades do sistema, ligado aos modulos da plataforma.

### 19.2 Perfis padronizados versionados

Perfis passam a ser tratados como artefatos governados, nao apenas linhas tecnicas de `role profile`.

### 19.3 Camada de acesso efetivo

DTO/view model para frontend que resolva:

- escopo;
- perfil;
- permissoes herdadas;
- excecoes;
- risco;
- justificativas.

### 19.4 Camada de revisao

Eventos, pendencias e recertificacao.

## 20. Proposta de rollout

### Fase 1 - Fundacao de produto

- criar catalogo de funcionalidades;
- traduzir `featureKey` para linguagem de negocio;
- mapear perfis padrao iniciais;
- redesenhar lista de usuarios e detalhe de usuario.

### Fase 2 - Governanca de perfis

- tela nova de perfis padronizados;
- matriz de funcionalidades por perfil;
- versao e impacto de alteracoes.

### Fase 3 - Excecoes e revisao

- fluxo de excecao com justificativa e expiracao;
- fila de revisao periodica;
- alertas de acesso amplo e excesso de privilegio.

### Fase 4 - Politica global de novas unidades

- separar de vez governanca global do fluxo local;
- permitir politicas por escopo e por perfil;
- exibir impacto claro na expansao de rede.

## 21. Metricas de sucesso

- reducao do tempo medio para conceder acesso.
- reducao do tempo medio para revisar acesso de um usuario.
- reducao de erros de concessao/revogacao.
- percentual de usuarios em perfis padronizados versus excecoes.
- percentual de excecoes expiradas/removidas no prazo.
- percentual de acessos administrativos revisados dentro do ciclo.
- reducao de tickets de duvida sobre permissao.

## 22. Riscos e mitigacoes

### Risco 1

Transformar RBAC em configuracao livre demais.

Mitigacao:

- perfis padronizados como caminho principal;
- excecoes controladas;
- permissao direta ao usuario limitada.

### Risco 2

Continuar misturando escopo com permissao.

Mitigacao:

- UX separada entre `onde atua` e `o que pode fazer`.

### Risco 3

Alterar perfis e impactar muita gente sem previsao.

Mitigacao:

- preview de impacto;
- versao do perfil;
- trilha de mudanca.

### Risco 4

Manter acesso amplo por inercia.

Mitigacao:

- revisao periodica;
- alertas de acesso em nivel rede;
- destaque para excesso de privilegio.

## 23. Decisoes recomendadas

### Decisao 1

Substituir a nomenclatura exposta de `grant` e `feature` por `funcionalidade` e `acao`.

### Decisao 2

Tornar obrigatoria a existencia de um catalogo de funcionalidades antes de expandir o RBAC fino.

### Decisao 3

Adotar perfis padronizados oficiais como caminho padrao de concessao.

### Decisao 4

Permitir excecao por usuario apenas com justificativa e, para itens criticos, prazo.

### Decisao 5

Introduzir revisao periodica de acessos privilegiados no produto.

## 24. Backlog priorizado

### P0

- catalogo de funcionalidades
- perfis padronizados iniciais
- resumo de acesso efetivo por usuario
- fluxo novo de conceder acesso por unidade + perfil

### P1

- matriz de permissoes por perfil
- preview de impacto
- tratamento formal de excecoes
- score de risco de acesso

### P2

- recertificacao periodica
- expiracao automatica de excecoes
- analytics de uso de permissoes
- sugestoes automatizadas de reducao de privilegio

## 25. Recomendacao objetiva para a proxima iteracao

Se fosse priorizar a implementacao agora, a melhor sequencia seria:

1. Criar o catalogo de funcionalidades e traduzir a linguagem da UI.
2. Redesenhar `Acesso por Unidade` para exigir escolha explicita de perfil e mostrar impacto.
3. Substituir a tela atual de `RBAC` por `Perfis padronizados`, `Funcionalidades` e `Revisoes`.
4. Reestruturar o detalhe do usuario com foco em acesso efetivo, excecoes e risco.
5. Deixar politica de novas unidades como governanca global separada.

## 26. Anexo - mapeamento do problema atual para a proposta

### Problema atual

`Acesso por Unidade` concede acesso usando perfil default.

### Solucao

Escolha explicita de perfil + resumo de impacto + confirmacao.

### Problema atual

`RBAC` esta orientado a objetos tecnicos.

### Solucao

Nova IA orientada a:

- Usuarios e acessos
- Perfis padronizados
- Funcionalidades
- Revisoes e auditoria

### Problema atual

O usuario nao enxerga o acesso efetivo consolidado.

### Solucao

Card de acesso efetivo no detalhe do usuario, com origem, escopo, risco e excecoes.

### Problema atual

Funcionalidades nao estao claramente listadas.

### Solucao

Catalogo canonico de funcionalidades pesquisavel e governavel.
