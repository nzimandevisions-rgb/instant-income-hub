import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const [userId, setUserId] = useState<string>('')
  const [points, setPoints] = useState<number>(0)
  const [payoutTarget, setPayoutTarget] = useState<string>('')
  const [payoutStatus, setPayoutStatus] = useState<string>('')

  // 1. Initialize or recover unique Lead Account ID
  useEffect(() => {
    let storedId = localStorage.getItem('syde_user_id')
    if (!storedId) {
      storedId = 'sh-' + Math.random().toString(36).substring(2, 9)
      localStorage.setItem('syde_user_id', storedId)
    }
    setUserId(storedId)
  }, [])

  // 2. Fetch live D1 balance for this specific lead
  useEffect(() => {
    if (!userId) return

    const loadBalance = () => {
      fetch(`/api/user/balance?user=${encodeURIComponent(userId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && typeof data.points === 'number') {
            setPoints(data.points)
          }
        })
        .catch((err) => console.error('Error fetching balance:', err))
    }

    loadBalance()
    // Poll every 15 seconds so points automatically pop up after completing a task
    const interval = setInterval(loadBalance, 15000)
    return () => clearInterval(interval)
  }, [userId])

  // Conversion: 1,000 PTS = $1.00 USD (≈ R18.00 ZAR)
  const usdValue = (points / 1000).toFixed(2)

  // 3. Tracking Link Generator (Ties every task to this lead)
  const startTask = (baseUrl: string) => {
    if (!userId) return
    const delimiter = baseUrl.includes('?') ? '&' : '?'
    const trackedUrl = `${baseUrl}${delimiter}subid1=${encodeURIComponent(userId)}&subId=${encodeURIComponent(userId)}&playerid=${encodeURIComponent(userId)}`
    window.open(trackedUrl, '_blank')
  }

  // 4. Withdrawal Handler
  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (points < 1000) {
      setPayoutStatus('Minimum withdrawal is 1,000 PTS ($1.00). Keep completing tasks!')
      return
    }
    if (!payoutTarget) {
      setPayoutStatus('Please enter your PayPal email or Mobile/Account number.')
      return
    }

    setPayoutStatus('Submitting payout request...')

    try {
      const res = await fetch('/api/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          points: points,
          destination: payoutTarget,
        }),
      })

      if (res.ok) {
        setPayoutStatus('Withdrawal request received! Processing within 24 hours.')
        setPoints(0)
      } else {
        setPayoutStatus('Withdrawal queued for administrator review.')
      }
    } catch {
      setPayoutStatus('Request queued! Support will review your payout.')
    }
  }

  return (
    <main style={{ maxWidth: '750px', margin: '0 auto', padding: '16px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Lead Wallet Banner */}
      <section style={{ background: '#0f172a', color: '#fff', borderRadius: '16px', padding: '24px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Your Account ID: <strong style={{ color: '#38bdf8' }}>{userId || 'Loading...'}</strong>
        </p>
        <h1 style={{ margin: '8px 0', fontSize: '42px', fontWeight: '800', color: '#22c55e' }}>
          {points} <span style={{ fontSize: '20px', color: '#94a3b8' }}>PTS</span>
        </h1>
        <p style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#e2e8f0' }}>
          ≈ ${usdValue} USD
        </p>
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          1,000 PTS = $1.00 USD • Verified Instant Payouts
        </p>
      </section>

      {/* Verified Tasks Section */}
      <section style={{ marginTop: '28px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: '#22c55e' }}>●</span> Live Verified Tasks
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Task 1 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>HOT</span>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px' }}>Samsung Galaxy S25 Sweepstakes</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Enter details & verify signup.</p>
              <strong style={{ color: '#15803d', fontSize: '14px', display: 'block', marginTop: '4px' }}>+340 PTS ($0.34)</strong>
            </div>
            <button 
              onClick={() => startTask("https://YOUR_OFFER_LINK_1")}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Start Offer
            </button>
          </div>

          {/* Task 2 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ background: '#e0f2fe', color: '#0284c7', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>POPULAR</span>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px' }}>Latest Smart Watch Giveaway</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Complete simple 2-minute survey.</p>
              <strong style={{ color: '#15803d', fontSize: '14px', display: 'block', marginTop: '4px' }}>+300 PTS ($0.30)</strong>
            </div>
            <button 
              onClick={() => startTask("https://YOUR_OFFER_LINK_2")}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Start Offer
            </button>
          </div>

          {/* Task 3 */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '800', padding: '2px 8px', borderRadius: '4px' }}>EASY</span>
              <h3 style={{ margin: '6px 0 2px 0', fontSize: '16px' }}>Instant App Rewards & Signup</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Install and open app.</p>
              <strong style={{ color: '#15803d', fontSize: '14px', display: 'block', marginTop: '4px' }}>+200 PTS ($0.20)</strong>
            </div>
            <button 
              onClick={() => startTask("https://YOUR_OFFER_LINK_3")}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}>
              Start Offer
            </button>
          </div>

        </div>
      </section>

      {/* Cash Out / Withdrawal Section */}
      <section style={{ marginTop: '32px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: '0 0 6px 0' }}>Request Payout</h2>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
          Minimum cash-out: <strong>1,000 PTS ($1.00 USD)</strong>. Supports PayPal, 1Voucher, or Bank Transfer.
        </p>

        <form onSubmit={handleWithdrawal} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="Enter PayPal Email or Phone/Account Number" 
            value={payoutTarget}
            onChange={(e) => setPayoutTarget(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          />
          <button 
            type="submit" 
            disabled={points < 1000}
            style={{ 
              background: points >= 1000 ? '#16a34a' : '#94a3b8', 
              color: '#fff', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '8px', 
              fontWeight: '700', 
              cursor: points >= 1000 ? 'pointer' : 'not-allowed' 
            }}>
            {points >= 1000 ? 'Withdraw Funds Now' : 'Earn At Least 1,000 PTS to Cash Out'}
          </button>
        </form>

        {payoutStatus && (
          <p style={{ marginTop: '10px', fontSize: '13px', color: '#0369a1', fontWeight: '600' }}>
            {payoutStatus}
          </p>
        )}
      </section>

    </main>
  )
}
