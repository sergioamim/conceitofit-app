"use client";

import { useEffect, useState } from "react";
import {
  listFuncionarios,
  createFuncionario,
  updateFuncionario,
  toggleFuncionario,
  deleteFuncionario,
  listCargos,
  createCargo,
  updateCargo,
  toggleCargo,
  deleteCargo,
} from "@/lib/mock/services";
import type { Cargo, Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { FuncionarioModal } from "@/components/shared/funcionario-modal";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CargoModal } from "@/components/shared/cargo-modal";

export default function FuncionariosPage() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [cargosModalOpen, setCargosModalOpen] = useState(false);
  const [cargoFormOpen, setCargoFormOpen] = useState(false);
  const [editingCargo, setEditingCargo] = useState<Cargo | null>(null);

  async function load() {
    const [funcs, cargosData] = await Promise.all([
      listFuncionarios({ apenasAtivos: false }),
      listCargos(),
    ]);
    setFuncionarios(funcs);
    setCargos(cargosData);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function handleSave(data: Omit<Funcionario, "id">, id?: string) {
    if (id) await updateFuncionario(id, data);
    else {
      const payload = {
        nome: data.nome,
        cargoId: data.cargoId,
        cargo: data.cargo,
        podeMinistrarAulas: data.podeMinistrarAulas,
      };
      await createFuncionario(payload);
    }
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

  async function handleSaveCargo(data: Omit<Cargo, "id" | "tenantId">, id?: string) {
    if (id) await updateCargo(id, data);
    else await createCargo({ nome: data.nome });
    setCargoFormOpen(false);
    setEditingCargo(null);
    await load();
  }

  async function handleToggleCargo(id: string) {
    await toggleCargo(id);
    load();
  }

  async function handleDeleteCargo(id: string) {
    if (!confirm("Remover este cargo?")) return;
    await deleteCargo(id);
    load();
  }

  const cargoMap = new Map(cargos.map((c) => [c.id, c.nome]));

  return (
    <div className="space-y-6">
      <CargoModal
        open={cargoFormOpen}
        onClose={() => {
          setCargoFormOpen(false);
          setEditingCargo(null);
        }}
        onSave={handleSaveCargo}
        initial={editingCargo}
      />

      <FuncionarioModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        onSave={handleSave}
        cargos={cargos}
        onOpenCargoModal={() => {
          setEditingCargo(null);
          setCargoFormOpen(true);
        }}
        initial={editing}
      />

      <Dialog open={cargosModalOpen} onOpenChange={setCargosModalOpen}>
        <DialogContent className="bg-card border-border sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">Cadastro de Cargos</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => { setEditingCargo(null); setCargoFormOpen(true); }}>Novo cargo</Button>
            </div>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-secondary">
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cargos.map((cargo) => (
                    <tr key={cargo.id} className="transition-colors hover:bg-secondary/40">
                      <td className="px-4 py-3 text-sm">{cargo.nome}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", cargo.ativo ? "bg-gym-teal/15 text-gym-teal" : "bg-secondary text-muted-foreground")}>
                          {cargo.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { setEditingCargo(cargo); setCargoFormOpen(true); }}>Editar</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleToggleCargo(cargo.id)}>{cargo.ativo ? "Desativar" : "Ativar"}</Button>
                          <Button variant="outline" size="sm" className="h-7 text-xs border-gym-danger/30 text-gym-danger hover:border-gym-danger/60" onClick={() => handleDeleteCargo(cargo.id)}>Remover</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Funcionários</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestão de equipe e responsáveis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border" onClick={() => setCargosModalOpen(true)}>Cargos</Button>
          <Button onClick={() => setModalOpen(true)}>Novo funcionário</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Aulas</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {funcionarios.map((f) => (
              <tr key={f.id} className="transition-colors hover:bg-secondary/40">
                <td className="px-4 py-3 text-sm font-medium">{f.nome}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{f.cargoId ? (cargoMap.get(f.cargoId) ?? "Cargo removido") : (f.cargo ?? "—")}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{f.podeMinistrarAulas ? "Pode ministrar" : "Não ministra"}</td>
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
