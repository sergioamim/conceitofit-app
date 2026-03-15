"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createCartaoClienteService,
  deleteCartaoClienteService,
  listBandeirasCartaoService,
  listCartoesClienteService,
  listMatriculasByAlunoService,
  listPagamentosService,
  listPlanosService,
  resolveAlunoTenantService,
  setCartaoPadraoService,
  updateAlunoService,
} from "@/lib/comercial/runtime";
import { useTenantContext } from "@/hooks/use-session-context";
import type { CartaoCliente, BandeiraCartao, Aluno, Matricula, Plano } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { NovoCartaoModal } from "@/components/shared/novo-cartao-modal";
import { Breadcrumb } from "@/components/shared/breadcrumb";
import { ClienteHeader } from "@/components/shared/cliente-header";
import { ClienteTabs } from "@/components/shared/cliente-tabs";
import { NovaMatriculaModal } from "@/components/shared/nova-matricula-modal";
import { SuspenderClienteModal } from "@/components/shared/suspender-cliente-modal";
import { normalizeErrorMessage } from "@/lib/utils/api-error";

function maskCard(ultimos4: string) {
  return `•••• •••• •••• ${ultimos4}`;
}

function cardGradient(name?: string) {
  const n = (name ?? "").toLowerCase();
  if (n.includes("visa")) return "from-blue-600/90 via-blue-500/70 to-cyan-500/60";
  if (n.includes("master")) return "from-orange-600/90 via-rose-500/70 to-yellow-500/60";
  if (n.includes("elo")) return "from-emerald-600/90 via-teal-500/70 to-lime-500/60";
  return "from-slate-700/90 via-slate-600/70 to-slate-500/60";
}

