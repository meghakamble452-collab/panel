import { useEffect, useState, useCallback } from 'react';
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
  ['/paid', 'Paid History', 'check'],
];

const Dots = () => <span className="dots"><i /><i /><i /></span>;

export default function App() {
  const [me, setMe] = useState(null);
  const [route, setRoute] = useState(location.hash.slice(1) || '/');
  const [tick, setTick] = useState(new Date());

  useEffect(() => { const h = () => setRoute(location.hash.slice(1) || '/'); addEventListener('hashchange', h); return () => removeEventListener('hashchange', h); }, []);
  useEffect(() => { api.me().then(setMe).catch(() => setMe(false)); }, []);
  useEffect(() => { const i = setInterval(() => setTick(new Date()), 1000); return () => clearInterval(i); }, []);
  useEffect(() => { document.title = 'Express Portal · ' + (NAV.find(n => n[0] === route)?.[1] || 'Dashboard'); }, [route]);

  if (me === null) return <div className="login"><div className="box"><span className="big">E</span><p><Dots /></p></div></div>;
  if (me === false) return <Login onDone={setMe} />;

  const Page = { '/': Dashboard, '/add': AddMember, '/masters': Masters, '/users': Users, '/deleted': Deleted, '/payments': Payments, '/paid': Paid }[route] || Dashboard;

  return (
    <div className="shell">
      <aside className="side">
        <div className="brand">
          <div className="mark">E</div>
          <div><b>EXPRESS</b><small>PREMIUM TATKAL</small></div>
        </div>
        {NAV.map(([p, l, i]) => (
          <a key={p} href={'#' + p} className={route === p ? 'on' : ''}><Icon n={i} /> {l}</a>
        ))}
        <div className="spacer" />
        <a className="dl" href="/api/download.php"><Icon n="down" /> Download Express</a>
        <a href="#logout" onClick={async e => { e.preventDefault(); await api.logout(); setMe(false); }}><Icon n="out" /> Logout</a>
      </aside>
      <main className="main">
        <div className="top">
          <div className="who">Welcome, <b>{me.username}</b> · {me.role.replace('_', ' ')}</div>
          <div className="clock">{tick.toLocaleTimeString('en-GB')}<small>{tick.toDateString()}</small></div>
          <div className="pill">◆ Secure · Operational</div>
        </div>
        <Page me={me} />
      </main>
    </div>
  );
}

function Login({ onDone }) {
  const [u, setU] = useState(''); const [p, setP] = useState('');
  const [e, setE] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <div className="login">
      <form className="box" onSubmit={async ev => {
        ev.preventDefault(); setBusy(true); setE('');
        try { await api.login(u, p); onDone(await api.me()); }
        catch (x) { setE(x.message); setBusy(false); }
      }}>
        <div className="big">E</div>
        <h1>Welcome back</h1>
        <p className="sub">SIGN IN TO CONTINUE</p>
        <input className="inp" placeholder="USERNAME" value={u} onChange={e => setU(e.target.value)} style={{ marginBottom: 10 }} />
        <input className="inp" type="password" placeholder="PASSWORD" value={p} onChange={e => setP(e.target.value)} style={{ marginBottom: 14 }} />
        {e && <div className="err">{e}</div>}
        <button className="btn a" style={{ width: '100%', padding: 11 }} disabled={busy}>
          {busy ? <>Signing in <Dots /></> : 'Login'}
        </button>
      </form>
    </div>
  );
}

function Head({ icon, title, sub, tag }) {
  return (
    <div className="pagehead">
      <div className="row"><Icon n={icon} s={19} /><div><h2>{title}</h2><p>{sub}</p></div></div>
      {tag && <span className="tag">{tag}</span>}
    </div>
  );
}

function Dashboard({ me }) {
  const [d, setD] = useState(null);
  useEffect(() => { api.dash().then(setD).catch(() => setD({})); }, []);
  if (!d) return <div className="card">Loading <Dots /></div>;
  const c = [['Super Masters', d.super_masters], ['Masters', d.masters], ['Admins', d.admins], ['Sellers', d.sellers], ['Total Keys', d.total_keys], ['Active Keys', d.active_keys], ['Today Paid', d.today_paid], ['Total Paid', d.total_paid]];
  return (
    <>
      <Head icon="dash" title="Dashboard" sub={`Welcome, ${me.username}`} tag="OVERVIEW" />
      {d.notice && <div className="notice">⚠️ <b>महत्वपूर्ण सूचना:</b> {d.notice}</div>}
      <div className="grid">{c.map(([l, v]) => <div className="stat" key={l}><b>{v ?? 0}</b><span>{l}</span></div>)}</div>
    </>
  );
}

