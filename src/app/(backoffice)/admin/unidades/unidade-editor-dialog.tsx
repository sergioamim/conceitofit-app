"use client";

import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Academia } from "@/lib/types";
import type { BackofficeUnidadeFormValues } from "@/lib/forms/backoffice-unidade-form";

type UnidadeEditorDialogProps = {
  open: boolean;
  isEditing: boolean;
  academias: Academia[];
  saving: boolean;
  errors: FieldErrors<BackofficeUnidadeFormValues>;
  control: Control<BackofficeUnidadeFormValues>;
  register: UseFormRegister<BackofficeUnidadeFormValues>;
  onClose: () => void;
  onSubmit: () => void;
};

export function UnidadeEditorDialog({
  open,
  isEditing,
  academias,
  saving,
  errors,
  control,
  register,
  onClose,
  onSubmit,
}: UnidadeEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="border-border bg-card sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            {isEditing ? "Editar unidade" : "Nova unidade"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Formulário administrativo global para cadastro e edição de unidades.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>Academia *</Label>
              <Controller
                control={control}
                name="academiaId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-invalid={errors.academiaId ? "true" : "false"}>
                      <SelectValue placeholder="Selecione a academia" />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      {academias.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.academiaId ? <p className="text-xs text-gym-danger">{errors.academiaId.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit-nome">Nome *</Label>
              <Input id="unit-nome" {...register("nome")} aria-invalid={errors.nome ? "true" : "false"} />
              {errors.nome ? <p className="text-xs text-gym-danger">{errors.nome.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-razao">Razão social</Label>
              <Input id="unit-razao" {...register("razaoSocial")} />
              {errors.razaoSocial ? <p className="text-xs text-gym-danger">{errors.razaoSocial.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-doc">Documento *</Label>
              <Input id="unit-doc" {...register("documento")} aria-invalid={errors.documento ? "true" : "false"} />
              {errors.documento ? <p className="text-xs text-gym-danger">{errors.documento.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-group">Grupo</Label>
              <Input id="unit-group" {...register("groupId")} />
              {errors.groupId ? <p className="text-xs text-gym-danger">{errors.groupId.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-subdomain">Subdomínio *</Label>
              <Input id="unit-subdomain" {...register("subdomain")} aria-invalid={errors.subdomain ? "true" : "false"} />
              {errors.subdomain ? <p className="text-xs text-gym-danger">{errors.subdomain.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-email">E-mail *</Label>
              <Input id="unit-email" type="email" {...register("email")} aria-invalid={errors.email ? "true" : "false"} />
              {errors.email ? <p className="text-xs text-gym-danger">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-telefone">Telefone</Label>
              <Input id="unit-telefone" {...register("telefone")} />
              {errors.telefone ? <p className="text-xs text-gym-danger">{errors.telefone.message}</p> : null}
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Controller
                control={control}
                name="ativo"
                render={({ field }) => (
                  <Select
                    value={field.value ? "ATIVA" : "INATIVA"}
                    onValueChange={(value) => field.onChange(value === "ATIVA")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="ATIVA">Ativa</SelectItem>
                      <SelectItem value="INATIVA">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label>Impressão de cupom</Label>
              <Controller
                control={control}
                name="cupomPrintMode"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-border bg-card">
                      <SelectItem value="80MM">80mm</SelectItem>
                      <SelectItem value="58MM">58mm</SelectItem>
                      <SelectItem value="CUSTOM">Customizado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit-width">Largura custom (mm)</Label>
              <Input id="unit-width" type="number" min={40} max={120} {...register("cupomCustomWidthMm")} />
              {errors.cupomCustomWidthMm ? <p className="text-xs text-gym-danger">{errors.cupomCustomWidthMm.message}</p> : null}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="border-border" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Salvando..." : isEditing ? "Salvar unidade" : "Criar unidade"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
