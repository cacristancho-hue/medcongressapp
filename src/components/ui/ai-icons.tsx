"use client"

export function OpenAIIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5153-4.9089 6.0462 6.0462 0 0 0-3.9474-3.1205 6.0417 6.0417 0 0 0-5.4347 1.2006 6.086 6.0417 0 0 0-6.3858.2008 6.0417 6.0417 0 0 0-2.4854 4.5746 6.0857 6.0417 0 0 0-2.1558 5.6767 6.0462 6.0462 0 0 0 3.9474 3.1205 6.0417 6.0417 0 0 0 5.4347-1.2006 6.086 6.0417 0 0 0 6.3858-.2008 6.0417 6.0417 0 0 0 2.4854-4.5746 6.0857 6.0417 0 0 0 2.1558-5.6767zM12 14.288a1.2057 1.2057 0 0 1-1.2-1.2057 1.2057 1.2057 0 0 1 1.2-1.2057 1.2057 1.2057 0 0 1 1.2 1.2057 1.2057 1.2057 0 0 1-1.2 1.2057z" />
    </svg>
  )
}

export function GeminiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L14.85 8.65L22 10.14L17.15 15.65L18.06 22.86L12 19.86L5.94 22.86L6.85 15.65L2 10.14L9.15 8.65L12 2Z" fill="url(#gemini-grad)" />
      <defs>
        <linearGradient id="gemini-grad" x1="2" y1="2" x2="22" y2="22">
          <stop offset="0%" stopColor="#4285F4" />
          <stop offset="100%" stopColor="#34A853" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function ClaudeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
    </svg>
  )
}
