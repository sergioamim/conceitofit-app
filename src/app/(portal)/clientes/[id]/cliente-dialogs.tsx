"use client";

import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ClienteWorkspace } from "./use-cliente-workspace";

type ClienteDialogsProps = Pick<
  ClienteWorkspace,
  | "aluno"
  | "liberarAcessoOpen"
  | "setLiberarAcessoOpen"
  | "liberarAcessoJustificativa"
  | "setLiberarAcessoJustificativa"
  | "liberandoAcesso"
  | "liberarAcessoErro"
  | "setLiberarAcessoErro"
  | "liberarAcessoInfo"
  | "setLiberarAcessoInfo"
  | "handleLiberarAcesso"
  | "excluirOpen"
  | "excluirJustificativa"
  | "setExcluirJustificativa"
  | "excluindo"
  | "excluirErro"
  | "setExcluirErro"
  | "excluirBlockedBy"
  | "setExcluirBlockedBy"
  | "closeExcluirModal"
  | "handleExcluir"
  | "migracaoOpen"
  | "migracaoTenantDestinoId"
  | "setMigracaoTenantDestinoId"
  | "migracaoJustificativa"
  | "setMigracaoJustificativa"
  | "migracaoPreservaContexto"
  | "setMigracaoPreservaContexto"
  | "migrandoCliente"
  | "migracaoErro"
  | "setMigracaoErro"
  | "migracaoBlockedBy"
  | "setMigracaoBlockedBy"
  | "closeMigracaoModal"
  | "handleMigracao"
  | "baseTenantNomeAtual"
  | "opcoesMigracao"
> & {
  bloquearAcessoOpen: boolean;
  bloquearAcessoJustificativa: string;
  setBloquearAcessoJustificativa: (value: string) => void;
  bloqueandoAcesso: boolean;
  bloquearAcessoErro: string;
  setBloquearAcessoErro: (value: string) => void;
  closeBloquearAcessoModal: () => void;
  handleBloquearAcesso: () => void | Promise<void>;
  lgpdDialogTipo: "pessoais" | "sensiveis" | null;
  lgpdJustificativa: string;
  setLgpdJustificativa: (value: string) => void;
  lgpdProcessando: boolean;
  lgpdErro: string;
  setLgpdErro: (value: string) => void;
  closeLgpdModal: () => void;
  handleLgpdConfirm: () => void | Promise<void>;
};

