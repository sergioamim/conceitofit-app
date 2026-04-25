"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

/**
 * Modal de captura/upload de foto para o wizard "Novo cliente".
 *
 * Diferente do `cliente-photo-modal` (que chama `updateAlunoService`
 * direto no backend), este modal apenas gera o base64 e devolve via
 * `onConfirm`. O wizard guarda no estado do form (`foto` field) e
 * envia junto com o payload de `createAlunoApi`.
 *
 * Abre sobreposto ao Dialog do wizard — Radix Dialog empilha modais,
 * então o wizard não é fechado enquanto este estiver aberto.
 */
export function WizardPhotoModal({
  open,
  onClose,
  currentPhoto,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  currentPhoto?: string;
  onConfirm: (base64: string) => void;
}) {
  const [preview, setPreview] = useState(currentPhoto ?? "");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("Este dispositivo não suporta acesso à câmera.");
      return;
    }
    setError("");
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => undefined);
      }
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") {
        setError("Permissão da câmera negada. Libere o acesso nas configurações do navegador.");
      } else if (name === "NotFoundError") {
        setError("Nenhuma câmera encontrada neste dispositivo.");
      } else {
        setError(`Não foi possível acessar a câmera: ${name || String(err)}`);
      }
    }
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      return;
    }
    setPreview(currentPhoto ?? "");
    setCameraOpen(false);
    setError("");
    return () => {
      stopCamera();
    };
  }, [open, currentPhoto, stopCamera]);

  useEffect(() => {
    if (!open || !cameraOpen) return;
    void startCamera();
  }, [cameraOpen, open, startCamera]);

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setPreview(dataUrl);
    stopCamera();
    setCameraOpen(false);
  }

  function handleFilePick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Arquivo precisa ser uma imagem.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Imagem acima de ${MAX_SIZE_MB}MB. Escolha uma foto menor.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPreview(reader.result);
        setError("");
      }
    };
    reader.onerror = () => setError("Não foi possível ler o arquivo.");
    reader.readAsDataURL(file);
  }

  function handleRemove() {
    setPreview("");
    stopCamera();
    setCameraOpen(false);
  }

  function handleConfirm() {
    onConfirm(preview);
    onClose();
  }

  const hasPreview = Boolean(preview);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="bg-card border-border w-[96vw] max-w-2xl p-0">
        <DialogHeader>
          <DialogTitle className="px-6 pt-6 font-display text-lg">
            Foto do cliente
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 pb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {cameraOpen ? "Posicione o rosto e capture" : hasPreview ? "Pré-visualização" : "Tire uma foto ou envie um arquivo"}
          </p>
          <div className="overflow-hidden rounded-xl border border-border bg-black/70">
            {cameraOpen ? (
              error ? (
                <div className="flex h-[50vh] items-center justify-center p-4 text-center text-sm text-gym-danger">
                  {error}
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-[50vh] w-full object-cover"
                />
              )
            ) : (
              <div className="flex h-[50vh] w-full items-center justify-center">
                {hasPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Foto do cliente"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm text-muted-foreground">Nenhuma foto selecionada.</span>
                )}
              </div>
            )}
          </div>

          {error && !cameraOpen ? (
            <p className="text-sm text-gym-danger">{error}</p>
          ) : null}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFilePick}
          />

          <div className="flex flex-wrap items-center justify-end gap-2">
            {cameraOpen ? (
              <>
                <Button type="button" variant="outline" onClick={() => { setCameraOpen(false); stopCamera(); }}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleCapture} disabled={Boolean(error)}>
                  <Camera className="size-4" aria-hidden />
                  Capturar
                </Button>
              </>
            ) : (
              <>
                {hasPreview ? (
                  <Button type="button" variant="outline" onClick={handleRemove}>
                    <X className="size-4" aria-hidden />
                    Remover
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setError(""); setCameraOpen(true); }}
                >
                  <Camera className="size-4" aria-hidden />
                  Câmera
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" aria-hidden />
                  Enviar arquivo
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Fechar
                </Button>
                <Button type="button" onClick={handleConfirm} disabled={preview === (currentPhoto ?? "")}>
                  Confirmar
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
