# PRD: Treinos V2

## 1. Resumo executivo
Treinos V2 redefine o módulo de treinos do web com uma abordagem operacional e reutilizável:

- `Treino Padrão` vira a fonte oficial de templates.
- `Treino atribuído` vira uma instância versionada para cliente(s).
- O editor de template e o editor de treino atribuído usam a mesma experiência-base.
- A listagem de templates deve ser simples e rápida.
- A complexidade fica concentrada no editor e na atribuição.
- O sistema deve permitir atribuir um treino padrão para `1 cliente`, `vários clientes` e, futuramente, `segmentos`.

As referências visuais recebidas definem dois princípios:

1. A tela de listagem de `Treino Padrão` deve ser enxuta, administrativa e paginada.
2. O editor deve ser uma área densa de operação, com blocos/séries, biblioteca lateral de exercícios, edição inline e técnicas especiais visíveis no próprio canvas.

As evidências da documentação oficial do EVO também validam pontos operacionais importantes para a V2:

- o cadastro base do treino usa `nome`, `frequência semanal` e `total de semanas` como campos obrigatórios;
- a montagem mantém biblioteca lateral com filtros por grupo de exercícios e grupo muscular;
- a operação real já trabalha com `conjugado`, `progressivo`, `drop-set`, `replicar série` e `versão simplificada`;
- a migração para a nova prescrição sinaliza campos que precisam revisão, especialmente quando séries, repetições, carga e intervalo não são numéricos;
- a atribuição em massa do treino padrão usa filtros operacionais como `contrato`, `níveis` e `gênero`.

---

## 2. Problema
Hoje a montagem e a reutilização de treinos tendem a ser fragmentadas:

- criar template e montar treino real não seguem o mesmo fluxo mental;
- professor repete o mesmo trabalho para vários clientes;
- atribuição em massa não está formalizada;
- revisão técnica e governança de templates ficam frágeis;
- a biblioteca de exercícios não está acoplada de forma produtiva à montagem do treino;
- alterações de template não têm rastreabilidade clara quando já existem clientes atribuídos.

---

## 3. Objetivos do produto
Treinos V2 deve:

- reduzir o tempo de criação e edição de treinos;
- aumentar o reuso de templates;
- permitir atribuição individual e em massa com segurança;
- separar claramente `template` de `instância atribuída`;
- oferecer governança por status, revisão e publicação;
- preparar a base para consumo consistente no app do cliente.

---

## 4. Objetivos de negócio
- aumentar o percentual de clientes com treino ativo;
- reduzir esforço operacional do professor para montar treinos repetitivos;
- padronizar treinos institucionais por unidade/rede;
- permitir campanhas operacionais do tipo:
  - atribuir treino base para novos alunos;
  - atribuir treino por objetivo/segmento;
  - atualizar carteiras inteiras de clientes com novo template;
- melhorar rastreabilidade de quem recebeu qual treino e quando.

---

## 5. Perfis de usuário
### 5.1 Professor
- cria templates;
- monta treinos do cliente;
- ajusta parâmetros;
- atribui treino para alunos;
- duplica ou adapta treinos existentes.

### 5.2 Coordenador técnico
- revisa templates;
- publica padrões;
- acompanha aderência, qualidade e padronização.

### 5.3 Operação / recepção
- pode iniciar atribuições a partir de templates publicados, conforme permissão.

### 5.4 Cliente
- recebe treino atribuído para execução no app/portal;
- não acessa metadados administrativos.

---

## 6. Princípios de UX
- mesma base de editor para template e treino atribuído;
- listagem simples, editor poderoso;
- edição inline sempre que possível;
- biblioteca lateral de exercícios sempre disponível;
- ações de atribuição explícitas e seguras;
- templates com revisão/publicação visível;
- interface operacional, sem excesso de modais;
- consistência com as referências visuais recebidas.

---

