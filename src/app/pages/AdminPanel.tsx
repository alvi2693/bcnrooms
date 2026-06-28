import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, ChevronLeft, ChevronRight, X, Users, Globe, Phone, Mail, Euro, Calendar, Trash2, Edit2 } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

const PROPERTIES = [
  {
    id: 'sagrera',
    name: 'Sagrera',
    color: '#3B82F6',
    light: '#EFF6FF',
    rooms: [
      { id: 1, name: 'Habitación Doble', type: 'double' },
    ]
  },
  {
    id: 'born',
    name: 'El Born',
    color: '#10B981',
    light: '#ECFDF5',
    rooms: [
      { id: 5, name: 'Hab. 1 (Doble)', type: 'double' },
      { id: 6, name: 'Hab. 2 (Doble)', type: 'double' },
      { id: 2, name: 'Hab. 3 (Mediana)', type: 'medium' },
      { id: 3, name: 'Hab. 4 (Mediana)', type: 'medium' },
      { id: 4, name: 'Hab. 5 (Mediana)', type: 'medium' },
    ]
  },
  {
    id: 'sagrada',
    name: 'Sagrada Família',
    color: '#8B5CF6',
    light: '#F5F3FF',
    rooms: [
      { id: 7, name: 'Habitación', type: 'double' },
    ]
  },
];

const ALL_ROOMS = PROPERTIES.flatMap(p => p.rooms.map(r => ({ ...r, propertyId: p.id, propertyName: p.name, color: p.color, light: p.light })));

const CHANNELS = ['WhatsApp', 'Facebook', 'Airbnb', 'Booking', 'Instagram', 'Directo'];
const NATIONALITIES = [
  // Europa
  'Alemana', 'Austriaca', 'Belga', 'Búlgara', 'Checa', 'Croata', 'Danesa',
  'Eslovaca', 'Eslovena', 'Española', 'Estonia', 'Finlandesa', 'Francesa',
  'Griega', 'Húngara', 'Irlandesa', 'Islandesa', 'Italiana', 'Letona',
  'Lituana', 'Luxemburguesa', 'Maltesa', 'Neerlandesa', 'Noruega', 'Polaca',
  'Portuguesa', 'Rumana', 'Sueca', 'Suiza', 'Inglesa', 'Ucraniana', 'Rusa', 'Turca',
  // América
  'Americana', 'Argentina', 'Boliviana', 'Brasileña', 'Canadiense', 'Chilena',
  'Colombiana', 'Costarricense', 'Cubana', 'Dominicana', 'Ecuatoriana',
  'Guatemalteca', 'Hondureña', 'Mexicana', 'Nicaragüense', 'Panameña',
  'Paraguaya', 'Peruana', 'Puertorriqueña', 'Salvadoreña', 'Uruguaya', 'Venezolana',
  // Asia / Oceanía / África
  'Australiana', 'China', 'Coreana', 'Emiratí', 'Filipina', 'India',
  'Israelí', 'Japonesa', 'Marroquí', 'Neozelandesa', 'Paquistaní',
  'Saudí', 'Sudafricana', 'Tailandesa',
  // Otra
  'Otra',
];

interface Reservation {
  id: number;
  room_id: number;
  room_name: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_nationality?: string;
  num_persons: number;
  check_in: string;
  check_out: string;
  price_total?: number;
  price_paid?: number;
  payment_status: string;
  channel?: string;
  notes?: string;
}

