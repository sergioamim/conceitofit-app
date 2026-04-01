# Task ID: 260

**Title:** Integração WhatsApp para notificações

**Status:** done

**Dependencies:** 259 ✓

**Priority:** high

**Description:** Sistema não tem canal de comunicação. WhatsApp é canal primário para academias (cobrança, follow-up, welcome).

**Details:**

Avaliar integração com API oficial WhatsApp Business ou Evolution API. Criar serviço de notificação com templates: welcome, vencimento de matrícula, cobrança pendente, follow-up de prospect. Backend precisa de endpoints para envio. Frontend precisa de configuração na admin e logs de envio.

**Test Strategy:**

Template de mensagem configurável na admin. Envio de welcome ao cadastrar aluno. Log de mensagens enviadas visível.

## Subtasks

### 260.1. Definir Tipos e Dados Mock para WhatsApp

**Status:** pending  
**Dependencies:** None  

Criar e estender tipos TypeScript e a camada de dados mock para incluir configurações de WhatsApp, modelos de mensagens e logs de envio, alinhando com a estrutura existente em src/lib/types.ts e src/lib/mock/store.ts.

**Details:**

Adicionar interfaces `IWhatsAppConfig`, `IWhatsAppTemplate` e `IWhatsAppMessageLog` em `src/lib/types.ts`. Estender `src/lib/mock/store.ts` com arrays mock para `whatsappTemplates` (ex: welcome, vencimento, cobrança) e `whatsappMessageLogs` para simular o armazenamento de dados. O `store.ts` deve conter dados mock iniciais para templates.

### 260.2. Desenvolver Serviço Mock de Envio de WhatsApp

**Status:** pending  
**Dependencies:** 260.1  

Implementar um serviço que simula o envio de mensagens WhatsApp, incluindo a renderização de templates com dados mock e o registro dos envios na camada de dados mock, replicando a abordagem de serviços em src/lib/mock/services.ts.

**Details:**

Criar um novo arquivo `src/lib/mock/whatsapp-service.ts`. Este serviço deve conter funções como `getWhatsAppTemplates()`, `saveWhatsAppTemplate(template: IWhatsAppTemplate)`, `sendWhatsappMessage(templateId: string, recipient: string, data: Record<string, string>)`. A função de envio deve renderizar o template com os dados fornecidos e registrar a mensagem 'enviada' em `whatsappMessageLogs` no `store.ts`.

### 260.3. Criar Página Admin de Configuração de Templates WhatsApp

**Status:** pending  
**Dependencies:** 260.1, 260.2  

Desenvolver uma página na área administrativa do frontend para que administradores possam visualizar, criar e editar templates de mensagens WhatsApp, utilizando os componentes Shadcn/ui e seguindo o design dark-only.

**Details:**

Criar uma nova rota em `/admin/configuracoes/whatsapp/templates`. Esta página deve ser 'use client'. Implementar uma interface com componentes Shadcn/ui (ex: `DataTable` para listar, `Dialog` para editar/criar) para interagir com as funções `getWhatsAppTemplates` e `saveWhatsAppTemplate` do `whatsapp-service.ts`.

### 260.4. Implementar Página Admin de Logs de Mensagens WhatsApp

**Status:** pending  
**Dependencies:** 260.1, 260.2  

Desenvolver uma página na área administrativa para exibir o histórico de mensagens WhatsApp 'enviadas' pelo sistema, utilizando os dados mock e o padrão de componentes Shadcn/ui e design dark-only.

**Details:**

Criar uma nova rota em `/admin/configuracoes/whatsapp/logs`. Esta página deve ser 'use client'. Utilizar uma tabela Shadcn/ui (`DataTable`) para exibir os `whatsappMessageLogs` recuperados do `whatsapp-service.ts`, mostrando detalhes como destinatário, template usado, conteúdo da mensagem e timestamp do 'envio'.

### 260.5. Integrar Envio Automático de Notificações WhatsApp em Fluxos Chave

**Status:** pending  
**Dependencies:** 260.2, 260.3  

Modificar a lógica de fluxos existentes, como o cadastro de alunos, para acionar o serviço mock de envio de WhatsApp com templates específicos, simulando notificações automáticas.

**Details:**

Identificar o ponto no código mock onde um novo aluno é 'cadastrado' (ex: em `src/lib/mock/services.ts` ou um arquivo similar que lide com criação de usuários/alunos). Adicionar uma chamada a `whatsappService.sendWhatsappMessage` com um template de 'boas-vindas' (ex: 'welcome_student') e os dados do aluno recém-criado. Adicionalmente, identificar um ponto para simular um lembrete de 'cobrança pendente' ou 'vencimento de matrícula' e integrar uma chamada similar.
