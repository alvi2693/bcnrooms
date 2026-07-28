import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, X, Users, Calendar, CalendarDays, Search } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

// Mismo mapa de pisos que AdminPanel. Se duplica a propósito: este panel
// tiene que poder desplegarse sin arrastrar nada del panel de administración.
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

const ALL_ROOMS = PROPERTIES.flatMap(p => p.rooms.map(r => ({ ...r, propertyName: p.name, color: p.color })));
const CHANNELS = ['WhatsApp', 'Facebook', 'Airbnb', 'Booking', 'Instagram', 'Directo'];

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

// Lo único que devuelve /calendar/reservations. Sin dinero, sin contacto.
interface ReservaCalendario {
  id: number;
  room_id: number;
  room_name: string;
  guest_name: string;
  num_persons: number;
  check_in: string;
  check_out: string;
}

const emptyForm = {
  room_id: 1,
  guest_name: '',
  guest_phone: '',
  guest_nationality: '',
  num_persons: 1,
  check_in: '',
  check_out: '',
  price_per_night: '',
  price_total: '',
  channel: 'WhatsApp',
  notes: '',
};

function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

// Fecha local, no UTC: toISOString adelanta un día por la noche en verano.
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
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

export function CalendarPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('calendar_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<ReservaCalendario[]>([]);
  const [selectedRes, setSelectedRes] = useState<ReservaCalendario | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState('sagrera');

  const COL_W = 52;
  const ROW_H = 52;
  const LABEL_W = 140;
  const DIAS_ATRAS = 7;
  const DIAS_ADELANTE = 240;
  const today = toDateStr(new Date());
  const isLoggedIn = !!token;

  const days: Date[] = useMemo(() => {
    const origen = addDays(new Date(), -DIAS_ATRAS);
    const arr: Date[] = [];
    for (let i = 0; i < DIAS_ATRAS + DIAS_ADELANTE; i++) arr.push(addDays(origen, i));
    return arr;
  }, [today]);

  const calScrollRef = useRef<HTMLDivElement>(null);
  const [mesVisible, setMesVisible] = useState('');

  function scrollHastaHoy(smooth = true) {
    const el = calScrollRef.current;
    if (!el) return;
    const idx = days.findIndex(d => toDateStr(d) === today);
    if (idx < 0) return;
    el.scrollTo({ left: Math.max(0, idx * COL_W - COL_W * 2), behavior: smooth ? 'smooth' : 'auto' });
  }

  useEffect(() => {
    if (!isLoggedIn) return;
    const el = calScrollRef.current;
    if (!el) return;
    const actualizarMes = () => {
      const idx = Math.min(days.length - 1, Math.max(0, Math.round(el.scrollLeft / COL_W)));
      setMesVisible(days[idx].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    };
    scrollHastaHoy(false);
    actualizarMes();
    el.addEventListener('scroll', actualizarMes, { passive: true });
    return () => el.removeEventListener('scroll', actualizarMes);
  }, [isLoggedIn, days]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch(`${BACKEND_URL}/calendar/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) { setToken(data.token); localStorage.setItem('calendar_token', data.token); }
      else setLoginError('Contraseña incorrecta');
    } catch { setLoginError('No se pudo conectar. Inténtalo otra vez en unos segundos.'); }
  }

  function handleLogout() { setToken(''); localStorage.removeItem('calendar_token'); }

  async function fetchReservations() {
    try {
      const res = await fetch(`${BACKEND_URL}/calendar/reservations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReservations(data.map((r: any) => ({
        ...r,
        check_in: r.check_in ? r.check_in.split('T')[0] : r.check_in,
        check_out: r.check_out ? r.check_out.split('T')[0] : r.check_out,
        num_persons: Number(r.num_persons),
      })));
    } catch {}
  }

  useEffect(() => { if (isLoggedIn) fetchReservations(); }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const room = ALL_ROOMS.find(r => r.id === Number(form.room_id));
      const payload = {
        ...form,
        room_id: Number(form.room_id),
        room_name: room ? `${room.propertyName} - ${room.name}` : '',
        num_persons: Number(form.num_persons),
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        price_total: form.price_total ? Number(form.price_total) : null,
      };
      const res = await fetch(`${BACKEND_URL}/calendar/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error || 'No se pudo guardar la reserva'); return; }
      setShowForm(false);
      setForm(emptyForm);
      fetchReservations();
    } catch {
      setFormError('No se pudo conectar con el servidor');
    } finally {
      setSaving(false);
    }
  }

  function abrirFormulario(roomId: number, fecha: string) {
    const p = PROPERTIES.find(pr => pr.rooms.some(r => r.id === roomId));
    if (p) setSelectedProperty(p.id);
    setForm({ ...emptyForm, room_id: roomId, check_in: fecha, check_out: toDateStr(addDays(new Date(fecha + 'T00:00:00'), 1)) });
    setFormError('');
    setShowForm(true);
  }

  // El total se recalcula solo al tocar el precio por noche o las fechas,
  // pero sigue siendo editable a mano por si se pacta otra cifra.
  function handlePPN(val: string) {
    const n = calcNights(form.check_in, form.check_out);
    const pn = parseFloat(val) || 0;
    setForm(f => ({ ...f, price_per_night: val, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : f.price_total }));
  }

  function handleFecha(key: 'check_in' | 'check_out', val: string) {
    setForm(f => {
      const u = { ...f, [key]: val };
      const n = calcNights(key === 'check_in' ? val : f.check_in, key === 'check_out' ? val : f.check_out);
      const pn = parseFloat(f.price_per_night) || 0;
      return { ...u, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : u.price_total };
    });
  }

  // Misma geometría que el panel de administración: medios días en los
  // encadenamientos y diente diagonal solo cuando hay reserva vecina.
  function getResBar(res: ReservaCalendario): { left: number; width: number; clipStart: boolean; clipEnd: boolean } | null {
    const firstDay = toDateStr(days[0]);
    const lastDay = toDateStr(days[days.length - 1]);
    if (res.check_out < firstDay || res.check_in > lastDay) return null;

    const idxOf = (dateStr: string) => days.findIndex(d => toDateStr(d) === dateStr);
    const ciIdx = idxOf(res.check_in);
    const coIdx = idxOf(res.check_out);

    const salienteEnMiEntrada = reservations.some(
      o => o.id !== res.id && o.room_id === res.room_id && o.check_out === res.check_in
    );
    const entranteEnMiSalida = reservations.some(
      o => o.id !== res.id && o.room_id === res.room_id && o.check_in === res.check_out
    );

    const startPx = ciIdx >= 0 ? (ciIdx + (salienteEnMiEntrada ? 0.5 : 0)) * COL_W : 0;
    const endPx = coIdx >= 0 ? (coIdx + (entranteEnMiSalida ? 0.5 : 1)) * COL_W : days.length * COL_W;

    return {
      left: startPx,
      width: Math.max(endPx - startPx, COL_W * 0.5),
      clipStart: ciIdx >= 0 && salienteEnMiEntrada,
      clipEnd: coIdx >= 0 && entranteEnMiSalida,
    };
  }

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#E05A2B] p-2.5 rounded-xl"><CalendarDays className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="font-bold text-slate-900">BCN Rooms</h1>
            <p className="text-xs text-slate-400">Calendario de disponibilidad</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-6 mt-4">
          Consulta qué habitaciones están libres y crea reservas nuevas.
        </p>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E05A2B]"
              placeholder="••••••••" autoFocus />
          </div>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button type="submit" className="w-full bg-[#E05A2B] text-white py-3 rounded-xl text-sm font-semibold">Entrar</button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-8">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#E05A2B] p-1.5 rounded-lg"><CalendarDays className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-900 text-sm">Calendario</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => abrirFormulario(1, today)}
              className="flex items-center gap-1.5 bg-[#E05A2B] text-white px-3 py-2 rounded-xl text-xs font-semibold">
              <Plus className="w-3.5 h-3.5" /> Nueva reserva
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-3 py-3 border-b border-slate-100">
            <div className="min-w-0">
              <span className="text-sm font-semibold text-slate-800 capitalize">{mesVisible || '—'}</span>
              <p className="text-[10px] text-slate-400">Desliza a los lados. Toca un hueco libre para reservar.</p>
            </div>
            <button onClick={() => scrollHastaHoy()}
              className="flex-shrink-0 text-xs px-3 py-1.5 bg-[#E05A2B] text-white rounded-lg font-medium">
              Ir a hoy
            </button>
          </div>

          <div ref={calScrollRef} className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div style={{ width: LABEL_W + COL_W * days.length }}>

              <div className="flex border-b border-slate-100">
                <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '2px 0 4px -2px rgba(15,23,42,0.10)' }}
                  className="sticky left-0 z-30 bg-white border-r border-slate-100" />
                {days.map((d, i) => {
                  const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div key={i} style={{ width: COL_W, minWidth: COL_W }}
                      className={`text-center py-1.5 border-r border-slate-100 ${isToday ? 'bg-orange-50' : isWE ? 'bg-slate-50' : ''}`}>
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
                    <div style={{ width: LABEL_W, minWidth: LABEL_W, background: prop.light, boxShadow: '2px 0 4px -2px rgba(15,23,42,0.10)' }}
                      className="sticky left-0 z-30 px-3 py-1.5 border-r border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                    </div>
                    <div className="flex-1" style={{ height: 24 }} />
                  </div>
                  {prop.rooms.map(room => {
                    const visibleRes = reservations.filter(r => r.room_id === room.id
                      && r.check_in <= toDateStr(days[days.length - 1])
                      && r.check_out >= toDateStr(days[0]));
                    return (
                      <div key={room.id} className="flex border-b border-slate-100 relative" style={{ height: ROW_H }}>
                        <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '2px 0 4px -2px rgba(15,23,42,0.10)' }}
                          className="sticky left-0 z-30 flex items-center px-3 border-r border-slate-100 bg-white">
                          <div>
                            <p className="text-[11px] font-medium text-slate-700">{room.name}</p>
                            <p className="text-[9px] text-slate-400">{room.type === 'double' ? 'Doble' : 'Mediana'}</p>
                          </div>
                        </div>
                        <div className="relative flex-1">
                          <div className="absolute inset-0 flex">
                            {days.map((d, i) => {
                              const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                              const ocupado = reservations.some(r => r.room_id === room.id && r.check_in <= ds && r.check_out >= ds);
                              return (
                                <div key={i} style={{ width: COL_W, minWidth: COL_W }}
                                  onClick={() => { if (!ocupado) abrirFormulario(room.id, ds); }}
                                  className={`h-full border-r border-slate-100 group ${!ocupado ? 'cursor-pointer hover:bg-blue-50/40' : ''} ${isToday ? 'bg-orange-50/50' : isWE ? 'bg-slate-50/30' : ''}`}>
                                  {!ocupado && (
                                    <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className="text-[10px] text-slate-400">+</span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {visibleRes.map(res => {
                            const bar = getResBar(res);
                            if (!bar) return null;
                            const tooth = COL_W * 0.5;
                            const { clipStart, clipEnd } = bar;
                            const clipPath = (clipStart || clipEnd)
                              ? `polygon(${clipStart ? `${tooth}px 0` : '0 0'}, 100% 0, ${clipEnd ? `calc(100% - ${tooth}px) 100%` : '100% 100%'}, 0 100%)`
                              : undefined;
                            return (
                              <button key={res.id} onClick={() => setSelectedRes(res)}
                                className="absolute top-1.5 bottom-1.5 flex items-center gap-1 text-white text-[11px] font-medium shadow-sm hover:opacity-90 truncate"
                                style={{
                                  left: bar.left + (clipStart ? 0 : 2),
                                  width: bar.width - (clipStart ? 0 : 2) - (clipEnd ? 0 : 2),
                                  background: prop.color,
                                  zIndex: 10,
                                  clipPath,
                                  borderRadius: 8,
                                  paddingLeft: clipStart ? tooth + 4 : 8,
                                  paddingRight: clipEnd ? tooth + 4 : 8,
                                }}>
                                <span className="truncate">{res.guest_name}</span>
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

        <p className="text-[11px] text-slate-400 mt-3 px-1">
          Anota el precio acordado al crear la reserva. El cobro lo registra Álvaro cuando entre el dinero.
        </p>
      </div>

      {/* Detalle de reserva — sin importes */}
      <AnimatePresence>
        {selectedRes && (() => {
          const room = ALL_ROOMS.find(r => r.id === selectedRes.room_id);
          const nights = calcNights(selectedRes.check_in, selectedRes.check_out);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
              onClick={() => setSelectedRes(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: room?.color }} />
                    <span className="text-xs text-slate-500">{room?.propertyName} · {room?.name}</span>
                  </div>
                  <button onClick={() => setSelectedRes(null)} className="p-1.5 hover:bg-slate-100 rounded-lg">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{selectedRes.guest_name}</h3>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>{fmtDate(selectedRes.check_in)} → {fmtDate(selectedRes.check_out)} · {nights} {nights === 1 ? 'noche' : 'noches'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{selectedRes.num_persons} {selectedRes.num_persons === 1 ? 'persona' : 'personas'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedRes(null)}
                  className="w-full mt-5 py-3 border border-slate-200 rounded-xl text-sm text-slate-600">
                  Cerrar
                </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Nueva reserva */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">Nueva reserva</h3>
                <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-slate-100 rounded-xl">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button"
                        onClick={() => { setSelectedProperty(p.id); setForm(f => ({ ...f, room_id: p.rooms[0].id })); }}
                        className="py-2.5 rounded-xl text-xs font-semibold border transition-all"
                        style={selectedProperty === p.id
                          ? { background: p.color, color: 'white', borderColor: p.color }
                          : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
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
                    <input required value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="John Doe" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
                    <input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="+34 600 000 000" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Personas *</label>
                    <input required type="number" min="1" value={form.num_persons}
                      onChange={e => setForm(f => ({ ...f, num_persons: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nacionalidad</label>
                    <NationalitySearch value={form.guest_nationality} onChange={v => setForm(f => ({ ...f, guest_nationality: v }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Check-in *</label>
                    <input required type="date" value={form.check_in}
                      onChange={e => handleFecha('check_in', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Check-out *</label>
                    <input required type="date" value={form.check_out}
                      onChange={e => handleFecha('check_out', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>
                {/* Precio acordado */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <p className="text-xs font-semibold text-slate-600 mb-3">Precio acordado</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">€/noche</label>
                      <input type="number" min="0" step="0.01" value={form.price_per_night}
                        onChange={e => handlePPN(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white focus:outline-none focus:border-[#E05A2B]"
                        placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Noches</label>
                      <div className="border border-slate-200 rounded-xl px-2 py-2 text-sm bg-white text-slate-700 font-medium">
                        {calcNights(form.check_in, form.check_out) || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Total (€)</label>
                      <input type="number" min="0" step="0.01" value={form.price_total}
                        onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))}
                        className="w-full border border-[#E05A2B]/40 rounded-xl px-2 py-2 text-sm bg-orange-50 text-[#E05A2B] font-bold focus:outline-none focus:border-[#E05A2B]"
                        placeholder="0" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    Pon el €/noche y el total se calcula solo. Puedes cambiar el total a mano si pactaste otra cifra.
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, channel: c }))}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.channel === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B] resize-none"
                    placeholder="Precio acordado, hora de llegada, lo que haga falta..." />
                </div>
                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">{formError}</div>
                )}
                <div className="flex gap-3 pb-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-3 border border-slate-200 rounded-xl text-sm text-slate-600">Cancelar</button>
                  <button type="submit" disabled={saving}
                    className="flex-1 py-3 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                    {saving ? 'Guardando...' : 'Crear reserva'}
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