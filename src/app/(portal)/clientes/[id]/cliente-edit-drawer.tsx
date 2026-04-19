"use client";

import { ClienteEditForm } from "@/components/shared/cliente-edit-form";
import type { Aluno } from "@/lib/types";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ClienteEditDrawerProps {
  open: boolean;
  aluno: Aluno;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
}

export function ClienteEditDrawer({ open, aluno, onClose, onSaved }: ClienteEditDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-2xl transform border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h2 className="font-display text-lg font-bold">Editar cadastro</h2>
              <p className="text-xs text-muted-foreground">{aluno.nome}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="size-4" />
            </Button>
          </div>

          {/* Content — scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {open && (
              <ClienteEditForm
                aluno={aluno}
                onCancel={onClose}
                onSaved={async () => {
                  await onSaved();
                  onClose();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
