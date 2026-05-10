import Link from "next/link"
import { cn } from "@/lib/utils"

type IllustrationKind =
  | "library"
  | "trash"
  | "search"
  | "congress"
  | "report"
  | "topics"
  | "references"
  | "generic"

interface Action {
  label: string
  href?: string
  onClick?: () => void
  primary?: boolean
}

interface EmptyStateProps {
  illustration?: IllustrationKind
  title: string
  description?: string
  action?: Action
  secondaryAction?: Action
  className?: string
  size?: "sm" | "md" | "lg"
}

/**
 * Reusable empty-state surface. Treats the empty case as an onboarding
 * surface (best practice 2026): illustration + clear value prop + a single
 * primary CTA when applicable.
 *
 * Illustrations are inline SVG so we never block on an asset request.
 */
export function EmptyState({
  illustration = "generic",
  title,
  description,
  action,
  secondaryAction,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizes = {
    sm: { wrap: "py-8", svg: "h-20 w-20", title: "text-base" },
    md: { wrap: "py-12", svg: "h-28 w-28", title: "text-lg" },
    lg: { wrap: "py-20", svg: "h-40 w-40", title: "text-2xl" },
  } as const
  const s = sizes[size]

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white text-center px-6 flex flex-col items-center",
        s.wrap,
        className
      )}
    >
      <Illustration kind={illustration} className={cn("mb-4 text-teal-600/70", s.svg)} />
      <h3 className={cn("font-semibold text-slate-900", s.title)}>{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 mt-2 max-w-md leading-relaxed">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {action && <ActionButton {...action} />}
          {secondaryAction && <ActionButton {...secondaryAction} />}
        </div>
      )}
    </div>
  )
}

function ActionButton({ label, href, onClick, primary }: Action) {
  const cls = primary
    ? "inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 transition-colors"
    : "inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition-colors"

  if (href) {
    return (
      <Link href={href} className={cls}>
        {label}
      </Link>
    )
  }
  return (
    <button onClick={onClick} className={cls}>
      {label}
    </button>
  )
}

// =============================================================================
// Illustrations — SVG inline, theming via currentColor
// =============================================================================

function Illustration({
  kind,
  className,
}: {
  kind: IllustrationKind
  className?: string
}) {
  const common = {
    className,
    viewBox: "0 0 200 200",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": true,
  } as const

  switch (kind) {
    case "library":
      return (
        <svg {...common}>
          <rect x="40" y="60" width="40" height="100" rx="3" stroke="currentColor" strokeWidth="2.5" />
          <rect x="85" y="40" width="40" height="120" rx="3" stroke="currentColor" strokeWidth="2.5" />
          <rect x="130" y="55" width="40" height="105" rx="3" stroke="currentColor" strokeWidth="2.5" />
          <line x1="50" y1="80" x2="70" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="50" y1="95" x2="70" y2="95" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="95" y1="60" x2="115" y2="60" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="95" y1="75" x2="115" y2="75" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="140" y1="75" x2="160" y2="75" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="40" y1="170" x2="170" y2="170" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        </svg>
      )

    case "trash":
      return (
        <svg {...common}>
          <path
            d="M55 70 L60 160 a5 5 0 0 0 5 5 H135 a5 5 0 0 0 5 -5 L145 70 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <line x1="45" y1="70" x2="155" y2="70" stroke="currentColor" strokeWidth="2.5" />
          <path d="M80 70 V55 a5 5 0 0 1 5 -5 H115 a5 5 0 0 1 5 5 V70" stroke="currentColor" strokeWidth="2.5" />
          <line x1="80" y1="90" x2="80" y2="145" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="100" y1="90" x2="100" y2="145" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="120" y1="90" x2="120" y2="145" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
      )

    case "search":
      return (
        <svg {...common}>
          <circle cx="85" cy="85" r="40" stroke="currentColor" strokeWidth="2.5" />
          <line x1="115" y1="115" x2="150" y2="150" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="70" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
          <line x1="70" y1="92" x2="92" y2="92" stroke="currentColor" strokeWidth="1.5" opacity="0.4" />
        </svg>
      )

    case "congress":
      return (
        <svg {...common}>
          <rect x="35" y="45" width="130" height="90" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <line x1="35" y1="65" x2="165" y2="65" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="55" cy="55" r="2" fill="currentColor" />
          <circle cx="65" cy="55" r="2" fill="currentColor" />
          <circle cx="75" cy="55" r="2" fill="currentColor" />
          <path
            d="M50 95 H65 L72 80 L82 110 L90 90 H110 M115 95 H150"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <line x1="60" y1="155" x2="140" y2="155" stroke="currentColor" strokeWidth="2" opacity="0.4" />
        </svg>
      )

    case "report":
      return (
        <svg {...common}>
          <path
            d="M55 30 H120 L150 60 V165 a5 5 0 0 1 -5 5 H55 a5 5 0 0 1 -5 -5 V35 a5 5 0 0 1 5 -5 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M120 30 V60 H150" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="65" y1="85" x2="135" y2="85" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="100" x2="135" y2="100" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="115" x2="120" y2="115" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="135" x2="115" y2="135" stroke="currentColor" strokeWidth="2" opacity="0.5" />
          <line x1="65" y1="150" x2="100" y2="150" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        </svg>
      )

    case "topics":
      return (
        <svg {...common}>
          <circle cx="100" cy="100" r="20" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="50" cy="60" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="160" cy="60" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="50" cy="150" r="14" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="160" cy="150" r="14" stroke="currentColor" strokeWidth="2.5" />
          <line x1="80" y1="90" x2="62" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="120" y1="90" x2="148" y2="70" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="80" y1="110" x2="62" y2="140" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <line x1="120" y1="110" x2="148" y2="140" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
        </svg>
      )

    case "references":
      return (
        <svg {...common}>
          <rect x="50" y="40" width="100" height="120" rx="4" stroke="currentColor" strokeWidth="2.5" />
          <line x1="65" y1="60" x2="135" y2="60" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <line x1="65" y1="78" x2="120" y2="78" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <line x1="65" y1="96" x2="135" y2="96" stroke="currentColor" strokeWidth="2" opacity="0.4" />
          <circle cx="135" cy="125" r="22" stroke="currentColor" strokeWidth="2.5" fill="white" />
          <path
            d="M127 125 L132 130 L143 119"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )

    case "generic":
    default:
      return (
        <svg {...common}>
          <circle cx="100" cy="100" r="60" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
          <circle cx="100" cy="100" r="30" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="6" fill="currentColor" />
        </svg>
      )
  }
}
