import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
  iconOnly?: boolean
  light?: boolean
}

export function Logo({ className, iconOnly = false, light = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {/* Icon: Pulse + Document Concept */}
      <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
        {/* Background Shield/Card */}
        <div className={cn(
          "absolute inset-0 rounded-xl rotate-3 transition-transform group-hover:rotate-6",
          light ? "bg-white/20" : "bg-blue-600/10"
        )} />
        <div className={cn(
          "absolute inset-0 rounded-xl -rotate-3 transition-transform group-hover:-rotate-0",
          light ? "bg-white" : "bg-blue-600"
        )} />
        
        {/* SVG Pulse Line + Doc */}
        <svg 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className={cn("w-5 h-5 relative z-10", light ? "text-blue-600" : "text-white")}
        >
          {/* Document Shape Outline */}
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" className="opacity-30" />
          {/* Pulse Line */}
          <path d="M3 12h3l3-9 4 18 3-9h5" />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span className={cn(
            "text-lg font-black tracking-tight",
            light ? "text-white" : "text-slate-900"
          )}>
            MEDD<span className="text-blue-600">CONGRESS</span>
          </span>
          <span className={cn(
            "text-[10px] font-bold uppercase tracking-[0.2em]",
            light ? "text-blue-200" : "text-slate-500"
          )}>
            Academic AI
          </span>
        </div>
      )}
    </div>
  )
}
