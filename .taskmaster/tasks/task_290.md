# Task ID: 290

**Title:** Extender Modelo de Tema do Storefront com Novos Campos

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Adicionar novas colunas na tabela storefront_themes via Flyway, mapear os campos na entidade, atualizar a lógica de persistência no serviço e estender a resposta da API para incluir os novos atributos do tema do storefront.

**Details:**

1.  **Flyway Migration**: Criar um novo script de migração Flyway (ex: `VXXX__add_storefront_theme_fields.sql` em `src/main/resources/db/migration`). Adicionar as colunas `hero_image_url` VARCHAR(255) NULL, `hero_title` VARCHAR(255) NULL, `hero_subtitle` VARCHAR(255) NULL, `theme_preset` VARCHAR(50) DEFAULT 'DEFAULT' NOT NULL, `use_custom_colors` BOOLEAN DEFAULT FALSE NOT NULL, `colors` JSONB NULL, `footer_text` TEXT NULL, `instagram` VARCHAR(255) NULL, `facebook` VARCHAR(255) NULL, `whatsapp` VARCHAR(255) NULL à tabela `storefront_themes`.
2.  **Atualizar StorefrontThemeEntity**: Localizar `StorefrontThemeEntity.java` (provavelmente em `src/main/java/.../storefront/theme/`) e adicionar os novos atributos como campos da classe, utilizando as anotações JPA apropriadas (ex: `@Column(name = "hero_image_url")`). Para `colors` (JSONB), usar a anotação `@Type(type = "jsonb")` se houver um tipo customizado ou tratar a serialização/desserialização manualmente. Adicionar getters e setters para os novos campos.
3.  **Atualizar StorefrontThemeService**: No método `applyRequest(StorefrontThemeEntity entity, StorefrontThemeRequest request)` dentro de `StorefrontThemeService.java`, mapear os novos campos do `StorefrontThemeRequest` para a `StorefrontThemeEntity`, garantindo que a lógica de persistência inclua esses valores. Lidar com a conversão do campo `colors` (String JSON do request para JSONB na entidade).
4.  **Atualizar StorefrontThemeResponse**: Adicionar os novos campos ao DTO `StorefrontThemeResponse.java` e atualizar o construtor ou método de mapeamento (ex: `of(StorefrontThemeEntity entity)`) para popular esses campos a partir da entidade.

**Test Strategy:**

1.  **Executar Migração**: Iniciar a aplicação e verificar se a migração Flyway foi aplicada com sucesso, confirmando a presença das novas colunas na tabela `storefront_themes` no banco de dados com os tipos e restrições corretas.
2.  **Testes de Integração - Criação/Atualização**: Criar ou atualizar um teste de integração para o endpoint de criação/atualização de tema (`POST`/`PUT` `/api/v1/storefront/themes` ou similar). Enviar um `StorefrontThemeRequest` com valores para todos os novos campos. Validar que a resposta da API (`StorefrontThemeResponse`) inclui os dados corretos e que a persistência no banco de dados foi bem-sucedida, especialmente para o campo `colors` (JSONB).
3.  **Testes de Leitura - Recuperação**: Criar ou atualizar um teste de integração para o endpoint de recuperação de tema (`GET` `/api/v1/storefront/themes/{id}` ou `/publico/storefront/{slug}/theme`). Verificar se a resposta da API retorna todos os novos campos com os valores esperados que foram previamente persistidos.
4.  **Verificação de Valores Padrão**: Testar a criação de um tema sem especificar os campos `theme_preset` e `use_custom_colors`. Confirmar que os valores padrão (`DEFAULT` e `FALSE`, respectivamente) são aplicados corretamente no banco de dados.
