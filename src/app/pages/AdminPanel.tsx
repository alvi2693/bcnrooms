import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, ChevronLeft, ChevronRight, X, Users, Globe, Phone, Mail, Calendar, Trash2, Edit2, LayoutList, CalendarDays, BarChart2, Home, AlertCircle, CheckCircle, Clock, Bell, BellOff, Search, Wallet } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

const PROPERTIES = [
  { id: 'sagrera', name: 'Sagrera', color: '#3B82F6', light: '#EFF6FF', rooms: [{ id: 1, name: 'Hab. Doble Sagrera', type: 'double' }] },
  { id: 'born', name: 'El Born', color: '#10B981', light: '#ECFDF5', rooms: [
    { id: 5, name: 'Hab. 1 Doble', type: 'double' },
    { id: 6, name: 'Hab. 2 Doble', type: 'double' },
    { id: 2, name: 'Hab. 3 Mediana', type: 'medium' },
    { id: 3, name: 'Hab. 4 Mediana', type: 'medium' },
    { id: 4, name: 'Hab. 5 Mediana', type: 'medium' },
  ]},
  { id: 'sagrada', name: 'Sagrada Família', color: '#8B5CF6', light: '#F5F3FF', rooms: [{ id: 7, name: 'Hab. Doble Sagrada Família', type: 'double' }] },
];

const ALL_ROOMS = PROPERTIES.flatMap(p => p.rooms.map(r => ({ ...r, propertyId: p.id, propertyName: p.name, color: p.color, light: p.light })));
const CHANNELS = ['WhatsApp', 'Facebook', 'Airbnb', 'Booking', 'Instagram', 'Directo'];
const PAYMENT_METHODS = ['Efectivo', 'Transferencia', 'Depósito bancario', 'PayPal', 'Bizum', 'Tarjeta', 'Otros'];
const EXPENSE_CATEGORIES = ['🛋️ Mobiliario', '🔧 Mantenimiento', '🧹 Limpieza', '💡 Suministros', '🏠 Alquiler/Hipoteca', '📦 Equipamiento', '📋 Otros'];
const NATIONALITIES = [
  'Alemana','Austriaca','Belga','Búlgara','Checa','Croata','Danesa','Eslovaca','Eslovena','Española',
  'Estonia','Finlandesa','Francesa','Griega','Húngara','Irlandesa','Islandesa','Italiana','Letona',
  'Lituana','Luxemburguesa','Maltesa','Neerlandesa','Noruega','Polaca','Portuguesa','Rumana','Sueca',
  'Suiza','Inglesa','Ucraniana','Rusa','Turca','Americana','Argentina','Boliviana','Brasileña',
  'Canadiense','Chilena','Colombiana','Costarricense','Cubana','Dominicana','Ecuatoriana',
  'Guatemalteca','Hondureña','Mexicana','Nicaragüense','Panameña','Paraguaya','Peruana',
  'Puertorriqueña','Salvadoreña','Uruguaya','Venezolana','Australiana','China','Coreana',
  'Emiratí','Filipina','India','Israelí','Japonesa','Marroquí','Neozelandesa','Paquistaní',
  'Saudí','Sudafricana','Tailandesa','Otra',
];

interface Reservation {
  id: number; room_id: number; room_name: string; guest_name: string;
  guest_email?: string; guest_phone?: string; guest_nationality?: string;
  num_persons: number; check_in: string; check_out: string;
  price_total?: number; price_paid?: number; payment_status: string;
  payment_method?: string; channel?: string; notes?: string;
}

interface Expense {
  id: number; property_id: string; property_name: string;
  category: string; description: string; amount: number; date: string;
}

const emptyForm = {
  room_id: 1, guest_name: '', guest_email: '', guest_phone: '',
  guest_nationality: '', num_persons: 1, check_in: '', check_out: '',
  price_per_night: '', price_total: '', price_paid: '',
  payment_status: 'pending', payment_method: 'Efectivo', channel: 'WhatsApp', notes: '',
};

const emptyExpenseForm = {
  property_id: 'sagrera', category: '🔧 Mantenimiento',
  description: '', amount: '', date: new Date().toISOString().split('T')[0],
};

