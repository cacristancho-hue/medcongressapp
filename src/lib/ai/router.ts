// Multi-provider AI router.
// Honors the principle "modelo económico para limpieza, modelo fuerte solo síntesis"
// from project memory. Each public function picks a primary provider and
// falls back to a secondary one if the primary is unavailable or errors.
//
// Provider mapping (knowledge cutoff Jan 2026):
//   image_analysis    primary  Gemini 2.5 Flash    fallback  GPT-4o
//   report_generation primary  Claude Sonnet 4.6   fallback  Gemini 2.5 Pro
//
// Cost is reported through the same shape regardless of provider so
// ai-usage.ts can persist it uniformly.

import { generateText, generateObject } from "ai"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"

export type ProviderId = "openai" | "google" | "anthropic"

export interface AiUsage {
  provider: ProviderId
  model: string
  inputTokens: number
  outputTokens: number
}

export interface ImageAnalysisResult {
  specialty: string | null
  raw_text: string
  medical_summary: string
  topics: Array<{
    name: string
    category?: string
    description?: string
  }>
  references: Array<{
    detected_title?: string
    detected_authors?: string
    detected_year?: string
    detected_journal?: string
    detected_doi?: string
  }>
}

export interface ImageAnalysisOutput {
  data: ImageAnalysisResult
  usage: AiUsage
}

export interface ReportOutput {
  content: string
  usage: AiUsage
}

const IMAGE_ANALYSIS_SCHEMA = z.object({
  specialty: z.string().nullable().describe("Especialidad médica predominante o null."),
  raw_text: z.string().describe("Texto literal extraído de la imagen."),
  medical_summary: z
    .string()
    .describe("Resumen médico profesional con datos clave y conclusión."),
  topics: z
    .array(
      z.object({
        name: z.string().describe("Nombre técnico del tema."),
        category: z
          .string()
          .optional()
          .describe(
            "Categoría amplia: 'Diagnóstico', 'Tratamiento', 'Epidemiología', 'Fisiopatología', 'Metodología', etc."
          ),
        description: z
          .string()
          .optional()
          .describe("Frase corta que aclara el tema."),
      })
    )
    .max(5)
    .describe("Hasta 5 temas clave detectados."),
  references: z
    .array(
      z.object({
        detected_title: z.string().optional(),
        detected_authors: z.string().optional(),
        detected_year: z.string().optional(),
        detected_journal: z.string().optional(),
        detected_doi: z.string().optional(),
      })
    )
    .describe("Referencias bibliográficas detectadas."),
})

const IMAGE_ANALYSIS_SYSTEM_PROMPT = `Eres un asistente médico experto. Analiza imágenes de diapositivas, posters o material gráfico de congresos médicos.

REGLAS CRÍTICAS:
1. IDENTIFICACIÓN: Determina la especialidad médica predominante.
2. OCR: Extrae TODO el texto literal en 'raw_text'. Prioriza títulos, datos numéricos y conclusiones.
3. RESUMEN: 'medical_summary' debe incluir: objetivo, datos clave (p-values, IC, dosis, criterios) y conclusión clínica.
4. TOPICS: Hasta 5 temas en terminología médica técnica.
5. REFERENCIAS: Detecta citas, nombres de estudios (EMPA-REG, KEYNOTE-001) y journals.
6. NUNCA inventes datos. Si algo no es legible, omítelo.`

const REPORT_SYSTEM_PROMPT = (language: "es" | "en") =>
  `Eres un experto en comunicación científica médica. Genera un Esquema Estructurado para Presentación Académica.

IMPORTANTE: Redacta COMPLETAMENTE en ${language === "es" ? "Español" : "Inglés"}.

ESTRUCTURA Markdown:
# [Título del Congreso]
## Diapositiva 1: Introducción y Objetivos
## Diapositivas 2-N: Hallazgos por Eje Temático (cita evidencia técnica con p-values, HR, N)
## Diapositiva Final: Conclusiones y Perlas Clínicas (Take-home messages)
## Bibliografía de Apoyo

REGLAS: tono profesional y preciso. NO alucines datos. Si algo no está claro en el OCR, no lo incluyas.`

function pickModel(provider: ProviderId, role: "fast" | "vision" | "reasoning") {
  switch (provider) {
    case "openai":
      return role === "fast" ? "gpt-4o-mini" : "gpt-4o"
    case "google":
      return role === "reasoning" ? "gemini-2.5-pro" : "gemini-2.5-flash"
    case "anthropic":
      return role === "reasoning" ? "claude-sonnet-4-6" : "claude-haiku-4-5"
  }
}

function modelHandle(provider: ProviderId, model: string) {
  switch (provider) {
    case "openai":
      return openai(model)
    case "google":
      return google(model)
    case "anthropic":
      return anthropic(model)
  }
}

function hasKey(provider: ProviderId): boolean {
  switch (provider) {
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY)
    case "google":
      return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    case "anthropic":
      return Boolean(process.env.ANTHROPIC_API_KEY)
  }
}

// The Google provider expects GOOGLE_GENERATIVE_AI_API_KEY by default.
// We accept GEMINI_API_KEY (the more common name on aistudio.google.com) and
// alias it transparently here.
function ensureGoogleEnvAlias() {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY && process.env.GEMINI_API_KEY) {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = process.env.GEMINI_API_KEY
  }
}

// ---------------------------------------------------------------------------
// Image analysis (OCR + structured output for one congress photo)
// ---------------------------------------------------------------------------

