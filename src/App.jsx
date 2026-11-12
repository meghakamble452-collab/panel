import { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from './lib/api';
import Icon from './components/Icon';
import './theme.css';

const NAV = [
  ['/', 'Dashboard', 'dash'],
  ['/add', 'Add New Member', 'add'],
  ['/masters', 'All Super Masters', 'crown'],
  ['/users', 'All Users', 'users'],
  ['/deleted', 'Deleted Users', 'trash'],
  ['/payments', 'Payment History', 'rupee'],
  ['/paid', 'Paid History', 'badge'],
  ['/results', 'Today Results', 'activity'],
];

/* ───────────────────────── Shared UI ───────────────────────── */

const Dots = () => <span className="dots"><i /><i /><i /></span>;

const Spinner = ({ s = 56 }) => (
  <span className="spin" style={{ '--s': s + 'px' }}>
    {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--i': i }} />)}
  </span>
);

function Loader({ text = 'Loading' }) {
  return (
    <div className="card loader">
      <Spinner />
      <span className="loader-t">{text} <Dots /></span>
    </div>
  );
}

const Bar = ({ on }) => <div className={'bar' + (on ? ' on' : '')}><i /></div>;

function Badge({ tone = 'ok', children }) {
  return <span className={'badge ' + tone}>{children}</span>;
}

function IconBtn({ icon, tip, tone = '', onClick, disabled }) {
  const [pos, setPos] = useState(null);
  const show = e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: r.left + r.width / 2, y: r.top }); };
  const hide = () => setPos(null);
  return (
    <>
      <button type="button" className={'ico ' + tone} onClick={e => { hide(); onClick?.(e); }} disabled={disabled} aria-label={tip}
        onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
        <Icon n={icon} s={15} />
      </button>
      {tip && pos && createPortal(<span className="tip" style={{ left: pos.x, top: pos.y }}>{tip}</span>, document.body)}
    </>
  );
}

function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="field search">
      <Icon n="search" s={15} />
      <input className="inp" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
      {value && <button type="button" className="clr" onClick={() => onChange('')} aria-label="Clear"><Icon n="x" s={13} /></button>}
    </div>
  );
}

function Tabs({ value, onChange, items }) {
  return (
    <div className="tabs">
      {items.map(([k, l, c]) => (
        <button type="button" key={k} className={value === k ? 'on' : ''} onClick={() => onChange(k)}>
          {l}{c !== undefined && <span className="cnt">({c})</span>}
        </button>
      ))}
    </div>
  );
}

function Head({ icon, title, sub, tag, children }) {
  return (
    <div className="pagehead">
      <div className="ph-l">
        <div className="ph-ico"><Icon n={icon} s={20} /></div>
        <div>
          <h1>{title} {tag && <span className="tag">{tag}</span>}</h1>
          <p>{sub}</p>
        </div>
      </div>
      {children && <div className="ph-r">{children}</div>}
    </div>
  );
}

function Empty({ cols, text = 'Koi record nahi' }) {
  return (
    <tr className="empty-row"><td colSpan={cols}>
      <div className="empty"><span className="empty-ico"><Icon n="inbox" s={26} w={1.6} /></span>{text}</div>
    </td></tr>
  );
}

/* Pagination */
function usePaged(list, resetKey) {
  const [st, setSt] = useState({ k: resetKey, page: 1 });
  const [per, setPer] = useState(25);
  const pages = Math.max(1, Math.ceil(list.length / per));
  const page = Math.min(st.k === resetKey ? st.page : 1, pages);
  const setPage = n => setSt({ k: resetKey, page: n });
  return {
    rows: list.slice((page - 1) * per, page * per),
    pager: <Pager page={page} pages={pages} per={per} total={list.length} setPage={setPage} setPer={n => { setPer(n); setPage(1); }} />,
  };
}

function Pager({ page, pages, per, total, setPage, setPer }) {
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== '…') nums.push('…');
  }
  const from = total ? (page - 1) * per + 1 : 0;
  const to = Math.min(page * per, total);
  return (
    <div className="pager">
      <div className="pg-info">
        Rows per page
        <select className="pg-sel" value={per} onChange={e => setPer(+e.target.value)}>
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <span className="pg-range">{from}–{to} of {total}</span>
      </div>
      <div className="pg-btns">
        <button type="button" className="pg" disabled={page === 1} onClick={() => setPage(1)} aria-label="First"><Icon n="first" s={15} /></button>
        <button type="button" className="pg" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous"><Icon n="prev" s={15} /></button>
        {nums.map((n, i) => n === '…'
          ? <span key={'e' + i} className="pg-gap">…</span>
          : <button type="button" key={n} className={'pg' + (n === page ? ' on' : '')} onClick={() => setPage(n)}>{n}</button>)}
        <button type="button" className="pg" disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next"><Icon n="next" s={15} /></button>
        <button type="button" className="pg" disabled={page === pages} onClick={() => setPage(pages)} aria-label="Last"><Icon n="last" s={15} /></button>
      </div>
    </div>
  );
}

