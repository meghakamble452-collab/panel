const BASE = import.meta.env.VITE_API || '/api';

async function req(path, opts = {}) {
  const r = await fetch(BASE + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
    ...opts,
  });
  const t = await r.text();
  let d;
  try { d = JSON.parse(t); } catch { d = { error: t || 'Bad response' }; }
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
}
const arr = v => (Array.isArray(v) ? v : []);

export const api = {
  login:  (u, p) => req('/auth_login.php', { method:'POST', body: JSON.stringify({ username:u, password:p }) }),
  logout: () => req('/auth_logout.php', { method:'POST' }),
  me:     () => req('/me.php'),
  dash:   () => req('/dashboard.php'),
  masters:() => req('/masters.php').then(arr),
  addMaster: b => req('/masters.php', { method:'POST', body: JSON.stringify(b) }),
  masterAct: (id,a) => req(`/masters.php?action=${a}&id=${id}`, { method:'POST' }),
  setPass: (id, p) => req(`/masters.php?action=setpass&id=${id}&p=${encodeURIComponent(p)}`, { method:'POST' }),
  users:  q => req(`/users.php?q=${encodeURIComponent(q||'')}`).then(arr),
  addUsers: b => req('/users.php', { method:'POST', body: JSON.stringify(b) }),
  userAct: (id,a,extra='') => req(`/users.php?action=${a}&id=${id}${extra}`, { method:'POST' }),
  bulk:   a => req(`/users.php?action=${a}`, { method:'POST' }),
  deleted:q => req(`/deleted.php?q=${encodeURIComponent(q||'')}`).then(arr),
  payments:() => req('/payments.php'),
  addPay: b => req('/payments.php', { method:'POST', body: JSON.stringify(b) }),
  paid:   q => req(`/paid.php?q=${encodeURIComponent(q||'')}`).then(arr),
  results: p => req(`/activities.php?from=${p.from}&to=${p.to}&q=${encodeURIComponent(p.q||'')}&status=${encodeURIComponent(p.status||'')}&gateway=${encodeURIComponent(p.gateway||'')}`).then(d => d),
};