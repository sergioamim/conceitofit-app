"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskCEP, maskCPF, maskPhone } from "@/lib/utils";

type MaskType = "cpf" | "phone" | "cep";

interface MaskedInputProps
  extends Omit<React.ComponentProps<typeof Input>, "onChange"> {
  mask: MaskType;
  value: string;
  onChange: (masked: string) => void;
}

const MASK_FN: Record<MaskType, (v: string) => string> = {
  cpf: maskCPF,
  phone: maskPhone,
  cep: maskCEP,
};

export function MaskedInput({ mask, value, onChange, ...props }: MaskedInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(MASK_FN[mask](e.target.value));
  }

  return <Input value={value} onChange={handleChange} {...props} />;
}
