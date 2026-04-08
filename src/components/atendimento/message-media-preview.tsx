"use client";

import {
  FileText,
  MapPin,
  Play,
  User,
} from "lucide-react";
import type { MessageContentType } from "@/lib/shared/types/whatsapp-crm";

interface MessageMediaPreviewProps {
  contentType: MessageContentType;
  mediaUrl: string | null;
  content: string | null;
}

export function MessageMediaPreview({
  contentType,
  mediaUrl,
  content,
}: MessageMediaPreviewProps) {
  switch (contentType) {
    case "IMAGEM":
      return mediaUrl ? (
        <a href={mediaUrl} target="_blank" rel="noopener noreferrer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mediaUrl}
            alt={content ?? "Imagem"}
            className="max-w-[200px] rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
          />
        </a>
      ) : (
        <p className="text-sm text-muted-foreground italic">Imagem indisponível</p>
      );

    case "AUDIO":
      return mediaUrl ? (
        <audio controls className="max-w-full">
          <source src={mediaUrl} />
          Seu navegador não suporta áudio.
        </audio>
      ) : (
        <p className="text-sm text-muted-foreground italic">Áudio indisponível</p>
      );

    case "DOCUMENTO":
      return (
        <a
          href={mediaUrl ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gym-teal hover:underline"
        >
          <FileText className="h-4 w-4 shrink-0" />
          <span className="truncate">{content ?? "Documento"}</span>
        </a>
      );

    case "VIDEO":
      return mediaUrl ? (
        <a
          href={mediaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block max-w-[200px]"
        >
          <div className="flex items-center justify-center h-28 rounded-lg bg-black/40">
            <Play className="h-8 w-8 text-white" />
          </div>
          <span className="text-xs text-muted-foreground mt-1 block">
            Abrir vídeo
          </span>
        </a>
      ) : (
        <p className="text-sm text-muted-foreground italic">Vídeo indisponível</p>
      );

    case "LOCALIZACAO":
      return (
        <a
          href={mediaUrl ?? `https://maps.google.com/?q=${encodeURIComponent(content ?? "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-gym-teal hover:underline"
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span>Ver no mapa</span>
        </a>
      );

    case "CONTATO":
      return (
        <div className="flex items-center gap-2 text-sm">
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span>{content ?? "Contato"}</span>
        </div>
      );

    default:
      return (
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
      );
  }
}
