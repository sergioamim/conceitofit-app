"use client";

import { useCallback, useRef, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

/**
 * Hook reutilizável de confirmação baseado em AlertDialog do Shadcn/ui.
 * Substitui window.confirm() nativo em toda a aplicação.
 *
 * Uso:
 * ```tsx
 * const { confirm, ConfirmDialog } = useConfirmDialog();
 *
 * function handleDelete(id: string) {
 *   confirm("Remover este item?", async () => {
 *     await deleteApi(id);
 *     await load();
 *   });
 * }
 *
 * return (
 *   <>
 *     {ConfirmDialog}
 *     // ... resto do JSX
 *   </>
 * );
 * ```
 */
export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [options, setOptions] = useState<ConfirmOptions>({});
  const [confirming, setConfirming] = useState(false);
  const onConfirmRef = useRef<(() => void | Promise<void>) | null>(null);

  const confirm = useCallback(
    (msg: string, onConfirm: () => void | Promise<void>, opts?: ConfirmOptions) => {
      setMessage(msg);
      setOptions(opts ?? {});
      onConfirmRef.current = onConfirm;
      setOpen(true);
    },
    []
  );

  async function handleConfirm() {
    if (!onConfirmRef.current) return;
    setConfirming(true);
    try {
      await onConfirmRef.current();
    } finally {
      setConfirming(false);
      setOpen(false);
    }
  }

  const ConfirmDialog = (
    <AlertDialog open={open} onOpenChange={(v) => { if (!confirming) setOpen(v); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options.title ?? "Confirmar"}</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={confirming}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant={options.variant ?? "destructive"}
            onClick={(e) => { e.preventDefault(); void handleConfirm(); }}
            disabled={confirming}
          >
            {confirming ? "Aguarde..." : (options.confirmLabel ?? "Confirmar")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, ConfirmDialog };
}
