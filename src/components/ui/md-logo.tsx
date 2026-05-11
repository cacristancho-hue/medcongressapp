"use client"

export default function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {/* Halo de luz trasera (Glow) */}
      <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-1000"></div>
      
      {/* Símbolo de Diapositiva Inteligente */}
      <div className="relative z-10 w-full h-full">
        <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="slide-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
            <filter id="glass" x="0" y="0" width="100%" height="100%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
            </filter>
          </defs>
          
          {/* Marco de Diapositiva (Rectangle 16:9 feel) */}
          <rect 
            x="5" y="20" width="110" height="60" rx="12" 
            fill="url(#slide-grad)" 
            className="stroke-white/20"
            strokeWidth="1"
          />
          
          {/* Brillo de Cristal en la Diapositiva */}
          <path 
            d="M15 20 Q5 20 5 30 V45 L115 25 V20 Z" 
            fill="white" 
            className="opacity-10"
          />
          
          {/* Letras MD de Alta Fidelidad */}
          <g transform="translate(15, 30) scale(0.9)">
            {/* Letra M */}
            <path 
              d="M10 40 V5 M10 5 L35 25 L60 5 V40" 
              stroke="white" 
              strokeWidth="10" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"
            />
            {/* Letra D */}
            <path 
              d="M75 5 V40 C75 40 105 40 105 22.5 C105 5 75 5 75 5" 
              stroke="white" 
              strokeWidth="10" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"
            />
          </g>
          
          {/* Lente de Captura / Indicador de IA (Esquina superior derecha) */}
          <circle cx="100" cy="35" r="6" fill="white" className="opacity-20" />
          <circle cx="100" cy="35" r="3" fill="#10B981" className="animate-pulse" />
          
          {/* Símbolo de Escaneo (Línea que atraviesa la diapositiva) */}
          <line 
            x1="5" y1="50" x2="115" y2="50" 
            stroke="#10B981" 
            strokeWidth="2" 
            className="opacity-40 animate-pulse"
            strokeDasharray="4 2"
          />
        </svg>
      </div>
    </div>
  )
}
