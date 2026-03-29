import { Check } from "lucide-react";
import { z } from "zod";
import { checkAlunoDuplicidadeService, createAlunoComMatriculaService } from "@/lib/tenant/comercial/runtime";
import { cn } from "@/lib/utils";

// ─── Constants ─────────────────────────────────────────────────────────────

export const TIPO_PLANO_LABEL: Record<string, string> = { MENSAL: "Mensal", TRIMESTRAL: "Trimestral", SEMESTRAL: "Semestral", ANUAL: "Anual", AVULSO: "Avulso" };

export const STEP_LABELS = ["Dados", "Plano", "Pagamento"];

// ─── Types ─────────────────────────────────────────────────────────────────

export type CriarAlunoComMatriculaResponse = Awaited<ReturnType<typeof createAlunoComMatriculaService>>;

// ─── Helpers ───────────────────────────────────────────────────────────────

export function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

export async function checkUniqueness(tenantId: string, search: string) {
  if (!search) return false;
  try {
    const result = await checkAlunoDuplicidadeService({ tenantId, search });
    return result.exists;
  } catch {
    return false;
  }
}

export function normalizeDraftEmail(nome: string, cpf: string, email?: string) {
  const trimmed = email?.trim();
  if (trimmed) return trimmed;
  const cpfDigits = (cpf || "").replace(/\D/g, "");
  const slug = (nome || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const base = slug || cpfDigits || "cliente";
  return `${base}.${Date.now()}@temporario.local`;
}

// ─── ZOD SCHEMA PARA O WIZARD ──────────────────────────────────────────────

export const clienteWizardSchema = z.object({
  nome: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido").or(z.literal("")),
  telefone: z.string().min(10, "Informe um telefone válido com DDD"),
  telefoneSec: z.string().optional(),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "Formato CPF inválido").or(z.literal("")),
  rg: z.string().optional(),
  dataNascimento: z.string().optional(),
  sexo: z.string().optional(),
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
