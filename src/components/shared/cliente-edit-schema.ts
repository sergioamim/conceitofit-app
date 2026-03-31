import { z } from "zod";

export const clienteEditSchema = z.object({
  nome: z.string().trim().min(1, "Informe o nome."),
  email: z.string().trim().email("E-mail inválido."),
  telefone: z.string().trim().min(1, "Informe o telefone."),
  telefoneSec: z.string().trim().optional().default(""),
  cpf: z.string().trim().min(1, "Informe o CPF."),
  rg: z.string().trim().optional().default(""),
  dataNascimento: z.string().optional().default(""),
  sexo: z.enum(["M", "F", "OUTRO", ""]).default(""),
  enderecoCep: z.string().trim().optional().default(""),
  enderecoLogradouro: z.string().trim().optional().default(""),
  enderecoNumero: z.string().trim().optional().default(""),
  enderecoComplemento: z.string().trim().optional().default(""),
  enderecoBairro: z.string().trim().optional().default(""),
  enderecoCidade: z.string().trim().optional().default(""),
  enderecoEstado: z.string().trim().optional().default(""),
  emergenciaNome: z.string().trim().optional().default(""),
  emergenciaTelefone: z.string().trim().optional().default(""),
  emergenciaParentesco: z.string().trim().optional().default(""),
  observacoesMedicas: z.string().trim().optional().default(""),
});

export type ClienteEditFormValues = z.infer<typeof clienteEditSchema>;
