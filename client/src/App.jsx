import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Box, CalendarDays, Check,
  ChevronDown, ChevronLeft, ChevronRight, CircleAlert, Clock3, Filter,
  LayoutDashboard, LoaderCircle, MapPin, Package, Plus, RefreshCw,
  Search, Truck, Utensils, X
} from "lucide-react";

const API = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const STATUSES = ["preparing", "picked_up", "in_transit", "delivered"];
const STATUS_LABELS = {
  preparing: "Preparing",
  picked_up: "Picked up",
  in_transit: "In transit",
  delivered: "Delivered"
};

function prettyStatus(value = "") {
  return STATUS_LABELS[String(value).toLowerCase()] || String(value).replaceAll("_", " ");
}
function getOrderItem(order) { return order.item ?? order.items ?? "—"; }
function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}
function todayLocal() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = raw; }
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(Array.isArray(detail) ? detail.map(x => x.msg).join(", ") : detail || `Request failed (${response.status})`);
  }
  return data;
}

function StatCard({ label, value, icon: Icon, tone, footnote }) {
  return <div className="stat-card">
    <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value ?? "—"}</div>
    <div className="stat-foot">{footnote}</div>
  </div>;
}

function StatusPill({ status }) {
  const key = String(status || "").toLowerCase();
  return <span className={`status-pill ${key}`}><i />{prettyStatus(key)}</span>;
}

function NewOrderModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ customer_name: "", delivery_address: "", items: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = e => setForm(v => ({ ...v, [e.target.name]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      // This payload follows the OrderCreate schema used by the current backend.
      const created = await request("/orders/", { method: "POST", body: JSON.stringify(form) });
      onCreated(created);
      onClose();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
    <form className="modal" onSubmit={submit}>
      <div className="modal-head">
        <div><span className="eyebrow">ORDER MANAGEMENT</span><h2>Create a delivery</h2><p>Add a customer order to today's dispatch list.</p></div>
        <button className="icon-button" type="button" onClick={onClose}><X size={19}/></button>
      </div>
      <label>Customer name<input name="customer_name" value={form.customer_name} onChange={update} placeholder="e.g. Rohan Mehta" required /></label>
      <label>Delivery address<textarea name="delivery_address" value={form.delivery_address} onChange={update} placeholder="Flat, building, street, area..." rows="3" required /></label>
      <label>Order items<input name="items" value={form.items} onChange={update} placeholder="e.g. 2 thalis, 4 rotis" required /></label>
      {error && <div className="error-message"><CircleAlert size={16}/>{error}</div>}
      <div className="modal-actions"><button className="btn secondary" type="button" onClick={onClose}>Cancel</button><button className="btn primary" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17}/> : <Plus size={17}/>} Create order</button></div>
    </form>
  </div>;
}

