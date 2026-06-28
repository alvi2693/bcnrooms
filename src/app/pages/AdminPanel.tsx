import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, ChevronLeft, ChevronRight, X, Users, Globe, Phone, Mail, Calendar, Trash2, Edit2, LayoutList, CalendarDays, BarChart2 } from 'lucide-react';

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
const PAYMENT_METHODS = ['Efectivo', 'Depósito bancario', 'PayPal', 'Bizum', 'Tarjeta', 'Otros'];
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

const emptyForm = {
  room_id: 1, guest_name: '', guest_email: '', guest_phone: '',
  guest_nationality: '', num_persons: 1, check_in: '', check_out: '',
  price_per_night: '', price_total: '', price_paid: '',
  payment_status: 'pending', payment_method: 'Efectivo', channel: 'WhatsApp', notes: '',
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

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('sagrera');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'calendar' | 'stats'>('list');
  const [calendarStart, setCalendarStart] = useState<Date>(() => { const d = new Date(); d.setDate(d.getDate() - 3); return d; });
  const DAYS_VISIBLE = 28;
  const COL_W = 48;
  const ROW_H = 50;
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
        price_paid: r.price_paid ? Number(r.price_paid) : 0,
        num_persons: Number(r.num_persons),
      })));
    } catch {}
  }

  useEffect(() => { if (isLoggedIn) fetchReservations(); }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setFormError('');
    const room = ALL_ROOMS.find(r => r.id === Number(form.room_id));
    const payload = { ...form, room_id: Number(form.room_id), room_name: room ? `${room.propertyName} - ${room.name}` : '', num_persons: Number(form.num_persons), price_total: form.price_total ? Number(form.price_total) : null, price_paid: form.price_paid ? Number(form.price_paid) : 0 };
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
    setForm({ room_id: r.room_id, guest_name: r.guest_name, guest_email: r.guest_email || '', guest_phone: r.guest_phone || '', guest_nationality: r.guest_nationality || '', num_persons: r.num_persons, check_in: r.check_in?.split('T')[0] || '', check_out: r.check_out?.split('T')[0] || '', price_per_night: '', price_total: r.price_total?.toString() || '', price_paid: r.price_paid?.toString() || '', payment_status: r.payment_status, payment_method: r.payment_method || 'Efectivo', channel: r.channel || 'WhatsApp', notes: r.notes || '' });
    setEditingId(r.id); setSelectedRes(null); setShowForm(true);
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
      {/* Header */}
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
            <button onClick={handleLogout} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100"><LogOut className="w-4 h-4" /></button>
          </div>
        </div>
      </header>

      {/* Stats row */}
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

      {/* Content */}
      <div className="px-4 py-3">

        {/* LIST VIEW */}
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
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={e => { e.stopPropagation(); handleEdit(r); }} className="p-1.5 text-slate-400 hover:text-[#E05A2B] hover:bg-orange-50 rounded-lg">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

        {/* CALENDAR VIEW */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <button onClick={() => setCalendarStart(addDays(calendarStart, -7))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronLeft className="w-4 h-4" /></button>
              <div className="flex items-center gap-2">
                <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 3); setCalendarStart(d); }} className="text-xs px-2 py-1 bg-slate-100 rounded-lg text-slate-600 font-medium">Hoy</button>
                <span className="text-xs font-semibold text-slate-700">{fmtDate(toDateStr(days[0]))} — {fmtDate(toDateStr(days[days.length-1]))}</span>
              </div>
              <button onClick={() => setCalendarStart(addDays(calendarStart, 7))} className="p-1.5 hover:bg-slate-100 rounded-lg"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="overflow-x-auto">
              <div style={{ minWidth: LABEL_W + COL_W * DAYS_VISIBLE }}>
                {/* Day headers */}
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
                {/* Property rows */}
                {PROPERTIES.map(prop => (
                  <div key={prop.id}>
                    <div className="flex items-center border-b border-slate-100" style={{ background: prop.light }}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="px-3 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                      </div>
                      <div className="flex-1 border-l border-slate-100" style={{ height: 24 }} />
                    </div>
                    {prop.rooms.map(room => {
                      const visibleRes = reservations.filter(r => {
                        if (r.room_id !== room.id) return false;
                        return r.check_in <= toDateStr(days[days.length-1]) && r.check_out >= toDateStr(days[0]);
                      });
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
                                return <div key={i} style={{ width: COL_W, minWidth: COL_W }} className={`h-full border-r border-slate-100 ${isToday ? 'bg-orange-50/50' : isWE ? 'bg-slate-50/30' : ''}`} />;
                              })}
                            </div>
                            {visibleRes.map(res => {
                              const sc = getResStartCol(res), span = getResSpan(res);
                              if (sc < 0 || span === 0) return null;
                              const pending = (res.price_total || 0) - (res.price_paid || 0);
                              return (
                                <button key={res.id} onClick={() => setSelectedRes(res)}
                                  className="absolute top-1.5 bottom-1.5 rounded-lg flex items-center px-2 gap-1 text-white text-[11px] font-medium shadow-sm hover:opacity-90 truncate"
                                  style={{ left: sc * COL_W + 2, width: span * COL_W - 4, background: prop.color, zIndex: 10 }}>
                                  <span className="truncate">{res.guest_name}</span>
                                  {pending > 0 && <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[9px]">{pending.toFixed(0)}€</span>}
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

        {/* STATS VIEW */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            {/* Resumen financiero global */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Resumen financiero</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Total facturado', v: `${reservations.reduce((a, r) => a + (r.price_total || 0), 0)}€`, c: 'text-slate-900' },
                  { l: 'Total cobrado', v: `${totalCobrado.toFixed(0)}€`, c: 'text-emerald-600' },
                  { l: 'Pendiente cobro', v: `${totalPending.toFixed(0)}€`, c: 'text-[#E05A2B]' },
                  { l: 'Ticket medio', v: `${reservations.length ? (reservations.reduce((a, r) => a + (r.price_total || 0), 0) / reservations.length).toFixed(0) : 0}€`, c: 'text-slate-900' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 mb-0.5">{s.l}</p>
                    <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Por piso — ocupación y finanzas */}
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
                  {/* Stats del piso */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">Reservas</p>
                      <p className="text-base font-bold text-slate-900">{propRes.length}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">Activas</p>
                      <p className="text-base font-bold text-emerald-600">{activeRes.length}</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center">
                      <p className="text-[10px] text-slate-400">% del total</p>
                      <p className="text-base font-bold" style={{ color: prop.color }}>{pct}%</p>
                    </div>
                  </div>
                  {/* Barra ocupación */}
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: prop.color }} />
                  </div>
                  {/* Finanzas */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Facturado</span>
                      <span className="font-semibold text-slate-900">{propIncome}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Cobrado</span>
                      <span className="font-semibold text-emerald-600">{propPaid}€</span>
                    </div>
                    {propPending > 0 && (
                      <div className="flex justify-between text-xs border-t border-slate-100 pt-1.5">
                        <span className="text-slate-500">Pendiente</span>
                        <span className="font-bold text-[#E05A2B]">{propPending.toFixed(0)}€</span>
                      </div>
                    )}
                  </div>
                  {/* Por habitación */}
                  {prop.rooms.length > 1 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Por habitación</p>
                      {prop.rooms.map(room => {
                        const roomRes = reservations.filter(r => r.room_id === room.id);
                        const roomIncome = roomRes.reduce((a, r) => a + (r.price_total || 0), 0);
                        const roomPaid = roomRes.reduce((a, r) => a + (r.price_paid || 0), 0);
                        const roomPending = roomIncome - roomPaid;
                        return (
                          <div key={room.id} className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-slate-600 font-medium">{room.name}</span>
                                <span className="text-slate-500">{roomRes.length} res · {roomIncome}€</span>
                              </div>
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${propRes.length ? (roomRes.length / propRes.length) * 100 : 0}%`, background: prop.color, opacity: 0.7 }} />
                              </div>
                              {roomPending > 0 && <p className="text-[10px] text-[#E05A2B] mt-0.5">Pendiente: {roomPending.toFixed(0)}€</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Por canal */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Reservas por canal</h3>
              {CHANNELS.map(ch => {
                const count = reservations.filter(r => r.channel === ch).length;
                if (count === 0) return null;
                const income = reservations.filter(r => r.channel === ch).reduce((a, r) => a + (r.price_total || 0), 0);
                return (
                  <div key={ch} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-600 font-medium">{ch}</span>
                      <span className="text-slate-500">{count} res · {income}€</span>
                    </div>
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
          {[
            { id: 'list', icon: LayoutList, label: 'Reservas' },
            { id: 'calendar', icon: CalendarDays, label: 'Calendario' },
            { id: 'stats', icon: BarChart2, label: 'Stats' },
          ].map(tab => (
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
                <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedRes.guest_name}</h3>
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
                  {pending > 0 && <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5"><span className="text-slate-500">Pendiente</span><span className="font-bold text-[#E05A2B]">{pending.toFixed(0)}€</span></div>}
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

      {/* Form - slide up on mobile */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto sm:hidden absolute left-1/2 -translate-x-1/2 top-2" />
                <h3 className="font-semibold text-slate-900">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); setFormError(''); }} className="p-1.5 hover:bg-slate-100 rounded-xl"><X className="w-4 h-4 text-slate-500" /></button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Paso 1: Piso */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => {
                          setSelectedProperty(p.id);
                          const firstRoom = p.rooms[0];
                          setForm(f => ({ ...f, room_id: firstRoom.id }));
                        }}
                        className="py-2.5 rounded-xl text-xs font-semibold border transition-all"
                        style={selectedProperty === p.id ? { background: p.color, color: 'white', borderColor: p.color } : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Paso 2: Habitación */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Habitación *</label>
                  <div className="flex flex-wrap gap-2">
                    {(PROPERTIES.find(p => p.id === selectedProperty)?.rooms || []).map(r => (
                      <button key={r.id} type="button"
                        onClick={() => setForm(f => ({ ...f, room_id: r.id }))}
                        className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${form.room_id === r.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Nombre + teléfono */}
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
                {/* Personas + nacionalidad */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Personas *</label>
                    <input required type="number" min="1" value={form.num_persons} onChange={e => setForm(f => ({ ...f, num_persons: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nacionalidad</label>
                    <select value={form.guest_nationality} onChange={e => setForm(f => ({ ...f, guest_nationality: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]">
                      <option value="">—</option>
                      {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                {/* Canal */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(c => <button key={c} type="button" onClick={() => setForm(f => ({ ...f, channel: c }))} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.channel === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{c}</button>)}
                  </div>
                </div>
                {/* Fechas */}
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
                {/* Calculadora */}
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
                {/* Precios */}
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
                {/* Estado pago */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Estado de pago</label>
                  <div className="flex gap-2">
                    {[{ v: 'pending', l: 'Pendiente' }, { v: 'partial', l: 'Parcial' }, { v: 'paid', l: 'Pagado' }].map(s => (
                      <button key={s.v} type="button" onClick={() => setForm(f => ({ ...f, payment_status: s.v }))}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium border transition-colors ${form.payment_status === s.v ? s.v === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : s.v === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' : 'bg-red-100 text-red-600 border-red-300' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Método pago */}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Método de pago</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => <button key={m} type="button" onClick={() => setForm(f => ({ ...f, payment_method: m }))} className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.payment_method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>{m}</button>)}
                  </div>
                </div>
                {/* Notas */}
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
    </div>
  );
}