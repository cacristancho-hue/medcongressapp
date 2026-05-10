"use client"

// Light-weight first-visit tour. Zero external deps.
// Steps reference DOM elements by stable data-tour attribute.
// Persisted in localStorage so it never repeats per user/browser.

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronRight, X } from "lucide-react"

const STORAGE_KEY = "medcongress.onboarding.completed.v1"

interface Step {
  target: string
  title: string
  description: string
  placement?: "top" | "bottom" | "right" | "left"
}

interface Props {
  steps: Step[]
  /** If true, the tour starts even if already completed (admin/preview). */
  force?: boolean
}

export default function OnboardingTour({ steps, force = false }: Props) {
  // mount-only flag derived from localStorage. Using lazy init avoids the
  // "setState in effect" warning while still being SSR-safe.
  const [active, setActive] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return force || localStorage.getItem(STORAGE_KEY) !== "1"
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [tick, setTick] = useState(0)

  // Listen to resize / scroll while active.
  useEffect(() => {
    if (!active) return
    const onChange = () => setTick((t) => t + 1)
    window.addEventListener("resize", onChange)
    window.addEventListener("scroll", onChange, true)
    return () => {
      window.removeEventListener("resize", onChange)
      window.removeEventListener("scroll", onChange, true)
    }
  }, [active])

  // Auto-scroll on step change (one-shot effect).
  useEffect(() => {
    if (!active) return
    const step = steps[stepIndex]
    const el = step ? document.querySelector(step.target) : null
    if (el) {
      const r = el.getBoundingClientRect()
      if (r.top < 80 || r.bottom > window.innerHeight - 80) {
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex])

  function dismiss() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1")
    }
    setActive(false)
  }

  function next() {
    if (stepIndex >= steps.length - 1) {
      dismiss()
    } else {
      setStepIndex(stepIndex + 1)
    }
  }

  if (!active) return null
  if (typeof window === "undefined") return null

  const step = steps[stepIndex]
  if (!step) return null

  void tick // referenced so React re-renders on resize/scroll

  // Compute rect at render time (cheap; getBoundingClientRect is fast).
  const el = document.querySelector(step.target)
  const rect = el ? el.getBoundingClientRect() : null
  const tooltip = rect
    ? positionTooltip(rect, step.placement ?? "bottom")
    : ({ top: "50%", left: "50%", transform: "translate(-50%, -50%)" } as const)

  return createPortal(
    <>
      {/* Dim overlay with hole over target */}
      <div className="fixed inset-0 z-[80] pointer-events-none">
        <div
          className="absolute inset-0 bg-slate-900/40 transition-opacity"
          style={{ clipPath: rect ? cutout(rect) : "none" }}
        />
        {rect && (
          <div
            className="absolute rounded-lg ring-2 ring-teal-400 ring-offset-2 ring-offset-transparent transition-all"
            style={{
              top: rect.top - 4,
              left: rect.left - 4,
              width: rect.width + 8,
              height: rect.height + 8,
            }}
          />
        )}
      </div>

      {/* Tooltip card */}
      <div
        className="fixed z-[81] w-72 rounded-xl bg-white shadow-xl border border-slate-200 p-4 animate-fade-in-up"
        style={tooltip}
      >
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[10px] uppercase tracking-wide text-teal-700 font-semibold">
            {stepIndex + 1} / {steps.length}
          </span>
          <button
            onClick={dismiss}
            aria-label="Cerrar tour"
            className="text-slate-400 hover:text-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h4 className="text-sm font-semibold text-slate-900 leading-tight">
          {step.title}
        </h4>
        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
          {step.description}
        </p>
        <div className="flex justify-between items-center mt-3">
          <button
            onClick={dismiss}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            Saltar tour
          </button>
          <button
            onClick={next}
            className="inline-flex items-center gap-1 rounded-md bg-slate-900 text-white text-xs font-medium px-3 py-1.5 hover:bg-slate-800 transition-colors"
          >
            {stepIndex >= steps.length - 1 ? "Entendido" : "Siguiente"}
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </>,
    document.body
  )
}

// =============================================================================
// Geometry helpers
// =============================================================================

function cutout(rect: DOMRect): string {
  const top = rect.top - 4
  const left = rect.left - 4
  const right = rect.right + 4
  const bottom = rect.bottom + 4
  const H = window.innerHeight
  return `polygon(
    0 0,
    100% 0,
    100% 100%,
    0 100%,
    0 ${top}px,
    ${left}px ${top}px,
    ${left}px ${bottom}px,
    ${right}px ${bottom}px,
    ${right}px ${top}px,
    0 ${top}px
  )`
    .replace(/\s+/g, " ")
    .replace(
      "100% 100%, 0 100%, 0 " + top + "px",
      `100% 100%, 0 100%, 0 ${H}px, 0 ${top}px`
    )
}

function positionTooltip(
  rect: DOMRect,
  placement: "top" | "bottom" | "right" | "left"
): React.CSSProperties {
  const margin = 14
  const tooltipWidth = 288
  const tooltipHeight = 140

  switch (placement) {
    case "top":
      return {
        top: Math.max(8, rect.top - tooltipHeight - margin),
        left: clampHorizontal(rect.left + rect.width / 2 - tooltipWidth / 2, tooltipWidth),
      }
    case "right":
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: Math.min(rect.right + margin, window.innerWidth - tooltipWidth - 8),
      }
    case "left":
      return {
        top: rect.top + rect.height / 2 - tooltipHeight / 2,
        left: Math.max(8, rect.left - tooltipWidth - margin),
      }
    case "bottom":
    default:
      return {
        top: rect.bottom + margin,
        left: clampHorizontal(rect.left + rect.width / 2 - tooltipWidth / 2, tooltipWidth),
      }
  }
}

function clampHorizontal(x: number, width: number): number {
  return Math.max(8, Math.min(x, window.innerWidth - width - 8))
}
