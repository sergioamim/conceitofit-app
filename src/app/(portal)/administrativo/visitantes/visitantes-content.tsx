"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  LogIn,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListErrorState } from "@/components/shared/list-states";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useTenantContext } from "@/lib/tenant/hooks/use-session-context";
import {
  listVisitantesAtivosApi,
  registrarVisitanteApi,
  revogarVisitanteApi,
  validarAcessoVisitanteApi,
  registrarEntradaVisitanteApi,
  type RegistrarVisitantePayload,
  type TipoVisitante,
  type ValidacaoVisitanteResult,
  type Visitante,
} from "@/lib/api/visitantes";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { formatBRL, formatDateTimeBR } from "@/lib/formatters";

const TIPO_OPTIONS: Array<{ value: TipoVisitante; label: string }> = [
  { value: "DAY_USE", label: "Day-use" },
  { value: "AULA_EXPERIMENTAL", label: "Aula experimental" },
  { value: "CONVIDADO", label: "Convidado" },
];

const TIPO_LABEL: Record<TipoVisitante, string> = {
  DAY_USE: "Day-use",
  AULA_EXPERIMENTAL: "Aula experimental",
  CONVIDADO: "Convidado",
};

const TIPO_CLASS: Record<TipoVisitante, string> = {
  DAY_USE: "bg-gym-accent/15 text-gym-accent",
  AULA_EXPERIMENTAL: "bg-gym-teal/15 text-gym-teal",
  CONVIDADO: "bg-gym-warning/15 text-gym-warning",
};

const registrarSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome do visitante."),
  documento: z.string().trim().optional(),
  telefone: z.string().trim().optional(),
  email: z.string().trim().email("E-mail inválido").or(z.literal("")).optional(),
  tipo: z.enum(["DAY_USE", "AULA_EXPERIMENTAL", "CONVIDADO"]),
  validoAte: z.string().min(1, "Informe a data/hora de validade."),
  maxEntradas: z.coerce.number().int().positive().max(10).optional(),
  valorCobrado: z.coerce.number().nonnegative().optional(),
  observacoes: z.string().trim().max(500).optional(),
});

type RegistrarFormValues = z.infer<typeof registrarSchema>;