export function ClienteDialogs(props: ClienteDialogsProps) {
  const {
    liberarAcessoOpen,
    setLiberarAcessoOpen,
    liberarAcessoJustificativa,
    setLiberarAcessoJustificativa,
    liberandoAcesso,
    liberarAcessoErro,
    setLiberarAcessoErro,
    liberarAcessoInfo,
    setLiberarAcessoInfo,
    handleLiberarAcesso,
    excluirOpen,
    excluirJustificativa,
    setExcluirJustificativa,
    excluindo,
    excluirErro,
    setExcluirErro,
    excluirBlockedBy,
    setExcluirBlockedBy,
    closeExcluirModal,
    handleExcluir,
    migracaoOpen,
    migracaoTenantDestinoId,
    setMigracaoTenantDestinoId,
    migracaoJustificativa,
    setMigracaoJustificativa,
    migracaoPreservaContexto,
    setMigracaoPreservaContexto,
    migrandoCliente,
    migracaoErro,
    setMigracaoErro,
    migracaoBlockedBy,
    setMigracaoBlockedBy,
    closeMigracaoModal,
    handleMigracao,
    baseTenantNomeAtual,
    opcoesMigracao,
    bloquearAcessoOpen,
    bloquearAcessoJustificativa,
    setBloquearAcessoJustificativa,
    bloqueandoAcesso,
    bloquearAcessoErro,
    setBloquearAcessoErro,
    closeBloquearAcessoModal,
    handleBloquearAcesso,
    lgpdDialogTipo,
    lgpdJustificativa,
    setLgpdJustificativa,
    lgpdProcessando,
    lgpdErro,
    setLgpdErro,
    closeLgpdModal,
    handleLgpdConfirm,
  } = props;

  return (
    <>
      <Dialog open={bloquearAcessoOpen} onOpenChange={(next) => { if (!next) closeBloquearAcessoModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Bloquear acesso
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Registre a justificativa para bloquear o acesso operacional deste cliente.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={bloquearAcessoJustificativa}
                onChange={(event) => {
                  setBloquearAcessoJustificativa(event.target.value);
                  if (bloquearAcessoErro) setBloquearAcessoErro("");
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Explique o motivo do bloqueio..."
              />
            </div>
            {bloquearAcessoErro ? <p className="text-xs text-gym-danger">{bloquearAcessoErro}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBloquearAcessoModal} disabled={bloqueandoAcesso}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleBloquearAcesso()}
              disabled={bloqueandoAcesso || !bloquearAcessoJustificativa.trim()}
            >
              {bloqueandoAcesso ? "Bloqueando..." : "Bloquear acesso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Liberar Acesso Dialog */}
      <Dialog
        open={liberarAcessoOpen}
        onOpenChange={(next) => {
          if (next) return;
          setLiberarAcessoOpen(false);
          setLiberarAcessoJustificativa("");
          setLiberarAcessoErro("");
        }}
      >
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Liberar acesso (catraca)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Informe a justificativa para envio do comando de liberação. Este campo é obrigatório.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa
              </label>
              <textarea
                value={liberarAcessoJustificativa}
                onChange={(event) => {
                  setLiberarAcessoJustificativa(event.target.value);
                  if (liberarAcessoErro) setLiberarAcessoErro("");
                  if (liberarAcessoInfo) setLiberarAcessoInfo(null);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Justificativa obrigatória para liberação..."
              />
            </div>
            {liberarAcessoErro ? <p className="text-xs text-gym-danger">{liberarAcessoErro}</p> : null}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLiberarAcessoOpen(false);
                setLiberarAcessoJustificativa("");
                setLiberarAcessoErro("");
              }}
              disabled={liberandoAcesso}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLiberarAcesso}
              disabled={liberandoAcesso || !liberarAcessoJustificativa.trim()}
            >
              {liberandoAcesso ? "Enviando..." : "Enviar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lgpdDialogTipo !== null} onOpenChange={(next) => { if (!next) closeLgpdModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {lgpdDialogTipo === "pessoais" ? "Excluir dados pessoais" : "Excluir dados sensíveis"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {lgpdDialogTipo === "pessoais"
                ? "Esta ação é irreversível e anonimiza nome, email, telefone e CPF do cliente."
                : "Esta ação é irreversível e remove anamnese e observações médicas do cliente."}
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={lgpdJustificativa}
                onChange={(event) => {
                  setLgpdJustificativa(event.target.value);
                  if (lgpdErro) setLgpdErro("");
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Descreva a justificativa para auditoria..."
              />
            </div>
            {lgpdErro ? <p className="text-xs text-gym-danger">{lgpdErro}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeLgpdModal} disabled={lgpdProcessando}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => void handleLgpdConfirm()}
              disabled={lgpdProcessando || !lgpdJustificativa.trim()}
            >
              {lgpdProcessando
                ? "Processando..."
                : lgpdDialogTipo === "pessoais"
                  ? "Excluir dados pessoais"
                  : "Excluir dados sensíveis"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Excluir Cliente Dialog */}
      <Dialog open={excluirOpen} onOpenChange={(next) => { if (!next) closeExcluirModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Excluir cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta ação deve ser usada apenas quando a exclusão controlada estiver permitida para o cliente. Informe a justificativa para auditoria.
            </p>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={excluirJustificativa}
                onChange={(event) => {
                  setExcluirJustificativa(event.target.value);
                  if (excluirErro) setExcluirErro("");
                  if (excluirBlockedBy.length > 0) setExcluirBlockedBy([]);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Descreva o motivo da exclusão controlada..."
              />
            </div>
            {excluirErro ? <p className="text-xs text-gym-danger">{excluirErro}</p> : null}
            {excluirBlockedBy.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Bloqueios encontrados
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100">
                  {excluirBlockedBy.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeExcluirModal} disabled={excluindo}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleExcluir}
              disabled={excluindo || !excluirJustificativa.trim()}
            >
              {excluindo ? "Excluindo..." : "Excluir cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Migração Dialog */}
      <Dialog open={migracaoOpen} onOpenChange={(next) => { if (!next) closeMigracaoModal(); }}>
        <DialogContent className="border-border bg-card sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Migrar unidade-base do cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              Esta operação altera a unidade-base estrutural do cliente. Não é apenas uma troca temporária de contexto.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 px-3 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Origem atual
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">{baseTenantNomeAtual}</p>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Unidade destino *
                </label>
                <select
                  value={migracaoTenantDestinoId}
                  onChange={(event) => {
                    setMigracaoTenantDestinoId(event.target.value);
                    if (migracaoErro) setMigracaoErro("");
                    if (migracaoBlockedBy.length > 0) setMigracaoBlockedBy([]);
                  }}
                  className="flex h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm"
                >
                  <option value="">Selecione a unidade destino</option>
                  {opcoesMigracao.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Justificativa *
              </label>
              <textarea
                value={migracaoJustificativa}
                onChange={(event) => {
                  setMigracaoJustificativa(event.target.value);
                  if (migracaoErro) setMigracaoErro("");
                  if (migracaoBlockedBy.length > 0) setMigracaoBlockedBy([]);
                }}
                rows={4}
                maxLength={500}
                className="min-h-24 w-full rounded-md border border-border bg-secondary px-3 py-2 text-sm"
                placeholder="Explique o motivo operacional e estrutural da migração..."
              />
            </div>
            <label className="flex items-start gap-2 rounded-xl border border-border px-3 py-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={migracaoPreservaContexto}
                onChange={(event) => setMigracaoPreservaContexto(event.target.checked)}
                className="mt-1"
              />
              <span>
                Preservar o contexto comercial no tenant de destino após a migração.
              </span>
            </label>
            {migracaoErro ? <p className="text-xs text-gym-danger">{migracaoErro}</p> : null}
            {migracaoBlockedBy.length > 0 ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Bloqueios encontrados
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-100">
                  {migracaoBlockedBy.map((item) => (
                    <li key={item.code}>{item.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeMigracaoModal} disabled={migrandoCliente}>
              Cancelar
            </Button>
            <Button
              onClick={handleMigracao}
              disabled={migrandoCliente || !migracaoTenantDestinoId || !migracaoJustificativa.trim()}
            >
              {migrandoCliente ? "Migrando..." : "Confirmar migração"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
