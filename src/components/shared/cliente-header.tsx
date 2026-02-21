"use client";

import type { Aluno, Plano } from "@/lib/types";
import { StatusBadge } from "@/components/shared/status-badge";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Camera } from "lucide-react";

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("pt-BR");
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
  sticky = true,
  showCartoesAction = true,
  onEdit,
  onChangeFoto,
}: {
  aluno: Aluno;
  planoAtivo?: { dataFim: string } | null;
  planoAtivoInfo?: Plano | null;
  suspenso: boolean;
  onCartoes: () => void;
  onNovaVenda: () => void;
  onSuspender: () => void;
  onReativar: () => void;
  sticky?: boolean;
  showCartoesAction?: boolean;
  onEdit?: () => void;
  onChangeFoto?: () => void;
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
              variant="outline"
              size="icon-sm"
              className="absolute -bottom-1 -right-1 border-secondary/60"
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
            <span>
              Plano:{" "}
              {planoAtivo ? (
                <span className="text-gym-teal">Ativo</span>
              ) : (
                <span className="text-gym-warning">Sem plano ativo</span>
              )}
            </span>
            {planoAtivoInfo && planoAtivo && (
              <span className="text-muted-foreground">
                {planoAtivoInfo.nome} · até {formatDate(planoAtivo.dataFim)}
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
        {!planoAtivo && (
          <Button onClick={onNovaVenda} className="h-9">
            Nova venda de plano
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
