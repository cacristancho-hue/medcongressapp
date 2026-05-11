// Centralized OpenAPI document for the future public API.
// Schemas are written once with Zod and re-used for runtime validation in
// server actions + the OpenAPI spec emitted at /api/openapi.json.
//
// As we expose more endpoints (POST /api/v1/congresses, etc.) we add their
// schemas here. The Swagger UI rendered by /api/docs reads this same source.

import { z } from "zod"
import { createDocument } from "zod-openapi"

// =============================================================================
// Reusable schemas
// =============================================================================

export const HealthResponseSchema = z
  .object({
    status: z.enum(["ok", "degraded"]),
    checks: z.record(z.string(), z.enum(["ok", "fail", "skipped"])),
    timestamp: z.string().datetime(),
  })
  .meta({ id: "HealthResponse" })

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
  })
  .meta({ id: "ErrorResponse" })

export const WebhookPayloadSchema = z
  .object({
    event: z.enum([
      "congress.created",
      "congress.deleted",
      "image.uploaded",
      "image.analyzed",
      "report.generated",
      "references.verified",
      "billing.upgraded",
    ]),
    payload: z.record(z.string(), z.unknown()),
  })
  .meta({ id: "WebhookPayload" })

export const VerificationStatusSchema = z
  .enum(["verified", "partially_verified", "ambiguous", "not_verified", "retracted"])
  .meta({ id: "VerificationStatus" })

export const ReferenceCandidateSchema = z
  .object({
    id: z.string().uuid(),
    congress_id: z.string().uuid(),
    image_id: z.string().uuid().nullable(),
    detected_title: z.string().nullable(),
    detected_authors: z.string().nullable(),
    detected_year: z.string().nullable(),
    detected_journal: z.string().nullable(),
    detected_doi: z.string().nullable(),
    detected_pmid: z.string().nullable(),
    verification_status: VerificationStatusSchema,
    confidence_score: z.number().min(0).max(1).nullable(),
    created_at: z.string().datetime(),
  })
  .meta({ id: "ReferenceCandidate" })

// =============================================================================
// Document
// =============================================================================

export function buildOpenApiDocument() {
  return createDocument({
    openapi: "3.1.0",
    info: {
      title: "MDCONGRESS API",
      version: "0.1.0",
      description:
        "API interna y futura API pública. Documenta esquemas reutilizables y endpoints expuestos.",
    },
    servers: [{ url: "https://MDCONGRESS.app" }],
    paths: {
      "/api/health": {
        get: {
          summary: "Health probe (uptime)",
          responses: {
            "200": {
              description: "Servicio saludable.",
              content: {
                "application/json": { schema: HealthResponseSchema },
              },
            },
            "503": {
              description: "Servicio degradado.",
              content: {
                "application/json": { schema: HealthResponseSchema },
              },
            },
          },
        },
      },
      "/api/openapi.json": {
        get: {
          summary: "Esta misma especificación en JSON.",
          responses: {
            "200": {
              description: "OpenAPI document",
              content: {
                "application/json": {
                  schema: z.record(z.string(), z.unknown()),
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        HealthResponse: HealthResponseSchema,
        ErrorResponse: ErrorResponseSchema,
        WebhookPayload: WebhookPayloadSchema,
        VerificationStatus: VerificationStatusSchema,
        ReferenceCandidate: ReferenceCandidateSchema,
      },
    },
  })
}
