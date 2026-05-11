"use client"

import { Microscope, Activity } from "lucide-react"

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Círculo de fondo sutil */}
      <div className="absolute inset-0 bg-blue-100/50 rounded-lg transform rotate-3 group-hover:rotate-6 transition-transform"></div>
      
      {/* Icono Principal: Combinación de Microscopio y Actividad */}
      <div className="relative text-blue-600 flex items-center justify-center">
        <Microscope className="w-full h-full" strokeWidth={2.5} />
        <div className="absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-sm border border-blue-50">
          <Activity className="w-3 h-3 text-emerald-500" strokeWidth={3} />
        </div>
      </div>
    </div>
  )
}
