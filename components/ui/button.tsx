import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md font-sans font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-primary text-white hover:bg-primary-light hover:-translate-y-px shadow-sm hover:shadow-xl",
        secondary: "border-[1.5px] border-primary text-primary bg-transparent hover:bg-primary-subtle",
        destructive: "border-[1.5px] border-error text-error bg-transparent hover:bg-red-50",
        ghost: "bg-transparent text-muted hover:bg-border hover:text-dark",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 text-base",
        sm: "h-9 px-4 text-sm rounded-sm",
        lg: "h-14 px-8 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    if (asChild && React.isValidElement(props.children)) {
      // Basic slot-like mapping for child elements
      const child = React.Children.only(props.children) as React.ReactElement;
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size }), className, child.props.className),
        ref,
        ...props,
      })
    }
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
