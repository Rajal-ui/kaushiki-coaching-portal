import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, success, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-md border-[1.5px] bg-white px-4 py-3 text-base font-sans text-dark transition-all placeholder:text-muted focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50",
          error
            ? "border-error focus:border-error focus:ring-error/25"
            : success
            ? "border-success focus:border-success focus:ring-success/25"
            : "border-border focus:border-primary focus:ring-primary/25",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
