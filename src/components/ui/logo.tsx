import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
  size?: "sm" | "md" | "lg"
}

/**
 * MDCONGRESS brand logo.
 *
 * Symbol: a stylized stethoscope head + ECG pulse merged into a hexagon,
 * representing "academic medicine + signal extraction". The hexagon nods to
 * molecular structure (medical/scientific), the pulse represents the act
 * of capturing knowledge in the moment of a congress.
 *
 * Premium typography: Inter at 700 with -2% letter-spacing.
 * The wordmark is structured to support a future rebrand without code
 * changes: just swap the inner span content.
 */
export function Logo({ className, iconOnly = false, light = false, size = "md" }: LogoProps) {
  const sizes = {
    sm: { box: "w-7 h-7", icon: "w-4 h-4", text: "text-base", tag: "text-[9px]" },
    md: { box: "w-9 h-9", icon: "w-5 h-5", text: "text-lg", tag: "text-[10px]" },
    lg: { box: "w-12 h-12", icon: "w-7 h-7", text: "text-2xl", tag: "text-xs" },
  } as const
  const s = sizes[size]

  return (
    <div className={cn("flex items-center gap-2.5 select-none group", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center shrink-0 rounded-xl transition-all",
          s.box,
          light
            ? "bg-white/15 ring-1 ring-white/20"
            : "bg-gradient-to-br from-teal-500 to-blue-700 shadow-md shadow-teal-500/20"
        )}
      >
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("relative z-10", s.icon, light ? "text-white" : "text-white")}
          aria-hidden="true"
        >
          {/* Hexagon outer ring */}
          <path
            d="M16 3 L27 9 L27 23 L16 29 L5 23 L5 9 Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.4"
          />
          {/* ECG pulse — the core element */}
          <path
            d="M7 16 H11 L13 11 L15.5 21 L18 13 L20 18 H25"
            stroke="currentColor"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={cn(
              "font-bold tracking-tighter",
              s.text,
              light ? "text-white" : "text-slate-900"
            )}
            style={{ letterSpacing: "-0.04em" }}
          >
            <span className={light ? "text-white" : "text-slate-900"}>MD</span>
            <span className={light ? "text-blue-200" : "text-blue-600"}>CONGRESS</span>
          </span>
          <span
            className={cn(
              "uppercase font-bold tracking-[0.2em] mt-0.5",
              s.tag,
              light ? "text-blue-100/80" : "text-slate-400"
            )}
          >
            Academic Companion
          </span>
        </div>
      )}
    </div>
  )
}