## 7. Escopo
### 7.1 Incluído no escopo
- listagem de `Treino Padrão`;
- busca, paginação e ações rápidas;
- criação/edição de template;
- criação/edição de treino atribuído;
- metadados obrigatórios do template:
  - nome
  - frequência semanal
  - total de semanas
- blocos/séries (`A`, `B`, `C`...) no mesmo editor;
- biblioteca lateral de exercícios;
- drawer lateral para criar/editar exercício;
- edição inline por linha de exercício;
- técnicas especiais:
  - conjugado
  - progressivo
  - drop-set
  - replicar série
- revisão e publicação de template;
- versão simplificada do editor;
- sinalização de itens que precisam revisão após migração/normalização;
- atribuição para 1 cliente;
- atribuição para vários clientes;
- snapshot/versionamento no momento da atribuição;
- histórico de atribuições e resultado operacional.

### 7.2 Fora do escopo inicial
- IA gerando treino automaticamente;
- periodização avançada multi-mesociclo;
- analytics biomecânico;
- integração com wearable;
- execução ao vivo com cronômetro avançado;
- recomendação automática clínica.

---

## 8. Modelo conceitual
### 8.1 Exercício
Entidade da biblioteca.

Campos principais:
- nome;
- código;
- grupo de exercícios;
- grupo muscular;
- tipo do exercício;
- objetivo padrão;
- unidade de carga;
- descrição;
- mídia;
- flag de disponibilidade no app do cliente;
- exercícios similares.

### 8.2 Template de treino (`Treino Padrão`)
Modelo reutilizável.

Campos:
- nome;
- frequência semanal;
- total de semanas;
- descrição/informações;
- categoria opcional;
- criado por;
- unidade;
- status;
- flag `precisa revisão`;
- blocos;
- exercícios e parâmetros.

### 8.3 Treino atribuído
Instância derivada de template ou criada manualmente para cliente(s).

Campos:
- cliente(s);
- professor responsável;
- origem;
- templateOrigemId opcional;
- versãoSnapshot;
- data de início;
- data de fim/vencimento;
- vigência;
- status.

### 8.4 Bloco / série
Abas do treino.

Exemplos:
- `A - Anterior`
- `B - Posterior`
- `C - Core`

### 8.5 Item de exercício
Linha editável dentro do bloco.

Campos:
- exercício;
- ordem;
- séries;
- objetivo;
- carga;
- unidade;
- intervalo;
- regulagem;
- observações;
- técnicas especiais.

### 8.6 Atribuição em massa
Operação que aplica um treino padrão a múltiplos clientes.

Campos:
- origem;
- critérios de seleção;
- filtros por contrato, níveis e gênero;
- lista final de clientes;
- política de conflito;
- vigência;
- responsável;
- resultado.

---

## 9. Jornada do produto
### 9.1 Listar e encontrar template
1. Usuário entra em `Treino Padrão`.
2. Busca por nome do treino ou professor.
3. Visualiza lista paginada.
4. Executa ação rápida:
   - editar;
   - abrir montagem;
   - atribuir;
   - excluir/arquivar.

### 9.2 Criar template
1. Usuário clica em `Criar treino padrão`.
2. Abre editor unificado.
3. Define nome, frequência semanal, total de semanas, descrição opcional e categoria.
4. Adiciona exercícios da biblioteca lateral.
5. Preenche parâmetros inline.
6. Salva como rascunho, continua a montagem ou publica quando permitido.

### 9.3 Atribuir para 1 cliente
1. Usuário abre template.
2. Clica em `Atribuir`.
3. Escolhe um cliente.
4. Define vigência e regra de substituição.
5. Confirma.
6. Sistema gera snapshot do treino atribuído.

### 9.4 Atribuir para vários clientes
1. Usuário abre template.
2. Clica em `Atribuir em massa`.
3. Define data de início/fim e seleciona clientes manualmente ou por filtros.
4. Revisa conflitos.
5. Usa filtros operacionais como contrato, níveis e gênero quando necessário.
6. Define política de overwrite.
7. Confirma.
8. Sistema processa e apresenta resumo operacional.

