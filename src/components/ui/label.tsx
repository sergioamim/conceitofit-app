import * as React from "react"

import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

function Label({
  className,
  ...props
}: React.ComponentProps<"label"> & {
  asChild?: boolean
}) {
  const Comp = props.asChild ? Slot.Root : "label"

  return (
    <Comp
      data-slot="label"
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    />
  )
}

export { Label }
