"use client";

import { useCallback, useRef, useState } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest } from "@/lib/api/http";
import { updateAlunoApi } from "@/lib/api/alunos";
import { normalizeErrorMessage } from "@/lib/utils/api-error";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 2;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

interface AvatarUploadProps {
  currentPhoto?: string | null;
  alunoId: string;
  tenantId: string;
  displayName?: string;
  onSuccess?: (newUrl: string) => void;
  className?: string;
}

export function AvatarUpload({
  currentPhoto,
  alunoId,
  tenantId,
  displayName,
  onSuccess,
  className,
}: AvatarUploadProps) {
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_SIZE_BYTES) {
        toast({
          title: "Arquivo muito grande",
          description: `O limite é ${MAX_SIZE_MB}MB. Escolha outra imagem.`,
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Formato inválido",
          description: "Selecione um arquivo de imagem (JPG, PNG, etc).",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    [toast],
  );

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadResult = await fetch("/api/v1/storage/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadResult.ok) {
        throw new Error("Falha no upload da imagem.");
      }

      const { url } = (await uploadResult.json()) as { url: string };

      // Update aluno with new photo URL
      await updateAlunoApi({
        tenantId,
        id: alunoId,
        data: { foto: url },
      });

      toast({ title: "Foto atualizada!" });
      setPreview(null);
      setSelectedFile(null);
      onSuccess?.(url);
    } catch (err) {
      toast({
        title: "Erro ao atualizar foto",
        description: normalizeErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }, [selectedFile, tenantId, alunoId, toast, onSuccess]);

  const handleCancel = useCallback(() => {
    setPreview(null);
    setSelectedFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const photoSrc = preview ?? currentPhoto;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative">
        <div className="size-32 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-2xl shadow-primary/20">
          <div className="size-full rounded-full bg-background flex items-center justify-center overflow-hidden border-4 border-background">
            {photoSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoSrc}
                alt={displayName ?? "Foto de perfil"}
                className="size-full object-cover"
              />
            ) : (
              <span className="text-4xl font-bold text-muted-foreground/40">
                {displayName?.[0]?.toUpperCase() ?? "?"}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          className="absolute bottom-0 right-0 size-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Trocar foto"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {preview && selectedFile && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="rounded-xl font-bold"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Enviando...
              </>
            ) : (
              "Salvar Foto"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl"
            onClick={handleCancel}
            disabled={uploading}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Cancelar
          </Button>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground">
        JPG, PNG ou WebP. Máximo {MAX_SIZE_MB}MB.
      </p>
    </div>
  );
}
