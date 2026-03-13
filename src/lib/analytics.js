import { supabase } from './supabase'

function getSessionId() {
  let sid = sessionStorage.getItem('kat_sid')
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem('kat_sid', sid)
  }
  return sid
}

export async function trackPageView(path) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const SB_URL = import.meta.env.VITE_SUPABASE_URL
    const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

    await fetch(`${SB_URL}/functions/v1/track-view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        path,
        referrer: document.referrer || null,
        user_agent: navigator.userAgent,
        user_id: user?.id || null,
        session_id: getSessionId(),
      }),
    })
  } catch (_) {
    // silent
  }
}
