# Task ID: 448

**Title:** Congelar taxonomia de rotas publicas, auth, portal e backoffice

**Status:** done

**Dependencies:** None

**Priority:** high

**Description:** Formalizar a estrutura alvo do App Router e a matriz de compatibilidade entre rotas atuais e rotas canonicas.

**Details:**

Mapear as superficies atuais em src/app/(public), src/app/storefront, src/app/acesso, src/app/app, src/app/(app), src/app/(backoffice) e src/app/(aluno). Registrar a matriz rota atual -> superficie alvo -> URL canonica -> estrategia de compatibilidade. Confirmar as decisoes base desta reorganizacao: / como landing institucional do SaaS, /acesso/[redeSlug] como entrada canonica por rede, /app/[networkSubdomain] como compatibilidade legada, storefront e adesao como superficies publicas, e o antigo route group (app) como candidato a (portal).

**Test Strategy:**

Revisao manual: conferir que a matriz cobre todas as superficies relevantes de src/app e que cada decisao de compatibilidade esta documentada antes de mover arquivos.