### 9.5 Ajustar treino atribuído
1. Usuário abre treino do cliente.
2. Usa o mesmo editor-base.
3. Ajusta parâmetros ou exercícios.
4. Salva.
5. Alteração afeta apenas a instância atribuída.

### 9.6 Reaproveitar treinos existentes
1. Usuário pode exportar um treino de cliente para `Treino Padrão`.
2. Usuário pode exportar um treino para outro cliente, colaborador ou oportunidade.
3. Usuário pode importar um treino padrão do `ADM Geral` para a unidade atual.
4. O sistema mantém esses fluxos como trilhas adjacentes ao editor principal, sem poluir a V1 da listagem.

---

## 10. Estrutura de telas
### 10.1 Listagem de Treino Padrão
Tela propositalmente enxuta.

Componentes:
- título `Treino Padrão`;
- link `Saiba mais`;
- busca principal;
- botão `Criar treino padrão`;
- quick filter/drawer de revisão quando existir backlog de migração;
- tabela;
- paginação;
- contador de resultados.

Colunas:
- `Nome do treino`
- `Criado por`
- `Ações`

Ações por linha:
- `Editar treino`
- `Abrir montagem`
- `Atribuir treino`
- `Excluir treino`

Regras:
- só mostra templates;
- não mistura treino atribuído;
- ordenação padrão por atualização/recência;
- filtros avançados podem existir em drawer futuro, não na área principal da V1.

### 10.2 Editor unificado
Mesma tela-base para template e treino atribuído.

Estrutura:
- cabeçalho com nome, autor/responsável, salvar, exportar, imprimir, fechar;
- metadados do treino: frequência semanal, total de semanas, categoria e status;
- abas horizontais de blocos;
- campo de informações do treino;
- toggle de versão simplificada;
- grade central com exercícios do bloco atual;
- biblioteca lateral de exercícios com busca e ação `+`;
- CTA para `Novo exercício`.

### 10.3 Drawer lateral de exercício
Campos:
- nome;
- grupo de exercícios;
- código;
- grupo muscular;
- tipo do exercício;
- objetivo;
- carga;
- descrição;
- mídia;
- disponibilidade no app;
- similares.

### 10.4 Modal/drawer de atribuição
Abas:
- `1 cliente`
- `Vários clientes`
- `Segmento` (preparado para futuro)

Campos:
- cliente(s);
- data de início e fim;
- vigência;
- professor responsável;
- observação;
- regra de substituição;
- filtros operacionais para lote:
  - contrato
  - níveis
  - gênero.

### 10.5 Lista de treinos atribuídos
Tela operacional complementar.

Filtros:
- cliente;
- professor;
- status;
- vigência;
- origem;
- unidade.

Ações:
- abrir;
- editar;
- encerrar;
- duplicar;
- reatribuir.

---

## 11. Requisitos funcionais
### Template e editor
- RF01. O sistema deve permitir cadastrar e editar treinos padrão.
- RF02. O sistema deve usar a mesma tela-base para template e treino atribuído.
- RF03. O sistema deve permitir criar blocos/séries nomeados.
- RF04. O sistema deve permitir adicionar exercícios da biblioteca lateral ao bloco atual.
- RF05. O sistema deve permitir reordenar exercícios.
- RF06. O sistema deve permitir editar inline:
  - séries
  - objetivo
  - carga
  - unidade
  - intervalo
  - regulagem
  - observações
- RF07. O sistema deve permitir técnicas especiais:
  - conjugado
  - progressivo
  - drop-set
  - replicar série
- RF08. O sistema deve permitir criar novo exercício sem sair do editor.
- RF09. O sistema deve permitir duplicar um template.
- RF10. O sistema deve permitir exportar e imprimir treino.
- RF10.1. O template deve exigir `nome`, `frequência semanal` e `total de semanas`.
- RF10.2. O sistema deve permitir alternar para `versão simplificada`.

