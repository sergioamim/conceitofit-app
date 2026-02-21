"use client";

import { useEffect, useState } from "react";
import {
  listFuncionarios,
  createFuncionario,
  updateFuncionario,
  toggleFuncionario,
  deleteFuncionario,
} from "@/lib/mock/services";
import type { Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FuncionarioModal } from "@/components/shared/funcionario-modal";

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);

  async function load() {
    const data = await listFuncionarios({ apenasAtivos: false });
    setFuncionarios(data);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleSave(data: Omit<Funcionario, "id" | "ativo">, id?: string) {
    if (id) await updateFuncionario(id, data);
    else await createFuncionario(data);
    setModalOpen(false);
    setEditing(null);
    load();
  }

  async function handleToggle(id: string) {
    await toggleFuncionario(id);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este funcionário?")) return;
    await deleteFuncionario(id);
    load();
  }

  return (
    <div className="space-y-6">
      <FuncionarioModal
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
          <h1 className="font-display text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão de equipe e responsáveis</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>Novo funcionário</Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{f.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{f.cargo ?? "—"}</td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                      f.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground"
                    )}
                  >
                    {f.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setEditing(f); setModalOpen(true); }} className="h-7 text-xs">Editar</Button>
                    <Button variant="outline" size="sm" onClick={() => handleToggle(f.id)} className="h-7 text-xs">{f.ativo ? "Desativar" : "Ativar"}</Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(f.id)} className="h-7 text-xs border-gym-danger/30 text-gym-danger hover:border-gym-danger/60">Remover</Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
