import { createAPIFileRoute } from '@tanstack/start/api'

export const Route = createAPIFileRoute('/api/user/balance')({
  GET: async ({ request }) => {
    const url = new URL(request.url)
    const userIdentifier = url.searchParams.get('user')

    if (!userIdentifier) {
      return new Response(JSON.stringify({ points: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const env = (process as any).env?.DB ? (process as any).env : (globalThis as any).__env__ || (globalThis as any)
    const db = env?.DB

    if (!db) {
      return new Response(JSON.stringify({ points: 0, error: 'DB not bound' }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    try {
      const user = await db.prepare(
        'SELECT id, email, points FROM users WHERE id = ? OR email = ?'
      ).bind(userIdentifier, userIdentifier).first()

      return new Response(JSON.stringify(user || { points: 0 }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      })
    } catch {
      return new Response(JSON.stringify({ points: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
})
