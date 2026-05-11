"use client"

export function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-900 hover:scale-110 transition-transform duration-500" fill="currentColor">
      <path d="M22.28 10.29a7.48 7.48 0 0 0-1.27-4.16 7.5 7.5 0 0 0-5.19-3.42 7.5 7.5 0 0 0-6.78 1.86 7.5 7.5 0 0 0-4.16 1.27 7.5 7.5 0 0 0-3.42 5.19 7.5 7.5 0 0 0 1.86 6.78 7.5 7.5 0 0 0 1.27 4.16 7.5 7.5 0 0 0 5.19 3.42 7.5 7.5 0 0 0 6.78-1.86 7.5 7.5 0 0 0 4.16-1.27 7.5 7.5 0 0 0 3.42-5.19 7.5 7.5 0 0 0-1.86-6.78zm-6.89 12.8a6.07 6.07 0 0 1-2.73-.65l.15-.08 3.82-2.2a.6.6 0 0 0 .3-.52v-4.41l1.58.91a.06.06 0 0 1 .03.05v4.3a6.08 6.08 0 0 1-3.15 5.6zm-8.63-3.27a6.07 6.07 0 0 1-.41-2.79l.15.09 3.82 2.2a.6.6 0 0 0 .6 0l3.82-2.2v1.81a.06.06 0 0 1-.03.05l-3.72 2.15a6.08 6.08 0 0 1-4.23.69zm-1.02-8.04a6.07 6.07 0 0 1 2.32-1.56v4.41a.6.6 0 0 0 .3.52l3.82 2.2-1.58.91a.06.06 0 0 1-.06 0l-3.72-2.15a6.08 6.08 0 0 1-1.08-4.33zm12.66-1.2a6.07 6.07 0 0 1-2.32 1.56V7.73a.6.6 0 0 0-.3-.52l-3.82-2.2 1.58-.91a.06.06 0 0 1 .06 0l3.72 2.15a6.08 6.08 0 0 1 1.08 4.33zm1.02 8.04a6.07 6.07 0 0 1 .41 2.79l-.15-.09-3.82-2.2a.6.6 0 0 0-.6 0l-3.82 2.2v-1.81a.06.06 0 0 1 .03-.05l3.72-2.15a6.08 6.08 0 0 1 4.23-.69zm-6.89-12.8a6.07 6.07 0 0 1 2.73.65l-.15.08-3.82-2.2a.6.6 0 0 0-.3.52v4.41l-1.58-.91a.06.06 0 0 1-.03-.05v-4.3a6.08 6.08 0 0 1 3.15-5.6zm-1.58 11.08l-1.58-.91V8.27l1.58.91v1.82zm3.16 0l-1.58-.91v-1.82l1.58.91v1.82zm0-3.64l-1.58-.91V6.45l1.58.91v1.82z" />
    </svg>
  )
}

export function GeminiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 12.5 8.5 19 11.5C12.5 14.5 12 21 12 21C12 21 11.5 14.5 5 11.5C11.5 8.5 12 2 12 2Z" fill="url(#gemini-real-v2)" />
      <defs>
        <linearGradient id="gemini-real-v2" x1="5" y1="2" x2="19" y2="21">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="50%" stopColor="#9B72CB" />
          <stop offset="100%" stopColor="#D96570" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#D97757]" fill="currentColor">
      <path d="M13.827 3h3.603L24 19.48h-3.603zM6.568 3h3.768l6.57 16.48h-3.768l-1.343-3.462H5.124l-1.344 3.462H0L6.568 3zm4.133 9.96L8.452 7.165 6.205 12.96z" />
    </svg>
  )
}

export function CrossRefIcon() {
  return (
    <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
      <div className="w-2.5 h-2.5 rounded-full bg-[#EF3E36]"></div>
      <span className="text-[11px] font-extrabold text-slate-500">CrossRef</span>
    </div>
  )
}

export function PubMedIcon() {
  return (
    <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
      <div className="w-2.5 h-2.5 rounded-full bg-[#336699]"></div>
      <span className="text-[11px] font-extrabold text-slate-500">PubMed</span>
    </div>
  )
}

export function OpenAlexIcon() {
  return (
    <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
      <div className="w-2.5 h-2.5 rounded-full bg-[#FFB347]"></div>
      <span className="text-[11px] font-extrabold text-slate-500">OpenAlex</span>
    </div>
  )
}
