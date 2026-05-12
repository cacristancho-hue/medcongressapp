"use client"

export default function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {/* Halo de luz trasera - Brillo ambiental de alta gama */}
      <div className="absolute inset-0 bg-blue-600/10 blur-3xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-all duration-1000"></div>
      
      {/* Símbolo Principal: The MD Elite Slide */}
      <div className="relative z-10 w-full h-full">
        <svg viewBox="0 0 130 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <defs>
            {/* Gradiente del cuerpo: Pizarra profunda a Azul Real - Oscurecido para contraste */}
            <linearGradient id="monolith-refined" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#020617" />
              <stop offset="100%" stopColor="#1E40AF" />
            </linearGradient>
            
            {/* Efecto de Biselado de Cristal - Opacidad reducida */}
            <linearGradient id="glass-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.15" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Sombra de seguridad para las letras MD */}
            <filter id="text-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="black" floodOpacity="0.5" />
            </filter>

            {/* Brillo Láser IA */}
            <filter id="laser-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="2" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Cuerpo de la Diapositiva (El "Monolito") */}
          <rect 
            x="5" y="15" width="120" height="70" rx="16" 
            fill="url(#monolith-refined)" 
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
          
          {/* Capa de Biselado (Glass Effect) */}
          <rect 
            x="5" y="15" width="120" height="35" rx="16" 
            fill="url(#glass-bevel)" 
          />

          {/* Guías de Enfoque (Viewfinder) - Estilo Leica/Sony */}
          <g stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round" className="opacity-60">
            <path d="M12 25 V18 H22" />
            <path d="M108 25 V18 H118" />
            <path d="M12 75 V82 H22" />
            <path d="M108 75 V82 H118" />
          </g>

          {/* Monograma MD (Geometría Pura) */}
          <g transform="translate(35, 38) scale(0.75)" filter="url(#text-shadow)">
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

          {/* Línea de Escaneo Láser (Inteligencia Activa) */}
          <g filter="url(#laser-glow)">
            <line 
              x1="8" y1="45" x2="122" y2="45" 
              stroke="#34D399" 
              strokeWidth="1.5" 
              strokeLinecap="round"
              className="opacity-80"
            >
              <animate 
                attributeName="y1" 
                values="22;78;22" 
                dur="3s" 
                repeatCount="indefinite" 
              />
              <animate 
                attributeName="y2" 
                values="22;78;22" 
                dur="3s" 
                repeatCount="indefinite" 
              />
            </line>
            {/* Destello en los bordes del láser */}
            <circle cx="8" cy="45" r="2" fill="#34D399">
              <animate attributeName="cy" values="22;78;22" dur="3s" repeatCount="indefinite" />
            </circle>
            <circle cx="122" cy="45" r="2" fill="#34D399">
              <animate attributeName="cy" values="22;78;22" dur="3s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>
      </div>
    </div>
  )
}
