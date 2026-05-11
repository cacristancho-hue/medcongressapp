"use client"

// Live presence indicator: shows who else is on this congress page right now.
// Uses Supabase Realtime presence (built-in, no extra infra).

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

interface PresenceUser {
  user_id: string
  display_name: string
  joined_at: string
}

interface Props {
  congressId: string
  currentUserId: string
  currentUserName: string
}

interface PresenceMeta {
  user_id?: string
  display_name?: string
  joined_at?: string
}

export default function CongressPresence({
  congressId,
  currentUserId,
  currentUserName,
}: Props) {
  const [others, setOthers] = useState<PresenceUser[]>([])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel(`presence:congress:${congressId}`, {
      config: { presence: { key: currentUserId } },
    })

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState()
        const users: PresenceUser[] = []
        for (const key of Object.keys(state)) {
          if (key === currentUserId) continue
          const meta = (state[key]?.[0] ?? {}) as PresenceMeta
          users.push({
            user_id: key,
            display_name: meta.display_name ?? "Otro usuario",
            joined_at: meta.joined_at ?? new Date().toISOString(),
          })
        }
        setOthers(users)
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return
        await channel.track({
          user_id: currentUserId,
          display_name: currentUserName,
          joined_at: new Date().toISOString(),
        } as PresenceMeta)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [congressId, currentUserId, currentUserName])

  if (others.length === 0) return null

  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50/50 border border-emerald-100 px-3 py-1 text-[10px] text-emerald-700 font-black uppercase tracking-widest shadow-sm">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </div>
      <span>
        {others.length === 1
          ? `${others[0].display_name} en línea`
          : `${others.length} colegas en línea`}
      </span>
    </div>
  )
}
