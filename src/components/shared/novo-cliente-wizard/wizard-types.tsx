import { Check } from "lucide-react";
import { z } from "zod";
import { checkAlunoDuplicidadeService, createAlunoComMatriculaService } from "@/lib/tenant/comercial/runtime";
import { requiredPastDateString, requiredPersonalName } from "@/lib/forms/personal-identity-schemas";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────

export const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

export const STEP_LABELS = ["Dados", "Plano", "Pagamento"];

// ─── Types ─────────────────────────────────────────────────────────────────

export type CriarAlunoComMatriculaResponse = Awaited<ReturnType<typeof createAlunoComMatriculaService>>;

// ─── Helpers ───────────────────────────────────────────────────────────────

export type UniquenessResult = {
  exists: boolean;
  alunoId?: string;
  alunoNome?: string;
};

export async function checkUniqueness(tenantId: string, search: string): Promise<UniquenessResult> {
  if (!search) return { exists: false };
  try {
    const result = await checkAlunoDuplicidadeService({ tenantId, search });
    return {
      exists: result.exists,
      alunoId: result.alunoId,
      alunoNome: result.alunoNome,
    };
  } catch {
    return { exists: false };
  }
}

// ─── ZOD SCHEMA PARA O WIZARD ──────────────────────────────────────────────

const cpfMaskSchema = z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato CPF inválido").or(z.literal(""));

export const clienteWizardSchema = z.object({
  nome: requiredPersonalName("Informe o nome.", "Informe um nome válido."),
  email: requiredTrimmedString("Informe o e-mail.").email("E-mail inválido."),
  telefone: z.string().min(10, "Informe um telefone válido com DDD"),
  telefoneSec: z.string().optional(),
  cpf: cpfMaskSchema,
  estrangeiro: z.boolean().default(false),
  passaporte: z.string().optional(),
  rg: z.string().optional(),
  dataNascimento: requiredPastDateString("Informe a data de nascimento."),
  sexo: z.string().trim().min(1, "Selecione o sexo."),
  enderecoCep: z.string().optional(),
  enderecoLogradouro: z.string().optional(),
  enderecoNumero: z.string().optional(),
  enderecoComplemento: z.string().optional(),
  enderecoBairro: z.string().optional(),
  enderecoCidade: z.string().optional(),
  enderecoEstado: z.string().optional(),
  emergenciaNome: z.string().optional(),
  emergenciaTelefone: z.string().optional(),
  emergenciaParentesco: z.string().optional(),
  temResponsavel: z.boolean().default(false),
  responsavelClienteId: z.string().optional(),
  responsavelNome: z.string().optional(),
  responsavelCpf: cpfMaskSchema.optional(),
  responsavelEmail: z.string().email("E-mail inválido").or(z.literal("")).optional(),
  responsavelTelefone: z.string().optional(),
  responsavelParentesco: z.string().optional(),
  observacoesMedicas: z.string().optional(),
  foto: z.string().optional(),

  selectedPlano: z.string().optional(),

  pagamento: z.object({
    dataInicio: z.string().optional(),
    formaPagamento: z.string().optional(),
    desconto: z.string().optional(),
    diaCobranca: z.string().optional(),
    cupomCodigo: z.string().optional(),
    convenioId: z.string().optional(),
    cartaoNumero: z.string().optional(),
    cartaoValidade: z.string().optional(),
    cartaoCvv: z.string().optional(),
    cartaoCpfTitular: z.string().optional(),
  }),
}).superRefine((values, ctx) => {
  if (!values.estrangeiro && !values.temResponsavel && !values.cpf) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cpf"],
      message: "CPF é obrigatório quando não houver passaporte ou responsável.",
    });
  }

  if (values.estrangeiro && !values.passaporte?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["passaporte"],
      message: "Passaporte é obrigatório para estrangeiro.",
    });
  }

  if (values.temResponsavel) {
    if (!values.responsavelNome?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsavelNome"],
        message: "Nome do responsável é obrigatório.",
      });
    }
    if (!values.responsavelCpf?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["responsavelCpf"],
        message: "CPF do responsável é obrigatório.",
      });
    }
  }
});

export type ClienteWizardForm = z.infer<typeof clienteWizardSchema>;

// ─── Step indicator ────────────────────────────────────────────────────────

export function StepDot({ step, current }: { step: number; current: number }) {
  const done = step < current;
  const active = step === current;
  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex size-8 items-center justify-center rounded-full text-xs font-bold transition-all",
        done ? "bg-gym-teal text-background shadow-sm" : active ? "bg-gym-accent text-background shadow-sm" : "bg-muted text-muted-foreground"
      )}>
        {done ? <Check className="size-4" /> : step}
      </div>
      <span className={cn(
        "text-xs font-semibold uppercase tracking-wide",
        active ? "text-foreground" : "text-muted-foreground"
      )}>
        {STEP_LABELS[step - 1]}
      </span>
    </div>
  );
}
