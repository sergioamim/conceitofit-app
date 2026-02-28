# Plano para Totem de Autoatendimento (kiosk) da rede Conceito.fit

## 1) Objetivo e escopo
- Totem físico em unidades para autoatendimento de alunos/visitantes: check-in, visualização de treino, impressão de ficha, consulta de vencimentos e atualização mínima de cadastro.
- Deve isolar-se da superfície pública; operar com autenticação local ao tenant e sem navegação livre.

## 2) Domínio e deploy
- Subdomínio dedicado, ex.: `totem.conceito.fit` ou `kiosk.conceito.fit`; pode incluir o tenant no host (`<tenant>.totem.conceito.fit`) ou via query/flag na instalação.
- Build do frontend separado (App Router + TypeScript) em `apps/totem` ou `src/app-totem`, compartilhando design system e tipos com o restante do monorepo.
- Rodar em modo kiosk/fullscreen (Chromium) com cache agressivo; CSP restritiva e `X-Frame-Options`/`Permissions-Policy` adequadas.

## 3) Autenticação
- **Primária**: reconhecimento facial (opt-in) com detecção de vivacidade. Exige cadastro prévio da biometria no app/recepção; associa `faceId` ao `clienteId`/`tenantId`.
- **Alternativas**: QR code gerado no app, código curto/PIN, CPF + data de nascimento como fallback de baixa fricção.
- Sempre limitar o contexto ao tenant fixo do totem; não permitir troca de academia/unidade na UI do totem.
- Sessão curta (ex.: 2–3 min de inatividade) e logout automático após concluir fluxo.

## 4) Fluxos suportados (MVP)
- Check-in rápido (registro de presença).
- Visualizar treino do dia/semana; opção de imprimir ficha resumida (sem dados sensíveis desnecessários).
- Mostrar status financeiro básico (pago/vencido) com mensagem padrão; ações de pagamento direcionam para app ou QR de cobrança (não concluir pagamento no totem no MVP).
- Atualizar dados de contato mínimos (telefone/email) com validação simples.

## 5) Reconhecimento facial: diretrizes de privacidade e segurança
- Consentimento explícito no cadastro; permitir revogação fácil e exclusão da biometria.
- Armazenar embeddings/faces em serviço seguro; não guardar imagem bruta além do necessário para a extração. Criptografia em repouso e trânsito.
- Liveness (movimento/iluminação) e limite de tentativas; fallback para PIN/QR se falhar.
- Audit log: tentativas de autenticação, sucesso/erro, `tenantId`, timestamp, `X-Context-Id`.
- Opção de “não usar biometria neste terminal” para usuários que optam por privacidade.

## 6) UX e acessibilidade para totem
- Layout otimizado para toque e distância: botões grandes, contraste alto, texto em linguagem simples; fluxo linear sem menus profundos.
- Teclado virtual para campos sensíveis, ocultando inputs após uso.
- Feedback claro de tempo restante da sessão; botão de encerrar sessão visível.
- Modo offline parcial: exibir aviso se sem rede; operações críticas (check-in) devem ser enfileiradas localmente e reenviadas quando a conexão voltar.

## 7) Integração com backend
- API de totem dedicada ou reuso das rotas de aluno com header fixo de tenant (`tenantId`) e `X-Context-Id` gerado por sessão.
- Endpoints específicos para: autenticação facial/QR/PIN, check-in, obter treino do dia, imprimir ficha (HTML/PDF leve), atualizar contato básico.
- Idempotência para check-in (evitar duplicidade).
- Para biometria, preferir um serviço especializado (interno ou provedor) acessado via backend; o frontend só captura câmera e envia frames de curta duração.

## 8) Impressão
- Uso de `window.print()` com stylesheet dedicado para fichas; ou gerar PDF leve no backend e abrir em aba oculta para impressão direta.
- Perfil de impressão compacto (58/80mm se for térmica) sem imagens pesadas; incluir nome, exercício, séries/reps, observações curtas.

## 9) Segurança física e lógica
- Bloquear teclado físico para atalhos de sistema quando em modo kiosk; ocultar barra de endereço e desativar gestos de navegação se possível.
- Whitelist de origens e CSP com fontes/imagens locais; desabilitar armazenamento de credenciais no browser.
- Monitorar integridade do dispositivo (heartbeat do totem + healthcheck) e exibir modo “manutenção” se o backend estiver indisponível.

## 10) Roadmap sugerido
1. Definir host e estrutura `apps/totem`; habilitar PWA + kiosk mode e CSP restrita.
2. Implementar autenticação QR/PIN (primeiro) e check-in idempotente; depois habilitar facial com liveness.
3. Entregar treino + impressão com folha dedicada; adicionar resumo financeiro somente leitura.
4. Implementar fila offline para check-in e sync automático.
5. Hardening: testes de usabilidade em tela grande, pen-test focado em bypass de sessão e na captura de câmera.
