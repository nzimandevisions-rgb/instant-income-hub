import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'

export const Route = createFileRoute('/')({
  component: DashboardPage,
})

function DashboardPage() {
  const [points, setPoints] = useState(0)
  // Get user email or ID from your auth session, or fallback to current user
  const userEmail = "Velley.velley@gmail.com" 

  // Fetch real-time points balance from Cloudflare D1
  useEffect(() => {
    fetch(`/api/user/balance?user=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.points === 'number') {
          setPoints(data.points)
        }
      })
      .catch((err) => console.error("Balance fetch error:", err))
  }, [userEmail])

  // Conversion: 1,000 Points = $1.00 USD
  const cashValue = (points / 1000).toFixed(2)

  // Tracking link: Automatically attaches the user ID so postback credits them
  const openOffer = (partnerUrl: string) => {
    const trackedUrl = `${partnerUrl}&subid1=${encodeURIComponent(userEmail)}&playerid=${encodeURIComponent(userEmail)}`
    window.open(trackedUrl, '_blank')
  }

  return (
    <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      {/* Earnings Overview Card */}
      <section style={{ background: '#1e293b', color: '#fff', borderRadius: '12px', padding: '24px', marginBottom: '24px', textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#94a3b8' }}>Available Balance</h2>
        <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#22c55e' }}>{points} PTS</div>
        <div style={{ fontSize: '20px', color: '#38bdf8', marginTop: '4px' }}>≈ ${cashValue} USD</div>
        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Active Account: {userEmail}</p>
      </section>

      {/* Available Jobs / Surveys / Tasks */}
      <section>
        <h3 style={{ fontSize: '20px', marginBottom: '16px' }}>Available Tasks & Offers</h3>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
          
          {/* Task 1: Adscend Media Offerwall */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>High-Paying Surveys & Apps</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Complete market research surveys and app installs.</p>
              <span style={{ display: 'inline-block', marginTop: '6px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                +150 to +2,500 PTS
              </span>
            </div>
            <button 
              onClick={() => openOffer("https://adscendmedia.com/adwall/publisher/YOUR_PUB_ID/profile/YOUR_PROFILE_ID?")}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Start Task
            </button>
          </div>

          {/* Task 2: AdGem Offerwall */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>Mobile Games & Quick Tasks</h4>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Play sponsored games and reach milestone levels.</p>
              <span style={{ display: 'inline-block', marginTop: '6px', background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' }}>
                +500 to +10,000 PTS
              </span>
            </div>
            <button 
              onClick={() => openOffer("https://api.adgem.com/v1/wall?appid=YOUR_ADGEM_APP_ID")}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              Start Task
            </button>
          </div>

        </div>
      </section>

      {/* Payout Information */}
      <section style={{ marginTop: '32px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Instant Payout Rules</h4>
        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
          Minimum withdrawal threshold is <strong>5,000 PTS ($5.00)</strong>. Payouts are processed to verified PayPal accounts.
        </p>
      </section>
    </main>
  )
}