export default function App() {
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(todayLocal());
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [apiOnline, setApiOnline] = useState(false);
  const pageSize = 8;

  const load = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ skip: String(page * pageSize), limit: String(pageSize) });
      if (status !== "all") params.set("status", status);
      if (date) params.set("created_date", date);
      const [orderData, summaryData] = await Promise.all([
        request(`/orders/?${params.toString()}`),
        request(`/stats/daily?summary_date=${date}`)
      ]);
      setOrders(Array.isArray(orderData) ? orderData : []);
      setSummary(summaryData);
      setApiOnline(true);
    } catch (err) {
      setApiOnline(false);
      setError(`${err.message}. Check that your FastAPI server is running at ${API}.`);
    } finally { setLoading(false); setRefreshing(false); }
  }, [page, status, date]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(o => [o.customer_name, o.delivery_address, getOrderItem(o), o.id]
      .some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [orders, search]);

  const counts = summary?.by_status || {};
  const total = summary?.total_orders ?? "—";

  function created() {
    setPage(0);
    load(true);
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Utensils size={20}/></div><span>Dabba<span className="brand-light">wala</span></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        <a className="nav-item active"><LayoutDashboard size={18}/>Overview</a>
        <a className="nav-item" href="#orders"><Package size={18}/>Orders <span className="nav-count">{total}</span></a>
      </nav>
      <div className="sidebar-bottom">
        <div className="api-status"><span className={`online-dot ${apiOnline ? "on" : ""}`}/><div><b>API connection</b><small>{apiOnline ? "Connected" : "Not connected"}</small></div></div>
        <div className="sidebar-version">DABBAWALA OPERATIONS <span>v1.0.0</span></div>
      </div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div className="breadcrumb">Workspace <span>/</span> <b>Overview</b></div>
        <div className="top-actions"><span className="today-label"><CalendarDays size={15}/>{new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span><div className="avatar">D</div></div>
      </header>

      <section className="page-heading">
        <div><div className="eyebrow">DELIVERY OPERATIONS</div><h1>Good day, team <span>✦</span></h1><p>Here's what's happening with your deliveries today.</p></div>
        <button className="btn primary" onClick={() => setShowCreate(true)}><Plus size={18}/> New order</button>
      </section>

      {error && <div className="connection-alert"><CircleAlert size={18}/><div><b>Couldn't load live data</b><span>{error}</span></div><button className="icon-button" onClick={() => load(true)}><RefreshCw size={17}/></button></div>}

      <section className="stats-grid">
        <StatCard label="Total orders" value={summary?.total_orders} icon={Package} tone="violet" footnote="For selected date"/>
        <StatCard label="Preparing" value={counts.preparing ?? 0} icon={Utensils} tone="amber" footnote="Being packed"/>
        <StatCard label="Picked up" value={counts.picked_up ?? 0} icon={Box} tone="blue" footnote="With delivery partner"/>
        <StatCard label="In transit" value={counts.in_transit ?? 0} icon={Truck} tone="teal" footnote="On the way"/>
        <StatCard label="Delivered" value={counts.delivered ?? 0} icon={Check} tone="green" footnote="Successfully delivered"/>
      </section>

      <section className="panel" id="orders">
        <div className="panel-heading">
          <div><div className="eyebrow">LIVE DISPATCH</div><h2>Orders <span className="subtle-count">{orders.length} shown</span></h2><p>Track and manage incoming deliveries.</p></div>
          <button className="btn secondary refresh-btn" onClick={() => load(true)} disabled={refreshing}><RefreshCw size={16} className={refreshing ? "spin" : ""}/>Refresh</button>
        </div>
        <div className="filters">
          <div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customer, address or item..." /></div>
          <div className="select-wrap"><Filter size={16}/><select value={status} onChange={e => {setStatus(e.target.value);setPage(0);}}><option value="all">All statuses</option>{STATUSES.map(s => <option key={s} value={s}>{prettyStatus(s)}</option>)}</select><ChevronDown size={15}/></div>
          <div className="date-wrap"><CalendarDays size={16}/><input type="date" value={date} onChange={e => {setDate(e.target.value);setPage(0);}}/></div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>ITEMS</th><th>DELIVERY ADDRESS</th><th>STATUS</th><th>CREATED</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan="6" className="table-state"><LoaderCircle className="spin"/>Loading orders...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan="6" className="table-state"><Package size={23}/><b>No orders found</b><span>Try changing the filters or create a new order.</span></td></tr>
              : filtered.map((o, i) => <tr key={o.id ?? i}>
                <td><span className="order-id">#{String(o.id ?? "—").padStart(4, "0")}</span></td>
                <td><div className="customer-cell"><div className="customer-avatar">{String(o.customer_name || "U").slice(0,1).toUpperCase()}</div><b>{o.customer_name || "Unknown"}</b></div></td>
                <td className="item-cell">{getOrderItem(o)}</td>
                <td><div className="address-cell"><MapPin size={14}/><span>{o.delivery_address || "—"}</span></div></td>
                <td><StatusPill status={o.status}/></td>
                <td className="date-cell">{formatDate(o.created_at)}</td>
              </tr>)}
            </tbody>
          </table>
        </div>
        <div className="table-footer"><span>Showing {filtered.length} order{filtered.length === 1 ? "" : "s"} on this page</span><div className="pagination"><button className="icon-button" disabled={page === 0} onClick={() => setPage(p => Math.max(0, p-1))}><ChevronLeft size={17}/></button><span>Page {page + 1}</span><button className="icon-button" disabled={orders.length < pageSize} onClick={() => setPage(p => p+1)}><ChevronRight size={17}/></button></div></div>
      </section>
      <footer className="footer"><span>© {new Date().getFullYear()} Dabbawala Operations</span><span><span className={`online-dot ${apiOnline ? "on" : ""}`}/>{apiOnline ? "All systems operational" : "Waiting for API"}</span></footer>
    </main>
    {showCreate && <NewOrderModal onClose={() => setShowCreate(false)} onCreated={created}/>}
  </div>;
}
