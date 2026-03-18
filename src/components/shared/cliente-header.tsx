"use client";

import type { Aluno, Plano } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, KeyRound, MoreVertical, Pencil, Trash2 } from "lucide-react";

function formatDate(d: string) {
  const [year, month, day] = d.split("-");
  if (!year || !month || !day) return d;
  return `${day}/${month}/${year}`;
}

export function ClienteHeader({
  aluno,
  planoAtivo,
  planoAtivoInfo,
  suspenso,
  onCartoes,
  onNovaVenda,
  onSuspender,
  onReativar,
  onLiberarAcesso,
  canDeleteCliente = false,
  onExcluir,
  sticky = true,
  showCartoesAction = true,
  onEdit,
  onChangeFoto,
  onCompletarCadastro,
}: {
  aluno: Aluno;
  planoAtivo?: { dataFim: string } | null;
  planoAtivoInfo?: Plano | null;
  suspenso: boolean;
  onCartoes: () => void;
  onNovaVenda: () => void;
  onSuspender: () => void;
  onReativar: () => void;
  onLiberarAcesso?: () => void;
  canDeleteCliente?: boolean;
  onExcluir?: () => void;
  sticky?: boolean;
  showCartoesAction?: boolean;
  onEdit?: () => void;
  onChangeFoto?: () => void;
  onCompletarCadastro?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      className={[
        "flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4",
        sticky ? "sticky top-4 z-30 backdrop-blur" : "",
      ].join(" ")}
    >
      <div className="flex items-start gap-4">
        <div className="relative">
          <div className="h-16 w-16 overflow-hidden rounded-full border border-border bg-secondary shadow-inner">
            {aluno.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={aluno.foto} alt={aluno.nome} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold uppercase text-muted-foreground">
                Foto
              </div>
            )}
          </div>
          {onChangeFoto && (
            <Button
              variant="default"
              size="icon-sm"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full border-2 border-card bg-gym-accent p-0 text-background shadow-md hover:bg-gym-accent/90"
              onClick={onChangeFoto}
              aria-label="Trocar foto"
            >
              <Camera className="size-4" />
            </Button>
          )}
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            {aluno.nome}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>
              Status: <StatusBadge status={aluno.status} />
            </span>
            {aluno.pendenteComplementacao ? (
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-500/15 text-amber-400">
                Cadastro pendente
              </span>
            ) : null}
            <span>
              Plano:{" "}
              {planoAtivo ? (
                <span className="text-gym-teal">{planoAtivoInfo?.nome ?? "Ativo"}</span>
              ) : (
                <span className="text-gym-warning">Sem plano ativo</span>
              )}
            </span>
            {planoAtivoInfo && planoAtivo && (
              <span className="text-muted-foreground">
                Vigente até {formatDate(planoAtivo.dataFim)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        {onEdit && (
          <Button variant="outline" className="h-9" onClick={onEdit}>
            <Pencil className="size-4" />
          </Button>
        )}
        {aluno.pendenteComplementacao && onCompletarCadastro && (
          <Button variant="outline" className="h-9 border-gym-accent/50 text-gym-accent" onClick={onCompletarCadastro}>
            Completar cadastro
          </Button>
        )}
        {onLiberarAcesso && (
          <Button variant="outline" className="h-9 border-amber-500/40 text-amber-300" onClick={onLiberarAcesso}>
            <KeyRound className="mr-2 size-4" />
            Liberar acesso (catraca)
          </Button>
        )}
        {!planoAtivo && (
          <Button onClick={onNovaVenda} className="h-9">
            Nova contratação
          </Button>
        )}
        {showCartoesAction && (
          <Button variant="outline" className="h-9" onClick={onCartoes}>
            Cartões
          </Button>
        )}
        <div className="relative" ref={menuRef}>
          <Button variant="outline" className="h-9 px-2" onClick={() => setMenuOpen((v) => !v)}>
            <MoreVertical className="size-4" />
          </Button>
          {menuOpen && (
            <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-40 rounded-md border border-border bg-card p-1 shadow-lg">
              {suspenso ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onReativar();
                  }}
                  className="w-full rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Reativar
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onSuspender();
                  }}
                  className="w-full rounded-md px-2 py-2 text-left text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  Suspender
                </button>
              )}
              {canDeleteCliente && onExcluir ? (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onExcluir();
                  }}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-gym-danger hover:bg-secondary"
                >
                  <Trash2 className="size-4" />
                  Excluir cliente
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
