"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Mail, MessageSquare, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import { useClienteOperationalContext } from "@/lib/query/use-portal-aluno";
import {
  usePreferenciasNotificacao,
  useAtualizarPreferencias,
  type PreferenciasNotificacao,
} from "@/lib/query/use-notificacoes-aluno";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

export default function NotificacoesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { tenantId, userId, tenantResolved } = useTenantContext();

  const { data: context } = useClienteOperationalContext({
    id: userId,
    tenantId,
    enabled: tenantResolved && !!userId,
  });

  const alunoId = context?.aluno?.id;

  const { data: prefs, isLoading } = usePreferenciasNotificacao({
    tenantId,
    alunoId,
    enabled: !!alunoId,
  });

  const mutation = useAtualizarPreferencias();

  const handleToggle = useCallback(
    (key: keyof PreferenciasNotificacao, value: boolean) => {
      if (!tenantId || !alunoId) return;
      mutation.mutate(
        { tenantId, alunoId, data: { [key]: value } },
        {
          onError: (err) =>
            toast({
              title: "Erro ao salvar",
              description: normalizeErrorMessage(err),
              variant: "destructive",
            }),
        },
      );
    },
    [tenantId, alunoId, mutation, toast],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 pb-20">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          aria-label="Voltar para meu perfil"
          onClick={() => router.push("/meu-perfil")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-display text-xl font-bold">Notificações</h1>
      </div>

      {/* E-mail */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">E-mail</h2>
        </div>
        <div className="space-y-1 rounded-2xl border border-border/40 bg-card p-1">
          <ToggleRow
            label="Aulas e reservas"
            description="Confirmação de reserva, cancelamento, waitlist"
            checked={prefs?.emailAulas ?? false}
            onCheckedChange={(v) => handleToggle("emailAulas", v)}
          />
          <ToggleRow
            label="Pagamentos e cobranças"
            description="Vencimento, confirmação de pagamento, 2ª via"
            checked={prefs?.emailPagamentos ?? false}
            onCheckedChange={(v) => handleToggle("emailPagamentos", v)}
          />
          <ToggleRow
            label="Treinos"
            description="Novo treino atribuído, vencimento de ficha"
            checked={prefs?.emailTreinos ?? false}
            onCheckedChange={(v) => handleToggle("emailTreinos", v)}
          />
        </div>
      </section>

      {/* WhatsApp */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">WhatsApp</h2>
        </div>
        <div className="space-y-1 rounded-2xl border border-border/40 bg-card p-1">
          <ToggleRow
            label="Lembretes"
            description="Lembrete de aula, treino pendente"
            checked={prefs?.whatsappLembretes ?? false}
            onCheckedChange={(v) => handleToggle("whatsappLembretes", v)}
          />
          <ToggleRow
            label="Cobranças"
            description="Aviso de vencimento, boleto pendente"
            checked={prefs?.whatsappCobrancas ?? false}
            onCheckedChange={(v) => handleToggle("whatsappCobrancas", v)}
          />
        </div>
      </section>

      {/* Push */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <BellRing className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold">Push (navegador)</h2>
        </div>
        <div className="space-y-1 rounded-2xl border border-border/40 bg-card p-1">
          <ToggleRow
            label="Notificações push"
            description="Receber alertas no navegador quando ativado"
            checked={prefs?.pushAtivado ?? false}
            onCheckedChange={(v) => handleToggle("pushAtivado", v)}
          />
        </div>
        <p className="text-[10px] text-muted-foreground px-1">
          Push requer que o navegador tenha permissão de notificação concedida.
        </p>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 hover:bg-muted/20 transition-colors">
      <div className="space-y-0.5 min-w-0">
        <Label className="text-sm font-semibold cursor-pointer">{label}</Label>
        <p className="text-[11px] text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
      />
    </div>
  );
}
