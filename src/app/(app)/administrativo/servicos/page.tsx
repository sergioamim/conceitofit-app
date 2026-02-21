"use client";

import { useEffect, useState } from "react";
import {
  listServicos,
  createServico,
  updateServico,
  toggleServico,
  deleteServico,
} from "@/lib/mock/services";
import type { Servico } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { ServicoModal } from "@/components/shared/servico-modal";
import { cn } from "@/lib/utils";

function formatBRL(value: number) {
  return (value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);

  async function load() {
    const data = await listServicos();
    setServicos(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleSave(
    data: Omit<Servico, "id" | "tenantId">,
    id?: string
  ) {
    if (id) await updateServico(id, data);
    else await createServico(data);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleToggle(id: string) {
    await toggleServico(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este serviço?")) return;
    await deleteServico(id);
    load();
  }

  return (
    <div className="space-y-6">
      <ServicoModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        initial={editing}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Serviços
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Itens cobrados à parte, com número de sessões
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo serviço</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Serviço
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Valor
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessões
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agendamento
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Acesso catraca
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Voucher
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {servicos.map((s) => (
                <tr key={s.id} className="transition-colors hover:bg-secondary/40">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{s.nome}</p>
                    {s.descricao && (
                      <p className="text-xs text-muted-foreground">{s.descricao}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatBRL(s.valor)}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {s.sessoes ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        s.agendavel
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.agendavel ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        s.permiteAcessoCatraca
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.permiteAcessoCatraca ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        s.permiteVoucher
                          ? "bg-gym-accent/15 text-gym-accent"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {s.permiteVoucher ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        s.ativo
                          ? "bg-gym-teal/15 text-gym-teal"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditing(s);
                        setModalOpen(true);
                      }}
                      className="border-border"
                    >
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggle(s.id)}
                      className="border-border"
                    >
                      {s.ativo ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(s.id)}
                      className="border-border text-gym-danger hover:text-gym-danger"
                    >
                      Remover
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {servicos.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-10 text-center text-sm text-muted-foreground"
                >
                  Nenhum serviço cadastrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
