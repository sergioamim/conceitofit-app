"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, Infinity } from "lucide-react";
import { listVoucherCodigos, listAlunos } from "@/lib/mock/services";
import type { Aluno, Voucher, VoucherCodigo } from "@/lib/types";

const TIPO_LABEL: Record<string, string> = {
  DESCONTO: "Desconto",
  ACESSO: "Acesso livre",
  SESSAO: "Sessão avulsa",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
      title="Copiar código"
    >
      {copied ? (
        <Check className="size-3.5 text-gym-teal" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

function AlunoCell({ aluno, onClick }: { aluno: Aluno; onClick: () => void }) {
  const initials = aluno.nome
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg px-1 py-0.5 hover:bg-secondary transition-colors text-left w-full"
      title={`Ver perfil de ${aluno.nome}`}
    >
      <div className="relative size-7 shrink-0 overflow-hidden rounded-full bg-secondary border border-border">
        {aluno.foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={aluno.foto} alt={aluno.nome} className="size-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
            {initials}
          </span>
        )}
      </div>
      <span className="text-xs font-medium hover:text-gym-accent transition-colors line-clamp-1">
        {aluno.nome}
      </span>
    </button>
  );
}

function formatPeriodo(voucher: Voucher): string {
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
  if (!voucher.prazoDeterminado) return `A partir de ${fmt(voucher.periodoInicio)}`;
  const fim = voucher.periodoFim ? fmt(voucher.periodoFim) : "—";
  return `${fmt(voucher.periodoInicio)} → ${fim}`;
}

export function VoucherCodigosModal({
  voucher,
  onClose,
}: {
  voucher: Voucher;
  onClose: () => void;
}) {
  const router = useRouter();
  const [codigos, setCodigos] = useState<VoucherCodigo[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([listVoucherCodigos(voucher.id), listAlunos()]).then(
      ([codData, alunosData]) => {
        setCodigos(codData);
        setAlunos(alunosData);
        setLoading(false);
      }
    );
  }, [voucher.id]);

  const alunoMap = useMemo(
    () => new Map(alunos.map((a) => [a.id, a])),
    [alunos]
  );

  const usages = codigos.filter((c) => c.usado);
  const usadoCount = usages.length;

  // For UNICO: the code is the same across all entries (or the first one)
  const uniCodigo =
    voucher.codigoTipo === "UNICO" ? (codigos[0]?.codigo ?? "—") : null;

  // ALEATORIO stats
  const totalCodigos = codigos.length;
  const disponiveis = codigos.filter((c) => !c.usado).length;

  const isUnicoIlimitado =
    voucher.codigoTipo === "UNICO" && voucher.ilimitado;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Voucher · {voucher.nome}
          </DialogTitle>
        </DialogHeader>

        {/* ─── Summary ─── */}
        <div className="rounded-xl border border-border bg-secondary/40 p-4 space-y-3">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                {TIPO_LABEL[voucher.tipo] ?? voucher.tipo} ·{" "}
                {voucher.codigoTipo === "UNICO" ? "Código único" : "Códigos aleatórios"} ·{" "}
                {formatPeriodo(voucher)}
              </p>
              {voucher.aplicarEm.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Aplica em:{" "}
                  {voucher.aplicarEm
                    .map((v) => (v === "ANUIDADE" ? "Anuidade" : "Contrato"))
                    .join(" + ")}
                </p>
              )}
            </div>
            <span
              className={`shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                voucher.ativo
                  ? "bg-gym-teal/15 text-gym-teal"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {voucher.ativo ? "Ativo" : "Inativo"}
            </span>
          </div>

          {/* Code display */}
          {voucher.codigoTipo === "UNICO" ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
              <div className="flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Código do voucher
                </p>
                <p className="font-mono text-xl font-bold tracking-widest text-gym-accent">
                  {uniCodigo}
                </p>
              </div>
              {uniCodigo && uniCodigo !== "—" && (
                <CopyButton text={uniCodigo} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground mb-0.5">Total de códigos</p>
                <p className="text-lg font-bold">{totalCodigos}</p>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground mb-0.5">Disponíveis</p>
                <p className="text-lg font-bold text-gym-teal">{disponiveis}</p>
              </div>
              <div className="rounded-lg border border-border bg-background px-3 py-2.5">
                <p className="text-[11px] text-muted-foreground mb-0.5">Utilizados</p>
                <p className="text-lg font-bold text-gym-warning">{usadoCount}</p>
              </div>
            </div>
          )}

          {/* UNICO stats row */}
          {voucher.codigoTipo === "UNICO" && (
            <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground border-t border-border">
              <span className="flex items-center gap-1.5">
                Quantidade:{" "}
                {isUnicoIlimitado ? (
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Infinity className="size-3.5" /> Ilimitada
                  </span>
                ) : (
                  <strong className="text-foreground">{voucher.quantidade ?? "—"}</strong>
                )}
              </span>
              <span>
                Utilizações:{" "}
                <strong className="text-gym-warning">{usadoCount}</strong>
              </span>
              {voucher.umaVezPorCliente && (
                <span className="text-muted-foreground/70">· 1 vez por cliente</span>
              )}
            </div>
          )}
        </div>

        {/* ─── Utilizações ─── */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Utilizações{" "}
            <span className="ml-1 rounded-full bg-secondary px-1.5 py-0.5 text-[10px]">
              {usadoCount}
            </span>
          </p>

          <div className="overflow-hidden rounded-xl border border-border">
            {loading ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Carregando…
              </div>
            ) : usages.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Nenhuma utilização registrada
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="border-b border-border bg-secondary text-[11px] uppercase tracking-wider text-muted-foreground">
                      <th className="px-4 py-2.5 text-left font-semibold">
                        Cliente
                      </th>
                      {voucher.codigoTipo === "ALEATORIO" && (
                        <th className="px-4 py-2.5 text-left font-semibold">
                          Código utilizado
                        </th>
                      )}
                      <th className="px-4 py-2.5 text-left font-semibold">
                        Data de uso
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {usages.map((cod) => {
                      const aluno = cod.usadoPorAlunoId
                        ? alunoMap.get(cod.usadoPorAlunoId)
                        : undefined;
                      return (
                        <tr
                          key={cod.id}
                          className="transition-colors hover:bg-secondary/40"
                        >
                          <td className="px-4 py-3 min-w-[160px]">
                            {aluno ? (
                              <AlunoCell
                                aluno={aluno}
                                onClick={() => {
                                  onClose();
                                  router.push(`/clientes/${aluno.id}`);
                                }}
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          {voucher.codigoTipo === "ALEATORIO" && (
                            <td className="px-4 py-3 font-mono text-xs font-semibold tracking-widest text-gym-accent">
                              {cod.codigo}
                            </td>
                          )}
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {cod.dataUso
                              ? new Date(cod.dataUso).toLocaleDateString("pt-BR")
                              : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
