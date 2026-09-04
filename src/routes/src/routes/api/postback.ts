import { createAPIFileRoute } from '@tanstack/start/api'

export const Route = createAPIFileRoute('/api/postback')({
  GET: async ({ request }) => handlePostback(request),
  POST: async ({ request }) => handlePostback(request),
})

async function handlePostback(request: Request) {
  const url = new URL(request.url)

  const subId = url.searchParams.get('subId') ||
                url.searchParams.get('subid1') ||
                url.searchParams.get('user_id') ||
                url.searchParams.get('playerid') ||
                url.searchParams.get('uid')

  const reward = parseInt(
    url.searchParams.get('reward') ||
    url.searchParams.get('points') ||
    url.searchParams.get('amount') || '0',
    10
  )

  const txid = url.searchParams.get('txid') ||
               url.searchParams.get('trans_id') ||
               `tx_${Date.now()}`

  if (!subId || isNaN(reward) || reward <= 0) {
    return new Response('Missing subId or valid reward amount', { status: 400 })
  }

  // Access Cloudflare D1 Database binding via global or request env
  const env = (process as any).env?.DB ? (process as any).env : (globalThis as any).__env__ || (globalThis as any)
  const db = env?.DB

  if (!db) {
    return new Response('D1 Database binding missing in Cloudflare', { status: 500 })
  }

  try {
    let user = await db.prepare(
      'SELECT id, points FROM users WHERE id = ? OR email = ?'
    ).bind(subId, subId).first()

    let targetId = subId

    if (!user) {
      targetId = `usr_${Date.now()}`
      await db.prepare(
        'INSERT INTO users (id, email, points) VALUES (?, ?, ?)'
      ).bind(targetId, subId.includes('@') ? subId : `${subId}@user.sydehustle.com`, reward).run()
    } else {
      targetId = user.id
      await db.prepare(
        'UPDATE users SET points = points + ? WHERE id = ?'
      ).bind(reward, user.id).run()
    }

    await db.prepare(
      'INSERT OR IGNORE INTO transactions (id, user_id, amount, txid, type) VALUES (?, ?, ?, ?, ?)'
    ).bind(`txn_${Date.now()}`, targetId, reward, txid, 'job_reward').run()

    return new Response('OK', { 
      status: 200,
      headers: { 'Content-Type': 'text/plain' }
    })
  } catch (err: any) {
    return new Response(`Database error: ${err.message}`, { status: 500 })
  }
}
