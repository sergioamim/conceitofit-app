"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { maskPhone } from "@/lib/utils";

type PhoneInputProps = Omit<React.ComponentProps<typeof Input>, "onChange" | "value"> & {
  value: string;
  onChange: (masked: string) => void;
};

export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(maskPhone(e.target.value));
  }

  return <Input value={value} onChange={handleChange} {...props} />;
}

