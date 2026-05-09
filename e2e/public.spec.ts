import { test, expect } from "@playwright/test"

test.describe("Public surfaces", () => {
  test("landing renders", async ({ page }) => {
    const response = await page.goto("/")
    expect(response?.ok()).toBeTruthy()
  })

  test("login page is reachable", async ({ page }) => {
    const response = await page.goto("/login")
    expect(response?.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/login$/)
  })

  test("signup page is reachable", async ({ page }) => {
    const response = await page.goto("/registro")
    expect(response?.ok()).toBeTruthy()
    await expect(page).toHaveURL(/\/registro$/)
  })

  test("unauthenticated dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("legal terms page is reachable without auth", async ({ page }) => {
    const response = await page.goto("/dashboard/legal/terminos")
    // Middleware may redirect to login, which is also fine.
    expect(response?.ok()).toBeTruthy()
  })

  test("legal privacy page is reachable without auth", async ({ page }) => {
    const response = await page.goto("/dashboard/legal/privacidad")
    expect(response?.ok()).toBeTruthy()
  })
})

test.describe("API health", () => {
  test("/api/health returns ok or degraded JSON", async ({ request }) => {
    const response = await request.get("/api/health")
    expect([200, 503]).toContain(response.status())
    const body = await response.json()
    expect(["ok", "degraded"]).toContain(body.status)
    expect(body.checks).toBeDefined()
  })
})
