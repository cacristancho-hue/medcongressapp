"use client"

import { Hash, ChevronRight } from "lucide-react"
import { clsx } from "clsx"

interface Topic {
  id: string
  name: string
  category: string | null
  description: string | null
  image_count: number
}

interface Props {
  topics: Topic[]
  activeTopicId: string | null
  onTopicClick: (topicId: string | null) => void
}

export default function TopicNavigator({ topics, activeTopicId, onTopicClick }: Props) {
  if (topics.length === 0) return null

  // Agrupar por categoría
  const categories = topics.reduce<Record<string, Topic[]>>((acc, t) => {
    const cat = t.category || "General"
    acc[cat] = acc[cat] ?? []
    acc[cat].push(t)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Hash className="h-4 w-4 text-blue-500" />
          Navegación por Ejes Temáticos
        </h3>
        {activeTopicId && (
          <button 
            onClick={() => onTopicClick(null)}
            className="text-[10px] text-blue-600 font-bold hover:underline"
          >
            Ver todas las fotos
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(categories).map(([category, items]) => (
          <div key={category} className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-tighter text-slate-400 font-bold ml-1">
              {category}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {items.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => onTopicClick(activeTopicId === topic.id ? null : topic.id)}
                  className={clsx(
                    "group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs transition-all",
                    activeTopicId === topic.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200"
                      : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                  )}
                >
                  <span className="font-medium">{topic.name}</span>
                  <span className={clsx(
                    "text-[10px] font-mono px-1 rounded",
                    activeTopicId === topic.id ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                  )}>
                    {topic.image_count}
                  </span>
                  {activeTopicId === topic.id && <ChevronRight className="h-3 w-3" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
