"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Bell, Smartphone, Pencil } from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listDunningTemplatesApi,
  updateDunningTemplateApi,
  type DunningTemplate,
} from "@/lib/api/dunning";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EVENTO_LABELS: Record<string, string> = {
  cobranca_falha_1: "1a falha de cobranca",
  cobranca_falha_2: "2a falha de cobranca",
  cobranca_ultimo_aviso: "Ultimo aviso",
  inadimplencia_suspensao: "Suspensao por inadimplencia",
};

const CANAL_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  EMAIL: Mail,
  PUSH: Bell,
  SMS: Smartphone,
  WHATSAPP: MessageSquare,
};

const CANAL_LABELS: Record<string, string> = {
  EMAIL: "E-mail",
  PUSH: "Push",
  SMS: "SMS",
  WHATSAPP: "WhatsApp",
};

const TEMPLATE_VARIABLES = [
  "{{nomeAluno}}",
  "{{valor}}",
  "{{vencimento}}",
  "{{diasRestantes}}",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DunningTemplatesContent() {
  const { tenantId } = useTenantContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryKey = ["dunning", "templates", tenantId ?? ""];

  const { data: templates = [], isLoading } = useQuery<DunningTemplate[]>({
    queryKey,
    queryFn: () => listDunningTemplatesApi({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
    staleTime: 60_000,
  });

  // Edit modal
  const [editing, setEditing] = useState<DunningTemplate | null>(null);
  const [editAssunto, setEditAssunto] = useState("");
  const [editCorpo, setEditCorpo] = useState("");
  const [saving, setSaving] = useState(false);

  function openEdit(tpl: DunningTemplate) {
    setEditing(tpl);
    setEditAssunto(tpl.assunto);
    setEditCorpo(tpl.corpo);
  }

  async function saveEdit() {
    if (!tenantId || !editing) return;
    setSaving(true);
    try {
      await updateDunningTemplateApi({
        tenantId,
        evento: editing.evento,
        canal: editing.canal,
        data: { assunto: editAssunto, corpo: editCorpo },
      });
      void queryClient.invalidateQueries({ queryKey });
      setEditing(null);
    } catch (err) {
      toast({
        title: "Erro ao salvar template",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function toggleAtivo(tpl: DunningTemplate) {
    if (!tenantId) return;
    try {
      await updateDunningTemplateApi({
        tenantId,
        evento: tpl.evento,
        canal: tpl.canal,
        data: { ativo: !tpl.ativo },
      });
      void queryClient.invalidateQueries({ queryKey });
    } catch (err) {
      toast({
        title: "Erro ao atualizar template",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    }
  }

  // Group by evento
  const grouped = templates.reduce<Record<string, DunningTemplate[]>>((acc, tpl) => {
    const key = tpl.evento;
    if (!acc[key]) acc[key] = [];
    acc[key].push(tpl);
    return acc;
  }, {});

  // Preview: replace variables with example values
  function previewCorpo(corpo: string): string {
    return corpo
      .replace(/\{\{nomeAluno\}\}/g, "Joao Silva")
      .replace(/\{\{valor\}\}/g, "R$ 149,90")
      .replace(/\{\{vencimento\}\}/g, "10/04/2026")
      .replace(/\{\{diasRestantes\}\}/g, "3");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Templates de Notificacao
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure os templates de notificacao enviados automaticamente em cada etapa do
          fluxo de dunning.
        </p>
      </div>

      {/* Variables reference */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Variaveis disponiveis
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TEMPLATE_VARIABLES.map((v) => (
            <span
              key={v}
              className="rounded-md bg-secondary px-2 py-1 font-mono text-xs text-gym-accent"
            >
              {v}
            </span>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
          Carregando templates...
        </div>
      )}

      {/* Grouped cards */}
      {Object.entries(grouped).map(([evento, items]) => (
        <div key={evento} className="space-y-3">
          <h2 className="text-base font-semibold text-foreground">
            {EVENTO_LABELS[evento] ?? evento}
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {items.map((tpl) => {
              const CanalIcon = CANAL_ICONS[tpl.canal] ?? Mail;
              return (
                <motion.div
                  key={tpl.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-lg hover:shadow-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary">
                        <CanalIcon size={16} />
                      </div>
                      <span className="text-sm font-semibold">
                        {CANAL_LABELS[tpl.canal] ?? tpl.canal}
                      </span>
                    </div>
                    <Switch
                      checked={tpl.ativo}
                      onCheckedChange={() => void toggleAtivo(tpl)}
                    />
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Assunto</p>
                    <p className="text-sm">{tpl.assunto || "—"}</p>
                  </div>

                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-semibold text-muted-foreground">Preview</p>
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {previewCorpo(tpl.corpo)}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-border pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-border"
                      onClick={() => openEdit(tpl)}
                    >
                      <Pencil size={14} className="mr-1.5" />
                      Editar
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      ))}

      {!isLoading && templates.length === 0 && (
        <div className="flex min-h-[30vh] items-center justify-center text-sm text-muted-foreground">
          Nenhum template configurado.
        </div>
      )}

      {/* Edit dialog */}
      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!saving && !open) setEditing(null);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar template —{" "}
              {editing
                ? `${EVENTO_LABELS[editing.evento] ?? editing.evento} / ${CANAL_LABELS[editing.canal] ?? editing.canal}`
                : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Assunto
              </label>
              <Input
                value={editAssunto}
                onChange={(e) => setEditAssunto(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">
                Corpo da mensagem
              </label>
              <Textarea
                value={editCorpo}
                onChange={(e) => setEditCorpo(e.target.value)}
                rows={6}
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                Preview
              </p>
              <div className="rounded-lg border border-border bg-secondary/50 p-3 text-sm whitespace-pre-wrap">
                {previewCorpo(editCorpo)}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-border"
              onClick={() => setEditing(null)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => void saveEdit()}
              disabled={saving}
              className="bg-gym-accent text-black hover:bg-gym-accent/90"
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
