import * as React from "react"
import { cn } from "../../lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary'
}

export function Button({ className, variant = 'primary', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 text-body-md hover:shadow-sm",
        {
          "bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-sm hover:brightness-110 border-0": variant === 'primary',
          "bg-transparent text-on-surface border border-outline-variant/15 hover:bg-surface-container-low": variant === 'secondary',
          "bg-transparent text-primary hover:bg-primary-container hover:text-on-primary-container border-0 px-2 py-1": variant === 'tertiary',
        },
        className
      )}
      {...props}
    />
  )
}
