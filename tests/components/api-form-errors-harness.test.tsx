"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/lib/api/http";
import { applyApiFieldErrors } from "@/lib/forms/api-form-errors";

type HarnessValues = {
  nome: string;
};

function Harness() {
  const {
    setError,
    formState: { errors },
  } = useForm<HarnessValues>({
    defaultValues: { nome: "" },
  });

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          applyApiFieldErrors(
            new ApiRequestError({
              status: 400,
              message: "Validation error",
              fieldErrors: { nome: "Informe o nome." },
            }),
            setError,
          );
        }}
      >
        aplicar
      </button>
      {errors.nome ? <p>{errors.nome.message}</p> : null}
    </div>
  );
}

describe("api-form-errors harness", () => {
  it("expõe o erro de backend inline após aplicar o helper", async () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "aplicar" }));

    expect(screen.getByText("Informe o nome.")).toBeInTheDocument();
  });
});
