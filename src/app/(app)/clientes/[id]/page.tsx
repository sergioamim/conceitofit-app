"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  getAluno,
  listMatriculas,
  listPlanos,
  listPagamentos,
  listPresencasByAluno,
  updateAluno,
  listFormasPagamento,
  receberPagamento,
  listConvenios,
} from "@/lib/mock/services";
import type { Aluno, Matricula, Plano, Pagamento, Presenca, FormaPagamento, Convenio } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { NovaMatriculaModal } from "@/components/shared/nova-matricula-modal";
import { ReceberPagamentoModal } from "@/components/shared/receber-pagamento-modal";
import { Button } from "@/components/ui/button";
import { SuspenderClienteModal } from "@/components/shared/suspender-cliente-modal";
import { cn } from "@/lib/utils";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function ClienteDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [convenios, setConvenios] = useState<Convenio[]>([]);
  const [freqMode, setFreqMode] = useState<"7d" | "ano">("7d");
  const [presencas, setPresencas] = useState<Presenca[]>([]);
  const [tab, setTab] = useState<"resumo" | "matriculas" | "financeiro">("resumo");
  const [suspenderOpen, setSuspenderOpen] = useState(false);
  const [novaMatriculaOpen, setNovaMatriculaOpen] = useState(false);
  const [recebendo, setRecebendo] = useState<Pagamento | null>(null);

  useEffect(() => {
    const id = params?.id;
    if (!id) return;
    void reload();
  }, [params?.id]);

  const planoAtivo = useMemo(() => {
    return matriculas.find((m) => m.status === "ATIVA");
  }, [matriculas]);

  const planoAtivoInfo = planoAtivo
    ? planos.find((p) => p.id === planoAtivo.planoId)
    : undefined;

  const saldo = useMemo(() => {
    const pago = pagamentos
      .filter((p) => p.status === "PAGO")
      .reduce((s, p) => s + p.valorFinal, 0);
    const aberto = pagamentos
      .filter((p) => p.status === "PENDENTE" || p.status === "VENCIDO")
      .reduce((s, p) => s + p.valorFinal, 0);
    return pago - aberto;
  }, [pagamentos]);

  const recorrente = useMemo(() => {
    const mat = matriculas.find((m) => m.renovacaoAutomatica);
    if (!mat) return null;
    const plano = planos.find((p) => p.id === mat.planoId);
    if (!plano) return null;
    const nextDate = new Date(mat.dataFim + "T00:00:00");
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      plano,
      data: nextDate.toISOString().split("T")[0],
      valor: plano.valor,
    };
  }, [matriculas, planos]);

  const serie = useMemo(() => {
    if (!aluno) return [];
    const today = new Date();
    if (freqMode === "7d") {
      const days: string[] = [];
      for (let i = 6; i >= 0; i -= 1) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }
      return days.map((d) =>
        presencas.some((p) => p.data === d) ? 1 : 0
      );
    }
    const year = today.getFullYear();
    const uniqueByMonth = Array.from({ length: 12 }).map(() => new Set<string>());
    presencas.forEach((p) => {
      if (p.data.startsWith(String(year))) {
        const month = parseInt(p.data.split("-")[1], 10) - 1;
        if (month >= 0 && month < 12) uniqueByMonth[month].add(p.data);
      }
    });
    return uniqueByMonth.map((set) => set.size);
  }, [aluno, freqMode, presencas]);

  const vendas = pagamentos
    .slice()
    .sort((a, b) => (a.dataCriacao > b.dataCriacao ? -1 : 1))
    .slice(0, 10);

  if (!aluno) {
    return (
      <div className="text-sm text-muted-foreground">Cliente não encontrado</div>
    );
  }

  const suspenso = aluno.status === "SUSPENSO" || Boolean(aluno.suspensao);
  const motivoOptions = [
    { value: "INADIMPLENCIA", label: "Inadimplência" },
    { value: "SAUDE", label: "Saúde" },
    { value: "VIAGEM", label: "Viagem" },
    { value: "PAUSA_CONTRATO", label: "Pausa de contrato" },
    { value: "OUTROS", label: "Outros" },
  ];

  async function reload() {
    const id = params?.id;
    if (!id) return;
    const [pags, ms, ps, pres, a, fps, cvs] = await Promise.all([
      listPagamentos(),
      listMatriculas(),
      listPlanos(),
      listPresencasByAluno(id),
      getAluno(id),
      listFormasPagamento(),
      listConvenios(),
    ]);
    setAluno(a);
    setMatriculas(ms.filter((m) => m.alunoId === id));
    setPlanos(ps);
    setPagamentos(pags.filter((p) => p.alunoId === id));
    setPresencas(pres);
    setFormasPagamento(fps);
    setConvenios(cvs);
  }

  return (
    <div className="space-y-6">
      {recebendo && (
        <ReceberPagamentoModal
          pagamento={recebendo}
          formasPagamento={formasPagamento}
          convenio={(() => {
            const mat = matriculas.find((m) => m.id === recebendo.matriculaId);
            if (!mat?.convenioId) return undefined;
            const conv = convenios.find((c) => c.id === mat.convenioId);
            return conv ? { nome: conv.nome, descontoPercentual: conv.descontoPercentual } : undefined;
          })()}
          onClose={() => setRecebendo(null)}
          onConfirm={async (data) => {
            await receberPagamento(recebendo.id, data);
            setRecebendo(null);
            await reload();
          }}
        />
      )}
      <NovaMatriculaModal
        open={novaMatriculaOpen}
        onClose={() => setNovaMatriculaOpen(false)}
        onDone={reload}
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
          await updateAluno(aluno.id, {
            status: "SUSPENSO",
            suspensao: payload,
            suspensoes: [registro, ...(aluno.suspensoes ?? [])],
          });
          setSuspenderOpen(false);
          await reload();
        }}
      />
      

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Cliente · {aluno.nome}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status do cliente: <StatusBadge status={aluno.status} />
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status do plano:{" "}
            {planoAtivo ? (
              <span className="text-gym-teal">Plano ativo</span>
            ) : (
              <span className="text-gym-warning">Sem plano ativo</span>
            )}
          </p>
        </div>
        <div className="flex items-start gap-3">
          {!planoAtivo && (
            <Button
              onClick={() => setNovaMatriculaOpen(true)}
              className="h-9"
            >
              Nova venda de plano
            </Button>
          )}
          {suspenso ? (
            <Button
              variant="outline"
              className="h-9"
              onClick={async () => {
                await updateAluno(aluno.id, {
                  status: "INATIVO",
                  suspensao: undefined,
                });
                await reload();
              }}
            >
              Reativar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="h-9"
              onClick={() => {
                setSuspenderOpen(true);
              }}
            >
              Suspender
            </Button>
          )}
          {planoAtivoInfo && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 text-right">
              <p className="text-xs text-muted-foreground">Plano ativo</p>
              <p className="font-display text-lg font-bold text-gym-accent">
                {planoAtivoInfo.nome}
              </p>
              <p className="text-xs text-muted-foreground">
                até {formatDate(planoAtivo?.dataFim ?? "")}
              </p>
            </div>
          )}
        </div>
      </div>

      {suspenso && aluno.suspensao && (
        <div className="rounded-xl border border-gym-warning/50 bg-gym-warning/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gym-warning">
            Cliente suspenso
          </p>
          <p className="mt-1 text-sm text-foreground">
            Motivo:{" "}
            {motivoOptions.find((m) => m.value === aluno.suspensao?.motivo)?.label ??
              aluno.suspensao?.motivo}
          </p>
          <p className="text-xs text-muted-foreground">
            {aluno.suspensao.inicio || aluno.suspensao.fim
              ? `${aluno.suspensao.inicio ? formatDate(aluno.suspensao.inicio) : "Imediato"} → ${aluno.suspensao.fim ? formatDate(aluno.suspensao.fim) : "Indeterminado"}`
              : "Prazo indeterminado"}
          </p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {[
          { key: "resumo", label: "Dados" },
          { key: "matriculas", label: "Matrículas" },
          { key: "financeiro", label: "Financeiro" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
              tab === t.key
                ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "resumo" && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Dados principais
              </p>
              <div className="mt-2 space-y-1 text-sm">
                <div>{aluno.email}</div>
                <div>{aluno.telefone}</div>
                {aluno.telefoneSec && <div>{aluno.telefoneSec}</div>}
                <div>CPF: {aluno.cpf}</div>
                <div>Nascimento: {formatDate(aluno.dataNascimento)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Frequência
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setFreqMode("7d")}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px]",
                      freqMode === "7d"
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    7 dias
                  </button>
                  <button
                    onClick={() => setFreqMode("ano")}
                    className={cn(
                      "rounded-md border px-2 py-0.5 text-[11px]",
                      freqMode === "ano"
                        ? "border-gym-accent bg-gym-accent/10 text-gym-accent"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    Anual
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-end gap-1.5">
                {serie.map((v, i) => (
                  <div
                    key={`${v}-${i}`}
                    className="w-full rounded-sm bg-gym-accent/70"
                    style={{ height: `${6 + v * 6}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saldo financeiro
              </p>
              <p className={cn(
                "mt-2 font-display text-2xl font-extrabold",
                saldo >= 0 ? "text-gym-teal" : "text-gym-danger"
              )}>
                {formatBRL(Math.abs(saldo))}
              </p>
              <p className="text-xs text-muted-foreground">
                {saldo >= 0 ? "Crédito" : "Devedor"}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Próxima cobrança
              </p>
              {recorrente ? (
                <>
                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(recorrente.data)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {recorrente.plano.nome}
                  </p>
                  <p className="font-display text-lg font-bold text-gym-accent">
                    {formatBRL(recorrente.valor)}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  Sem cobrança recorrente
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-base font-bold">
                Histórico de vendas
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  router.push(`/pagamentos?clienteId=${aluno.id}`);
                }}
                className="border-border text-xs"
              >
                Ver todas
              </Button>
            </div>
            <div className="divide-y divide-border">
              {vendas.length === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma venda encontrada
                </p>
              )}
              {vendas.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">{p.descricao}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(p.dataVencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gym-accent">
                      {formatBRL(p.valorFinal)}
                    </p>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display text-base font-bold">
              Histórico de suspensão
            </h2>
            <div className="mt-3 divide-y divide-border">
              {(aluno.suspensoes?.length ?? 0) === 0 && (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Nenhuma suspensão registrada
                </p>
              )}
              {(aluno.suspensoes ?? []).map((s, idx) => (
                <div key={`${s.dataRegistro}-${idx}`} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {motivoOptions.find((m) => m.value === s.motivo)?.label ?? s.motivo}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {s.inicio || s.fim
                        ? `${s.inicio ? formatDate(s.inicio) : "Imediato"} → ${s.fim ? formatDate(s.fim) : "Indeterminado"}`
                        : "Prazo indeterminado"}
                    </p>
                    {s.detalhes && (
                      <p className="mt-1 text-xs text-muted-foreground">{s.detalhes}</p>
                    )}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Registrado em {formatDate(s.dataRegistro.split("T")[0])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {tab === "matriculas" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold">Matrículas</h2>
          <div className="mt-3 divide-y divide-border">
            {matriculas.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhuma matrícula encontrada
              </p>
            )}
            {matriculas.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {planos.find((p) => p.id === m.planoId)?.nome ?? "Plano"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(m.dataInicio)} → {formatDate(m.dataFim)}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "financeiro" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display text-base font-bold">Financeiro</h2>
          <div className="mt-3 divide-y divide-border">
            {pagamentos.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nenhum pagamento encontrado
              </p>
            )}
            {pagamentos.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{p.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(p.dataVencimento)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gym-accent">
                    {formatBRL(p.valorFinal)}
                  </p>
                  <StatusBadge status={p.status} />
                  {(p.status === "PENDENTE" || p.status === "VENCIDO") && (
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border"
                        onClick={() => setRecebendo(p)}
                      >
                        Receber pagamento
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
