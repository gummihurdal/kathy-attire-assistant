import { supabase } from './supabase'

// Generate or reuse a session ID for this browser session
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
    await supabase.from('page_views').insert({
      site: 'my-outfit',
      path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      user_id: user?.id || null,
      session_id: getSessionId(),
    })
  } catch (_) {
    // silent — never break the UI
  }
}
