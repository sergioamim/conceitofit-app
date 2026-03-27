import { z } from "zod";
import { requiredTrimmedString } from "@/lib/forms/zod-helpers";

export const impersonationDialogSchema = z.object({
  justification: requiredTrimmedString("Informe a justificativa da impersonação."),
});

export type ImpersonationDialogValues = z.infer<typeof impersonationDialogSchema>;
