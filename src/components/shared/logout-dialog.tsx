"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { LogOut } from "lucide-react";

type LogoutDialogProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
};

export function LogoutDialog({
  isOpen,
  onOpenChange,
  onConfirm,
  title = "Encerrar sessão?",
  description = "Você será redirecionado para a tela de login. Esta ação não pode ser desfeita.",
}: LogoutDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border/40 bg-card/95 backdrop-blur-xl">
        <DialogHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gym-danger/10 text-gym-danger">
            <LogOut className="h-6 w-6" />
          </div>
          <DialogTitle className="text-center text-xl font-display font-bold">
            {title}
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground pt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex sm:justify-center gap-3 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 rounded-xl h-11 border-border/60"
          >
            Permanecer
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-xl h-11 shadow-lg shadow-gym-danger/20 font-bold"
          >
            {loading ? "Saindo..." : "Sim, Sair"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
