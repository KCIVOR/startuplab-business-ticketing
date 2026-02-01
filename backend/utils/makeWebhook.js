const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL
const MAKE_WEBHOOK_API_KEY = process.env.MAKE_WEBHOOK_API_KEY

export async function sendMakeNotification(body) {
  if (!MAKE_WEBHOOK_URL) return { ok: false, skipped: true, reason: 'MAKE_WEBHOOK_URL missing' }
  const headers = {
    'Content-Type': 'application/json',
    ...(MAKE_WEBHOOK_API_KEY ? { 'x-api-key': MAKE_WEBHOOK_API_KEY } : {})
  }
  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('Make.com webhook failed', res.status, text)
      return { ok: false, status: res.status, text }
    }
    return { ok: true, status: res.status }
  } catch (err) {
    console.error('Make.com webhook error', err)
    return { ok: false, error: err?.message || 'unknown error' }
  }
}
