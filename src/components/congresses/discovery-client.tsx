"use client"

import { useState, useMemo } from "react"
import TopicNavigator from "./topic-navigator"
import PhotoGrid from "./photo-grid"

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
}

interface DiscoveryTopic {
  id: string
  name: string
  category: string | null
  description: string | null
  image_count: number
}

interface Props {
  congressId: string
  initialImages: DiscoveryImage[]
  topics: DiscoveryTopic[]
}

export default function DiscoveryClient({ congressId, initialImages, topics }: Props) {
  const [activeTopicId, setActiveTopicId] = useState<string | null>(null)

  const filteredImages = useMemo(() => {
    if (!activeTopicId) return initialImages
    return initialImages.filter(img => img.topic_ids.includes(activeTopicId))
  }, [activeTopicId, initialImages])

  return (
    <div className="space-y-8">
      <TopicNavigator 
        topics={topics} 
        activeTopicId={activeTopicId}
        onTopicClick={setActiveTopicId}
      />
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            {activeTopicId ? "Fotos relacionadas con el tema" : "Galería Completa"}
          </h4>
          {activeTopicId && (
            <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold border border-blue-100">
              {filteredImages.length} resultados
            </span>
          )}
        </div>
        <PhotoGrid congressId={congressId} initialImages={filteredImages} />
      </div>
    </div>
  )
}
