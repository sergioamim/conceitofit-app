# Wave 2 - Perfil Web do Aluno

## Objetivo

Refletir no `meu perfil` da area do aluno o documento principal dinamico (`CPF` ou `Passaporte`) e o bloco de `Responsavel` quando houver vinculo.

## Checklist

- [x] Mostrar documento principal dinamico no card de dados pessoais
- [x] Exibir responsavel e contato do responsavel quando presentes
- [x] Validar lint do arquivo alterado
- [x] Registrar status de typecheck global do repo

## Files

- `src/app/(cliente)/meu-perfil/components/meu-perfil-content.tsx`

## Validacao

- `eslint src/app/(cliente)/meu-perfil/components/meu-perfil-content.tsx`
- `tsc --noEmit` global do repo segue com erros preexistentes fora desta story
