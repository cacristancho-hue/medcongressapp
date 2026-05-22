// Tiny job queue helper backed by public.ai_jobs.
// MVP scope: enqueue + status query. The worker that actually processes jobs
// will live in supabase/functions/ai-job-worker (next iteration) or Vercel
// cron. This module is what server actions call to schedule work.

import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { log } from "@/lib/logger"

export type JobType =
  | "image_analysis"
  | "image_derivation"
  | "topics_extraction"
  | "report_generation"
  | "reference_verification"

export type JobStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"

export interface EnqueueInput {
  userId: string
  organizationId?: string | null
  jobType: JobType
  payload: Record<string, unknown>
  congressId?: string | null
  imageId?: string | null
  priority?: number
  scheduledAt?: Date
}

export async function enqueueJob(input: EnqueueInput): Promise<{ id?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_jobs")
      .insert({
        user_id: input.userId,
        organization_id: input.organizationId ?? null,
        job_type: input.jobType,
        payload: input.payload,
        congress_id: input.congressId ?? null,
        image_id: input.imageId ?? null,
        priority: input.priority ?? 100,
        scheduled_at: input.scheduledAt?.toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      log("error", "enqueueJob failed", {
        userId: input.userId,
        jobType: input.jobType,
        err: error.message,
      })
      return { error: error.message }
    }
    return { id: data.id }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown"
    log("error", "enqueueJob unexpected", { err: msg })
    return { error: msg }
  }
}

// Enqueue a congress-wide reference_verification job, deduped: skips if one is
// already pending/processing for the congress. Accepts any Supabase client so
// both server actions (user client) and the worker (service client) can call it.
export async function enqueueReferenceVerificationIfPending(
  supabase: SupabaseClient,
  input: { userId: string; congressId: string; organizationId?: string | null }
): Promise<{ id?: string; skipped?: boolean; error?: string }> {
  const { data: existing } = await supabase
    .from("ai_jobs")
    .select("id")
    .eq("congress_id", input.congressId)
    .eq("job_type", "reference_verification")
    .in("status", ["pending", "processing"])
    .limit(1)

  if (existing && existing.length > 0) return { skipped: true }

  const { data, error } = await supabase
    .from("ai_jobs")
    .insert({
      user_id: input.userId,
      organization_id: input.organizationId ?? null,
      job_type: "reference_verification",
      payload: {},
      congress_id: input.congressId,
      priority: 75,
    })
    .select("id")
    .single()

  if (error) {
    log("error", "enqueueReferenceVerificationIfPending failed", {
      congressId: input.congressId,
      err: error.message,
    })
    return { error: error.message }
  }
  return { id: data.id }
}

export interface JobSnapshot {
  id: string
  jobType: JobType
  status: JobStatus
  attemptCount: number
  errorMessage: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  resourceId: string | null  // image_id or congress_id depending on type
}

interface AiJobRow {
  id: string
  job_type: JobType
  status: JobStatus
  attempt_count: number
  error_message: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
  congress_id: string | null
  image_id: string | null
}

export async function getCongressJobs(
  congressId: string
): Promise<{ data?: JobSnapshot[]; error?: string }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("ai_jobs")
      .select(
        "id, job_type, status, attempt_count, error_message, started_at, finished_at, created_at, congress_id, image_id"
      )
      .eq("congress_id", congressId)
      .order("created_at", { ascending: false })

    if (error) return { error: error.message }

    const snapshot: JobSnapshot[] = ((data ?? []) as AiJobRow[]).map((j) => ({
      id: j.id,
      jobType: j.job_type,
      status: j.status,
      attemptCount: j.attempt_count,
      errorMessage: j.error_message,
      startedAt: j.started_at,
      finishedAt: j.finished_at,
      createdAt: j.created_at,
      resourceId: j.image_id ?? j.congress_id,
    }))
    return { data: snapshot }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "unknown" }
  }
}
