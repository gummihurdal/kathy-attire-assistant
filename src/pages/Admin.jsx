import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

// Only these emails can access admin
const ADMIN_EMAILS = ['gudmundur.brekkan@snb.ch', 'gummihurdal@gmail.com', 'brekkan@gmail.com']

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background: 'var(--charcoal)', border: '1px solid var(--border)', padding: '1.5rem 2rem' }}>
      <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', color: 'var(--ivory)', fontWeight: 300 }}>{value}</p>
      {sub && <p style={{ fontSize: '0.7rem', color: 'var(--stone)', marginTop: '0.25rem' }}>{sub}</p>}
    </div>
  )
}

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return `${Math.floor(diff)}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [topPages, setTopPages] = useState([])
  const [users, setUsers] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    if (!ADMIN_EMAILS.includes(user.email)) { navigate('/'); return }
    loadAll()
  }, [user])

  async function loadAll() {
    setLoading(true)
    const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
    const SB = import.meta.env.VITE_SUPABASE_URL

    // Use service role via edge function workaround — fetch with anon key
    // page_views: anon can INSERT but not SELECT (service_role only)
    // We'll use a dedicated admin edge function or count via supabase-js with service role
    // For now, use supabase client (will work if RLS allows service_role reads)
    
    const [pvRes, wRes, listRes] = await Promise.all([
      supabase.from('page_views').select('*', { count: 'exact', head: false }).order('created_at', { ascending: false }).limit(200),
      supabase.from('wardrobe_items').select('id, user_id, created_at', { count: 'exact' }),
      supabase.from('listings').select('*').order('created_at', { ascending: false }),
    ])

    const views = pvRes.data || []
    const totalViews = pvRes.count || views.length

    // Today's views
    const today = new Date(); today.setHours(0,0,0,0)
    const todayViews = views.filter(v => new Date(v.created_at) >= today).length

    // Unique sessions
    const uniqueSessions = new Set(views.map(v => v.session_id).filter(Boolean)).size

    // Top pages
    const pageCounts = {}
    views.forEach(v => { pageCounts[v.path] = (pageCounts[v.path] || 0) + 1 })
    const sorted = Object.entries(pageCounts).sort((a,b) => b[1]-a[1]).slice(0,10)

    setStats({ totalViews, todayViews, uniqueSessions, wardrobeItems: wRes.count || 0 })
    setRecent(views.slice(0, 50))
    setTopPages(sorted)
    setListings(listRes.data || [])
    setLoading(false)
  }

  if (!user || !ADMIN_EMAILS.includes(user.email)) return null

  const TABS = ['overview', 'visits', 'boutique']

  return (
    <div style={{ minHeight: '100vh', padding: '2.5rem 2rem 5rem', maxWidth: 1200, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          ♛ Private
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 4vw, 3rem)', color: 'var(--ivory)', fontWeight: 300, marginBottom: '0.5rem' }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--stone)', marginBottom: '2.5rem' }}>my-outfit.azurenexus.com</p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: tab === t ? 'var(--gold)' : 'var(--stone)',
              borderBottom: `2px solid ${tab === t ? 'var(--gold)' : 'transparent'}`,
              padding: '0.75rem 1.25rem', fontFamily: 'var(--font-body)',
              transition: 'all 0.15s', marginBottom: '-1px',
            }}>{t}</button>
          ))}
          <button onClick={loadAll} style={{
            background: 'none', border: '1px solid var(--border)', cursor: 'pointer',
            fontSize: '0.6rem', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'var(--stone)', padding: '0.4rem 0.875rem', fontFamily: 'var(--font-body)',
            marginLeft: 'auto', alignSelf: 'center', transition: 'color 0.15s',
          }}>↻ Refresh</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--stone)', fontSize: '0.82rem' }}>Loading…</p>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && stats && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1px', background: 'var(--border)', marginBottom: '3rem' }}>
                  <StatCard label="Total Page Views" value={stats.totalViews.toLocaleString()} />
                  <StatCard label="Views Today" value={stats.todayViews.toLocaleString()} />
                  <StatCard label="Unique Sessions" value={stats.uniqueSessions.toLocaleString()} />
                  <StatCard label="Wardrobe Items" value={stats.wardrobeItems.toLocaleString()} sub="across all users" />
                  <StatCard label="Boutique Listings" value={listings.length.toLocaleString()} sub={`${listings.filter(l=>l.status==='active').length} active`} />
                </div>

                <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>Top Pages</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                  {topPages.map(([path, count]) => (
                    <div key={path} style={{ background: 'var(--charcoal)', padding: '0.75rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--ivory)', fontFamily: 'monospace' }}>{path || '/'}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 500 }}>{count} views</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* VISITS */}
            {tab === 'visits' && (
              <div>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
                  Last {recent.length} visits
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                  {recent.map(v => (
                    <div key={v.id} style={{ background: 'var(--charcoal)', padding: '0.7rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 120px 100px', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--ivory)', fontFamily: 'monospace' }}>{v.path}</span>
                        {v.referrer && <span style={{ fontSize: '0.62rem', color: 'var(--stone)', marginLeft: '0.75rem' }}>← {v.referrer.replace(/https?:\/\//, '').slice(0,30)}</span>}
                      </div>
                      <span style={{ fontSize: '0.65rem', color: v.user_id ? 'var(--gold)' : 'var(--stone)' }}>
                        {v.user_id ? '● logged in' : '○ anon'}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--stone)', textAlign: 'right' }}>{timeAgo(v.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BOUTIQUE */}
            {tab === 'boutique' && (
              <div>
                <p style={{ fontSize: '0.6rem', letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '1rem' }}>
                  All listings ({listings.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
                  {listings.map(l => (
                    <div key={l.id} style={{ background: 'var(--charcoal)', padding: '0.875rem 1.25rem', display: 'grid', gridTemplateColumns: '1fr 80px 80px 90px', gap: '1rem', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--ivory)' }}>{l.title}</p>
                        <p style={{ fontSize: '0.62rem', color: 'var(--stone)' }}>{l.brand} · {l.category}</p>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--ivory)' }}>€{Number(l.price).toLocaleString()}</span>
                      <span style={{ fontSize: '0.62rem', color: l.status === 'active' ? 'var(--gold)' : 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l.status}</span>
                      <span style={{ fontSize: '0.62rem', color: 'var(--stone)', textAlign: 'right' }}>{timeAgo(l.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
