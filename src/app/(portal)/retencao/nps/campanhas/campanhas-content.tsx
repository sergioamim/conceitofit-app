"use client";

import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Megaphone,
  Pencil,
  Plus,
  Send,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listNpsCampanhasApi,
  createNpsCampanhaApi,
  updateNpsCampanhaApi,
  dispararNpsCampanhaApi,
  type NpsCampanha,
  type PesquisaTipo,
  type CanalNotificacao,
} from "@/lib/api/nps";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { ListErrorState } from "@/components/shared/list-states";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const campanhasKeys = {
  list: (tenantId: string) => ["nps", "campanhas", tenantId] as const,
};

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const campanhaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatorio"),
  tipo: z.enum(["NPS", "SATISFACAO"]),
  gatilho: z.string().optional(),
  pergunta: z.string().min(1, "Pergunta obrigatoria"),
  mensagemConvite: z.string().optional(),
  canalPadrao: z.enum(["EMAIL", "PUSH", "SMS", "WHATSAPP"]).optional(),
  diasCooldown: z.coerce.number().min(0).optional(),
  ativo: z.boolean().optional(),
});

type CampanhaFormData = z.infer<typeof campanhaSchema>;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampanhasContent({
  initialData,
}: {
  initialData: NpsCampanha[] | null;
}) {
  const { tenantId } = useTenantContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampanha, setEditingCampanha] = useState<NpsCampanha | null>(
    null,
  );
  const [dispararLoading, setDispararLoading] = useState<string | null>(null);

  // Query
  const {
    data: campanhas = [],
    isLoading,
    error,
  } = useQuery<NpsCampanha[]>({
    queryKey: campanhasKeys.list(tenantId ?? ""),
    queryFn: () => listNpsCampanhasApi({ tenantId: tenantId! }),
    enabled: Boolean(tenantId),
    staleTime: 30_000,
    initialData: initialData ?? undefined,
  });

  // Form
  const form = useForm<CampanhaFormData>({
    resolver: zodResolver(campanhaSchema),
    mode: "onTouched",
    defaultValues: {
      nome: "",
      tipo: "NPS",
      gatilho: "",
      pergunta: "",
      mensagemConvite: "",
      canalPadrao: undefined,
      diasCooldown: 30,
      ativo: true,
    },
  });

  // Manual required-fields watcher to avoid running zodResolver on mount,
  // which would surface a ZodError in the Next.js dev overlay before the
  // modal is even opened. "onTouched" keeps inline errors after first blur.
  const watchedNome = form.watch("nome");
  const watchedPergunta = form.watch("pergunta");
  const canSave = Boolean(watchedNome?.trim()) && Boolean(watchedPergunta?.trim());

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CampanhaFormData) =>
      createNpsCampanhaApi({ tenantId: tenantId!, data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: campanhasKeys.list(tenantId!),
      });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CampanhaFormData) =>
      updateNpsCampanhaApi({
        tenantId: tenantId!,
        campanhaId: editingCampanha!.id,
        data,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: campanhasKeys.list(tenantId!),
      });
      closeModal();
    },
  });

  // Handlers
  function openCreate() {
    setEditingCampanha(null);
    form.reset({
      nome: "",
      tipo: "NPS",
      gatilho: "",
      pergunta: "",
      mensagemConvite: "",
      canalPadrao: undefined,
      diasCooldown: 30,
      ativo: true,
    });
    setModalOpen(true);
  }

  function openEdit(campanha: NpsCampanha) {
    setEditingCampanha(campanha);
    form.reset({
      nome: campanha.nome,
      tipo: campanha.tipo,
      gatilho: campanha.gatilho ?? "",
      pergunta: campanha.pergunta,
      mensagemConvite: campanha.mensagemConvite ?? "",
      canalPadrao: campanha.canalPadrao ?? undefined,
      diasCooldown: campanha.diasCooldown,
      ativo: campanha.ativo,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingCampanha(null);
    form.reset();
  }

  function onSubmit(data: CampanhaFormData) {
    if (editingCampanha) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  }

  async function handleDisparar(campanhaId: string) {
    if (!tenantId) return;
    setDispararLoading(campanhaId);
    try {
      await dispararNpsCampanhaApi({ tenantId, campanhaId });
      toast({
        title: "Campanha disparada",
        description: "As notificações serão enviadas aos alunos elegíveis.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao disparar campanha",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
      });
    } finally {
      setDispararLoading(null);
    }
  }

  const saving = createMutation.isPending || updateMutation.isPending;
  const mutationError = createMutation.error || updateMutation.error;

  // Render
  if (isLoading && campanhas.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
        Carregando campanhas...
      </div>
    );
  }

  if (error && campanhas.length === 0) {
    return <ListErrorState error={normalizeErrorMessage(error)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Campanhas NPS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie campanhas de pesquisa de satisfacao e NPS.
          </p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-gym-accent text-black hover:bg-gym-accent/90"
        >
          <Plus size={16} className="mr-1.5" />
          Nova campanha
        </Button>
      </div>

      {/* List */}
      <div className="grid gap-4">
        {campanhas.length === 0 && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            Nenhuma campanha cadastrada.
          </div>
        )}
        {campanhas.map((campanha) => (
          <motion.div
            key={campanha.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card rounded-2xl border p-5 transition-all hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base font-bold tracking-tight">
                      {campanha.nome}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        campanha.tipo === "NPS"
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-gym-teal/15 text-gym-teal"
                      }`}
                    >
                      {campanha.tipo}
                    </span>
                    {campanha.ativo ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-gym-teal">
                        <ToggleRight size={12} /> Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-muted-foreground">
                        <ToggleLeft size={12} /> Inativo
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {campanha.pergunta}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {campanha.canalPadrao && (
                      <span>Canal: {campanha.canalPadrao}</span>
                    )}
                    <span>Cooldown: {campanha.diasCooldown} dias</span>
                    {campanha.gatilho && (
                      <span>Gatilho: {campanha.gatilho}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    onClick={() => openEdit(campanha)}
                  >
                    <Pencil size={14} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    disabled={dispararLoading === campanha.id}
                    onClick={() => void handleDisparar(campanha.id)}
                  >
                    <Send size={14} className="mr-1" />
                    {dispararLoading === campanha.id
                      ? "Disparando..."
                      : "Disparar"}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(open) => !saving && setModalOpen(open)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCampanha ? "Editar campanha" : "Nova campanha"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-gym-danger">*</span>
              </Label>
              <Input
                id="nome"
                {...form.register("nome")}
                placeholder="Nome da campanha"
                aria-invalid={form.formState.errors.nome ? "true" : "false"}
                className="bg-secondary border-border"
              />
              {form.formState.errors.nome && (
                <p className="text-xs text-gym-danger">
                  {form.formState.errors.nome.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.watch("tipo")}
                  onValueChange={(v) =>
                    form.setValue("tipo", v as PesquisaTipo)
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="NPS">NPS</SelectItem>
                    <SelectItem value="SATISFACAO">Satisfacao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Canal padrao</Label>
                <Select
                  value={form.watch("canalPadrao") ?? ""}
                  onValueChange={(v) =>
                    form.setValue(
                      "canalPadrao",
                      v as CanalNotificacao | undefined,
                    )
                  }
                >
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PUSH">Push</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pergunta">
                Pergunta <span className="text-gym-danger">*</span>
              </Label>
              <Textarea
                id="pergunta"
                {...form.register("pergunta")}
                placeholder="De 0 a 10, qual a probabilidade de voce recomendar nossa academia?"
                aria-invalid={form.formState.errors.pergunta ? "true" : "false"}
                className="bg-secondary border-border min-h-[80px]"
              />
              {form.formState.errors.pergunta && (
                <p className="text-xs text-gym-danger">
                  {form.formState.errors.pergunta.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="mensagemConvite">Mensagem de convite</Label>
              <Textarea
                id="mensagemConvite"
                {...form.register("mensagemConvite")}
                placeholder="Mensagem enviada ao aluno (opcional)"
                className="bg-secondary border-border min-h-[60px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gatilho">Gatilho</Label>
                <Input
                  id="gatilho"
                  {...form.register("gatilho")}
                  placeholder="Ex: CHECKIN_30D"
                  className="bg-secondary border-border"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diasCooldown">Cooldown (dias)</Label>
                <Input
                  id="diasCooldown"
                  type="number"
                  {...form.register("diasCooldown")}
                  className="bg-secondary border-border"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                id="ativo"
                checked={form.watch("ativo") ?? true}
                onCheckedChange={(v) => form.setValue("ativo", v)}
              />
              <Label htmlFor="ativo">Campanha ativa</Label>
            </div>

            {mutationError && (
              <p className="text-sm text-gym-danger">
                {normalizeErrorMessage(mutationError)}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="border-border"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving || !canSave}
                className="bg-gym-accent text-black hover:bg-gym-accent/90"
              >
                {saving
                  ? "Salvando..."
                  : editingCampanha
                    ? "Salvar"
                    : "Criar campanha"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
