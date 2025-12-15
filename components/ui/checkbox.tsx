"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        // Base styles
        "peer h-4 w-4 shrink-0 rounded-[4px] border shadow-xs transition-all outline-none",
        // Unchecked state - light mode
        "border-input bg-background",
        // Unchecked state - dark mode (high visibility)
        "dark:border-gray-400 dark:bg-gray-700/50 dark:ring-1 dark:ring-gray-500/50",
        // Checked state - light mode
        "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary",
        // Checked state - dark mode (override dark unchecked styles)
        "data-[state=checked]:ring-0 dark:data-[state=checked]:bg-primary dark:data-[state=checked]:border-primary dark:data-[state=checked]:ring-0",
        // Focus states
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        // Invalid states
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        // Disabled states
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="flex h-full w-full items-center justify-center text-current"
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }