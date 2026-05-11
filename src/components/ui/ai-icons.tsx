"use client"

export function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-slate-900 hover:scale-110 transition-transform duration-500" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 0C5.372 0 0 5.372 0 12C0 18.628 5.372 24 12 24C18.628 24 24 18.628 24 12C24 5.372 18.628 0 12 0ZM12 21C7.03 21 3 17.03 3 12C3 6.97 7.03 3 12 3C16.97 3 21 6.97 21 12C21 17.03 16.97 21 12 21Z" />
      <circle cx="12" cy="12" r="2.25" />
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
