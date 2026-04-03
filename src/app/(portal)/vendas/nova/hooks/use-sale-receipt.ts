"use client";

import { useState } from "react";
import type { Aluno, Plano, Venda } from "@/lib/types";

export interface UseSaleReceipt {
  receiptOpen: boolean;
  setReceiptOpen: (open: boolean) => void;
  receiptVenda: Venda | null;
  receiptCliente: Aluno | null;
  receiptPlano: Plano | null;
  receiptContratoAutoMsg: string;
  receiptVoucherCodigo: string;
  receiptVoucherPercent: number;
  showReceipt: (params: {
    venda: Venda;
    cliente: Aluno | null;
    plano: Plano | null;
    contratoAutoMsg: string;
    voucherCodigo: string;
    voucherPercent: number;
  }) => void;
}

export function useSaleReceipt(): UseSaleReceipt {
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptVenda, setReceiptVenda] = useState<Venda | null>(null);
  const [receiptCliente, setReceiptCliente] = useState<Aluno | null>(null);
  const [receiptPlano, setReceiptPlano] = useState<Plano | null>(null);
  const [receiptContratoAutoMsg, setReceiptContratoAutoMsg] = useState("");
  const [receiptVoucherCodigo, setReceiptVoucherCodigo] = useState("");
  const [receiptVoucherPercent, setReceiptVoucherPercent] = useState(0);

  function showReceipt(params: {
    venda: Venda;
    cliente: Aluno | null;
    plano: Plano | null;
    contratoAutoMsg: string;
    voucherCodigo: string;
    voucherPercent: number;
  }) {
    setReceiptVenda(params.venda);
    setReceiptCliente(params.cliente);
    setReceiptPlano(params.plano);
    setReceiptContratoAutoMsg(params.contratoAutoMsg);
    setReceiptVoucherCodigo(params.voucherCodigo);
    setReceiptVoucherPercent(params.voucherPercent);
    setReceiptOpen(true);
  }

  return {
    receiptOpen,
    setReceiptOpen,
    receiptVenda,
    receiptCliente,
    receiptPlano,
    receiptContratoAutoMsg,
    receiptVoucherCodigo,
    receiptVoucherPercent,
    showReceipt,
  };
}
