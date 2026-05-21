export type UserRole = "student" | "resident" | "fellow" | "specialist" | "professor"

export type CongressStatus = "active" | "archived"

export type ImageStatus =
  | "uploaded"
  | "processing"
  | "ocr_done"
  | "analyzed"
  | "failed"
  | "deleted_original"

export type UploadStatus =
  | "local_pending"
  | "compressed"
  | "upload_pending"
  | "uploaded"
  | "uploaded_to_supabase"
  | "upload_failed"

export type ExternalSyncStatus =
  | "not_configured"
  | "sync_pending"
  | "synced_to_drive"
  | "synced_to_onedrive"
  | "sync_failed"

export type OcrStatus = "pending" | "ocr_pending" | "ocr_done" | "ocr_failed"

export type AiStatus = "pending" | "ai_pending" | "ai_done" | "ai_failed"

// --- SCHEMA TYPES (FASES 1 & 2) ---

export interface Profile {
  id: string
  user_id: string
  full_name: string | null
  role: UserRole | null
  specialty: string | null
  country: string | null
  age: number | null
  gender: string | null
  workplace_type: string | null
  created_at: string
}

export interface Congress {
  id: string
  user_id: string
  name: string
  location: string | null
  start_date: string | null
  end_date: string | null
  specialty: string | null
  notes: string | null
  created_at: string
}

export interface CongressImage {
  id: string
  congress_id: string
  user_id: string
  storage_path: string
  storage_path_optimized: string | null
  storage_path_thumbnail: string | null
  original_filename: string
  file_size: number | null
  mime_type: string | null
  status: ImageStatus
  width_original: number | null
  height_original: number | null
  width_optimized: number | null
  height_optimized: number | null
  width_thumbnail: number | null
  height_thumbnail: number | null
  size_original_bytes: number | null
  size_optimized_bytes: number | null
  size_thumbnail_bytes: number | null
  compression_quality: number | null
  compression_ratio: number | null
  mime_type_original: string | null
  mime_type_optimized: string | null
  mime_type_thumbnail: string | null
  upload_status: UploadStatus | null
  external_sync_status: ExternalSyncStatus | null
  ocr_status: OcrStatus | null
  ai_status: AiStatus | null
  upload_error: string | null
  image_order: number
  created_at: string
  updated_at?: string
}

// --- FUTURE PHASES (PLANNED) ---

export type VerificationStatus =
  | "verified"
  | "partially_verified"
  | "not_verified"
  | "ambiguous"
  | "retracted"

export type OutputType =
  | "summary_by_topic"
  | "academic_report"
  | "bibliography"
  | "class_outline"
  | "notebooklm_pack"
  | "slide_outline"

export interface OcrResult {
  id: string
  image_id: string
  /** Literal extracted text (OCR). Source of truth for search/topics. */
  raw_text: string | null
  /** Cleaned OCR. Legacy rows (<= fase31) may hold the AI summary instead. */
  cleaned_text: string | null
  /** AI-generated medical synthesis (INFERENCE). Not literal text. */
  medical_summary: string | null
  confidence_score: number | null
  created_at: string
}

export interface Topic {
  id: string
  congress_id: string
  name: string
  category: string | null
  description: string | null
  created_at: string
}

export interface ReferenceCandidate {
  id: string
  congress_id: string
  image_id: string
  user_id: string
  raw_reference_text: string
  detected_title: string | null
  detected_authors: string | null
  detected_year: string | null
  detected_journal: string | null
  detected_doi: string | null
  detected_pmid: string | null
  verification_status: VerificationStatus
  confidence_score: number | null
  created_at: string
}

// --- FASE 12: MULTI-TENANT FOUNDATION ---

export type OrganizationType =
  | "individual"
  | "society"
  | "hospital"
  | "university"
  | "enterprise"
  | "admin"

export type OrganizationPlan =
  | "free"
  | "congress"
  | "academic"
  | "enterprise"
  | "admin"

export type MembershipRole = "owner" | "admin" | "member" | "viewer"

export interface Organization {
  id: string
  name: string
  slug: string | null
  type: OrganizationType
  plan: OrganizationPlan
  country: string | null
  specialty: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrganizationMembership {
  organization_id: string
  user_id: string
  role: MembershipRole
  created_at: string
}

// --- FASE 11: AI usage tracking ---

export type AiActionType =
  | "image_analysis"
  | "report_generation"
  | "reference_verification"

export type AiUsageStatus = "success" | "blocked" | "error"

export interface AiUsageLimits {
  user_id: string
  plan: OrganizationPlan
  monthly_image_quota: number
  monthly_report_quota: number
  monthly_cost_cap_usd: number
  updated_at: string
}

export interface AiUsageRecord {
  id: string
  user_id: string
  action_type: AiActionType
  model: string | null
  input_tokens: number | null
  output_tokens: number | null
  estimated_cost_usd: number | null
  congress_id: string | null
  image_id: string | null
  status: AiUsageStatus
  error_message: string | null
  created_at: string
}
