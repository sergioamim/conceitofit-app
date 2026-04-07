"use client";

import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";

const IMPORTAR_PAGAMENTOS_EXEMPLO = `Nome,CPF,Descricao,Valor,Desconto,Data Vencimento,Data Pagamento,Status,Forma Pagamento,Tipo
Maria Souza,11987654321,Mensalidade Fevereiro,199,10,10/02/2026,10/02/2026,PAGO,PIX,MENSALIDADE
João Alves,11876543210,Taxa de reativação,80,0,20/02/2026,,PENDENTE,,AVULSO`;

interface PagamentosImportSectionProps {
  payload: string;
  onChangePayload: (value: string) => void;
  onImportar: () => void;
  onClear: () => void;
  importando: boolean;
  erro: string | null;
  resultado: {
    total: number;
    importados: number;
    ignorados: number;
    erros: string[];
  } | null;
  onFileUpload: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function PagamentosImportSection({
  payload,
  onChangePayload,
  onImportar,
  onClear,
  importando,
  erro,
  resultado,
  onFileUpload,
}: PagamentosImportSectionProps) {
  const importFileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Importar pagamentos
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Cole um CSV (ex.: backup do EVO) e execute a importação em lote.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={importFileRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={onFileUpload}
          />
          <Button
            type="button"
            variant="outline"
            className="border-border text-xs"
            onClick={() => importFileRef.current?.click()}
          >
            Selecionar arquivo
          </Button>
          <Button
            type="button"
            className="text-xs"
            onClick={onImportar}
            disabled={importando}
          >
            {importando ? "Importando..." : "Importar"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-border text-xs"
            onClick={onClear}
          >
            Limpar
          </Button>
        </div>
      </div>
      <textarea
        value={payload}
        onChange={(event) => onChangePayload(event.target.value)}
        rows={9}
        className="mt-3 w-full rounded-md border border-border bg-secondary p-2 text-xs leading-5 text-foreground"
        placeholder='Nome,CPF,Descricao,Valor,Desconto,Data Vencimento,Data Pagamento,Status,Forma Pagamento,Tipo'
      />
      {(erro || resultado) && (
        <div
          className={`mt-3 rounded-md border px-3 py-2 text-xs ${
            erro || (resultado?.ignorados ?? 0) > 0
              ? "border-gym-danger/30 bg-gym-danger/10 text-gym-danger"
              : "border-gym-teal/30 bg-gym-teal/10 text-gym-teal"
          }`}
        >
          {erro && <p className="font-semibold">{erro}</p>}
          {!erro && resultado && (
            <div className="space-y-1">
              <p>
                Registros processados: {resultado.total} · Importados: {resultado.importados} · Ignorados:
                {resultado.ignorados}
              </p>
              {resultado.erros.length > 0 && (
                <ul className="list-disc pl-4">
                  {resultado.erros.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export const IMPORTAR_PAGAMENTOS_EXEMPLO_CSV = IMPORTAR_PAGAMENTOS_EXEMPLO;