function defaultValidoAte(): string {
  // Amanhã mesmo horário em formato compatível com datetime-local
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Pagina de gestao de visitantes (Task #541).
 * Consome todo o VisitanteController do BE: listar ativos, registrar, validar
 * codigo de acesso, registrar entrada (liberar catraca), revogar.
 *
 * NOTA: A integracao com CatracaFaceSyncController (/api/v1/integracoes/catraca/
 * faces/sync) para sincronizar foto do visitante fica como follow-up —
 * requer upload de foto + integracao separada. Nao bloqueia a funcionalidade
 * principal da task.
 */
export function VisitantesContent() {
  const { tenantId, tenantResolved } = useTenantContext();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>("TODOS");
  const [registrarOpen, setRegistrarOpen] = useState(false);
  const [validarOpen, setValidarOpen] = useState(false);
  const [codigoValidar, setCodigoValidar] = useState("");
  const [deviceIdEntrada, setDeviceIdEntrada] = useState("");
  const [validacaoResult, setValidacaoResult] = useState<ValidacaoVisitanteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const query = useQuery<Visitante[]>({
    queryKey: ["visitantes", "ativos", tenantId],
    queryFn: () => listVisitantesAtivosApi({ tenantId }),
    enabled: tenantResolved && Boolean(tenantId),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const items = query.data ?? [];
  const loadError = query.error instanceof Error ? query.error.message : null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((v) => {
      if (tipoFilter !== "TODOS" && v.tipo !== tipoFilter) return false;
      if (!term) return true;
      return [v.nome, v.documento, v.codigoAcesso].filter(Boolean).join(" ").toLowerCase().includes(term);
    });
  }, [items, search, tipoFilter]);

  const stats = useMemo(() => {
    const hoje = filtered.filter((v) => v.entradasRealizadas > 0).length;
    const pendentes = filtered.filter((v) => v.entradasRealizadas === 0 && !v.revogado).length;
    const revogados = filtered.filter((v) => v.revogado).length;
    return { total: filtered.length, hoje, pendentes, revogados };
  }, [filtered]);

  const form = useForm<RegistrarFormValues>({
    resolver: zodResolver(registrarSchema),
    defaultValues: {
      nome: "",
      documento: "",
      telefone: "",
      email: "",
      tipo: "DAY_USE",
      validoAte: defaultValidoAte(),
      maxEntradas: 1,
      valorCobrado: undefined,
      observacoes: "",
    },
  });

  const registrarMutation = useMutation({
    mutationFn: (data: RegistrarVisitantePayload) =>
      registrarVisitanteApi({ tenantId, data }),
    onSuccess: (v) => {
      void queryClient.invalidateQueries({ queryKey: ["visitantes", "ativos", tenantId] });
      setSuccess(`Visitante ${v.nome} cadastrado. Código: ${v.codigoAcesso}`);
      setTimeout(() => setSuccess(null), 5000);
      setRegistrarOpen(false);
      form.reset({
        nome: "",
        documento: "",
        telefone: "",
        email: "",
        tipo: "DAY_USE",
        validoAte: defaultValidoAte(),
        maxEntradas: 1,
        valorCobrado: undefined,
        observacoes: "",
      });
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const revogarMutation = useMutation({
    mutationFn: (visitanteId: string) => revogarVisitanteApi({ tenantId, visitanteId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["visitantes", "ativos", tenantId] });
      setSuccess("Acesso do visitante revogado.");
      setTimeout(() => setSuccess(null), 3000);
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  const entradaMutation = useMutation({
    mutationFn: () =>
      registrarEntradaVisitanteApi({
        tenantId,
        codigoAcesso: codigoValidar,
        deviceId: deviceIdEntrada || undefined,
      }),
    onSuccess: (v) => {
      void queryClient.invalidateQueries({ queryKey: ["visitantes", "ativos", tenantId] });
      setSuccess(
        `Entrada registrada: ${v.nome} (${v.entradasRealizadas}/${v.maxEntradas}).`
      );
      setTimeout(() => setSuccess(null), 5000);
      setValidarOpen(false);
      setCodigoValidar("");
      setDeviceIdEntrada("");
      setValidacaoResult(null);
    },
    onError: (e) => setError(normalizeErrorMessage(e)),
  });

  async function handleValidar() {
    if (!codigoValidar.trim()) return;
    setError(null);
    try {
      const result = await validarAcessoVisitanteApi({ tenantId, codigoAcesso: codigoValidar });
      setValidacaoResult(result);
    } catch (e) {
      setError(normalizeErrorMessage(e));
    }
  }

  function onSubmitRegistrar(values: RegistrarFormValues) {
    setError(null);
    const payload: RegistrarVisitantePayload = {
      nome: values.nome,
      documento: values.documento || undefined,
      telefone: values.telefone || undefined,
      email: values.email || undefined,
      tipo: values.tipo,
      validoAte: new Date(values.validoAte).toISOString(),
      maxEntradas: values.maxEntradas ?? 1,
      valorCobrado: values.valorCobrado,
      observacoes: values.observacoes || undefined,
    };
    registrarMutation.mutate(payload);
  }

  function handleRevogar(v: Visitante) {
    confirm(`Revogar acesso de ${v.nome}? O visitante não poderá mais entrar.`, () => {
      revogarMutation.mutate(v.id);
    });
  }

  return (
    <div className="space-y-6">
      {ConfirmDialog}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Administrativo
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Visitantes</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Day-use, aulas experimentais e convidados. Libere acesso temporário pela catraca.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="border-border" onClick={() => setValidarOpen(true)}>
            <ShieldCheck className="size-4" />
            Validar código
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={() => void query.refetch()}
            disabled={query.isFetching}
          >
            <RefreshCw className={`size-4 ${query.isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setRegistrarOpen(true)}>
            <Plus className="size-4" />
            Novo visitante
          </Button>
        </div>
      </div>

      {loadError ? (
        <ListErrorState error={loadError} onRetry={() => void query.refetch()} />
      ) : null}

      {(error || success) ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {error ?? success}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Total ativos
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Já entraram
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-teal">{stats.hoje}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Aguardando
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-warning">
            {stats.pendentes}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Revogados
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold text-gym-danger">
            {stats.revogados}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar nome, documento ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-border bg-secondary pl-9"
            />
          </div>
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="TODOS">Todos os tipos</SelectItem>
              {TIPO_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-card/60" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
          Nenhum visitante ativo encontrado.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-3 py-2 text-left font-semibold">Nome</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Documento</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Tipo</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Código</th>
                <th scope="col" className="px-3 py-2 text-left font-semibold">Válido até</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Entradas</th>
                <th scope="col" className="px-3 py-2 text-right font-semibold">Valor</th>
                <th scope="col" className="px-3 py-2 text-center font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((v) => (
                <tr key={v.id} className={`hover:bg-secondary/30 ${v.revogado ? "opacity-50" : ""}`}>
                  <td className="px-3 py-2 font-medium">{v.nome}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{v.documento ?? "—"}</td>
                  <td className="px-3 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TIPO_CLASS[v.tipo]}`}>
                      {TIPO_LABEL[v.tipo]}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">{v.codigoAcesso}</td>
                  <td className="px-3 py-2 text-xs">{formatDateTimeBR(v.validoAte)}</td>
                  <td className="px-3 py-2 text-right font-mono">
                    {v.entradasRealizadas}/{v.maxEntradas}
                  </td>
                  <td className="px-3 py-2 text-right font-mono">
                    {v.valorCobrado != null ? formatBRL(v.valorCobrado) : "—"}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {v.revogado ? (
                      <span className="text-[11px] text-muted-foreground">Revogado</span>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gym-danger hover:bg-gym-danger/10"
                        onClick={() => handleRevogar(v)}
                        disabled={revogarMutation.isPending}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: novo visitante */}
      <Dialog open={registrarOpen} onOpenChange={setRegistrarOpen}>
        <DialogContent className="border-border bg-card sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-display">Novo visitante</DialogTitle>
            <DialogDescription>
              Cadastre um acesso temporário. Um código será gerado para liberação na catraca.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitRegistrar)} className="space-y-4 py-2">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" className="mt-1 border-border bg-secondary" {...form.register("nome")} />
                {form.formState.errors.nome ? (
                  <p className="mt-1 text-[11px] text-gym-danger">{form.formState.errors.nome.message}</p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="documento">Documento</Label>
                <Input id="documento" className="mt-1 border-border bg-secondary" {...form.register("documento")} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" className="mt-1 border-border bg-secondary" {...form.register("telefone")} />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" className="mt-1 border-border bg-secondary" {...form.register("email")} />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={form.watch("tipo")}
                  onValueChange={(v) => form.setValue("tipo", v as TipoVisitante)}
                >
                  <SelectTrigger className="mt-1 border-border bg-secondary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {TIPO_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="validoAte">Válido até *</Label>
                <Input
                  id="validoAte"
                  type="datetime-local"
                  className="mt-1 border-border bg-secondary"
                  {...form.register("validoAte")}
                />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <Label htmlFor="maxEntradas">Máx. entradas</Label>
                <Input
                  id="maxEntradas"
                  type="number"
                  min={1}
                  max={10}
                  className="mt-1 border-border bg-secondary"
                  {...form.register("maxEntradas")}
                />
              </div>
              <div>
                <Label htmlFor="valorCobrado">Valor cobrado (R$)</Label>
                <Input
                  id="valorCobrado"
                  type="number"
                  step="0.01"
                  min={0}
                  className="mt-1 border-border bg-secondary"
                  {...form.register("valorCobrado")}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                rows={2}
                className="mt-1 border-border bg-secondary"
                {...form.register("observacoes")}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRegistrarOpen(false)}
                className="border-border"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarMutation.isPending}>
                <UserPlus className="size-4" />
                {registrarMutation.isPending ? "Cadastrando..." : "Cadastrar e gerar código"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: validar / liberar catraca */}
      <Dialog
        open={validarOpen}
        onOpenChange={(open) => {
          setValidarOpen(open);
          if (!open) {
            setCodigoValidar("");
            setDeviceIdEntrada("");
            setValidacaoResult(null);
          }
        }}
      >
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Validar código de visitante</DialogTitle>
            <DialogDescription>
              Informe o código de acesso do visitante para validar e liberar a catraca.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="codigoValidar">Código de acesso</Label>
              <Input
                id="codigoValidar"
                placeholder="Ex: ABC123"
                value={codigoValidar}
                onChange={(e) => setCodigoValidar(e.target.value.toUpperCase())}
                className="mt-1 border-border bg-secondary font-mono"
              />
            </div>
            <div>
              <Label htmlFor="deviceIdEntrada">Device ID (opcional)</Label>
              <Input
                id="deviceIdEntrada"
                placeholder="ID da catraca que vai liberar"
                value={deviceIdEntrada}
                onChange={(e) => setDeviceIdEntrada(e.target.value)}
                className="mt-1 border-border bg-secondary"
              />
            </div>
            {validacaoResult ? (
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${
                  validacaoResult.valido
                    ? "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
                    : "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
                }`}
              >
                <p className="font-semibold">
                  {validacaoResult.valido ? "Código válido" : "Código inválido"}
                </p>
                {validacaoResult.motivo ? <p>{validacaoResult.motivo}</p> : null}
                {validacaoResult.nome ? (
                  <p className="mt-1 text-xs">
                    {validacaoResult.nome} ({validacaoResult.entradasRealizadas}/
                    {validacaoResult.maxEntradas} entradas)
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleValidar}
              disabled={!codigoValidar.trim()}
              className="border-border"
            >
              Validar
            </Button>
            <Button
              type="button"
              onClick={() => entradaMutation.mutate()}
              disabled={
                !codigoValidar.trim() ||
                entradaMutation.isPending ||
                (validacaoResult != null && !validacaoResult.valido)
              }
            >
              <LogIn className="size-4" />
              {entradaMutation.isPending ? "Liberando..." : "Liberar entrada"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
