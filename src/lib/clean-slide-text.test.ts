import { describe, it, expect } from "vitest"
import { cleanSlideText } from "./clean-slide-text"

describe("cleanSlideText", () => {
  it("returns empty string for nullish input", () => {
    expect(cleanSlideText(null)).toBe("")
    expect(cleanSlideText(undefined)).toBe("")
    expect(cleanSlideText("")).toBe("")
  })

  it("keeps clinical content intact", () => {
    const input = "Manejo de la hipertensión\nObjetivo PA < 130/80 mmHg\nIniciar IECA o ARA-II"
    expect(cleanSlideText(input)).toBe(input)
  })

  it("drops everything after a References heading", () => {
    const input = "Puntos clave del estudio\nReducción de eventos 25%\n\nReferencias\n1. Smith J. NEJM 2020;382:1.\n2. Doe A. Lancet 2019."
    const out = cleanSlideText(input)
    expect(out).toContain("Puntos clave del estudio")
    expect(out).toContain("Reducción de eventos 25%")
    expect(out).not.toContain("Smith J")
    expect(out).not.toContain("Referencias")
  })

  it("drops standalone DOI / PMID lines", () => {
    const input = "Resultado principal positivo\ndoi: 10.1056/NEJMoa2034577\nPMID: 12345678"
    const out = cleanSlideText(input)
    expect(out).toBe("Resultado principal positivo")
  })

  it("drops a footer numbered citation with year + volume:pages", () => {
    const input = "Conclusión: el tratamiento es eficaz\n1. Smith J, et al. N Engl J Med. 2020;382(8):727-733."
    const out = cleanSlideText(input)
    expect(out).toContain("Conclusión: el tratamiento es eficaz")
    expect(out).not.toContain("Smith J")
  })

  it("does NOT remove prose that merely mentions a year inline", () => {
    const input = "Desde 2020 la incidencia aumentó un 15% en la población estudiada"
    expect(cleanSlideText(input)).toBe(input)
  })

  it("collapses excessive blank lines", () => {
    const input = "Línea A\n\n\n\nLínea B"
    expect(cleanSlideText(input)).toBe("Línea A\n\nLínea B")
  })
})
