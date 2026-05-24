"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import TopicNavigator from "./topic-navigator"
import PhotoGrid from "./photo-grid"
import { clsx } from "clsx"
import { Layers } from "lucide-react"

interface DiscoveryImage {
  id: string
  storage_path: string
  storage_path_optimized?: string | null
  storage_path_thumbnail?: string | null
  original_filename: string
  file_size: number | null
  status: string
  created_at: string
  signedUrl: string | null
  thumbSignedUrl?: string | null
  optimizedSignedUrl?: string | null
  ocr_text?: string | null
  topic_ids: string[]
  session_id?: string | null
  image_type?: string | null
}

interface DiscoveryTopic {
  id: string
  name: string
  category: string | null
  description: string | null
  image_count: number
}

export interface DiscoverySession {
  id: string
  title: string
  speaker?: string | null
  room?: string | null
}

interface Props {
  congressId: string
  initialImages: DiscoveryImage[]
  topics: DiscoveryTopic[]
  sessions: DiscoverySession[]
}

// "all" = todas, "unassigned" = sin sesión, o un id de sesión.
type SessionFilter = "all" | "unassigned" | string

export default function DiscoveryClient({ congressId, initialImages, topics, sessions }: Props) {
  const t = useTranslations("discovery")
  const tv = useTranslations("viewer")
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const unassignedCount = useMemo(
    () => initialImages.filter((img) => !img.session_id).length,
    [initialImages]
  )

  // Image types present in this congress (for the type filter chips).
  const availableTypes = useMemo(() => {
    const set = new Set<string>()
    initialImages.forEach((img) => {
      if (img.image_type) set.add(img.image_type)
    })
    return Array.from(set)
  }, [initialImages])

  const filteredImages = useMemo(() => {
    return initialImages.filter((img) => {
      const matchesTopic = !activeTopicId || img.topic_ids.includes(activeTopicId)
      const matchesSession =
        sessionFilter === "all" ||
        (sessionFilter === "unassigned" ? !img.session_id : img.session_id === sessionFilter)
      const matchesType = typeFilter === "all" || img.image_type === typeFilter
      return matchesTopic && matchesSession && matchesType
    })
  }, [activeTopicId, sessionFilter, typeFilter, initialImages])

  return (
    <div className="space-y-8">
      <TopicNavigator
        topics={topics}
        activeTopicId={activeTopicId}
        onTopicClick={setActiveTopicId}
      />

      {/* Navegador de sesiones (ponencias) */}
      {(sessions.length > 0 || unassignedCount > 0) && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> {t("sessions")}
          </h4>
          <div className="flex flex-wrap gap-2">
            <SessionChip
              label={t("all")}
              active={sessionFilter === "all"}
              onClick={() => setSessionFilter("all")}
            />
            {sessions.map((s) => (
              <SessionChip
                key={s.id}
                label={s.title}
                sublabel={s.speaker ?? undefined}
                active={sessionFilter === s.id}
                onClick={() => setSessionFilter(s.id)}
              />
            ))}
            {unassignedCount > 0 && (
              <SessionChip
                label={`${t("unassigned")} (${unassignedCount})`}
                active={sessionFilter === "unassigned"}
                onClick={() => setSessionFilter("unassigned")}
                muted
              />
            )}
          </div>
        </div>
      )}

      {/* Filtro por tipo de imagen (clasificado por IA) */}
      {availableTypes.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t("contentType")}</h4>
          <div className="flex flex-wrap gap-2">
            <SessionChip label={t("allTypes")} active={typeFilter === "all"} onClick={() => setTypeFilter("all")} />
            {availableTypes.map((ty) => (
              <SessionChip
                key={ty}
                label={tv(`type.${ty}`)}
                active={typeFilter === ty}
                onClick={() => setTypeFilter(ty)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTopicId ? t("relatedPhotos") : t("fullGallery")}
          </h4>
          {(activeTopicId || sessionFilter !== "all" || typeFilter !== "all") && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
              {filteredImages.length} {t("results")}
            </span>
          )}
        </div>
        <PhotoGrid congressId={congressId} initialImages={filteredImages} sessions={sessions} />
      </div>
    </div>
  )
}

function SessionChip({
  label,
  sublabel,
  active,
  onClick,
  muted,
}: {
  label: string
  sublabel?: string
  active: boolean
  onClick: () => void
  muted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all text-left",
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm"
          : muted
            ? "bg-slate-50 text-slate-500 border-slate-200 hover:border-slate-300"
            : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
      )}
    >
      <span className="block leading-tight">{label}</span>
      {sublabel && <span className="block text-[10px] opacity-70 leading-tight">{sublabel}</span>}
    </button>
  )
}
