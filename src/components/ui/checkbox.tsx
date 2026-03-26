"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & {
    indeterminate?: boolean
  }
>(({ className, indeterminate, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary outline-none focus-ring-brand disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
      className
    )}
    // Quando usamos o pseudo-estado indeterminate sem controle strict via root, podemos passar via state manual:
    {...(indeterminate && props.checked !== true ? { "data-state": "indeterminate" } : {})}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      // O Indicator renderiza apenas quando há estado checked ou indeterminate verdadeiro no Root real, porém no hack
      // a gente tem que forçar a montagem
      forceMount={indeterminate ? true : undefined}
      className={cn("flex items-center justify-center text-current")}
    >
      {indeterminate && props.checked !== true ? (
        <Minus className="h-4 w-4" />
      ) : (
        <Check className="h-4 w-4" />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