/* Drawer */
function Drawer({ open, onClose, title, sub, icon = 'plus', children }) {
  useEffect(() => {
    if (!open) return;
    const h = e => e.key === 'Escape' && onClose();
    addEventListener('keydown', h);
    return () => removeEventListener('keydown', h);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="drawer-bg" onMouseDown={onClose}>
      <aside className="drawer" onMouseDown={e => e.stopPropagation()}>
        <header className="drawer-head">
          <div className="ph-ico sm"><Icon n={icon} s={17} /></div>
          <div className="dh-t"><h3>{title}</h3>{sub && <p>{sub}</p>}</div>
          <IconBtn icon="x" tip="Close" onClick={onClose} />
        </header>
        {children}
      </aside>
    </div>,
    document.body,
  );
}

function DrawerForm({ onSubmit, busy, submitText = 'Save', err, children, onCancel }) {
  return (
    <form className="drawer-form" onSubmit={onSubmit}>
      <div className="drawer-body">{children}{err && <div className="err"><Icon n="alert" s={14} /> {err}</div>}</div>
      <div className="drawer-foot">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancel</button>
        <button className="btn" disabled={busy}>{busy ? <>Saving <Dots /></> : submitText}</button>
      </div>
    </form>
  );
}

/* Drawer-based prompt (replaces window.prompt) */
function usePrompt() {
  const [c, setC] = useState(null);
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const close = useCallback(() => setC(null), []);
  const ask = o => { setV(o.value ?? ''); setErr(''); setBusy(false); setC(o); };
  const submit = async e => {
    e.preventDefault();
    const m = c.validate?.(v);
    if (m) return setErr(m);
    setBusy(true);
    try { await c.onSubmit(v); setC(null); }
    catch (x) { setErr(x.message); }
    setBusy(false);
  };
  const node = (
    <Drawer open={!!c} onClose={close} title={c?.title} sub={c?.sub} icon={c?.icon}>
      {c && (
        <DrawerForm onSubmit={submit} busy={busy} err={err} onCancel={close} submitText={c.submitText}>
          <label>{c.label}</label>
          <input className="inp" autoFocus type={c.type || 'text'} placeholder={c.placeholder} value={v} onChange={e => setV(e.target.value)} />
          {c.hint && <p className="hint">{c.hint}</p>}
        </DrawerForm>
      )}
    </Drawer>
  );
  return [ask, node];
}

function useConfirm() {
  const [c, setC] = useState(null);
  const ask = (title, text, onYes, danger = true) => setC({ title, text, onYes, danger });
  const node = c && createPortal(
    <div className="modal-bg" onMouseDown={() => setC(null)}>
      <div className="modal" onMouseDown={e => e.stopPropagation()}>
        <div className={'modal-ico ' + (c.danger ? 'r' : 'g')}><Icon n={c.danger ? 'alert' : 'check'} s={22} /></div>
        <h3>{c.title}</h3>
        <p>{c.text}</p>
        <div className="row end">
          <button className="btn ghost" onClick={() => setC(null)}>Cancel</button>
          <button className={'btn ' + (c.danger ? 'r' : 'g')} onClick={() => { const f = c.onYes; setC(null); f && f(); }}>Confirm</button>
        </div>
      </div>
    </div>,
    document.body,
  );
  return [ask, node];
}

function useDebounced(v, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}

/* Material-style ripple on every .btn / .ico / .pg / .tabs button */
function useRipple() {
  useEffect(() => {
    const h = e => {
      const b = e.target.closest('.btn, .ico, .pg, .tabs button, .side a, .chip');
      if (!b || b.disabled) return;
      const r = b.getBoundingClientRect();
      const d = Math.max(r.width, r.height) * 2.2;
      const s = document.createElement('span');
      s.className = 'ripple';
      s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
      b.appendChild(s);
      setTimeout(() => s.remove(), 650);
    };
    addEventListener('pointerdown', h);
    return () => removeEventListener('pointerdown', h);
  }, []);
}

const initials = s => (s || '?').slice(0, 2).toUpperCase();

/* ───────────────────────── App shell ───────────────────────── */

export default function App() {
  const [me, setMe] = useState(null);
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [tick, setTick] = useState(new Date());
  const [nav, setNav] = useState(false);
  useRipple();

  useEffect(() => { const h = () => { setRoute(location.hash.slice(1) || '/'); setNav(false); }; addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  useEffect(() => { api.me().then(setMe).catch(() => setMe(false)); }, []);
  useEffect(() => { const i = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { document.title = 'Express Portal · ' + (NAV.find(n => n[0] === route)?.[1] || 'Dashboard'); }, [route]);

  if (me === null) return (
    <div className="login"><Mesh />
      <div className="box boot"><div className="big">E</div><Spinner s={46} /><p className="sub">Loading <Dots /></p></div>
    </div>
  );
  if (me === false) return <Login onDone={setMe} />;

  const Page = { '/': Dashboard, '/add': AddMember, '/masters': Masters, '/users': Users, '/deleted': Deleted, '/payments': Payments, '/paid': Paid, '/results': Results }[route] || Dashboard;
  const cur = NAV.find(n => n[0] === route) || NAV[0];

  return (
    <div className="shell">
      <Mesh />
      {nav && <div className="side-bg" onClick={() => setNav(false)} />}
      <aside className={'side' + (nav ? ' open' : '')}>
        <div className="brand">
          <div className="mark">E</div>
          <div><b>EXPRESS</b><small>PREMIUM TATKAL</small></div>
          <button className="ico side-x" onClick={() => setNav(false)} aria-label="Close menu"><Icon n="x" s={15} /></button>
        </div>
        <div className="nav-lbl">MENU</div>
        <nav>
          {NAV.map(([p, l, i]) => (
            <a key={p} href={'#' + p} className={route === p ? 'on' : ''}><span className="ni"><Icon n={i} s={17} /></span>{l}</a>
          ))}
        </nav>
        <div className="spacer" />
        <a className="dl" href="/api/download.php"><span className="ni"><Icon n="down" s={17} /></span>Download Express</a>
        <div className="me">
          <div className="av">{initials(me.username)}</div>
          <div className="me-t"><b>{me.username}</b><small>{me.role.replace('_', ' ')}</small></div>
          <IconBtn icon="out" tip="Logout" tone="d" onClick={async () => { await api.logout(); setMe(false); }} />
        </div>
      </aside>
      <main className="main">
        <header className="top">
          <button className="ico burger" onClick={() => setNav(true)} aria-label="Open menu"><Icon n="menu" s={17} /></button>
          <div className="crumb"><span>Express</span><Icon n="next" s={13} /><b>{cur[1]}</b></div>
          <div className="top-r">
            <div className="clock"><Icon n="clock" s={14} /><b>{tick.toLocaleTimeString('en-GB')}</b><small>{tick.toDateString()}</small></div>
            <div className="pill"><span className="pulse" /> Secure · Operational</div>
          </div>
        </header>
        <div className="page" key={route}>
          <Page me={me} />
        </div>
      </main>
    </div>
  );
}

const Mesh = () => <div className="mesh" aria-hidden="true"><i /><i /><i /><i /></div>;

function Login({ onDone }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [e, setE] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="login"><Mesh />
      <form className="box" onSubmit={async ev => {
        ev.preventDefault(); setBusy(true); setE('');
        try { await api.login(u, p); onDone(await api.me()); }
        catch (x) { setE(x.message); setBusy(false); }
      }}>
        <div className="big">E</div>
        <h1>Welcome back</h1>
        <p className="sub">Sign in to continue to Express Portal</p>
        <div className="field"><Icon n="user" s={16} /><input className="inp" placeholder="Username" value={u} onChange={e => setU(e.target.value)} autoComplete="username" /></div>
        <div className="field"><Icon n="lock" s={16} /><input className="inp" type="password" placeholder="Password" value={p} onChange={e => setP(e.target.value)} autoComplete="current-password" /></div>
        {e && <div className="err"><Icon n="alert" s={14} /> {e}</div>}
        <button className="btn lg" style={{ width: '100%' }} disabled={busy}>
          {busy ? <>Signing in <Dots /></> : 'Login'}
        </button>
      </form>
    </div>
  );
}

/* ───────────────────────── Pages ───────────────────────── */

const STATS = [
  ['Super Masters', 'super_masters', 'crown', 'violet'],
  ['Masters', 'masters', 'user', 'blue'],
  ['Admins', 'admins', 'shield', 'cyan'],
  ['Sellers', 'sellers', 'users', 'teal'],
  ['Total Keys', 'total_keys', 'key', 'indigo'],
  ['Active Keys', 'active_keys', 'bolt', 'green'],
  ['Today Paid', 'today_paid', 'cash', 'amber'],
  ['Total Paid', 'total_paid', 'wallet', 'pink'],
];

function Dashboard({ me }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.dash().then(setD).catch(() => setD({})); }, []);
  if (!d) return <Loader text="Dashboard load ho raha hai" />;
  return (
    <>
      <Head icon="dash" title="Dashboard" sub={`Welcome back, ${me.username} — here's what's happening today`} />
      {d.notice && <div className="notice"><span className="notice-ico"><Icon n="alert" s={17} /></span><div><b>महत्वपूर्ण सूचना:</b> {d.notice}</div></div>}
      <div className="grid">
        {STATS.map(([l, k, i, t], n) => (
          <div className={'stat ' + t} key={k} style={{ '--d': n * 45 + 'ms' }}>
            <div className="stat-ico"><Icon n={i} s={19} /></div>
            <div><b>{(d[k] ?? 0).toLocaleString?.('en-IN') ?? d[k]}</b><span>{l}</span></div>
          </div>
        ))}
      </div>
    </>
  );
}

function AddMember() {
  const blank = { username: '', password: '', role: 'seller', rate: 500 };
  const [f, setF] = useState(blank);
  const [msg, setMsg] = useState(null); const [busy, setBusy] = useState(false);
  return (
    <>
      <Head icon="add" title="Add New Member" sub="Create seller / admin / master" tag="NEW MEMBER" />
      <form className="card form" onSubmit={async e => {
        e.preventDefault(); setBusy(true);
        try { await api.addMaster(f); setMsg({ ok: true, t: 'Created: ' + f.username }); setF(blank); }
        catch (x) { setMsg({ ok: false, t: x.message }); }
        setBusy(false);
      }}>
        <div className="form-grid">
          <div><label>Member name</label><div className="field"><Icon n="user" s={15} /><input className="inp" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} /></div></div>
          <div><label>Role</label>
            <select className="inp" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
              {['super_master', 'master', 'admin', 'seller'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div><label>Password</label><div className="field"><Icon n="lock" s={15} /><input className="inp" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} /></div></div>
          <div><label>Per ID rate</label><div className="field"><Icon n="rupee" s={15} /><input className="inp" type="number" value={f.rate} onChange={e => setF({ ...f, rate: e.target.value })} /></div></div>
        </div>
        <div className="row" style={{ marginTop: 20 }}>
          <button className="btn" disabled={busy}><Icon n="plus" s={16} />{busy ? <>Creating <Dots /></> : 'Add Member'}</button>
          {msg && <span className={'flash ' + (msg.ok ? 'ok' : 'no')}><Icon n={msg.ok ? 'check' : 'alert'} s={14} /> {msg.t}</span>}
        </div>
      </form>
    </>
  );
}

function Masters() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [ask, modal] = useConfirm();
  const [prompt, drawer] = usePrompt();
  const reload = useCallback(() => api.masters().then(setRows).catch(() => setRows([])).finally(() => setLoading(false)), []);
  useEffect(() => { reload(); }, [reload]);

  const act = async (id, a) => { await api.masterAct(id, a); await reload(); };
  const active = rows.filter(r => r.status === 'active').length;
  const list = rows
    .filter(r => tab === 'all' || (tab === 'active' ? r.status === 'active' : r.status !== 'active'))
    .filter(r => (r.username || '').toLowerCase().includes(q.toLowerCase()));
  const { rows: pageRows, pager } = usePaged(list, tab + q);

  if (loading) return <Loader text="Members load ho rahe hain" />;
  return (
    <>
      <Head icon="crown" title="Master List" sub="Super master management">
        <a className="btn" href="#/add"><Icon n="plus" s={16} /> ADD MEMBER</a>
      </Head>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={[['all', 'All', rows.length], ['active', 'Active', active], ['blocked', 'Blocked', rows.length - active]]} />
        <SearchBox value={q} onChange={setQ} placeholder="Search member…" />
      </div>
      <div className="card tcard">
        <div className="tbl-wrap">
          <table>
            <thead><tr>
              <th>Member</th><th>Password</th><th>Admin</th><th className="num">Due</th><th className="num">Today Sold</th>
              <th className="num">Total Sold</th><th className="num">Active Sold</th><th className="num">Weekly</th><th className="num">Today Reward</th><th>Status</th><th>Action</th>
            </tr></thead>
            <tbody>
              {list.length === 0 && <Empty cols={11} />}
              {pageRows.map(r => (
                <tr key={r.id}>
                  <td><div className="cell-main"><b>{r.username}</b><small>ID - {r.id} <Badge tone="info">{r.role.replace('_', ' ')}</Badge></small></div></td>
                  <td className="mono">{r.pass_plain || '-'}</td>
                  <td>{r.admin}</td>
                  <td className="num"><span className="money no">₹{r.payment_due}</span></td>
                  <td className="num">{r.today_sold}</td>
                  <td className="num">{r.total_sold}</td>
                  <td className="num">{r.active_sold}</td>
                  <td className="num">{r.weekly_sale}</td>
                  <td className="num"><span className="money ok">₹{r.today_reward}</span></td>
                  <td><Badge tone={r.status === 'active' ? 'ok' : 'no'}>{r.status}</Badge></td>
                  <td><div className="acts">
                    <IconBtn icon="pass" tip="Change Password" onClick={() => prompt({
                      title: 'Change password', sub: r.username, icon: 'pass', label: 'New password', placeholder: 'Min 4 characters',
                      validate: v => v.length < 4 && 'Password kam se kam 4 characters ka hona chahiye',
                      onSubmit: async v => { await api.setPass(r.id, v); await reload(); },
                    })} />
                    <IconBtn icon="rupee" tip="Add Payment" tone="g" onClick={() => prompt({
                      title: 'Add payment', sub: r.username, icon: 'rupee', label: 'Amount (₹)', type: 'number', placeholder: '0',
                      validate: v => !v && 'Amount daalo',
                      onSubmit: async v => { await api.addPay({ amount: v, remark: 'Payment added', target_id: r.id }); await reload(); },
                    })} />
                    <IconBtn icon={r.status === 'active' ? 'block' : 'check'} tip={r.status === 'active' ? 'Block' : 'Activate'} tone={r.status === 'active' ? 'w' : 'g'}
                      onClick={() => ask(r.status === 'active' ? 'Block member?' : 'Activate member?',
                        `${r.username} ka access ${r.status === 'active' ? 'band' : 'chalu'} ho jaayega.`,
                        () => act(r.id, r.status === 'active' ? 'block' : 'activate'), r.status === 'active')} />
                    <IconBtn icon="trash" tip="Delete" tone="d" onClick={() => ask('Delete member?', `${r.username} permanently delete ho jaayega.`, () => act(r.id, 'delete'))} />
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
      {modal}{drawer}
    </>
  );
}

function Users() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true); const [doneQ, setDoneQ] = useState(null);
  const [tab, setTab] = useState('all');
  const [gen, setGen] = useState(false);
  const [f, setF] = useState({ count: 1, days: 30, prefix: 'EXP' });
  const [genBusy, setGenBusy] = useState(false); const [genErr, setGenErr] = useState('');
  const [ask, modal] = useConfirm();
  const [prompt, drawer] = usePrompt();
  const dq = useDebounced(q);
  const fetching = doneQ !== dq;
  const reload = useCallback(() => api.users(dq).then(setRows).catch(() => setRows([])).finally(() => { setLoading(false); setDoneQ(dq); }), [dq]);
  useEffect(() => { reload(); }, [reload]);
  const act = async (id, a, extra = '') => { await api.userAct(id, a, extra); await reload(); };
  const closeGen = useCallback(() => setGen(false), []);

  const cnt = useMemo(() => ({
    active: rows.filter(r => r.active).length,
    paid: rows.filter(r => r.paid).length,
  }), [rows]);
  const list = rows.filter(r => ({ all: true, active: !!r.active, inactive: !r.active, paid: !!r.paid, unpaid: !r.paid })[tab]);
  const { rows: pageRows, pager } = usePaged(list, tab + dq);

  if (loading) return <Loader text="Users load ho rahe hain" />;
  return (
    <>
      <Head icon="users" title="User List" sub="All software key management">
        <button className="btn" onClick={() => { setGenErr(''); setGen(true); }}><Icon n="key" s={16} /> GENERATE KEYS</button>
      </Head>
      <div className="toolbar">
        <Tabs value={tab} onChange={setTab} items={[
          ['all', 'All', rows.length], ['active', 'Active', cnt.active], ['inactive', 'Inactive', rows.length - cnt.active],
          ['paid', 'Paid', cnt.paid], ['unpaid', 'Unpaid', rows.length - cnt.paid],
        ]} />
      </div>
      <div className="toolbar">
        <SearchBox value={q} onChange={setQ} placeholder="Search User / Key / MAC ID…" />
        <div className="row tb-r">
          <button className="btn sm outline r" onClick={() => ask('Delete all unpaid keys?', 'Saari unpaid keys delete ho jaayengi.', () => api.bulk('deleteunpaid').then(reload))}><Icon n="trash" s={14} /> Delete All Unpaid</button>
          <button className="btn sm outline" onClick={() => ask('Deactivate all keys?', 'Saare keys band ho jaayenge.', () => api.bulk('deactivateall').then(reload))}><Icon n="power" s={14} /> Deactivate All</button>
          <button className="btn sm outline g" onClick={() => ask('Activate all keys?', 'Saare keys chalu ho jaayenge.', () => api.bulk('activateall').then(reload), false)}><Icon n="bolt" s={14} /> Activate All</button>
          <button className="btn sm outline" onClick={() => ask('Reset all MAC?', 'Saare devices unbind ho jaayenge.', () => api.bulk('resetall').then(reload))}><Icon n="reset" s={14} /> Reset All</button>
        </div>
      </div>
      <div className="card tcard">
        <Bar on={fetching} />
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Key</th><th>MAC ID</th><th className="num">Validity</th><th>Active</th><th>IP</th><th>Paid</th><th>Action</th></tr></thead>
            <tbody>
              {list.length === 0 && <Empty cols={7} />}
              {pageRows.map(r => (
                <tr key={r.id}>
                  <td><div className="cell-main"><b className="key">{r.keycode}</b><small>ID - {r.id}</small></div></td>
                  <td className="mono">{r.mac || '-'}</td>
                  <td className="num">{r.days_left}</td>
                  <td><Badge tone={r.active ? 'ok' : 'no'}>{r.active ? 'Active' : 'Inactive'}</Badge></td>
                  <td className="mono">{r.last_ip || 0}</td>
                  <td><Badge tone={r.paid ? 'ok' : 'warn'}>{r.paid ? 'Paid' : 'Unpaid'}</Badge></td>
                  <td><div className="acts">
                    <IconBtn icon={r.active ? 'power' : 'check'} tip={r.active ? 'Deactivate' : 'Activate'} tone={r.active ? 'w' : 'g'}
                      onClick={() => ask(r.active ? 'Deactivate key?' : 'Activate key?',
                        `${r.keycode} ${r.active ? 'band' : 'chalu'} ho jaayegi.`,
                        () => act(r.id, r.active ? 'deactivate' : 'activate'), !!r.active)} />
                    <IconBtn icon="reset" tip="Reset MAC" onClick={() => ask('Reset MAC?', 'Is key ka device unbind hoga, naye PC par login kar sakte hain.', () => act(r.id, 'resetmac'), false)} />
                    <IconBtn icon="calplus" tip="Add Days" onClick={() => prompt({
                      title: 'Add days', sub: r.keycode, icon: 'calplus', label: 'Days', type: 'number', placeholder: '30',
                      validate: v => !v && 'Days daalo',
                      onSubmit: v => act(r.id, 'adddays', '&days=' + encodeURIComponent(v)),
                    })} />
                    <IconBtn icon="rupee" tip="Mark Paid" tone="g" onClick={() => ask('Mark as paid?', 'Ye key paid mark ho jaayegi.', () => act(r.id, 'paid'), false)} />
                    <IconBtn icon="trash" tip="Delete" tone="d" onClick={() => ask('Delete key?', `${r.keycode} delete ho jaayegi.`, () => act(r.id, 'delete'))} />
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>

      <Drawer open={gen} onClose={closeGen} title="Generate keys" sub="Naye software keys banaiye" icon="key">
        <DrawerForm busy={genBusy} err={genErr} submitText="Generate" onCancel={closeGen} onSubmit={async e => {
          e.preventDefault(); setGenBusy(true); setGenErr('');
          try { await api.addUsers(f); await reload(); setGen(false); }
          catch (x) { setGenErr(x.message); }
          setGenBusy(false);
        }}>
          <label>Count</label><input className="inp" type="number" value={f.count} onChange={e => setF({ ...f, count: e.target.value })} />
          <label>Days</label><input className="inp" type="number" value={f.days} onChange={e => setF({ ...f, days: e.target.value })} />
          <label>Prefix</label><input className="inp" value={f.prefix} onChange={e => setF({ ...f, prefix: e.target.value })} />
          <p className="hint">{f.count || 0} key(s) banengi, {f.days || 0} din ki validity ke saath.</p>
        </DrawerForm>
      </Drawer>
      {modal}{drawer}
    </>
  );
}

function Deleted() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true); const [doneQ, setDoneQ] = useState(null);
  const dq = useDebounced(q);
  const fetching = doneQ !== dq;
  useEffect(() => {
    api.deleted(dq).then(setRows).catch(() => setRows([])).finally(() => { setLoading(false); setDoneQ(dq); });
  }, [dq]);
  const { rows: pageRows, pager } = usePaged(rows, dq);
  if (loading) return <Loader text="Deleted users load ho rahe hain" />;
  return (
    <>
      <Head icon="trash" title="Deleted User List" sub="Deleted software key history" tag={`TOTAL ${rows.length}`} />
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search Deleted User…" /></div>
      <div className="card tcard">
        <Bar on={fetching} />
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Key</th><th className="num">Days</th><th>Seller</th><th>Admin</th><th>Master</th><th>Super Master</th><th>Paid</th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={7} />}
              {pageRows.map(r => (
                <tr key={r.id}>
                  <td><b className="key">{r.keycode}</b></td><td className="num">{r.days_left}</td>
                  <td>{r.seller || 'N/A'}</td><td>{r.admin || 'N/A'}</td><td>{r.master || 'N/A'}</td><td>{r.super_name || 'N/A'}</td>
                  <td><Badge tone={r.paid ? 'ok' : 'warn'}>{r.paid ? 'Paid' : 'Unpaid'}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
    </>
  );
}

function Payments() {
  const [rows, setRows] = useState([]); const [tot, setTot] = useState({ records: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [f, setF] = useState({ amount: '', remark: '', target_id: '' });
  const reload = useCallback(() => api.payments().then(d => { setRows(Array.isArray(d.rows) ? d.rows : []); setTot({ records: d.records || 0, total: d.total || 0 }); setLoading(false); }).catch(() => { setRows([]); setLoading(false); }), []);
  useEffect(() => { reload(); }, [reload]);
  const close = useCallback(() => setOpen(false), []);
  const { rows: pageRows, pager } = usePaged(rows, '');

  if (loading) return <Loader text="Payments load ho rahe hain" />;
  return (
    <>
      <Head icon="rupee" title="Payment History" sub="Complete super master payment transaction record">
        <button className="btn" onClick={() => { setErr(''); setOpen(true); }}><Icon n="plus" s={16} /> ADD PAYMENT</button>
      </Head>
      <div className="grid two">
        <div className="stat indigo"><div className="stat-ico"><Icon n="ticket" s={19} /></div><div><b>{tot.records}</b><span>Total records</span></div></div>
        <div className="stat green"><div className="stat-ico"><Icon n="wallet" s={19} /></div><div><b>₹{Number(tot.total).toLocaleString('en-IN')}</b><span>Total amount</span></div></div>
      </div>
      <div className="card tcard">
        <div className="tbl-wrap">
          <table>
            <thead><tr><th className="num">Amount</th><th>Remark</th><th>Super Master</th><th>Date</th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={4} />}
              {pageRows.map(r => (
                <tr key={r.id}><td className="num"><span className="money ok">₹{r.amount}</span></td><td>{r.remark}</td><td>{r.target || '-'}</td><td className="muted">{r.created_at}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
      <Drawer open={open} onClose={close} title="Add payment" sub="Naya payment record" icon="rupee">
        <DrawerForm busy={busy} err={err} onCancel={close} onSubmit={async e => {
          e.preventDefault(); setBusy(true); setErr('');
          try { await api.addPay(f); setF({ amount: '', remark: '', target_id: '' }); await reload(); setOpen(false); }
          catch (x) { setErr(x.message); }
          setBusy(false);
        }}>
          <label>Amount (₹)</label><input className="inp" autoFocus type="number" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
          <label>Target ID</label><input className="inp" value={f.target_id} onChange={e => setF({ ...f, target_id: e.target.value })} />
          <label>Remark</label><textarea className="inp" rows={3} value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} />
        </DrawerForm>
      </Drawer>
    </>
  );
}

function Paid() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true); const [doneQ, setDoneQ] = useState(null);
  const dq = useDebounced(q);
  const fetching = doneQ !== dq;
  useEffect(() => {
    api.paid(dq).then(setRows).catch(() => setRows([])).finally(() => { setLoading(false); setDoneQ(dq); });
  }, [dq]);
  const { rows: pageRows, pager } = usePaged(rows, dq);
  if (loading) return <Loader text="Paid history load ho rahi hai" />;
  return (
    <>
      <Head icon="badge" title="Paid History" sub="Complete paid key history" tag={`TOTAL ${rows.length}`} />
      <div className="toolbar"><SearchBox value={q} onChange={setQ} placeholder="Search Paid History…" /></div>
      <div className="card tcard">
        <Bar on={fetching} />
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Key</th><th>Master</th><th>Super Master</th><th>Date</th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={4} />}
              {pageRows.map(r => (
                <tr key={r.id}><td><b className="key">{r.keycode}</b></td><td>{r.master || '-'}</td><td>{r.super_name || '-'}</td><td className="muted">{r.created_at}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
    </>
  );
}

const ST_CLASS = s => {
  const t = (s || '').toLowerCase();
  if (t.includes('success') || (t.includes('booked') && !t.includes('not'))) return 'ok';
  if (t.includes('not booked')) return 'warn';
  return 'no';
};

function Results() {
  const today = new Date().toISOString().slice(0, 10);
  const [f, setF] = useState({ from: today, to: today, q: '', status: '', gateway: '' });
  const [d, setD] = useState({ rows: [], total: 0, success_count: 0 });
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setBusy(true);
    try { setD(await api.results(f)); } catch { setD({ rows: [], total: 0, success_count: 0 }); }
    setBusy(false);
  };
  // initial fetch (no synchronous setState inside the effect)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { api.results(f).then(setD).catch(() => {}).finally(() => setLoading(false)); }, []);
  const rows = Array.isArray(d.rows) ? d.rows : [];
  const { rows: pageRows, pager } = usePaged(rows, d);

  const csv = () => {
    const head = ['Time', 'Key', 'Train No', 'Route', 'Gateway', 'PNR Time', 'Log', 'Status'];
    const body = rows.map(r => [r.created_at, r.keycode, r.train_no, r.src_dest, r.gateway, r.pnr_time, r.log_text, r.status]);
    const txt = [head, ...body].map(a => a.map(x => `"${(x ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const u = URL.createObjectURL(new Blob([txt], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = u; a.download = `results-${f.from}-to-${f.to}.csv`; a.click();
    URL.revokeObjectURL(u);
  };

  if (loading) return <Loader text="Results load ho rahe hain" />;
  return (
    <>
      <Head icon="activity" title="Booking Dashboard" sub="Live activity of every user">
        <IconBtn icon="csv" tip="Download CSV" onClick={csv} />
        <IconBtn icon="refresh" tip="Refresh" onClick={load} disabled={busy} />
      </Head>
      <div className="grid three">
        <div className="stat indigo"><div className="stat-ico"><Icon n="ticket" s={19} /></div><div><b>{d.total}</b><span>Total records</span></div></div>
        <div className="stat green"><div className="stat-ico"><Icon n="check" s={19} /></div><div><b>{d.success_count}</b><span>Success</span></div></div>
        <div className="stat pink"><div className="stat-ico"><Icon n="alert" s={19} /></div><div><b>{Math.max(0, (d.total || 0) - (d.success_count || 0))}</b><span>Other</span></div></div>
      </div>
      <form className="card filters" onSubmit={e => { e.preventDefault(); load(); }}>
        <div><label>From</label><input className="inp" type="date" value={f.from} onChange={e => setF({ ...f, from: e.target.value })} /></div>
        <div><label>To</label><input className="inp" type="date" value={f.to} onChange={e => setF({ ...f, to: e.target.value })} /></div>
        <div className="grow"><label>Search</label><div className="field"><Icon n="search" s={15} /><input className="inp" placeholder="Key / Train / Route" value={f.q} onChange={e => setF({ ...f, q: e.target.value })} /></div></div>
        <div><label>Status</label>
          <select className="inp" value={f.status} onChange={e => setF({ ...f, status: e.target.value })}>
            <option value="">All Status</option>
            <option value="Success">Success</option>
            <option value="Booked">Booked</option>
            <option value="Not Booked">Not Booked</option>
            <option value="Payment Declined">Payment Declined</option>
            <option value="Fail">Fail</option>
          </select>
        </div>
        <div><label>Gateway</label><input className="inp" placeholder="Gateway" value={f.gateway} onChange={e => setF({ ...f, gateway: e.target.value })} /></div>
        <div className="f-btn"><button className="btn" disabled={busy}>{busy ? <>Applying <Dots /></> : <><Icon n="search" s={15} /> Apply</>}</button></div>
      </form>
      <div className="card tcard">
        <Bar on={busy} />
        <div className="tbl-wrap">
          <table>
            <thead><tr><th>Key</th><th>Train No</th><th>Route</th><th>Gateway</th><th>PNR Time</th><th>Log</th><th>Image</th><th>Status</th><th>Time</th></tr></thead>
            <tbody>
              {rows.length === 0 && <Empty cols={9} />}
              {pageRows.map(r => (
                <tr key={r.id}>
                  <td><b className="key">{r.keycode || '-'}</b></td>
                  <td>{r.train_no || '-'}</td>
                  <td>{r.src_dest || '-'}</td>
                  <td>{r.gateway || '-'}</td>
                  <td>{r.pnr_time || '-'}</td>
                  <td className="log">{r.log_text || '-'}</td>
                  <td>{r.image ? <a href={`/api/result/${r.image}`} target="_blank" rel="noreferrer"><img className="thumb" src={`/api/result/${r.image}`} alt="" /></a> : '-'}</td>
                  <td><Badge tone={ST_CLASS(r.status)}>{r.status || '-'}</Badge></td>
                  <td className="mono">{(r.created_at || '').slice(11, 19)}<br /><small className="muted">{(r.created_at || '').slice(0, 10)}</small></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pager}
      </div>
    </>
  );
}
