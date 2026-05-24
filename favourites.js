// favourites.js — small adapter around Supabase favourites table
// Schema:
//   favourites(id uuid pk, content_id text, user_id text default 'default', created_at timestamptz)
// If Supabase keys are not configured, falls back to localStorage so the
// prototype still works end-to-end.

(function () {
  const USER_ID = 'default';
  const LS_KEY = 'gmk.favs.v1';

  const env = window.__GMK_ENV || {};
  const SB_URL = env.SUPABASE_URL || '';
  const SB_KEY = env.SUPABASE_ANON_KEY || '';
  const useSupabase = !!(SB_URL && SB_KEY);

  const listeners = new Set();
  const state = { ids: new Set(), ready: false };

  function emit() { listeners.forEach((fn) => fn(state.ids)); }
  function lsRead() {
    try { return new Set(JSON.parse(localStorage.getItem(LS_KEY) || '[]')); }
    catch { return new Set(); }
  }
  function lsWrite() {
    localStorage.setItem(LS_KEY, JSON.stringify([...state.ids]));
  }

  async function sbFetch(path, init = {}) {
    const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: SB_KEY,
        Authorization: `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...(init.headers || {}),
      },
    });
    if (!res.ok) throw new Error(`Supabase ${res.status}`);
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  async function load() {
    if (useSupabase) {
      try {
        const rows = await sbFetch(`favourites?user_id=eq.${USER_ID}&select=content_id`);
        state.ids = new Set((rows || []).map((r) => r.content_id));
      } catch (e) {
        console.warn('Supabase load failed, falling back to localStorage', e);
        state.ids = lsRead();
      }
    } else {
      state.ids = lsRead();
    }
    state.ready = true;
    emit();
  }

  async function toggle(contentId) {
    const had = state.ids.has(contentId);
    // Optimistic
    if (had) state.ids.delete(contentId);
    else state.ids.add(contentId);
    emit();

    if (useSupabase) {
      try {
        if (had) {
          await sbFetch(
            `favourites?user_id=eq.${USER_ID}&content_id=eq.${encodeURIComponent(contentId)}`,
            { method: 'DELETE' }
          );
        } else {
          await sbFetch('favourites', {
            method: 'POST',
            body: JSON.stringify({ content_id: contentId, user_id: USER_ID }),
          });
        }
      } catch (e) {
        // revert on error
        if (had) state.ids.add(contentId); else state.ids.delete(contentId);
        emit();
        console.warn('Supabase write failed', e);
      }
    } else {
      lsWrite();
    }
    return !had;
  }

  function has(contentId) { return state.ids.has(contentId); }
  function all() { return new Set(state.ids); }
  function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

  window.GMK_FAV = { load, toggle, has, all, subscribe };
})();