function AddMember() {
  const [f, setF] = useState({ username: '', password: '', role: 'seller', rate: 500 });
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  return (
    <>
      <Head icon="add" title="Add New Member" sub="Create seller / admin / master" tag="NEW MEMBER" />
      <div className="card" style={{ maxWidth: 640 }}>
        <label>MEMBER NAME</label><input className="inp" value={f.username} onChange={e => setF({ ...f, username: e.target.value })} />
        <label>ROLE</label>
        <select className="inp" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>
          {['super_master', 'master', 'admin', 'seller'].map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
        <label>PASSWORD</label><input className="inp" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        <label>PER ID RATE</label><input className="inp" type="number" value={f.rate} onChange={e => setF({ ...f, rate: e.target.value })} />
        <button className="btn" style={{ marginTop: 16 }} disabled={busy} onClick={async () => {
          setBusy(true);
          try { await api.addMaster(f); setMsg('✓ Created: ' + f.username); setF({ username: '', password: '', role: 'seller', rate: 500 }); }
          catch (x) { setMsg('✗ ' + x.message); }
          setBusy(false);
        }}>{busy ? <Dots /> : 'Add Member'}</button>
        {msg && <p style={{ fontSize: 12.5 }}>{msg}</p>}
      </div>
    </>
  );
}

function Masters() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState(''); const [load, setLoad] = useState(false);
  const reload = useCallback(() => api.masters().then(setRows).catch(() => setRows([])), []);
  useEffect(() => { reload(); }, [reload]);
  const act = async (id, a) => { setLoad(true); await api.masterAct(id, a); await reload(); setLoad(false); };
  const list = rows.filter(r => (r.username || '').toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <Head icon="crown" title="Master List" sub="Super master management" tag="SUPER MASTER LIST" />
      <div className="card">
        <input className="inp" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300, marginBottom: 12 }} />
        <table>
          <thead><tr><th>Username</th><th>Role</th><th>Due</th><th>Sold</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan="6" className="empty">Koi record nahi</td></tr>}
            {list.map(r => (
              <tr key={r.id}>
                <td><b>{r.username}</b></td><td>{r.role.replace('_', ' ')}</td>
                <td><span className="badge no">₹{r.payment_due}</span></td><td>{r.total_sold}</td>
                <td><span className={'badge ' + (r.status === 'active' ? 'ok' : 'no')}>{r.status}</span></td>
                <td className="row">
                  <button className="ico" data-tip="View" onClick={() => alert(`User: ${r.username}\nRole: ${r.role}\nDue: ₹${r.payment_due}`)}><Icon n="eye" /></button>
                  <button className="ico" data-tip="Add Payment" onClick={async () => {
                    const a = prompt('Amount'); if (!a) return;
                    await api.addPay({ amount: a, remark: 'Payment added', target_id: r.id }); reload();
                  }}><Icon n="rupee" /></button>
                  <button className="ico" data-tip="Block" onClick={() => act(r.id, 'block')}><Icon n="power" /></button>
                  <button className="ico g" data-tip="Activate" onClick={() => act(r.id, 'activate')}><Icon n="check" /></button>
                  <button className="ico d" data-tip="Delete" onClick={() => confirm('Delete?') && act(r.id, 'delete')}><Icon n="trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Users() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  const [f, setF] = useState({ count: 1, days: 30, prefix: 'EXP' });
  const reload = useCallback(() => api.users(q).then(setRows).catch(() => setRows([])), [q]);
  useEffect(() => { reload(); }, [reload]);
  const act = async (id, a, extra = '') => { await api.userAct(id, a, extra); reload(); };
  return (
    <>
      <Head icon="users" title="User List" sub="All software key management" tag="ALL USER KEYS" />
      <div className="card">
        <h3>Generate Keys</h3>
        <div className="row">
          <input className="inp" style={{ maxWidth: 100 }} type="number" value={f.count} onChange={e => setF({ ...f, count: e.target.value })} placeholder="Count" />
          <input className="inp" style={{ maxWidth: 100 }} type="number" value={f.days} onChange={e => setF({ ...f, days: e.target.value })} placeholder="Days" />
          <input className="inp" style={{ maxWidth: 140 }} value={f.prefix} onChange={e => setF({ ...f, prefix: e.target.value })} placeholder="Prefix" />
          <button className="btn a" onClick={async () => { await api.addUsers(f); reload(); }}>Generate</button>
        </div>
      </div>
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <input className="inp" placeholder="Search User / Key / MAC ID…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 320 }} />
          <div style={{ marginLeft: 'auto' }} className="row">
            <button className="btn r" onClick={() => confirm('Delete all unpaid keys?') && api.bulk('deleteunpaid').then(reload)}>Delete All Unpaid</button>
            <button className="btn ghost" onClick={() => confirm('Deactivate all keys?') && api.bulk('deactivateall').then(reload)}>Deactivate All</button>
            <button className="btn g" onClick={() => api.bulk('activateall').then(reload)}>Activate All</button>
            <button className="btn ghost" onClick={() => api.bulk('resetall').then(reload)}>Reset All</button>
          </div>
        </div>
        <table>
          <thead><tr><th>Key</th><th>MAC ID</th><th>Validity</th><th>Active</th><th>IP</th><th>Paid</th><th>Action</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="empty">Koi record nahi</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td><b>{r.keycode}</b></td><td className="mono">{r.mac || '-'}</td><td>{r.days_left}</td>
                <td><span className={'badge ' + (r.active ? 'ok' : 'no')}>{r.active ? 'Yes' : 'No'}</span></td>
                <td>{r.last_ip || 0}</td>
                <td><span className={'badge ' + (r.paid ? 'ok' : 'no')}>{r.paid ? 'Yes' : 'No'}</span></td>
                <td className="row">
                  <button className="ico d" data-tip="Deactivate" onClick={() => act(r.id, 'deactivate')}><Icon n="power" /></button>
                  <button className="ico" data-tip="Reset MAC" onClick={() => act(r.id, 'resetmac')}><Icon n="reset" /></button>
                  <button className="ico" data-tip="Add Days" onClick={() => { const d = prompt('Days'); if (d) act(r.id, 'adddays', '&days=' + d); }}><Icon n="add" /></button>
                  <button className="ico g" data-tip="Mark Paid" onClick={() => act(r.id, 'paid')}><Icon n="rupee" /></button>
                  <button className="ico d" data-tip="Delete" onClick={() => confirm('Delete key?') && act(r.id, 'delete')}><Icon n="trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Deleted() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  useEffect(() => { api.deleted(q).then(setRows).catch(() => setRows([])); }, [q]);
  return (
    <>
      <Head icon="trash" title="Deleted User List" sub="Deleted software key history" tag={`TOTAL ${rows.length}`} />
      <div className="card">
        <input className="inp" placeholder="Search Deleted User…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300, marginBottom: 12 }} />
        <table>
          <thead><tr><th>Key</th><th>Days</th><th>Seller</th><th>Admin</th><th>Master</th><th>Super Master</th><th>Paid</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="7" className="empty">Koi record nahi</td></tr>}
            {rows.map(r => (
              <tr key={r.id}>
                <td><b>{r.keycode}</b></td><td>{r.days_left}</td>
                <td>{r.seller || 'N/A'}</td><td>{r.admin || 'N/A'}</td><td>{r.master || 'N/A'}</td><td>{r.super_name || 'N/A'}</td>
                <td><span className={'badge ' + (r.paid ? 'ok' : 'no')}>{r.paid ? 'PAID' : 'UNPAID'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Payments() {
  const [rows, setRows] = useState([]); const [tot, setTot] = useState({ records: 0, total: 0 });
  const [f, setF] = useState({ amount: '', remark: '', target_id: '' });
  const reload = useCallback(() => api.payments().then(d => { setRows(Array.isArray(d.rows) ? d.rows : []); setTot({ records: d.records || 0, total: d.total || 0 }); }).catch(() => setRows([])), []);
  useEffect(() => { reload(); }, [reload]);
  return (
    <>
      <Head icon="rupee" title="Super Master Payment History" sub="Complete payment transaction record" tag="PAYMENT RECORDS" />
      <div className="card">
        <div className="row">
          <input className="inp" style={{ maxWidth: 130 }} placeholder="Amount" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} />
          <input className="inp" style={{ maxWidth: 130 }} placeholder="Target ID" value={f.target_id} onChange={e => setF({ ...f, target_id: e.target.value })} />
          <input className="inp" placeholder="Remark" value={f.remark} onChange={e => setF({ ...f, remark: e.target.value })} />
          <button className="btn" onClick={async () => { await api.addPay(f); setF({ amount: '', remark: '', target_id: '' }); reload(); }}>Save</button>
          <div style={{ marginLeft: 'auto' }} className="row">
            <span className="tag">TOTAL {tot.records}</span>
            <span className="tag">₹{tot.total}</span>
          </div>
        </div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Amount</th><th>Remark</th><th>Super Master</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="4" className="empty">Koi record nahi</td></tr>}
            {rows.map(r => (
              <tr key={r.id}><td><span className="badge ok">₹{r.amount}</span></td><td>{r.remark}</td><td>{r.target || '-'}</td><td>{r.created_at}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Paid() {
  const [rows, setRows] = useState([]); const [q, setQ] = useState('');
  useEffect(() => { api.paid(q).then(setRows).catch(() => setRows([])); }, [q]);
  return (
    <>
      <Head icon="check" title="Paid History" sub="Complete paid key history" tag={`TOTAL ${rows.length}`} />
      <div className="card">
        <input className="inp" placeholder="Search Paid History…" value={q} onChange={e => setQ(e.target.value)} style={{ maxWidth: 300, marginBottom: 12 }} />
        <table>
          <thead><tr><th>Key</th><th>Master</th><th>Super Master</th><th>Date</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan="4" className="empty">Koi record nahi</td></tr>}
            {rows.map(r => (
              <tr key={r.id}><td><b>{r.keycode}</b></td><td>{r.master || '-'}</td><td>{r.super_name || '-'}</td><td>{r.created_at}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}