function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }
function toDateStr(date: Date): string { return date.toISOString().split('T')[0]; }
function fmtDate(str: string): string {
  if (!str) return '';
  const d = new Date(str.split('T')[0] + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function calcNights(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function NationalitySearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const filtered = NATIONALITIES.filter(n => n.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    function handle(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  return (
    <div ref={ref} className="relative">
      <div className="flex items-center border border-slate-200 rounded-xl px-3 py-3 gap-2 bg-white cursor-text" onClick={() => setOpen(true)}>
        <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
        <input className="flex-1 text-sm outline-none bg-transparent" placeholder={value || 'Buscar...'}
          value={open ? query : value}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)} />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {filtered.map(n => (
            <div key={n} className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-slate-50 ${value === n ? 'font-semibold text-[#E05A2B]' : 'text-slate-700'}`}
              onMouseDown={() => { onChange(n); setQuery(''); setOpen(false); }}>{n}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [formError, setFormError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('sagrera');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'list' | 'calendar' | 'expenses' | 'stats'>('today');
  const [calendarStart, setCalendarStart] = useState<Date>(() => new Date());
  const [pushEnabled, setPushEnabled] = useState(false);

  const DAYS_VISIBLE = 14;
  const COL_W = 52;
  const ROW_H = 52;
  const LABEL_W = 140;
  const today = toDateStr(new Date());
  const isLoggedIn = !!token;

  const days: Date[] = [];
  for (let i = 0; i < DAYS_VISIBLE; i++) days.push(addDays(calendarStart, i));

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username !== 'admin') { setLoginError('Usuario incorrecto'); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.token) { setToken(data.token); localStorage.setItem('admin_token', data.token); setLoginError(''); }
      else setLoginError('Contraseña incorrecta');
    } catch { setLoginError('Error de conexión'); }
  }

  function handleLogout() { setToken(''); localStorage.removeItem('admin_token'); }

  async function fetchReservations() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reservations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReservations(data.map((r: any) => ({
        ...r,
        check_in: r.check_in ? r.check_in.split('T')[0] : r.check_in,
        check_out: r.check_out ? r.check_out.split('T')[0] : r.check_out,
        price_total: r.price_total ? Number(r.price_total) : 0,
        price_per_night: r.price_per_night ? Number(r.price_per_night) : 0,
        price_paid: r.price_paid ? Number(r.price_paid) : 0,
        num_persons: Number(r.num_persons),
      })));
    } catch {}
  }

  async function fetchExpenses() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setExpenses(data.map((e: any) => ({ ...e, amount: Number(e.amount), date: e.date?.split('T')[0] || e.date })));
    } catch {}
  }

  useEffect(() => { if (isLoggedIn) { fetchReservations(); fetchExpenses(); } }, [isLoggedIn]);
  useEffect(() => { if (isLoggedIn && 'Notification' in window) setPushEnabled(Notification.permission === 'granted'); }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    const room = ALL_ROOMS.find(r => r.id === Number(form.room_id));
    const pricePaid = Number(form.price_paid) || 0;
    const priceTotal = form.price_total ? Number(form.price_total) : null;
    let paymentStatus = 'pending';
    if (priceTotal && pricePaid >= priceTotal) paymentStatus = 'paid';
    else if (pricePaid > 0) paymentStatus = 'partial';
    const payload = { ...form, room_id: Number(form.room_id), room_name: room ? `${room.propertyName} - ${room.name}` : '', num_persons: Number(form.num_persons), price_total: priceTotal, price_paid: pricePaid, payment_status: paymentStatus };
    const url = editingId ? `${BACKEND_URL}/admin/reservations/${editingId}` : `${BACKEND_URL}/admin/reservations`;
    const res = await fetch(url, { method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setFormError(data.error || 'Error al guardar'); return; }
    setShowForm(false); setEditingId(null); setForm(emptyForm); setFormError(''); fetchReservations();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await fetch(`${BACKEND_URL}/admin/reservations/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSelectedRes(null); fetchReservations();
  }

  function handleEdit(r: Reservation) {
    const prop = PROPERTIES.find(p => p.rooms.some(rm => rm.id === r.room_id));
    if (prop) setSelectedProperty(prop.id);
    setForm({ room_id: r.room_id, guest_name: r.guest_name, guest_email: r.guest_email || '', guest_phone: r.guest_phone || '', guest_nationality: r.guest_nationality || '', num_persons: r.num_persons, check_in: r.check_in?.split('T')[0] || '', check_out: r.check_out?.split('T')[0] || '', price_per_night: (r as any).price_per_night?.toString() || '', price_total: r.price_total?.toString() || '', price_paid: r.price_paid?.toString() || '', payment_status: r.payment_status, payment_method: r.payment_method || 'Efectivo', channel: r.channel || 'WhatsApp', notes: r.notes || '' });
    setEditingId(r.id); setSelectedRes(null); setShowForm(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    const prop = PROPERTIES.find(p => p.id === expenseForm.property_id);
    const payload = { ...expenseForm, property_name: prop?.name || '', amount: Number(expenseForm.amount) };
    const url = editingExpenseId ? `${BACKEND_URL}/admin/expenses/${editingExpenseId}` : `${BACKEND_URL}/admin/expenses`;
    await fetch(url, { method: editingExpenseId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
    setShowExpenseForm(false); setEditingExpenseId(null); setExpenseForm(emptyExpenseForm); fetchExpenses();
  }

  async function handleExpenseDelete(id: number) {
    if (!confirm('¿Eliminar este gasto?')) return;
    await fetch(`${BACKEND_URL}/admin/expenses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchExpenses();
  }

  function handleExpenseEdit(ex: Expense) {
    setExpenseForm({ property_id: ex.property_id, category: ex.category, description: ex.description, amount: ex.amount.toString(), date: ex.date });
    setEditingExpenseId(ex.id); setShowExpenseForm(true);
  }

  function handlePPN(val: string) {
    const n = calcNights(form.check_in, form.check_out), pn = parseFloat(val) || 0;
    setForm(f => ({ ...f, price_per_night: val, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : f.price_total }));
  }

  function handleCIO(key: 'check_in' | 'check_out', val: string) {
    setForm(f => {
      const u = { ...f, [key]: val };
      const n = calcNights(key === 'check_in' ? val : f.check_in, key === 'check_out' ? val : f.check_out);
      const pn = parseFloat(f.price_per_night) || 0;
      return { ...u, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : u.price_total };
    });
  }

  function getResStartCol(res: Reservation): number { return days.findIndex(d => toDateStr(d) >= res.check_in); }
  function getResSpan(res: Reservation): number { let s = 0; for (const d of days) { const ds = toDateStr(d); if (ds >= res.check_in && ds <= res.check_out) s++; } return s; }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) { alert('Tu navegador no soporta notificaciones push'); return; }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert('Permiso denegado'); return; }
      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch(`${BACKEND_URL}/push/vapid-key`);
      const { publicKey } = await keyRes.json();
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
      await fetch(`${BACKEND_URL}/push/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(sub) });
      setPushEnabled(true); alert('✅ Notificaciones activadas');
    } catch { alert('Error activando notificaciones'); }
  }

  const totalPending = reservations.reduce((a, r) => a + ((r.price_total || 0) - (r.price_paid || 0)), 0);
  const totalCobrado = reservations.reduce((a, r) => a + (r.price_paid || 0), 0);
  const activeNow = reservations.filter(r => r.check_in <= today && r.check_out >= today).length;
  const sorted = [...reservations].sort((a, b) => a.check_in.localeCompare(b.check_in));

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#E05A2B] p-2.5 rounded-xl"><Calendar className="w-5 h-5 text-white" /></div>
          <div><h1 className="font-bold text-slate-900">BCN Rooms</h1><p className="text-xs text-slate-400">Panel de administración</p></div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="text-xs font-medium text-slate-600 mb-1 block">Usuario</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" /></div>
          <div><label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="••••••••" /></div>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button type="submit" className="w-full bg-[#E05A2B] text-white py-3 rounded-xl text-sm font-semibold">Entrar</button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#E05A2B] p-1.5 rounded-lg"><Calendar className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-900 text-sm">BCN Rooms Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }} className="flex items-center gap-1.5 bg-[#E05A2B] text-white px-3 py-2 rounded-xl text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Nueva
            </button>
            <button onClick={enablePush} className={`p-2 rounded-xl ${pushEnabled ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400 hover:bg-slate-100'}`}>
              {pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Reservas', v: reservations.length, c: 'text-slate-900' },
          { l: 'Activas', v: activeNow, c: 'text-emerald-600' },
          { l: 'Pendiente', v: `${totalPending.toFixed(0)}€`, c: 'text-[#E05A2B]' },
          { l: 'Cobrado', v: `${totalCobrado.toFixed(0)}€`, c: 'text-emerald-600' },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl p-3 border border-slate-100">
            <p className="text-xs text-slate-400">{s.l}</p>
            <p className={`text-xl font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">

        {/* TODAY */}
        {activeTab === 'today' && (() => {
          const checkinsHoy = reservations.filter(r => r.check_in === today);
          const checkoutsHoy = reservations.filter(r => r.check_out === today);
          const urgentePago = reservations.filter(r => ((r.price_total || 0) - (r.price_paid || 0)) > 0 && r.check_in <= today)
            .sort((a, b) => ((b.price_total || 0) - (b.price_paid || 0)) - ((a.price_total || 0) - (a.price_paid || 0)));
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Estado de habitaciones</h3>
                <div className="space-y-2">
                  {ALL_ROOMS.map(room => {
                    const resActiva = reservations.find(r => r.room_id === room.id && r.check_in <= today && r.check_out > today);
                    const checkinHoy = reservations.find(r => r.room_id === room.id && r.check_in === today);
                    const checkoutHoy = reservations.find(r => r.room_id === room.id && r.check_out === today);
                    const prop = PROPERTIES.find(p => p.rooms.some(r => r.id === room.id));
                    let badge = { text: 'Libre', bg: 'bg-emerald-100', color: 'text-emerald-700' };
                    let icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
                    if (checkinHoy) { badge = { text: `Check-in · ${checkinHoy.guest_name}`, bg: 'bg-blue-100', color: 'text-blue-700' }; icon = <AlertCircle className="w-4 h-4 text-blue-500" />; }
                    else if (checkoutHoy) { badge = { text: `Check-out · ${checkoutHoy.guest_name}`, bg: 'bg-yellow-100', color: 'text-yellow-700' }; icon = <Clock className="w-4 h-4 text-yellow-500" />; }
                    else if (resActiva) { badge = { text: `Ocupada · ${resActiva.guest_name}`, bg: 'bg-red-100', color: 'text-red-600' }; icon = <AlertCircle className="w-4 h-4 text-red-400" />; }
                    return (
                      <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => resActiva && setSelectedRes(resActiva)}>
                        <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: prop?.color || '#999' }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-700">{room.name}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badge.bg} ${badge.color}`}>{badge.text}</span>
                        </div>
                        {icon}
                      </div>
                    );
                  })}
                </div>
              </div>
              {checkinsHoy.length > 0 && (
                <div className="bg-white rounded-2xl border border-blue-100 p-4">
                  <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-blue-500" /><h3 className="font-semibold text-slate-900 text-sm">Check-in hoy ({checkinsHoy.length})</h3></div>
                  <div className="space-y-2">
                    {checkinsHoy.map(r => {
                      const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl cursor-pointer" onClick={() => setSelectedRes(r)}>
                          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{r.guest_name}</p>
                            <p className="text-xs text-slate-500">{room?.name} · {calcNights(r.check_in, r.check_out)} noches · {r.num_persons} pers.</p>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{r.price_total || 0}€</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {checkoutsHoy.length > 0 && (
                <div className="bg-white rounded-2xl border border-yellow-100 p-4">
                  <div className="flex items-center gap-2 mb-3"><Clock className="w-4 h-4 text-yellow-500" /><h3 className="font-semibold text-slate-900 text-sm">Check-out hoy ({checkoutsHoy.length})</h3></div>
                  <div className="space-y-2">
                    {checkoutsHoy.map(r => {
                      const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
                      const pending = (r.price_total || 0) - (r.price_paid || 0);
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl cursor-pointer" onClick={() => setSelectedRes(r)}>
                          <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{r.guest_name}</p>
                            <p className="text-xs text-slate-500">{room?.name}</p>
                          </div>
                          {pending > 0 && <span className="text-xs font-bold text-[#E05A2B]">{pending.toFixed(0)}€ pendiente</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {urgentePago.length > 0 && (
                <div className="bg-white rounded-2xl border border-orange-100 p-4">
                  <div className="flex items-center gap-2 mb-3"><AlertCircle className="w-4 h-4 text-[#E05A2B]" /><h3 className="font-semibold text-slate-900 text-sm">Cobros pendientes ({urgentePago.length})</h3></div>
                  <div className="space-y-2">
                    {urgentePago.slice(0, 5).map(r => {
                      const pending = (r.price_total || 0) - (r.price_paid || 0);
                      const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl cursor-pointer" onClick={() => setSelectedRes(r)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{r.guest_name}</p>
                            <p className="text-xs text-slate-500">{room?.propertyName} · {r.payment_method || 'Efectivo'}</p>
                          </div>
                          <span className="text-sm font-bold text-[#E05A2B]">{pending.toFixed(0)}€</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {checkinsHoy.length === 0 && checkoutsHoy.length === 0 && urgentePago.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Todo tranquilo hoy</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* LIST */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {sorted.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-slate-400 text-sm mb-3">Sin reservas aún</p>
                <button onClick={() => setShowForm(true)} className="text-[#E05A2B] text-sm font-medium">+ Añadir primera reserva</button>
              </div>
            )}
            {sorted.map(r => {
              const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
              const pending = (r.price_total || 0) - (r.price_paid || 0);
              const isActive = r.check_in <= today && r.check_out >= today;
              const isPast = r.check_out < today;
              const isPaid = pending <= 0 && (r.price_total || 0) > 0;
              return (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className={`bg-white rounded-2xl border p-4 cursor-pointer ${isPast ? 'opacity-60 border-slate-100' : 'border-slate-100'}`}
                  onClick={() => setSelectedRes(r)}>
                  <div className="flex items-start gap-3">
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: room?.color || '#999' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{r.guest_name}</span>
                          {isActive && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">Activo</span>}
                          {isPast && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Pasado</span>}
                          {isPaid && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Pagado</span>}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); handleEdit(r); }} className="p-1.5 text-slate-400 hover:text-[#E05A2B] hover:bg-orange-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{room?.propertyName} · {room?.name}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span>📅 {fmtDate(r.check_in)} → {fmtDate(r.check_out)}</span>
                          <span>👥 {r.num_persons}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-semibold text-slate-900">{r.price_total || 0}€</span>
                          {pending > 0 && <span className="text-xs text-[#E05A2B] ml-1">−{pending.toFixed(0)}€</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* CALENDAR */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
              <button onClick={() => setCalendarStart(addDays(calendarStart, -14))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-2">
                <button onClick={() => setCalendarStart(new Date())} className="text-xs px-2 py-1 bg-[#E05A2B] text-white rounded-lg font-medium">Hoy</button>
                <span className="text-xs font-semibold text-slate-700">{fmtDate(toDateStr(days[0]))} — {fmtDate(toDateStr(days[days.length-1]))}</span>
              </div>
              <button onClick={() => setCalendarStart(addDays(calendarStart, 14))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: LABEL_W + COL_W * DAYS_VISIBLE }}>
                <div className="flex border-b border-slate-100" style={{ paddingLeft: LABEL_W }}>
                  {days.map((d, i) => {
                    const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <div key={i} style={{ width: COL_W, minWidth: COL_W }} className={`text-center py-1.5 border-r border-slate-100 ${isToday ? 'bg-orange-50' : isWE ? 'bg-slate-50' : ''}`}>
                        <div className="text-[9px] text-slate-400 uppercase">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                        <div className={`text-xs font-bold ${isToday ? 'text-[#E05A2B]' : 'text-slate-700'}`}>{d.getDate()}</div>
                        {d.getDate() === 1 && <div className="text-[8px] text-slate-400 capitalize">{d.toLocaleDateString('es-ES', { month: 'short' })}</div>}
                      </div>
                    );
                  })}
                </div>
                {PROPERTIES.map(prop => (
                  <div key={prop.id}>
                    <div className="flex items-center border-b border-slate-100" style={{ background: prop.light }}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="px-3 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                      </div>
                      <div className="flex-1 border-l border-slate-100" style={{ height: 24 }} />
                    </div>
                    {prop.rooms.map(room => {
                      const visibleRes = reservations.filter(r => r.room_id === room.id && r.check_in <= toDateStr(days[days.length-1]) && r.check_out >= toDateStr(days[0]));
                      return (
                        <div key={room.id} className="flex border-b border-slate-100 relative" style={{ height: ROW_H }}>
                          <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="flex items-center px-3 border-r border-slate-100 bg-white z-10">
                            <div>
                              <p className="text-[11px] font-medium text-slate-700">{room.name}</p>
                              <p className="text-[9px] text-slate-400">{room.type === 'double' ? 'Doble' : 'Mediana'}</p>
                            </div>
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-0 flex">
                              {days.map((d, i) => {
                                const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                                const hasRes = reservations.some(r => r.room_id === room.id && r.check_in <= ds && r.check_out >= ds);
                                return (
                                  <div key={i} style={{ width: COL_W, minWidth: COL_W }}
                                    onClick={() => {
                                      if (!hasRes) {
                                        const p = PROPERTIES.find(p => p.rooms.some(r => r.id === room.id));
                                        if (p) setSelectedProperty(p.id);
                                        setForm(f => ({ ...emptyForm, room_id: room.id, check_in: ds }));
                                        setEditingId(null); setShowForm(true);
                                      }
                                    }}
                                    className={`h-full border-r border-slate-100 group ${!hasRes ? 'cursor-pointer hover:bg-blue-50/40' : ''} ${isToday ? 'bg-orange-50/50' : isWE ? 'bg-slate-50/30' : ''}`}>
                                    {!hasRes && <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-slate-400">+</span></div>}
                                  </div>
                                );
                              })}
                            </div>
                            {visibleRes.map(res => {
                              const sc = getResStartCol(res), span = getResSpan(res);
                              if (sc < 0 || span === 0) return null;
                              const pending = (res.price_total || 0) - (res.price_paid || 0);
                              const isPaid = pending <= 0 && (res.price_total || 0) > 0;
                              return (
                                <button key={res.id} onClick={() => setSelectedRes(res)}
                                  className="absolute top-1.5 bottom-1.5 rounded-lg flex items-center px-2 gap-1 text-white text-[11px] font-medium shadow-sm hover:opacity-90 truncate"
                                  style={{ left: sc * COL_W + 2, width: span * COL_W - 4, background: prop.color, zIndex: 10 }}>
                                  <span className="truncate">{res.guest_name}</span>
                                  {isPaid
                                    ? <span className="flex-shrink-0 bg-white/30 rounded px-1 text-[9px]">✓</span>
                                    : <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[9px]">{pending.toFixed(0)}€</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* EXPENSES */}
        {activeTab === 'expenses' && (
          <div className="space-y-4">
            {PROPERTIES.map(prop => {
              const propIncome = reservations.filter(r => prop.rooms.some(rm => rm.id === r.room_id)).reduce((a, r) => a + (r.price_paid || 0), 0);
              const propCost = expenses.filter(e => e.property_id === prop.id).reduce((a, e) => a + e.amount, 0);
              const neto = propIncome - propCost;
              return (
                <div key={prop.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: prop.color }} />
                    <h3 className="font-semibold text-slate-900 text-sm">{prop.name}</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Ingresos</p><p className="text-sm font-bold text-emerald-600">{propIncome}€</p></div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Gastos</p><p className="text-sm font-bold text-red-500">{propCost}€</p></div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Neto</p><p className={`text-sm font-bold ${neto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{neto}€</p></div>
                  </div>
                </div>
              );
            })}
            <button onClick={() => { setExpenseForm(emptyExpenseForm); setEditingExpenseId(null); setShowExpenseForm(true); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 hover:border-[#E05A2B] hover:text-[#E05A2B] transition-colors">
              <Plus className="w-4 h-4" /> Añadir gasto
            </button>
            {PROPERTIES.map(prop => {
              const propExpenses = expenses.filter(e => e.property_id === prop.id);
              if (propExpenses.length === 0) return null;
              return (
                <div key={prop.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-slate-100" style={{ background: prop.light }}>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {propExpenses.map(ex => (
                      <div key={ex.id} className="flex items-center gap-3 p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-slate-500">{ex.category}</span>
                            <span className="text-[10px] text-slate-400">{fmtDate(ex.date)}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 truncate">{ex.description}</p>
                        </div>
                        <span className="text-sm font-bold text-red-500 flex-shrink-0">−{ex.amount}€</span>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => handleExpenseEdit(ex)} className="p-1.5 text-slate-400 hover:text-[#E05A2B] hover:bg-orange-50 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleExpenseDelete(ex.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5 bg-slate-50">
                      <span className="text-xs text-slate-500 font-medium">Total gastos</span>
                      <span className="text-xs font-bold text-red-500">{propExpenses.reduce((a, e) => a + e.amount, 0)}€</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Resumen financiero</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Total facturado', v: `${reservations.reduce((a, r) => a + (r.price_total || 0), 0)}€`, c: 'text-slate-900' },
                  { l: 'Total cobrado', v: `${totalCobrado.toFixed(0)}€`, c: 'text-emerald-600' },
                  { l: 'Pendiente cobro', v: `${totalPending.toFixed(0)}€`, c: 'text-[#E05A2B]' },
                  { l: 'Ticket medio', v: `${reservations.length ? (reservations.reduce((a, r) => a + (r.price_total || 0), 0) / reservations.length).toFixed(0) : 0}€`, c: 'text-slate-900' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 mb-0.5">{s.l}</p><p className={`text-lg font-bold ${s.c}`}>{s.v}</p></div>
                ))}
              </div>
            </div>
            {PROPERTIES.map(prop => {
              const propRes = reservations.filter(r => prop.rooms.some(rm => rm.id === r.room_id));
              const propIncome = propRes.reduce((a, r) => a + (r.price_total || 0), 0);
              const propPaid = propRes.reduce((a, r) => a + (r.price_paid || 0), 0);
              const propPending = propIncome - propPaid;
              const activeRes = propRes.filter(r => r.check_in <= today && r.check_out >= today);
              const pct = reservations.length ? Math.round((propRes.length / reservations.length) * 100) : 0;
              return (
                <div key={prop.id} className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: prop.color }} />
                    <h3 className="font-semibold text-slate-900 text-sm">{prop.name}</h3>
                    <span className="text-[10px] text-slate-400 ml-auto">{prop.rooms.length} hab.</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {[{ l: 'Reservas', v: propRes.length, c: 'text-slate-900' }, { l: 'Activas', v: activeRes.length, c: 'text-emerald-600' }, { l: '% total', v: `${pct}%`, c: '' }].map(s => (
                      <div key={s.l} className="bg-slate-50 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-400">{s.l}</p>
                        <p className={`text-base font-bold ${s.c}`} style={!s.c ? { color: prop.color } : {}}>{s.v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: prop.color }} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Facturado</span><span className="font-semibold">{propIncome}€</span></div>
                    <div className="flex justify-between text-xs"><span className="text-slate-500">Cobrado</span><span className="font-semibold text-emerald-600">{propPaid}€</span></div>
                    {propPending > 0 && <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5"><span className="text-slate-500">Pendiente</span><span className="font-bold text-[#E05A2B]">{propPending.toFixed(0)}€</span></div>}
                  </div>
                  {prop.rooms.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Por habitación</p>
                      {prop.rooms.map(room => {
                        const roomRes = reservations.filter(r => r.room_id === room.id);
                        const roomIncome = roomRes.reduce((a, r) => a + (r.price_total || 0), 0);
                        const roomPaid = roomRes.reduce((a, r) => a + (r.price_paid || 0), 0);
                        const roomPending = roomIncome - roomPaid;
                        return (
                          <div key={room.id}>
                            <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 font-medium">{room.name}</span><span className="text-slate-500">{roomRes.length} res · {roomIncome}€</span></div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${propRes.length ? (roomRes.length / propRes.length) * 100 : 0}%`, background: prop.color, opacity: 0.7 }} />
                            </div>
                            {roomPending > 0 && <p className="text-[10px] text-[#E05A2B] mt-0.5">Pendiente: {roomPending.toFixed(0)}€</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Por canal</h3>
              {CHANNELS.map(ch => {
                const count = reservations.filter(r => r.channel === ch).length;
                if (count === 0) return null;
                const income = reservations.filter(r => r.channel === ch).reduce((a, r) => a + (r.price_total || 0), 0);
                return (
                  <div key={ch} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 font-medium">{ch}</span><span className="text-slate-500">{count} · {income}€</span></div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E05A2B] rounded-full" style={{ width: `${(count / reservations.length) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40">
        <div className="flex">
          {[{ id: 'today', icon: Home, label: 'Hoy' }, { id: 'list', icon: LayoutList, label: 'Reservas' }, { id: 'calendar', icon: CalendarDays, label: 'Calendario' }, { id: 'expenses', icon: Wallet, label: 'Gastos' }, { id: 'stats', icon: BarChart2, label: 'Stats' }].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-colors ${activeTab === tab.id ? 'text-[#E05A2B]' : 'text-slate-400'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Detail popup */}
      <AnimatePresence>
        {selectedRes && (() => {
          const room = ALL_ROOMS.find(r => r.id === selectedRes.room_id);
          const pending = (selectedRes.price_total || 0) - (selectedRes.price_paid || 0);
          const nights = calcNights(selectedRes.check_in, selectedRes.check_out);
          const isPaid = pending <= 0 && (selectedRes.price_total || 0) > 0;
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
              onClick={() => setSelectedRes(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: room?.color }} />
                    <span className="text-xs text-slate-500">{room?.propertyName} · {room?.name}</span>
                  </div>
                  <button onClick={() => setSelectedRes(null)} className="p-1.5 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-xl font-bold text-slate-900">{selectedRes.guest_name}</h3>
                  {isPaid && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Pagado</span>}
                </div>
                <div className="space-y-2.5 mb-4 text-sm">
                  <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-slate-400" /><span>{fmtDate(selectedRes.check_in)} → {fmtDate(selectedRes.check_out)} · {nights} {nights === 1 ? 'noche' : 'noches'}</span></div>
                  <div className="flex items-center gap-3"><Users className="w-4 h-4 text-slate-400" /><span>{selectedRes.num_persons} {selectedRes.num_persons === 1 ? 'persona' : 'personas'}</span></div>
                  {selectedRes.guest_nationality && <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-slate-400" /><span>{selectedRes.guest_nationality}</span></div>}
                  {selectedRes.guest_phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400" /><span>{selectedRes.guest_phone}</span></div>}
                  {selectedRes.guest_email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400" /><span>{selectedRes.guest_email}</span></div>}
                  {selectedRes.channel && <div className="flex items-center gap-3"><span className="w-4 text-center text-xs">📲</span><span>{selectedRes.channel}</span></div>}
                  {selectedRes.payment_method && <div className="flex items-center gap-3"><span className="w-4 text-center text-xs">💳</span><span>{selectedRes.payment_method}</span></div>}
                </div>
                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Total</span><span className="font-semibold">{selectedRes.price_total || 0}€</span></div>
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Cobrado</span><span className="font-semibold text-emerald-600">{selectedRes.price_paid || 0}€</span></div>
                  {isPaid
                    ? <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5"><span className="text-slate-500">Estado</span><span className="font-bold text-emerald-600">✓ Completamente pagado</span></div>
                    : <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5"><span className="text-slate-500">Pendiente</span><span className="font-bold text-[#E05A2B]">{pending.toFixed(0)}€</span></div>
                  }
                </div>
                {selectedRes.notes && <div className="bg-yellow-50 rounded-xl p-3 mb-4 text-xs text-slate-600">{selectedRes.notes}</div>}
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedRes)} className="flex-1 flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-sm text-slate-600"><Edit2 className="w-3.5 h-3.5" /> Editar</button>
                  <button onClick={() => handleDelete(selectedRes.id)} className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500"><Trash2 className="w-3.5 h-3.5" /> Eliminar</button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Reservation Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0 relative">
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto sm:hidden absolute left-1/2 -translate-x-1/2 top-2" />
                <h3 className="font-semibold text-slate-900">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); setFormError(''); }} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelectedProperty(p.id); setForm(f => ({ ...f, room_id: p.rooms[0].id })); }}
                        className="py-2.5 rounded-xl text-xs font-semibold border transition-all"
                        style={selectedProperty === p.id ? { background: p.color, color: 'white', borderColor: p.color } : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Habitación *</label>
                  <div className="flex flex-wrap gap-2">
                    {(PROPERTIES.find(p => p.id === selectedProperty)?.rooms || []).map(r => (
                      <button key={r.id} type="button" onClick={() => setForm(f => ({ ...f, room_id: r.id }))}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${form.room_id === r.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre *</label>
                    <input required value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="John Doe" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
                    <input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Personas *</label>
                    <input required type="number" min="1" value={form.num_persons} onChange={e => setForm(f => ({ ...f, num_persons: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nacionalidad</label>
                    <NationalitySearch value={form.guest_nationality} onChange={v => setForm(f => ({ ...f, guest_nationality: v }))} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(c => <button key={c} type="button" onClick={() => setForm(f => ({ ...f, channel: c }))} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.channel === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{c}</button>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Check-in *</label>
                    <input required type="date" value={form.check_in} onChange={e => handleCIO('check_in', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Check-out *</label>
                    <input required type="date" value={form.check_out} onChange={e => handleCIO('check_out', e.target.value)} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-3">💰 Calculadora</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">€/noche</label>
                      <input type="number" value={form.price_per_night} onChange={e => handlePPN(e.target.value)} className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Noches</label>
                      <div className="border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white text-slate-700 font-medium">{calcNights(form.check_in, form.check_out) || '—'}</div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Total</label>
                      <div className="border border-[#E05A2B]/40 rounded-xl px-2 py-2 text-sm bg-orange-50 text-[#E05A2B] font-bold">
                        {form.price_per_night && calcNights(form.check_in, form.check_out) ? `${(parseFloat(form.price_per_night) * calcNights(form.check_in, form.check_out)).toFixed(0)}€` : '—'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Total (€)</label>
                    <input type="number" value={form.price_total} onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Cobrado (€)</label>
                    <input type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                </div>
                {form.price_total && (
                  <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-600">
                    Estado calculado:{' '}
                    {Number(form.price_paid) >= Number(form.price_total)
                      ? <span className="text-emerald-600 font-semibold">✓ Pagado</span>
                      : Number(form.price_paid) > 0
                      ? <span className="text-yellow-600 font-semibold">Parcial — pendiente {(Number(form.price_total) - Number(form.price_paid)).toFixed(0)}€</span>
                      : <span className="text-[#E05A2B] font-semibold">Pendiente {form.price_total}€</span>
                    }
                  </div>
                )}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Método de pago</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payment_method: m }))} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{m}</button>)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B] resize-none" placeholder="Info adicional..." />
                </div>
                {formError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠️ {formError}</div>}
                <div className="flex gap-3 pb-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold">{editingId ? 'Guardar' : 'Crear reserva'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expense Form */}
      <AnimatePresence>
        {showExpenseForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) { setShowExpenseForm(false); setEditingExpenseId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">{editingExpenseId ? 'Editar gasto' : 'Nuevo gasto'}</h3>
                <button onClick={() => { setShowExpenseForm(false); setEditingExpenseId(null); }} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
                      <form onSubmit={handleExpenseSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button" onClick={() => setExpenseForm(f => ({ ...f, property_id: p.id }))}
                        className="py-2.5 rounded-xl text-xs font-semibold border transition-all"
                        style={expenseForm.property_id === p.id ? { background: p.color, color: 'white', borderColor: p.color } : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Categoría *</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPENSE_CATEGORIES.map(c => (
                      <button key={c} type="button" onClick={() => setExpenseForm(f => ({ ...f, category: c }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${expenseForm.category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción *</label>
                  <input required value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="Ej: Compra sofá salón" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€) *</label>
                    <input required type="number" min="0" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha *</label>
                    <input required type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>
                <div className="flex gap-3 pb-2">
                  <button type="button" onClick={() => { setShowExpenseForm(false); setEditingExpenseId(null); }} className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600">Cancelar</button>
                  <button type="submit" className="flex-1 py-3 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold">{editingExpenseId ? 'Guardar' : 'Añadir gasto'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}