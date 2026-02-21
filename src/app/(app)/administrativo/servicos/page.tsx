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
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

function ServicoModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<Servico, "id" | "tenantId">, id?: string) => void;
  initial?: Servico | null;
}) {
  const [form, setForm] = useState({
    nome: "",
    descricao: "",
    sessoes: "",
    ativo: true,
  });

  useEffect(() => {
    if (initial) {
      setForm({
        nome: initial.nome,
        descricao: initial.descricao ?? "",
        sessoes: initial.sessoes ? String(initial.sessoes) : "",
        ativo: initial.ativo,
      });
    } else {
      setForm({
        nome: "",
        descricao: "",
        sessoes: "",
        ativo: true,
      });
    }
  }, [initial, open]);

  function handleSave() {
    if (!form.nome) return;
    onSave(
      {
        nome: form.nome,
        descricao: form.descricao || undefined,
        sessoes: form.sessoes ? Math.max(1, parseInt(form.sessoes, 10)) : undefined,
        ativo: form.ativo,
      },
      initial?.id
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {initial ? "Editar serviço" : "Novo serviço"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nome *
            </label>
            <Input
              value={form.nome}
              onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Descrição
            </label>
            <Input
              value={form.descricao}
              onChange={(e) =>
                setForm((f) => ({ ...f, descricao: e.target.value }))
              }
              className="bg-secondary border-border"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Sessões
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                value={form.sessoes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, sessoes: e.target.value }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Ativo
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ativo: e.target.checked }))
                  }
                />
                <span className="text-muted-foreground">Disponível</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-border">
            Cancelar
          </Button>
          <Button onClick={handleSave}>{initial ? "Salvar" : "Criar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
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
                Sessões
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
                  {s.sessoes ?? "—"}
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
                  colSpan={4}
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