### Listagem
- RF11. A listagem de treino padrão deve ser enxuta e paginada.
- RF12. A tela deve permitir busca por nome do treino ou professor.
- RF13. A listagem deve expor ações rápidas por linha.
- RF13.1. Quando houver backlog de revisão/migração, a listagem deve permitir filtrar ou destacar itens com `Revisar`.

### Revisão e publicação
- RF14. O sistema deve suportar status de template:
  - rascunho
  - em revisão
  - publicado
  - arquivado
- RF15. O sistema deve bloquear publicação de template inválido.
- RF16. O sistema deve destacar templates que precisam revisão.
- RF16.1. O sistema deve sinalizar campos inválidos ou não migrados quando séries, repetições, carga ou intervalo não forem numéricos.

### Atribuição
- RF17. O sistema deve permitir atribuir treino padrão para 1 cliente.
- RF18. O sistema deve permitir atribuir treino padrão para múltiplos clientes.
- RF19. O sistema deve gerar snapshot/versionamento na atribuição.
- RF20. Editar treino atribuído não deve alterar o template.
- RF21. O sistema deve registrar resultado da atribuição em massa.
- RF22. O sistema deve permitir regras de conflito:
  - manter treino atual
  - substituir treino atual
  - agendar novo treino
- RF22.1. A atribuição em massa deve permitir filtros operacionais como contrato, níveis e gênero.

### Operação
- RF23. O sistema deve permitir visualizar quantos clientes receberam um template.
- RF24. O sistema deve permitir abrir histórico de atribuições por template.
- RF25. O sistema deve manter rastreabilidade de origem e versão.
- RF26. O sistema deve permitir exportar um treino de cliente como novo `Treino Padrão`.
- RF27. O sistema deve permitir importar treino padrão do `ADM Geral` para a unidade, em fluxo dedicado ou lateral.

---

## 12. Regras de negócio
- RN01. `Treino Padrão` é template; `Treino atribuído` é instância.
- RN02. Toda atribuição gera snapshot da versão usada.
- RN03. Alterações futuras no template não modificam instâncias atribuídas automaticamente.
- RN04. Atualizar clientes para nova versão deve ser ação explícita.
- RN05. Apenas usuários autorizados podem publicar, excluir e atribuir em massa.
- RN06. Template publicado é o candidato principal à atribuição institucional.
- RN07. Treino atribuído pode estar em:
  - rascunho
  - ativo
  - agendado
  - encerrado
  - substituído
- RN08. Atribuição em massa deve produzir resumo:
  - total selecionado
  - total atribuído
  - total ignorado
  - motivos
- RN09. Template inválido não pode ser publicado.
- RN10. Treino atribuído pode sofrer ajuste local sem impactar a origem.

---

## 13. Permissões
### Professor
- criar/editar próprios templates;
- atribuir individualmente;
- ajustar treinos atribuídos.

### Coordenador técnico
- revisar/publicar templates;
- acompanhar qualidade e uso;
- operar atribuição em massa, se permitido.

### Administrador
- acesso total;
- publicação;
- exclusão/arquivamento;
- atribuição em massa;
- gestão de catálogo.

### Operação
- acesso restrito a templates publicados;
- atribuição operacional, se explicitamente autorizado.

### Permissões finas mapeadas na documentação
- `Exercícios`
- `Treino padrão`
- `Treino padrão - prescrever`
- `Treinos - prescrever`
- `Treinos - prescrever outras carteiras`
- `Treinos - personalizar exercício`
- `Treinos - somente editar carga`
- `Treinos - consultar outras carteiras`
- `Treino - exibir quantidade de resultados`

---

