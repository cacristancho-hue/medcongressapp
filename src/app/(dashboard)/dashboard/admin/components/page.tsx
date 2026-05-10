import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Palette } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton, SkeletonCard, SkeletonStatCard } from "@/components/ui/skeleton"
import { Logo } from "@/components/ui/logo"
import { requireAdmin } from "../_admin-gate"

export const dynamic = "force-dynamic"

/**
 * Internal component catalog. Replaces Storybook with a single page that
 * renders our primitives in their canonical states. Lightweight, no extra
 * dependency. Useful for design QA and onboarding new contributors.
 */
export default async function AdminComponentsPage() {
  const user = await requireAdmin()
  if (!user) redirect("/dashboard")

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-10">
      <Link
        href="/dashboard/admin/metrics"
        className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver a métricas
      </Link>
      <header>
        <p className="text-xs uppercase tracking-wide text-slate-500">Operaciones</p>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Componentes
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Catálogo interno de primitives + tokens. Sustituye a Storybook (sin overhead extra).
        </p>
      </header>

      {/* COLORS */}
      <Section title="Color tokens">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Swatch name="bg" varName="--color-bg" />
          <Swatch name="bg-elevated" varName="--color-bg-elevated" />
          <Swatch name="bg-muted" varName="--color-bg-muted" />
          <Swatch name="border" varName="--color-border" />
          <Swatch name="brand" varName="--color-brand" />
          <Swatch name="brand-soft" varName="--color-brand-soft" />
          <Swatch name="primary" varName="--color-primary" />
          <Swatch name="success" varName="--color-success" />
          <Swatch name="warning" varName="--color-warning" />
          <Swatch name="danger" varName="--color-danger" />
          <Swatch name="info" varName="--color-info" />
          <Swatch name="accent" varName="--color-accent" />
        </div>
      </Section>

      {/* TYPOGRAPHY */}
      <Section title="Tipografía">
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-[var(--text-display,_2.5rem)] font-bold tracking-tight text-slate-900" style={{ fontSize: "var(--text-display)" }}>
            Display · Inter Bold
          </p>
          <p className="text-3xl font-bold text-slate-900">Heading 1 · Inter</p>
          <p className="text-2xl font-semibold text-slate-900">Heading 2 · Inter</p>
          <p className="text-xl font-semibold text-slate-900">Heading 3 · Inter</p>
          <p className="text-base text-slate-700 leading-relaxed">
            Body · Inter regular. Inter is the de-facto premium SaaS typeface, used by Linear,
            Notion and Vercel. Excelente legibilidad médica con stylistic sets para 1-l-I y 0-O.
          </p>
          <p className="text-xs font-mono text-slate-700">
            Mono · IBM Plex Mono · DOI: 10.1056/NEJMra2031234 · PMID: 38765432
          </p>
        </div>
      </Section>

      {/* LOGO */}
      <Section title="Logo">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-center">
            <Logo size="sm" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-center">
            <Logo size="md" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 flex items-center justify-center">
            <Logo size="lg" iconOnly />
          </div>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-teal-600 to-blue-800 p-6 flex items-center justify-center">
          <Logo size="md" light />
        </div>
      </Section>

      {/* BUTTONS */}
      <Section title="Botones">
        <div className="rounded-xl border border-slate-200 bg-white p-6 flex flex-wrap gap-3">
          <button className="inline-flex items-center justify-center rounded-md bg-slate-900 text-white text-sm font-medium px-4 py-2 hover:bg-slate-800 transition-colors press">
            Primary
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-teal-600 text-white text-sm font-medium px-4 py-2 hover:bg-teal-700 transition-colors press">
            Brand
          </button>
          <button className="inline-flex items-center justify-center rounded-md border border-slate-200 text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-50 transition-colors">
            Outline
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-slate-600 text-sm font-medium px-4 py-2 hover:bg-slate-100 transition-colors">
            Ghost
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-red-600 text-white text-sm font-medium px-4 py-2 hover:bg-red-700 transition-colors press">
            Destructive
          </button>
          <button className="inline-flex items-center justify-center rounded-md bg-slate-200 text-slate-400 text-sm font-medium px-4 py-2 cursor-not-allowed" disabled>
            Disabled
          </button>
        </div>
      </Section>

      {/* CARDS */}
      <Section title="Cards">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Card básica</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Contenido de ejemplo.</p>
            </CardContent>
          </Card>
          <Card className="hover-lift cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Card con hover-lift</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-500">Pasa el mouse para ver el lift.</p>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* SKELETONS */}
      <Section title="Loading skeletons">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-3">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </Section>

      {/* EMPTY STATES */}
      <Section title="Empty states">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EmptyState
            illustration="library"
            size="sm"
            title="Tu biblioteca"
            description="Sin referencias todavía"
          />
          <EmptyState
            illustration="search"
            size="sm"
            title="Sin resultados"
            description="Prueba con otro término"
          />
          <EmptyState
            illustration="trash"
            size="sm"
            title="Papelera vacía"
          />
          <EmptyState
            illustration="references"
            size="sm"
            title="Sin referencias verificadas"
          />
        </div>
      </Section>

      {/* ANIMATIONS */}
      <Section title="Animaciones / micro-interactions">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <div className="spinner-brand mx-auto mb-3" />
            <p className="text-xs text-slate-500">spinner-brand</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <div className="live-dot mx-auto mb-3" />
            <p className="text-xs text-slate-500">live-dot</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center animate-fade-in-up">
            <p className="text-sm text-slate-700">animate-fade-in-up</p>
          </div>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs uppercase tracking-wide text-slate-500 font-semibold">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="rounded-lg overflow-hidden border border-slate-200">
      <div className="h-16" style={{ background: `var(${varName})` }} />
      <div className="px-2 py-1.5 bg-white">
        <p className="text-[11px] font-mono text-slate-700">{name}</p>
        <p className="text-[10px] font-mono text-slate-400">{varName}</p>
      </div>
    </div>
  )
}
