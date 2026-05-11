"use client"

export default function Logo({ className = "h-12 w-auto", showText = false }: { className?: string, showText?: boolean }) {
  return (
    <div className={`group relative flex items-center gap-3 ${className}`}>
      {/* Símbolo MD + CONGRESS Integrado */}
      <svg viewBox="0 0 320 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-auto drop-shadow-2xl">
        <defs>
          <linearGradient id="brand-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E40AF" />
          </linearGradient>
          
          {/* Brillo de barrido muy lento y elegante */}
          <linearGradient id="scan-shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <filter id="soft-glow">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
          </filter>
        </defs>

        {/* Marco de Diapositiva Unificado (16:9 feel extendido) */}
        <rect 
          x="5" y="10" width="310" height="80" rx="16" 
          fill="url(#brand-grad)" 
          className="stroke-white/10"
          strokeWidth="1"
        />

        {/* Efecto de Reflejo Superior (Glassmorphism) */}
        <path 
          d="M20 10 Q5 10 5 25 V45 L315 25 V10 Z" 
          fill="white" 
          className="opacity-5"
        />

        {/* Monograma MD (Lado Izquierdo) */}
        <g transform="translate(25, 30) scale(0.85)">
          <path 
            d="M0 40 V5 L20 25 L40 5 V40" 
            stroke="white" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M55 5 V40 C55 40 85 40 85 22.5 C85 5 55 5 55 5" 
            stroke="white" 
            strokeWidth="10" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
        </g>

        {/* Palabra CONGRESS (Lado Derecho - Integrada) */}
        <text 
          x="135" y="65" 
          fill="white" 
          className="font-black text-4xl" 
          style={{ fontFamily: 'var(--font-plex-mono), monospace', letterSpacing: '0.15em' }}
        >
          CONGRESS
        </text>

        {/* Línea de Escaneo IA (Sutil y Lenta) */}
        <rect x="5" y="10" width="40" height="80" fill="url(#scan-shimmer)" className="opacity-20">
          <animate 
            attributeName="x" 
            values="-50;320;-50" 
            dur="8s" 
            repeatCount="indefinite" 
          />
        </rect>

        {/* Indicador de Foco / Lente */}
        <circle cx="295" cy="25" r="4" fill="#34D399" className="animate-pulse" />
        <path d="M285 20 H305 M295 10 V30" stroke="white" strokeOpacity="0.2" strokeWidth="1" />
      </svg>
    </div>
  )
}