export default function CartoesClientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { tenantId, tenantResolved, tenants, setTenant } = useTenantContext();
  const [cartoes, setCartoes] = useState<CartaoCliente[]>([]);
  const [bandeiras, setBandeiras] = useState<BandeiraCartao[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [novaMatriculaOpen, setNovaMatriculaOpen] = useState(false);
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [pendenteFinanceiro, setPendenteFinanceiro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const id = params?.id;
    if (!id || !tenantResolved) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const resolved = await resolveAlunoTenantService({
        alunoId: id,
        tenantId,
        tenantIds: tenants.map((item) => item.id),
      });
      if (!resolved) {
        setAluno(null);
        setCartoes([]);
        setMatriculas([]);
        setPlanos([]);
        setPendenteFinanceiro(false);
        return;
      }
      if (resolved.tenantId !== tenantId) {
        await setTenant(resolved.tenantId);
      }
      const currentTenantId = resolved.tenantId;
      const [cards, brands, ms, ps, pags] = await Promise.all([
        listCartoesClienteService({ tenantId: currentTenantId, alunoId: id }),
        listBandeirasCartaoService({ apenasAtivas: true }),
        listMatriculasByAlunoService({
          tenantId: currentTenantId,
          alunoId: id,
          page: 0,
          size: 200,
        }),
        listPlanosService({ tenantId: currentTenantId, apenasAtivos: false }),
        listPagamentosService({
          tenantId: currentTenantId,
          alunoId: id,
          page: 0,
          size: 40,
        }),
      ]);
      setCartoes(cards);
      setBandeiras(brands);
      setAluno(resolved.aluno);
      setMatriculas(ms.filter((m) => m.alunoId === id));
      setPlanos(ps);
      setPendenteFinanceiro(
        pags.some((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
      );
    } catch (error) {
      setLoadError(normalizeErrorMessage(error));
      setAluno(null);
    } finally {
      setLoading(false);
    }
  }, [params?.id, setTenant, tenantId, tenantResolved, tenants]);

  useEffect(() => {
    if (!tenantResolved) return;
    void load();
  }, [load, tenantResolved]);

  const planoAtivo = useMemo(
    () => matriculas.find((m) => m.status === "ATIVA"),
    [matriculas]
  );
  const planoAtivoInfo = useMemo(
    () => (planoAtivo ? planos.find((p) => p.id === planoAtivo.planoId) : null),
    [planoAtivo, planos]
  );
  const suspenso = Boolean(aluno?.status === "SUSPENSO" || aluno?.suspensao);

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Carregando cliente...</div>
    );
  }

  if (loadError) {
    return (
      <div className="text-sm text-gym-danger">{loadError}</div>
    );
  }

  if (!aluno) {
    return (
      <div className="text-sm text-muted-foreground">Cliente não encontrado para a unidade ativa.</div>
    );
  }

  return (
    <div className="space-y-6">
      <NovaMatriculaModal
        open={novaMatriculaOpen}
        onClose={() => setNovaMatriculaOpen(false)}
        onDone={load}
        prefillClienteId={aluno.id}
      />
      <SuspenderClienteModal
        open={suspenderOpen}
        onClose={() => setSuspenderOpen(false)}
        initial={aluno.suspensao}
        onConfirm={async (payload) => {
          const registro = {
            ...payload,
            dataRegistro: new Date().toISOString().slice(0, 19),
          };
          await updateAlunoService({
            tenantId: aluno.tenantId,
            id: aluno.id,
            data: {
              status: "SUSPENSO",
              suspensao: payload,
              suspensoes: [registro, ...(aluno.suspensoes ?? [])],
            },
          });
          setSuspenderOpen(false);
          await load();
        }}
      />
      <NovoCartaoModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        bandeiras={bandeiras}
        onSave={async (data) => {
          const id = params?.id;
          if (!id) return;
          await createCartaoClienteService({
            tenantId: aluno.tenantId,
            alunoId: id,
            data: {
              bandeiraId: data.bandeiraId,
              titular: data.titular,
              ultimos4: data.ultimos4,
              validade: data.validade,
              cpfTitular: data.cpfTitular,
            },
          });
          setModalOpen(false);
          await load();
        }}
      />

      <Breadcrumb
        items={[
          { label: "Clientes", href: "/clientes" },
          { label: aluno.nome, href: `/clientes/${params?.id ?? ""}` },
          { label: "Cartões" },
        ]}
      />

      <ClienteHeader
        aluno={aluno}
        planoAtivo={planoAtivo ? { dataFim: planoAtivo.dataFim } : null}
        planoAtivoInfo={planoAtivoInfo}
        suspenso={suspenso}
        onCartoes={() => router.push(`/clientes/${aluno.id}/cartoes`)}
        onNovaVenda={() => setNovaMatriculaOpen(true)}
        onSuspender={() => setSuspenderOpen(true)}
        onReativar={async () => {
          await updateAlunoService({
            tenantId: aluno.tenantId,
            id: aluno.id,
            data: {
              status: "INATIVO",
              suspensao: undefined,
            },
          });
          await load();
        }}
        showCartoesAction={false}
      />

      <ClienteTabs
        current="cartoes"
        baseHref={`/clientes/${aluno.id}`}
        pendenteFinanceiro={pendenteFinanceiro}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Cartões do cliente</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie formas de pagamento salvas
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo cartão</Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cartoes.map((c) => {
          const bandeira = bandeiras.find((b) => b.id === c.bandeiraId);
          return (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4">
              <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br p-4 text-white shadow-lg">
                <div className={`absolute inset-0 bg-gradient-to-br ${cardGradient(bandeira?.nome)} opacity-90`} />
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -left-6 bottom-6 h-24 w-24 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-widest text-white/80">Cartão</p>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold">
                      {bandeira?.nome ?? "Crédito"}
                    </span>
                  </div>
                  <div className="mt-6 font-display text-xl tracking-[0.2em]">
                    {maskCard(c.ultimos4)}
                  </div>
                  <div className="mt-6 flex items-center justify-between text-xs text-white/80">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-white/60">Titular</p>
                      <p className="text-xs font-semibold text-white">{c.titular}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-widest text-white/60">Validade</p>
                      <p className="text-xs font-semibold text-white">{c.validade}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center gap-2">
                  {c.padrao ? (
                    <span className="inline-flex items-center rounded-full bg-gym-teal/15 px-2.5 py-0.5 text-[11px] font-semibold text-gym-teal">
                      Padrão
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border"
                      onClick={async () => {
                        await setCartaoPadraoService({ tenantId: aluno.tenantId, id: c.id });
                        await load();
                      }}
                    >
                      Definir padrão
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-gym-danger hover:text-gym-danger"
                    onClick={async () => {
                      if (!confirm("Remover este cartão?")) return;
                      await deleteCartaoClienteService({ tenantId: aluno.tenantId, id: c.id });
                      await load();
                    }}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
        {cartoes.length === 0 && (
          <div className="col-span-2 rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhum cartão cadastrado
          </div>
        )}
      </div>
    </div>
  );
}
