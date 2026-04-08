import { z } from "zod";

// ── Edição de perfil ────────────────────────────────────────

export const editarPerfilSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres.").max(120),
  email: z.email("E-mail inválido."),
  telefone: z.string().trim().min(10, "Telefone inválido.").max(15),
  dataNascimento: z.string().trim().min(1, "Data de nascimento é obrigatória."),
  cep: z.string().trim().optional(),
  logradouro: z.string().trim().optional(),
  numero: z.string().trim().optional(),
  complemento: z.string().trim().optional(),
  bairro: z.string().trim().optional(),
  cidade: z.string().trim().optional(),
  estado: z.string().trim().max(2).optional(),
});

export type EditarPerfilFormValues = z.infer<typeof editarPerfilSchema>;

// ── Troca de senha ──────────────────────────────────────────

export const trocarSenhaSchema = z
  .object({
    senhaAtual: z.string().min(1, "Informe a senha atual."),
    novaSenha: z.string().min(8, "A nova senha deve ter no mínimo 8 caracteres."),
    confirmarSenha: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((data) => data.novaSenha === data.confirmarSenha, {
    message: "As senhas não coincidem.",
    path: ["confirmarSenha"],
  });

export type TrocarSenhaFormValues = z.infer<typeof trocarSenhaSchema>;