const emptyForm = {
  room_id: 1,
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  guest_nationality: '',
  num_persons: 1,
  check_in: '',
  check_out: '',
  price_per_night: '',
  price_total: '',
  price_paid: '',
  payment_status: 'pending',
  channel: 'WhatsApp',
  notes: '',
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

function formatDate(str: string): string {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [calendarStart, setCalendarStart] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return d;
  });
  const DAYS_VISIBLE = 28;

  const isLoggedIn = !!token;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (username !== 'admin') { setLoginError('Usuario incorrecto'); return; }
    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setLoginError('');
      } else {
        setLoginError('Contraseña incorrecta');
      }
    } catch { setLoginError('Error de conexión'); }
  }

  function handleLogout() {
    setToken('');
    localStorage.removeItem('admin_token');
  }

  async function fetchReservations() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      setReservations(await res.json());
    } catch {}
  }

  useEffect(() => { if (isLoggedIn) fetchReservations(); }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    const room = ALL_ROOMS.find(r => r.id === Number(form.room_id));
    const payload = {
      ...form,
      room_id: Number(form.room_id),
      room_name: room ? `${room.propertyName} - ${room.name}` : '',
      num_persons: Number(form.num_persons),
      price_total: form.price_total ? Number(form.price_total) : null,
      price_paid: form.price_paid ? Number(form.price_paid) : 0,
    };
    const url = editingId ? `${BACKEND_URL}/admin/reservations/${editingId}` : `${BACKEND_URL}/admin/reservations`;
    const res = await fetch(url, {
      method: editingId ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setFormError(data.error || 'Error al guardar la reserva');
      return;
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    fetchReservations();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await fetch(`${BACKEND_URL}/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSelectedRes(null);
    fetchReservations();
  }

  function calcNights(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 0;
    return Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
  }

  function handlePricePerNight(val: string) {
    const nights = calcNights(form.check_in, form.check_out);
    const pn = parseFloat(val) || 0;
    setForm(f => ({
      ...f,
      price_per_night: val,
      price_total: nights > 0 && pn > 0 ? (pn * nights).toFixed(2) : f.price_total,
    }));
  }

  function handleCheckInOut(key: 'check_in' | 'check_out', val: string) {
    setForm(f => {
      const updated = { ...f, [key]: val };
      const nights = calcNights(
        key === 'check_in' ? val : f.check_in,
        key === 'check_out' ? val : f.check_out
      );
      const pn = parseFloat(f.price_per_night) || 0;
      return {
        ...updated,
        price_total: nights > 0 && pn > 0 ? (pn * nights).toFixed(2) : updated.price_total,
      };
    });
  }

  function handleEdit(r: Reservation) {
    setForm({
      room_id: r.room_id,
      guest_name: r.guest_name,
      guest_email: r.guest_email || '',
      guest_phone: r.guest_phone || '',
      guest_nationality: r.guest_nationality || '',
      num_persons: r.num_persons,
      check_in: r.check_in,
      check_out: r.check_out,
      price_per_night: '',
      price_total: r.price_total?.toString() || '',
      price_paid: r.price_paid?.toString() || '',
      payment_status: r.payment_status,
      channel: r.channel || 'WhatsApp',
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setSelectedRes(null);
    setShowForm(true);
  }

  // Generar días del calendario
  const days: Date[] = [];
  for (let i = 0; i < DAYS_VISIBLE; i++) {
    days.push(addDays(calendarStart, i));
  }

  function getResForRoomDay(roomId: number, date: Date): Reservation | null {
    const ds = toDateStr(date);
    return reservations.find(r => r.room_id === roomId && r.check_in <= ds && r.check_out > ds) || null;
  }

  function getResStartCol(res: Reservation, days: Date[]): number {
    return days.findIndex(d => toDateStr(d) >= res.check_in);
  }

  function getResSpan(res: Reservation, days: Date[]): number {
    let span = 0;
    for (const d of days) {
      const ds = toDateStr(d);
      if (ds >= res.check_in && ds < res.check_out) span++;
    }
    return span;
  }

  const today = toDateStr(new Date());
  const COL_W = 52;
  const ROW_H = 52;
  const LABEL_W = 160;

  // Stats
  const totalPending = reservations.reduce((a, r) => a + ((r.price_total || 0) - (r.price_paid || 0)), 0);
  const activeNow = reservations.filter(r => r.check_in <= today && r.check_out > today).length;

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#E05A2B] p-2.5 rounded-xl"><Calendar className="w-5 h-5 text-white" /></div>
            <div>
              <h1 className="font-bold text-slate-900">BCN Rooms</h1>
              <p className="text-xs text-slate-400">Panel de administración</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Usuario</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="••••••••" />
            </div>
            {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
            <button type="submit" className="w-full bg-[#E05A2B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#c94e23] transition-colors">
              Entrar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-full px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#E05A2B] p-2 rounded-xl"><Calendar className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-900 text-sm">BCN Rooms · Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}
              className="flex items-center gap-2 bg-[#E05A2B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#c94e23] transition-colors">
              <Plus className="w-4 h-4" /> Nueva reserva
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-5 max-w-full">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Reservas totales', value: reservations.length, color: 'text-slate-900' },
            { label: 'Activas ahora', value: activeNow, color: 'text-emerald-600' },
            { label: 'Pendiente cobro', value: `${totalPending.toFixed(0)}€`, color: 'text-[#E05A2B]' },
            { label: 'Total cobrado', value: `${reservations.reduce((a, r) => a + (r.price_paid || 0), 0).toFixed(0)}€`, color: 'text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100">
              <p className="text-xs text-slate-400 mb-1">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {PROPERTIES.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: p.color }} />
              <span className="text-xs text-slate-500 font-medium">{p.name}</span>
            </div>
          ))}
        </div>

        {/* Calendario */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
          {/* Nav mes */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <button onClick={() => setCalendarStart(addDays(calendarStart, -7))} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <div className="flex gap-2">
              <button onClick={() => { const d = new Date(); d.setDate(d.getDate() - 3); setCalendarStart(d); }}
                className="text-xs px-3 py-1.5 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200 font-medium">
                Hoy
              </button>
              <span className="text-sm font-semibold text-slate-900 px-2 py-1.5">
                {days[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} — {days[days.length-1].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <button onClick={() => setCalendarStart(addDays(calendarStart, 7))} className="p-1.5 hover:bg-slate-100 rounded-lg">
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div style={{ minWidth: LABEL_W + COL_W * DAYS_VISIBLE }}>
              {/* Header días */}
              <div className="flex border-b border-slate-100" style={{ paddingLeft: LABEL_W }}>
                {days.map((d, i) => {
                  const ds = toDateStr(d);
                  const isToday = ds === today;
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={i} style={{ width: COL_W, minWidth: COL_W }}
                      className={`text-center py-2 border-r border-slate-100 ${isToday ? 'bg-orange-50' : isWeekend ? 'bg-slate-50' : ''}`}>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {d.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                      <div className={`text-xs font-bold ${isToday ? 'text-[#E05A2B]' : 'text-slate-700'}`}>
                        {d.getDate()}
                      </div>
                      {d.getDate() === 1 && (
                        <div className="text-[9px] text-slate-400 capitalize">
                          {d.toLocaleDateString('es-ES', { month: 'short' })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Filas por propiedad y habitación */}
              {PROPERTIES.map((prop, pi) => (
                <div key={prop.id}>
                  {/* Cabecera propiedad */}
                  <div className="flex items-center border-b border-slate-100" style={{ background: prop.light }}>
                    <div style={{ width: LABEL_W, minWidth: LABEL_W }} className="px-3 py-2">
                      <span className="text-xs font-bold uppercase tracking-wide" style={{ color: prop.color }}>
                        {prop.name}
                      </span>
                    </div>
                    <div className="flex-1 border-l border-slate-100" style={{ height: 28 }} />
                  </div>

                  {/* Filas habitaciones */}
                  {prop.rooms.map((room, ri) => {
                    // Calcular reservas únicas visibles para esta habitación
                    const visibleRes = reservations.filter(r => {
                      if (r.room_id !== room.id) return false;
                      const lastDay = toDateStr(days[days.length - 1]);
                      const firstDay = toDateStr(days[0]);
                      return r.check_in <= lastDay && r.check_out > firstDay;
                    });

                    return (
                      <div key={room.id} className="flex border-b border-slate-100 relative" style={{ height: ROW_H }}>
                        {/* Label */}
                        <div style={{ width: LABEL_W, minWidth: LABEL_W }}
                          className="flex items-center px-3 border-r border-slate-100 bg-white z-10">
                          <div>
                            <p className="text-xs font-medium text-slate-700">{room.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{room.type === 'double' ? 'Doble' : 'Mediana'}</p>
                          </div>
                        </div>

                        {/* Celdas de días */}
                        <div className="relative flex-1">
                          {/* Fondo de celdas */}
                          <div className="absolute inset-0 flex">
                            {days.map((d, i) => {
                              const ds = toDateStr(d);
                              const isToday = ds === today;
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                              return (
                                <div key={i} style={{ width: COL_W, minWidth: COL_W }}
                                  className={`h-full border-r border-slate-100 ${isToday ? 'bg-orange-50/50' : isWeekend ? 'bg-slate-50/50' : ''}`} />
                              );
                            })}
                          </div>

                          {/* Bloques de reservas */}
                          {visibleRes.map(res => {
                            const startCol = getResStartCol(res, days);
                            const span = getResSpan(res, days);
                            if (startCol < 0 || span === 0) return null;
                            const pending = (res.price_total || 0) - (res.price_paid || 0);
                            return (
                              <button
                                key={res.id}
                                onClick={() => setSelectedRes(res)}
                                className="absolute top-1.5 bottom-1.5 rounded-lg flex items-center px-2 gap-1.5 text-white text-xs font-medium shadow-sm hover:opacity-90 hover:shadow-md transition-all truncate"
                                style={{
                                  left: startCol * COL_W + 2,
                                  width: span * COL_W - 4,
                                  background: prop.color,
                                  zIndex: 10,
                                }}
                              >
                                <span className="truncate">{res.guest_name}</span>
                                {pending > 0 && (
                                  <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[10px]">
                                    {pending.toFixed(0)}€
                                  </span>
                                )}
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

        {/* Lista próximas reservas */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="font-semibold text-slate-900 mb-4 text-sm">Próximas reservas</h3>
          {reservations.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">Sin reservas aún. Añade la primera.</p>
          )}
          <div className="space-y-2">
            {[...reservations]
              .sort((a, b) => a.check_in.localeCompare(b.check_in))
              .slice(0, 10)
              .map(r => {
                const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
                const pending = (r.price_total || 0) - (r.price_paid || 0);
                const isActive = r.check_in <= today && r.check_out > today;
                return (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedRes(r)}>
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: room?.color || '#999' }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-900">{r.guest_name}</span>
                        {isActive && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Activo</span>}
                      </div>
                      <p className="text-xs text-slate-400">{room?.propertyName} · {room?.name} · {formatDate(r.check_in)} → {formatDate(r.check_out)} · {r.num_persons} pers.</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-slate-900">{r.price_total || 0}€</p>
                      {pending > 0 && <p className="text-xs text-[#E05A2B]">−{pending.toFixed(0)}€</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={e => { e.stopPropagation(); handleEdit(r); }}
                        className="p-1.5 text-slate-400 hover:text-[#E05A2B] hover:bg-orange-50 rounded-lg transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(r.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Popup detalle reserva */}
      <AnimatePresence>
        {selectedRes && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRes(null)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-6"
              onClick={e => e.stopPropagation()}>
              {(() => {
                const room = ALL_ROOMS.find(r => r.id === selectedRes.room_id);
                const pending = (selectedRes.price_total || 0) - (selectedRes.price_paid || 0);
                const nights = Math.ceil((new Date(selectedRes.check_out).getTime() - new Date(selectedRes.check_in).getTime()) / 86400000);
                return (
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: room?.color }} />
                        <span className="text-xs font-medium text-slate-500">{room?.propertyName} · {room?.name}</span>
                      </div>
                      <button onClick={() => setSelectedRes(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedRes.guest_name}</h3>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-700">{formatDate(selectedRes.check_in)} → {formatDate(selectedRes.check_out)} · {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-700">{selectedRes.num_persons} {selectedRes.num_persons === 1 ? 'persona' : 'personas'}</span>
                      </div>
                      {selectedRes.guest_nationality && (
                        <div className="flex items-center gap-3 text-sm">
                          <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{selectedRes.guest_nationality}</span>
                        </div>
                      )}
                      {selectedRes.guest_phone && (
                        <div className="flex items-center gap-3 text-sm">
                          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{selectedRes.guest_phone}</span>
                        </div>
                      )}
                      {selectedRes.guest_email && (
                        <div className="flex items-center gap-3 text-sm">
                          <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-700">{selectedRes.guest_email}</span>
                        </div>
                      )}
                      {selectedRes.channel && (
                        <div className="flex items-center gap-3 text-sm">
                          <span className="w-4 h-4 text-slate-400 flex-shrink-0 text-center text-xs">📲</span>
                          <span className="text-slate-700">{selectedRes.channel}</span>
                        </div>
                      )}
                    </div>

                    {/* Pago */}
                    <div className="bg-slate-50 rounded-xl p-4 mb-5">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Total</span>
                        <span className="font-semibold text-slate-900">{selectedRes.price_total || 0}€</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-slate-500">Cobrado</span>
                        <span className="font-semibold text-emerald-600">{selectedRes.price_paid || 0}€</span>
                      </div>
                      {pending > 0 && (
                        <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5">
                          <span className="text-slate-500">Pendiente</span>
                          <span className="font-bold text-[#E05A2B]">{pending.toFixed(0)}€</span>
                        </div>
                      )}
                    </div>

                    {selectedRes.notes && (
                      <div className="bg-yellow-50 rounded-xl p-3 mb-5 text-xs text-slate-600">{selectedRes.notes}</div>
                    )}

                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(selectedRes)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      <button onClick={() => handleDelete(selectedRes.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500 hover:bg-red-100 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-lg my-4 shadow-xl"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); setFormError(''); }} className="p-1.5 hover:bg-slate-100 rounded-xl">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Habitación *</label>
                  <select value={form.room_id} onChange={e => setForm(f => ({ ...f, room_id: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]">
                    {PROPERTIES.map(p => (
                      <optgroup key={p.id} label={p.name}>
                        {p.rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {[
                  { label: 'Nombre huésped *', key: 'guest_name', type: 'text', required: true, placeholder: 'John Doe' },
                  { label: 'Teléfono', key: 'guest_phone', type: 'text', placeholder: '+34 600 000 000' },
                  { label: 'Email', key: 'guest_email', type: 'email', placeholder: 'email@ejemplo.com' },
                  { label: 'Nº personas *', key: 'num_persons', type: 'number', required: true },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{f.label}</label>
                    <input required={f.required} type={f.type} placeholder={f.placeholder}
                      value={(form as any)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nacionalidad</label>
                  <select value={form.guest_nationality} onChange={e => setForm(f => ({ ...f, guest_nationality: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]">
                    <option value="">Seleccionar</option>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Check-in *</label>
                  <input required type="date" value={form.check_in}
                    onChange={e => handleCheckInOut('check_in', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Check-out *</label>
                  <input required type="date" value={form.check_out}
                    onChange={e => handleCheckInOut('check_out', e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                </div>

                {/* Calculadora precio */}
                <div className="col-span-2 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-3">💰 Calculadora de precio</p>
                  <div className="grid grid-cols-3 gap-3 items-end">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">€ / noche</label>
                      <input type="number" value={form.price_per_night}
                        onChange={e => handlePricePerNight(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#E05A2B] bg-white" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Noches</label>
                      <div className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white text-slate-700 font-medium">
                        {calcNights(form.check_in, form.check_out) || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Total calculado</label>
                      <div className="border border-[#E05A2B]/40 rounded-xl px-3 py-2 text-sm bg-orange-50 text-[#E05A2B] font-bold">
                        {form.price_per_night && calcNights(form.check_in, form.check_out)
                          ? `${(parseFloat(form.price_per_night) * calcNights(form.check_in, form.check_out)).toFixed(0)}€`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Precio total (€)</label>
                  <input type="number" value={form.price_total}
                    onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Cobrado (€)</label>
                  <input type="number" value={form.price_paid}
                    onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Estado de pago</label>
                  <div className="flex gap-2">
                    {[{ v: 'pending', l: 'Pendiente', c: 'red' }, { v: 'partial', l: 'Parcial', c: 'yellow' }, { v: 'paid', l: 'Pagado', c: 'emerald' }].map(s => (
                      <button key={s.v} type="button" onClick={() => setForm(f => ({ ...f, payment_status: s.v }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${form.payment_status === s.v
                          ? s.v === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                          : s.v === 'partial' ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          : 'bg-red-100 text-red-600 border-red-300'
                          : 'bg-white text-slate-500 border-slate-200'}`}>
                        {s.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B] resize-none"
                    placeholder="Info adicional..." />
                </div>
                {formError && (
                  <div className="col-span-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
                    ⚠️ {formError}
                  </div>
                )}
                <div className="col-span-2 flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold hover:bg-[#c94e23]">
                    {editingId ? 'Guardar' : 'Crear reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}