"use client"

import { Microscope, Activity } from "lucide-react"

export default function Logo({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div className={`group relative flex items-center justify-center ${className}`}>
      {/* Glow Effect */}
      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-125 transition-transform duration-700"></div>
      
      {/* Main Logo Container: Hexagonal Science-first design */}
      <div className="relative z-10 w-full h-full">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="100%" stopColor="#0891B2" />
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="2" />
              <feOffset dx="1" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Hexagon Background (The scientific molecule) */}
          <path 
            d="M50 5 L89 27.5 V72.5 L50 95 L11 72.5 V27.5 Z" 
            fill="white" 
            className="stroke-slate-100"
            strokeWidth="1"
          />
          <path 
            d="M50 10 L85 30 V70 L50 90 L15 30 V30 Z" 
            fill="url(#logo-grad)" 
            className="opacity-95"
          />
          
          {/* Stylized 'M' + 'D' integration */}
          <path 
            d="M30 35 V65 M30 35 L50 50 L70 35 V65" 
            stroke="white" 
            strokeWidth="8" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Clinical Pulse (ECG) Overlay */}
          <path 
            d="M20 75 H35 L40 65 L45 85 L50 75 H80" 
            stroke="white" 
            strokeWidth="3" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            fill="none"
            className="opacity-40"
          />
          
          {/* The "MD" Dot - Symbol of Precision */}
          <circle cx="75" cy="25" r="5" fill="#10B981" />
        </svg>
      </div>
    </div>
  )
}