## 14. Integração com app do cliente
Na V1:
- treino atribuído publicado pode ser consumido no app;
- exercícios exibem nome, mídia e descrição;
- cliente vê treino por blocos;
- cliente não vê metadados administrativos.

---

## 15. Métricas de sucesso
- tempo médio de criação de template;
- tempo médio de atribuição para múltiplos clientes;
- percentual de clientes com treino ativo;
- taxa de reutilização de templates;
- volume de atribuições em massa;
- percentual de templates revisados antes da publicação.

---

## 16. Riscos
- atribuição em massa sem regra clara de overwrite;
- excesso de densidade no editor em telas menores;
- taxonomia ruim da biblioteca degradando busca;
- confusão entre template e treino atribuído se snapshot não for explícito.

---

## 17. Decisões recomendadas
- editor único para template e treino atribuído;
- listagem simples e operacional;
- snapshot obrigatório na atribuição;
- template publicado como base institucional;
- auditoria das atribuições em massa;
- filtros avançados fora da listagem principal na V1.

---

## 18. Open questions
- cliente pode ter mais de um treino ativo simultâneo?
- atribuição em massa deve ser síncrona ou assíncrona?
- vigência será obrigatória?
- professor pode editar treino de outro professor?
- atualização em massa para nova versão entra como P0 ou P1?

---

## 19. Critérios de aceite
- CA01. Usuário cria um template com múltiplos blocos.
- CA02. Usuário adiciona exercícios pela biblioteca lateral.
- CA03. Usuário edita parâmetros inline.
- CA04. Usuário cria exercício novo em drawer e reutiliza no treino.
- CA05. Usuário salva e publica template válido.
- CA06. Usuário encontra template via busca na listagem.
- CA07. Usuário atribui template para um cliente.
- CA08. Usuário atribui template para vários clientes.
- CA09. Instância atribuída preserva snapshot da versão.
- CA10. Edição de instância não afeta template de origem.
- CA11. Sistema produz resumo de atribuição em massa.

---

## 20. Roadmap proposto
### P0
- listagem de treino padrão;
- editor unificado;
- biblioteca lateral;
- CRUD de exercício;
- blocos/séries;
- edição inline;
- atribuição individual;
- atribuição em massa;
- snapshot/versionamento;
- revisão/publicação;
- exportar/imprimir.

### P1
- histórico detalhado de atribuições;
- reatribuição por nova versão;
- filtros avançados e segmentos;
- analytics de adoção;
- exportar treino de cliente para treino padrão;
- importar treino padrão do ADM Geral por unidade;
- exportar treino para outro cliente, colaborador ou oportunidade;
- persistência operacional de treinos minimizados/rascunhos.

### P2
- IA assistiva;
- periodização avançada;
- automações por eventos de matrícula/renovação.

## 21. Descobertas validadas na documentação EVO
Os artigos da EVO Help reforçaram pontos que impactam diretamente o desenho da V2:

- `Prescrever e compartilhar um treino padrão` confirmou que a listagem do template é simples, que o template exige nome/frequência semanal/total de semanas e que a atribuição em massa usa filtros por contrato, níveis e gênero.
- `Prescrição de treinos` detalhou o editor novo: filtros na biblioteca lateral, reordenação por drag handle, `conjugado`, `progressivo`, `drop-set`, `replicar série`, `versão simplificada`, histórico de excluídos e permissões finas por perfil.
- `Ativar a nova prescrição de treinos e migrar os treinos padrões existentes` deixou claro que a migração precisa de revisão manual quando campos como séries, repetições, carga e intervalo carregam textos não numéricos.
- `Cadastro de exercícios` confirmou a importância do cadastro rico de exercício, com grupo, grupo muscular, similares, objetivo, carga, descrição e mídia.
- `Exportação de treino do cliente para treino padrão` e `Importação de treino padrão do ADM Geral por unidade` mostraram que o ecossistema real do produto inclui fluxos de reaproveitamento/importação que valem entrar pelo menos como P1 do backlog.
