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
    category: string
    description: string
  }>
  references: Array<{
    detected_title: string | null
    detected_authors: string | null
    detected_year: string | null
    detected_journal: string | null
    detected_doi: string | null
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
        category: z.string().describe("Categoría amplia: 'Diagnóstico', 'Tratamiento', 'Epidemiología', 'Fisiopatología', 'Metodología', etc."),
        description: z.string().describe("Frase corta que aclara el tema."),
      })
    )
    .max(5)
    .describe("Hasta 5 temas clave detectados."),
  references: z
    .array(
      z.object({
        detected_title: z.string().nullable().describe("Título del estudio."),
        detected_authors: z.string().nullable().describe("Autores (si están disponibles)."),
        detected_year: z.string().nullable().describe("Año de publicación."),
        detected_journal: z.string().nullable().describe("Nombre de la revista médica."),
        detected_doi: z.string().nullable().describe("DOI si es visible."),
      })
    )
    .describe("Referencias bibliográficas detectadas."),
})

const IMAGE_ANALYSIS_SYSTEM_PROMPT = `Eres un sistema de Inteligencia Médica de ELITE (v2026). Tu misión es procesar diapositivas académicas con RIGOR CIENTÍFICO ABSOLUTO.

REGLAS DE ORO (INNEGOCIABLES):
1. **INTEGRIDAD BIBLIOGRÁFICA UBICUA**: La omisión de una referencia es un fallo de integridad. Las referencias pueden aparecer en CUALQUIER PARTE de la diapositiva (no solo en el pie de página). Debes escanear el cuerpo del texto, cuadros laterales y gráficos en busca de citas.
2. **USO DE IMÁGENES**: 
   - Usa la 'Imagen Principal' para detectar referencias en el medio o parte superior de la diapositiva.
   - Usa los 'Zooms' solo como ayuda para el texto que sea demasiado pequeño en la principal. 
   - NO limites tu búsqueda de bibliografía a las áreas de los zooms.
3. **FIDELIDAD OCR**: Extrae el texto literal respetando saltos de línea. Si hay obstrucciones, márcalas con [obstruido].
4. **PRECISIÓN TÉCNICA**: Los 'topics' deben usar terminología médica estándar. 

FLUJO DE ANÁLISIS:
- Paso 1: Escanea TODA la 'Imagen Principal' buscando patrones de citas (autores, años entre paréntesis, DOIs, nombres de journals).
- Paso 2: Si detectas una cita en el pie de página, usa 'Zoom Inferior Izquierdo/Derecho' para confirmar los detalles.
- Paso 3: Reporta TODA referencia detectada en el array 'references', sin importar su posición en la imagen.

ESTRUCTURA DE REFERENCIAS:
- Captura: Título, Autores (primeros 3 + et al), Año, Journal y DOI/PMID si es legible. 
- Si la cita está cortada, extrae los caracteres que veas. Nuestro motor de consenso de 2026 lo resolverá.`

const REPORT_SYSTEM_PROMPT = (language: "es" | "en") =>
  `Eres el motor de síntesis académica más avanzado, especializado en la creación de ESQUEMAS DE PONENCIA para médicos de postgrado. 
   Tu objetivo es transformar el ruido de un congreso en un guion narrativo estructurado y científico.

   IMPORTANTE: Redacta COMPLETAMENTE en ${language === "es" ? "Español" : "Inglés"}.

   INSTRUCCIONES DE PRODUCTO:
   1. **Esquema de Ponencia (Script)**: Crea una estructura lógica para que el médico pueda replicar esta charla de forma fluida.
   2. **Enfoque de Enriquecimiento (No Juicio)**: Tu labor es COMPLEMENTAR. El ponente tiene tiempo limitado; tú usas los artículos para aportar los detalles técnicos que no caben en una diapositiva (ej: metodología, subgrupos). Mantén siempre un tono de respeto profesional.
   3. **Dualidad de Fuentes**: 
      - Usa [foto:N] para los mensajes clave presentados.
      - Usa [ref:ID] para la profundidad científica de los artículos de soporte.

   ESTRUCTURA DEL DOCUMENTO (Markdown):
   # [Título sugerido para la Ponencia]

   ## I. Apertura y Mensajes Clave
   (Resumen de los conceptos fundamentales presentados)

   ## II. Desarrollo Temático (Profundización Académica)
   Para cada bloque temático:
   ### [Nombre del Módulo]
   - **Guion Narrativo**: Estructura sugerida para explicar el tema.
   - **Evidencia Visual**: Mensajes destacados en [foto:N].
   - **Contexto Complementario**: Información extraída de los ABSTRACTS para dar más solidez al tema tratado.
   
   ## III. Perlas Clínicas y Aplicación
   (Puntos accionables para la práctica diaria basados en la sesión)

   ## IV. Bibliografía y Evidencia Verificada
   (Lista numerada de las referencias [ref:ID] con su estado y métricas de impacto).

   REGLAS DE RIGOR CIENTÍFICO:
   1. **ALERTA DE RETRACTACIÓN**: Si un estudio es [Status: RETRACTED], incluye advertencia en negrita y rojo: **⚠️ ALERTA: ESTUDIO RETRACTADO**.
   2. **PRIORIZACIÓN**: Prioriza evidencia [Status: VERIFIED].
   3. **FORMATO**: Usa tablas Markdown extensas para comparativas técnicas. Tono profesional y académico.`

