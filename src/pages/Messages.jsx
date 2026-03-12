import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../lib/auth'
import { getInbox, getThread, replyMessage, sendMessage, markThreadRead } from '../lib/messages'
import { Send, MessageSquare, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'

function timeAgo(ts) {
  const diff = (Date.now() - new Date(ts)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function Messages() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [inbox, setInbox] = useState([])
  const [selected, setSelected] = useState(null)
  const [thread, setThread] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/auth'); return }
    getInbox().then(d => { setInbox(d); setLoading(false) })
  }, [user])

  const openThread = async (msg) => {
    setSelected(msg)
    setReply('')
    const msgs = await getThread(msg.listing_id)
    setThread(msgs)
    await markThreadRead(msg.listing_id)
    // Refresh inbox to clear unread
    getInbox().then(setInbox)
  }

  const handleSend = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      // Determine receiver: if I'm the sender, receiver is the other party
      const isSeller = selected.listing?.seller_id === user.id
      const otherThread = thread.find(m => m.sender_id !== user.id) || thread[0]
      const receiverId = isSeller ? otherThread?.sender_id : selected.listing?.seller_id
      const receiverEmail = isSeller ? otherThread?.sender_email : ''

      await replyMessage({
        listingId: selected.listing_id,
        buyerId: receiverId,
        buyerEmail: receiverEmail,
        message: reply,
      })
      setReply('')
      const updated = await getThread(selected.listing_id)
      setThread(updated)
      toast.success('Sent', { className: 'toast-royal' })
    } catch (e) {
      toast.error(e.message || 'Failed to send', { className: 'toast-royal' })
    } finally {
      setSending(false)
    }
  }

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', maxWidth: 900, margin: '0 auto', padding: '2.5rem 1.5rem 5rem' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
        <p style={{ fontSize: '0.6rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '0.5rem' }}>
          Boutique
        </p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', color: 'var(--ivory)', fontWeight: 300 }}>
          Messages
        </h1>
      </motion.div>

      <div className="messages-layout">
        {/* Inbox list */}
        <div style={{ borderRight: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.6rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ivory-faint)', marginBottom: '1rem', paddingRight: '1.5rem' }}>
            Conversations
          </p>

          {loading && (
            <p style={{ color: 'var(--ivory-faint)', fontSize: '0.82rem' }}>Loading…</p>
          )}

          {!loading && inbox.length === 0 && (
            <div style={{ padding: '2rem 0', textAlign: 'center' }}>
              <MessageSquare size={28} strokeWidth={1} style={{ color: 'var(--ivory-faint)', marginBottom: '0.75rem' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--ivory-faint)' }}>No messages yet</p>
              <Link to="/boutique" style={{ fontSize: '0.72rem', color: 'var(--gold)', textDecoration: 'none', display: 'block', marginTop: '0.5rem' }}>
                Browse the boutique →
              </Link>
            </div>
          )}

          {inbox.map(msg => {
            const isUnread = !msg.read_at && msg.receiver_id === user.id
            const isActive = selected?.listing_id === msg.listing_id
            return (
              <motion.div key={msg.id} whileHover={{ x: 2 }}
                onClick={() => openThread(msg)}
                style={{
                  padding: '1rem 1.25rem 1rem 0',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(201,168,76,0.04)' : 'transparent',
                  transition: 'background 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: '0.78rem', color: isUnread ? 'var(--ivory)' : 'var(--ivory-dim)', fontWeight: isUnread ? 500 : 300, marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {msg.listing?.title || 'Listing'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--ivory-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {msg.message}
                    </p>
                    <p style={{ fontSize: '0.62rem', color: 'var(--stone)', marginTop: '0.25rem' }}>
                      {msg.listing?.brand}
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    <p style={{ fontSize: '0.62rem', color: 'var(--stone)', marginBottom: '0.3rem' }}>{timeAgo(msg.created_at)}</p>
                    {isUnread && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', marginLeft: 'auto' }} />
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Thread view */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 400 }}>
          {!selected ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
              <MessageSquare size={32} strokeWidth={1} style={{ color: 'var(--ivory-faint)' }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--ivory-faint)' }}>Select a conversation</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div style={{ padding: '0 0 1rem 1.5rem', borderBottom: '1px solid var(--border)', marginBottom: '1rem' }}>
                <Link to={`/boutique/${selected.listing_id}`}
                  style={{ fontSize: '0.78rem', color: 'var(--ivory)', textDecoration: 'none', fontWeight: 400 }}>
                  {selected.listing?.title}
                </Link>
                <p style={{ fontSize: '0.68rem', color: 'var(--gold)', marginTop: '0.15rem' }}>
                  {selected.listing?.brand}
                </p>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <AnimatePresence>
                  {thread.map(m => {
                    const mine = m.sender_id === user.id
                    return (
                      <motion.div key={m.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        style={{
                          display: 'flex',
                          justifyContent: mine ? 'flex-end' : 'flex-start',
                        }}>
                        <div style={{
                          maxWidth: '72%',
                          padding: '0.65rem 0.875rem',
                          background: mine ? 'rgba(201,168,76,0.12)' : 'var(--charcoal)',
                          border: `1px solid ${mine ? 'rgba(201,168,76,0.25)' : 'var(--border)'}`,
                        }}>
                          <p style={{ fontSize: '0.8rem', color: 'var(--ivory)', lineHeight: 1.6 }}>{m.message}</p>
                          <p style={{ fontSize: '0.6rem', color: 'var(--stone)', marginTop: '0.3rem', textAlign: mine ? 'right' : 'left' }}>
                            {mine ? 'You' : m.sender_email.split('@')[0]} · {timeAgo(m.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Reply input */}
              <div style={{ padding: '1rem 0 0 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem' }}>
                <textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder="Type a message… (Enter to send)"
                  rows={2}
                  style={{
                    flex: 1, background: 'var(--charcoal)', border: '1px solid var(--border)',
                    color: 'var(--ivory)', fontFamily: 'var(--font-body)', fontSize: '0.82rem',
                    padding: '0.65rem 0.875rem', resize: 'none', outline: 'none', lineHeight: 1.6,
                  }}
                />
                <button onClick={handleSend} disabled={sending || !reply.trim()}
                  style={{
                    background: reply.trim() ? 'rgba(201,168,76,0.15)' : 'var(--charcoal)',
                    border: `1px solid ${reply.trim() ? 'rgba(201,168,76,0.4)' : 'var(--border)'}`,
                    color: 'var(--gold)', cursor: reply.trim() ? 'pointer' : 'default',
                    width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s', flexShrink: 0,
                  }}>
                  <Send size={15} strokeWidth={1.5} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        .messages-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 0;
          min-height: 500px;
          border: 1px solid var(--border);
        }
        @media (max-width: 640px) {
          .messages-layout {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
