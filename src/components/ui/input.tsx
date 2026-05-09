import { clsx } from "clsx"
import { forwardRef } from "react"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        <input
          className={clsx(
            "flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-800 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50",
            error ? "border-red-500" : "border-slate-300",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
