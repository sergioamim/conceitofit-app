import type { RefObject } from "react";
import type { ProspectMensagem, Funcionario } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/formatters";

export function ProspectConversaTab({
  mensagens,
  msgTexto,
  setMsgTexto,
  autorNome,
  setAutorNome,
  sendingMsg,
  funcionarios,
  handleSendMsg,
  messagesEndRef,
}: {
  mensagens: ProspectMensagem[];
  msgTexto: string;
  setMsgTexto: (v: string) => void;
  autorNome: string;
  setAutorNome: (v: string) => void;
  sendingMsg: boolean;
  funcionarios: Funcionario[];
  handleSendMsg: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {mensagens.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma mensagem ainda. Inicie a conversa!
          </p>
        )}
        {mensagens.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-secondary/30 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-gym-accent">{m.autorNome}</span>
              <span className="text-[11px] text-muted-foreground">{formatDateTime(m.datahora)}</span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed">{m.texto}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Send message */}
      <div className="border-t border-border p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Enviando como:</span>
          <Select value={autorNome} onValueChange={setAutorNome}>
            <SelectTrigger className="h-7 w-44 border-border bg-secondary text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="border-border bg-card">
              <SelectItem value="Academia">Academia</SelectItem>
              {funcionarios.map((f) => (
                <SelectItem key={f.id} value={f.nome}>{f.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Digite uma mensagem..."
            value={msgTexto}
            onChange={(e) => setMsgTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSendMsg(); } }}
            className="border-border bg-secondary text-sm"
          />
          <Button onClick={handleSendMsg} disabled={!msgTexto.trim() || sendingMsg} className="shrink-0">
            Enviar
          </Button>
        </div>
      </div>
    </div>
  );
}