interface AnalyzeImageInput {
  imageUrl: string
  forceProvider?: ProviderId
}

export async function analyzeImage(input: AnalyzeImageInput): Promise<ImageAnalysisOutput> {
  ensureGoogleEnvAlias()
  const order: ProviderId[] = input.forceProvider
    ? [input.forceProvider]
    : ["google", "openai"]

  let lastError: unknown = null

  for (const provider of order) {
    if (!hasKey(provider)) continue

    const model = pickModel(provider, "vision")

    try {
      const result = await generateObject({
        model: modelHandle(provider, model),
        schema: IMAGE_ANALYSIS_SCHEMA,
        system: IMAGE_ANALYSIS_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analiza esta imagen de congreso médico:",
              },
              {
                type: "image",
                image: new URL(input.imageUrl),
              },
            ],
          },
        ],
      })

      return {
        data: result.object,
        usage: {
          provider,
          model,
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      }
    } catch (error) {
      lastError = error
      console.warn(`[ai/router] analyzeImage failed on ${provider}/${model}:`, error)
      continue
    }
  }

  throw lastError ?? new Error("Ningún proveedor de IA disponible para analyzeImage")
}

// ---------------------------------------------------------------------------
// Topic extraction from already-OCR'd corpus
// One-shot batch call: cheaper than re-running per-image vision analysis.
// ---------------------------------------------------------------------------

const TOPICS_FROM_CORPUS_SCHEMA = z.object({
  topics: z
    .array(
      z.object({
        name: z.string().describe("Nombre técnico del tópico médico."),
        category: z.string().describe(
          "Categoría amplia: 'Diagnóstico', 'Tratamiento', 'Epidemiología', 'Fisiopatología', 'Metodología', 'Farmacología', etc."
        ),
        description: z.string().describe("Frase corta (≤25 palabras) que aclara el tópico."),
        image_indices: z
          .array(z.number().int().min(0))
          .describe("Índices (0-based) de las imágenes donde aparece este tópico."),
      })
    )
    .max(40),
})

export interface TopicExtractionResult {
  topics: Array<{
    name: string
    category: string
    description: string
    image_indices: number[]
  }>
  usage: AiUsage
}

export async function extractTopicsFromCorpus(input: {
  documents: Array<{ index: number; text: string }>
  forceProvider?: ProviderId
}): Promise<TopicExtractionResult> {
  ensureGoogleEnvAlias()
  // Claude has stronger clinical reasoning for topic taxonomy than Flash;
  // fall back to Gemini Pro and OpenAI if Anthropic is unavailable.
  const order: ProviderId[] = input.forceProvider
    ? [input.forceProvider]
    : ["anthropic", "google", "openai"]

  const corpus = input.documents
    .map((d) => `=== IMG_${d.index} ===\n${d.text}`)
    .join("\n\n")
    .slice(0, 200_000)

  const system = `Eres un experto en clasificación temática de literatura médica.
Recibirás un corpus de extractos OCR de diapositivas de congreso, cada uno marcado con \`=== IMG_N ===\`.
Tu tarea: identificar entre 8 y 30 tópicos médicos técnicos relevantes, agruparlos por categoría amplia
y para cada tópico listar los índices N de las imágenes donde aparece. Usa terminología médica.
NO inventes tópicos que no estén soportados por el texto.`

  let lastError: unknown = null

  for (const provider of order) {
    if (!hasKey(provider)) continue
    // For taxonomy reasoning we want better-than-fast: Sonnet / Pro / 4o.
    const model = pickModel(provider, "reasoning")
    try {
      const result = await generateObject({
        model: modelHandle(provider, model),
        schema: TOPICS_FROM_CORPUS_SCHEMA,
        system,
        prompt: corpus,
      })

      return {
        topics: result.object.topics,
        usage: {
          provider,
          model,
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      }
    } catch (error) {
      lastError = error
      console.warn(`[ai/router] extractTopicsFromCorpus failed on ${provider}/${model}:`, error)
      continue
    }
  }

  throw lastError ?? new Error("Ningún proveedor disponible para extractTopicsFromCorpus")
}

// ---------------------------------------------------------------------------
// Academic report (high-quality synthesis from concatenated OCR text)
// ---------------------------------------------------------------------------

interface GenerateReportInput {
  fullText: string
  language: "es" | "en"
  forceProvider?: ProviderId
}

export async function generateReport(input: GenerateReportInput): Promise<ReportOutput> {
  ensureGoogleEnvAlias()
  const order: ProviderId[] = input.forceProvider
    ? [input.forceProvider]
    : ["anthropic", "google", "openai"]

  let lastError: unknown = null

  for (const provider of order) {
    if (!hasKey(provider)) continue

    const model = pickModel(provider, "reasoning")

    try {
      const result = await generateText({
        model: modelHandle(provider, model),
        system: REPORT_SYSTEM_PROMPT(input.language),
        prompt: `Genera el esquema basado en estos datos:\n\n\`\`\`\n${input.fullText}\n\`\`\``,
      })

      return {
        content: result.text,
        usage: {
          provider,
          model,
          inputTokens: result.usage.inputTokens ?? 0,
          outputTokens: result.usage.outputTokens ?? 0,
        },
      }
    } catch (error) {
      lastError = error
      console.warn(`[ai/router] generateReport failed on ${provider}/${model}:`, error)
      continue
    }
  }

  throw lastError ?? new Error("Ningún proveedor de IA disponible para generateReport")
}
