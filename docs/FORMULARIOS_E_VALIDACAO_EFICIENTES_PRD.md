# PRD: Formulários de Alta Confiança e Validação Proativa (UX)

## 1. Contexto e Problema
O sistema possui formulários densos (cadastro de cliente, configuração de planos, matrículas complexas). Atualmente, o usuário só descobre erros após tentar enviar o formulário ("Submit"), e pode perder dados se a página recarregar ou se ele navegar para fora acidentalmente. Além disso, em telas longas, o botão de salvar fica "escondido" no final da página, exigindo scroll extra.

## 2. Objetivos
- **Segurança de Dados:** Impedir a perda de progresso em formulários parcialmente preenchidos.
- **Feedback Imediato:** Validar campos críticos (CPF, Email, Datas) antes do envio final.
- **Acessibilidade de Ação:** Manter as ações principais (Salvar/Cancelar) sempre visíveis.

## 3. Funcionalidades Detalhadas

### 3.1. Sticky Action Footer (Rodapé de Ação Fixo)
- Implementar um componente de rodapé que "gruda" na parte inferior da viewport em formulários que excedem a altura da tela.
- **Benefício:** O usuário pode salvar a qualquer momento sem precisar rolar até o fim. Melhora a taxa de conversão em cadastros longos.

### 3.2. Validação Inline e Assíncrona (Feedback em Tempo Real)
- Configurar o `react-hook-form` para validar campos críticos no modo `onBlur` ou `onChange`.
- Integrar validações assíncronas (ex: verificar se o CPF já existe na base) enquanto o usuário ainda está no campo.
- **Benefício:** Reduz a frustração de preencher tudo e ser barrado por um erro simples no topo do form.

### 3.3. Draft System (Auto-save Local)
- Implementar um mecanismo que salva o estado do formulário no `localStorage` conforme o usuário digita.
- Oferecer a opção "Continuar de onde parou" se o usuário retornar a um formulário abandonado.
- **Benefício:** Proteção contra quedas de energia, fechamento acidental de abas ou expiração de sessão.

## 4. Requisitos Técnicos
- **Frontend:** React Hook Form (modos de validação), Zod (schemas), LocalStorage API.
- **Componentização:** Criar um `FormShell` ou `FormFooter` padronizado.

## 5. Plano de Execução
1. **Fase 1:** Criar o componente `StickyFormFooter` e aplicar nos formulários principais.
2. **Fase 2:** Evoluir schemas de validação para suporte inline e feedbacks visuais imediatos.
3. **Fase 3:** Implementar o hook `useFormDraft` para persistência local de rascunhos.
