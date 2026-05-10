// Soft delete + restore helpers.
// Mark rows with deleted_at instead of physically removing them.
// SELECT queries should always filter `deleted_at is null` (or use the
// `*_active` views) unless explicitly listing the archive.

import { createClient } from "@/lib/supabase/server"
import { auditLog, type AuditAction } from "@/lib/logger"

export type SoftDeletableTable = "congresses" | "congress_images" | "reports" | "organizations"

interface SoftDeleteInput {
  table: SoftDeletableTable
  id: string
  userId: string
  auditAction: AuditAction
}

/**
 * Soft delete a row. Returns true if the row was marked as deleted.
 */
export async function softDelete(input: SoftDeleteInput): Promise<boolean> {
  const supabase = await createClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from(input.table)
    .update({ deleted_at: now, deleted_by: input.userId })
    .eq("id", input.id)
    .is("deleted_at", null)

  if (error) {
    console.error(`softDelete(${input.table}/${input.id}) failed:`, error.message)
    return false
  }

  await auditLog({
    userId: input.userId,
    action: input.auditAction,
    resourceType: input.table,
    resourceId: input.id,
    status: "success",
    metadata: { soft: true, deleted_at: now },
  })

  return true
}

/**
 * Restore a soft-deleted row. Returns true if restoration succeeded.
 */
export async function restoreFromArchive(input: SoftDeleteInput): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from(input.table)
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", input.id)
    .not("deleted_at", "is", null)

  if (error) {
    console.error(`restoreFromArchive(${input.table}/${input.id}) failed:`, error.message)
    return false
  }

  await auditLog({
    userId: input.userId,
    action: input.auditAction,
    resourceType: input.table,
    resourceId: input.id,
    status: "success",
    metadata: { restored: true },
  })

  return true
}
