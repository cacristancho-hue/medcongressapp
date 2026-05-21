export async function kickQueuedAiJobs() {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return { kicked: false, message: "CRON_SECRET no configurado." }
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"

  let processed = 0
  let failures = 0

  for (let i = 0; i < 3; i++) {
    const response = await fetch(`${baseUrl}/api/jobs/worker`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
      },
    })

    if (!response.ok) {
      failures++
      break
    }

    const data = await response.json().catch(() => null)
    processed += Number(data?.processed ?? 0)
    if (!data?.processed) break
  }

  return {
    kicked: true,
    processed,
    failures,
  }
}
