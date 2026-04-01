# Task ID: 288

**Title:** Backend: Criar endpoint de login global para administradores

**Status:** done

**Dependencies:** 62 ✓, 63 ✓

**Priority:** high

**Description:** Implementar um novo endpoint POST /api/v1/admin/auth/login para autenticação de usuários com acesso elevado (ADMIN/OWNER), que não exige X-Rede-Identifier e retorna um token JWT com escopo GLOBAL.

**Details:**

Criar ou estender um controlador de autenticação (ex: src/modules/auth/auth.controller.ts ou um novo src/modules/admin-auth/admin-auth.controller.ts) com o endpoint POST /api/v1/admin/auth/login. Este endpoint deve aceitar credenciais de usuário (email/username e senha). No serviço de autenticação associado (ex: src/modules/auth/auth.service.ts ou um novo src/modules/admin-auth/admin-auth.service.ts), implementar a lógica para: autenticar o usuário com as credenciais fornecidas; verificar se o usuário possui os perfis ADMIN ou OWNER (o serviço de usuários, ex: src/modules/users/users.service.ts, deve fornecer essa informação); gerar um token JWT onde o payload deve incluir um claim 'scope' definido como 'GLOBAL'; garantir que este fluxo não dependa e nem tente resolver o X-Rede-Identifier. Revisar o endpoint existente POST /api/v1/auth/login para confirmar que ele continua exigindo o X-Rede-Identifier (conforme definido nas Tasks 62 e 63) e que o token gerado por ele não contenha o scope GLOBAL, mas sim um scope específico da academia. Pode ser necessário ajustar um middleware ou guarda ('guard') existente para aplicar essa restrição. Atualizar a documentação da API (Swagger/OpenAPI) para incluir o novo endpoint e suas características.

**Test Strategy:**

1. Login Admin bem-sucedido: Tentar fazer login em POST /api/v1/admin/auth/login com credenciais de um usuário ADMIN ou OWNER. Verificar se um token JWT é retornado. Decodificar o token JWT e confirmar que o claim 'scope' está definido como 'GLOBAL'. Confirmar que o request foi bem-sucedido mesmo sem o header X-Rede-Identifier. 2. Login Admin falho (sem privilégios): Tentar fazer login em POST /api/v1/admin/auth/login com credenciais de um usuário operador de academia (sem ADMIN/OWNER). Verificar se o login falha com um erro de autorização. 3. Login Admin falho (credenciais inválidas): Tentar fazer login em POST /api/v1/admin/auth/login com credenciais inválidas. Verificar se o login falha com um erro apropriado (ex: 401 Unauthorized). 4. Endpoint de Login de Rede (Existente): Tentar fazer login em POST /api/v1/auth/login sem o header X-Rede-Identifier. Verificar se o login falha, confirmando que a exigência do X-Rede-Identifier ainda está ativa para este endpoint. Tentar fazer login em POST /api/v1/auth/login com X-Rede-Identifier e credenciais válidas. Verificar se um token é retornado. Decodificar o token e confirmar que o claim 'scope' não está definido como 'GLOBAL'. 5. Testes de Integração: Desenvolver testes de integração que simulem os fluxos de login para ambos os endpoints e verifiquem a correta emissão e validação dos tokens e escopos.