function pickModel(provider: ProviderId, role: "fast" | "vision" | "reasoning") {
  switch (provider) {
    case "openai":
      return role === "fast" ? "gpt-4o-mini" : "gpt-4o"
    case "google":
      // May 2026: gemini-2.5-flash is extremely stable and cost-effective for vision/fast tasks.
      // Using gemini-2.5-pro for reasoning as it remains the standard for complex clinical analysis.
      return role === "reasoning" ? "gemini-2.5-pro" : "gemini-2.5-flash"
    case "anthropic":
      return role === "reasoning" ? "claude-sonnet-4.6" : "claude-haiku-4.5"
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
  zoomLeftUrl?: string
  zoomRightUrl?: string
  forceProvider?: ProviderId
}

async function retry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries <= 0) throw error
    await new Promise((resolve) => setTimeout(resolve, delay))
    return retry(fn, retries - 1, delay * 2)
  }
}

export async function analyzeImage(input: AnalyzeImageInput): Promise<ImageAnalysisOutput> {
  ensureGoogleEnvAlias()
  // Priorizar Google para visión por su excelente manejo de múltiples imágenes de alta resolución
  const order: ProviderId[] = input.forceProvider
    ? [input.forceProvider]
    : ["google", "openai"]

  const errors: Array<{ provider: ProviderId; error: string }> = []

  for (const provider of order) {
    if (!hasKey(provider)) {
      errors.push({ provider, error: "API Key no configurada" })
      continue
    }

    const model = pickModel(provider, "vision")

    try {
      const result = await retry(async () => {
        const content: Array<{ type: "text"; text: string } | { type: "image"; image: URL }> = [
          {
            type: "text",
            text: `Analiza esta diapositiva médica. 
                   REGLA DE ORO PARA CITAS: Se proporcionan hasta 3 imágenes. 
                   1. 'Imagen Principal': Vista completa de la diapositiva.
                   2. 'Zoom Inferior Izquierdo' y 'Zoom Inferior Derecho': Ampliaciones de alta calidad de los pies de página. 
                   
                   TU PRIORIDAD: Extraer TODAS las referencias bibliográficas visibles. 
                   Usa los Zooms para leer el texto pequeño de las citas. 
                   Incluso si la cita es parcial, extrae lo que sea legible (ej: solo autores y año, o solo título parcial). 
                   Extrae: título, autores, año, journal y DOI de CADA cita detectada.`,
          },
          {
            type: "image",
            image: new URL(input.imageUrl),
          }
        ]

        if (input.zoomLeftUrl) {
          content.push({ type: "text", text: "Zoom Inferior Izquierdo (Citas):" })
          content.push({ type: "image", image: new URL(input.zoomLeftUrl) })
        }
        if (input.zoomRightUrl) {
          content.push({ type: "text", text: "Zoom Inferior Derecho (Citas):" })
          content.push({ type: "image", image: new URL(input.zoomRightUrl) })
        }

        return await generateObject({
          model: modelHandle(provider, model),
          schema: IMAGE_ANALYSIS_SCHEMA,
          system: IMAGE_ANALYSIS_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content,
            },
          ],
        })
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
      const msg = error instanceof Error ? error.message : String(error)
      errors.push({ provider, error: msg })
      console.warn(`[ai/router] analyzeImage failed on ${provider}/${model} after retries:`, msg)
      continue
    }
  }

  const errorSummary = errors.map(e => `${e.provider.toUpperCase()}: ${e.error}`).join(" | ")
  
  // Si detectamos errores de red conocidos (DNS, timeout), enriquecemos el mensaje para el usuario
  const isNetworkError = /ENOTFOUND|ETIMEDOUT|ECONNREFUSED|fetch failed/i.test(errorSummary)
  const userMessage = isNetworkError 
    ? `Error de conectividad. Por favor, verifica tu conexión a internet o DNS. Detalles: ${errorSummary}`
    : `Ningún proveedor disponible. Detalles: ${errorSummary}`

  throw new Error(userMessage)
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
