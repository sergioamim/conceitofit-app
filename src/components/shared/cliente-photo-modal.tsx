"use client";

import { useEffect, useRef, useState } from "react";
import { updateAluno } from "@/lib/mock/services";
import type { Aluno } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function ClientePhotoModal({
  open,
  onClose,
  aluno,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  aluno: Aluno;
  onSaved?: () => Promise<void> | void;
}) {
  const [preview, setPreview] = useState(aluno.foto ?? "");
  const [saving, setSaving] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!open) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPreview(aluno.foto ?? "");
    setCameraError("");
    let mounted = true;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch {
        if (mounted) {
          setCameraError("Não foi possível acessar a câmera.");
        }
      }
    };
    start();
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [open, aluno.foto]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 320;
    canvas.height = video.videoHeight || 240;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateAluno(aluno.id, { foto: preview || undefined });
    setSaving(false);
    onClose();
    if (onSaved) {
      await onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">
            Trocar foto do cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Use a câmera para tirar uma nova foto
            </p>
            <div className="rounded-xl border border-border bg-black/40">
              {cameraError ? (
                <div className="flex h-40 items-center justify-center p-4 text-sm text-gym-danger">
                  {cameraError}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-40 w-full object-cover"
                />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleCapture} disabled={!!cameraError}>
              Capturar nova foto
            </Button>
            <Button
              variant="outline"
              onClick={() => setPreview("")}
              disabled={!preview}
            >
              Remover foto atual
            </Button>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Pré-visualização
            </p>
            <div className="mt-2 flex h-32 items-center justify-center rounded-xl border border-border bg-secondary">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt={`${aluno.nome} preview`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs text-muted-foreground">Sem foto selecionada</span>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Salvando..." : "Salvar foto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
