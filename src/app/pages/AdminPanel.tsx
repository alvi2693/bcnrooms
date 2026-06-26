import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, Plus, Calendar, Users, Euro, ChevronLeft, 
  ChevronRight, Trash2, Edit2, X, Check, Clock
} from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

const ROOMS = [
  { id: 1, name: 'Habitación en Sagrera', slug: 'sagrera' },
  { id: 2, name: 'Habitación en el Born', slug: 'born' },
  { id: 3, name: 'Habitación en Sagrada Família', slug: 'sagrada-familia' },
];

const CHANNELS = ['WhatsApp', 'Facebook', 'Airbnb', 'Booking', 'Instagram', 'Directo'];
const NATIONALITIES = ['Española', 'Francesa', 'Italiana', 'Alemana', 'Inglesa', 'Americana', 'Argentina', 'Mexicana', 'Brasileña', 'Otra'];

interface Reservation {
  id: number;
  room_id: number;
  room_name: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  guest_nationality: string;
  num_persons: number;
  check_in: string;
  check_out: string;
  price_total: number;
  price_paid: number;
  payment_status: string;
  channel: string;
  notes: string;
  created_at: string;
}

const emptyForm = {
  room_id: 1,
  room_name: 'Habitación en Sagrera',
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  guest_nationality: '',
  num_persons: 1,
  check_in: '',
  check_out: '',
  price_total: '',
  price_paid: '',
  payment_status: 'pending',
  channel: 'WhatsApp',
  notes: '',
};

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'calendar' | 'list'>('calendar');
  const [selectedRoom, setSelectedRoom] = useState(0); // 0 = todas
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

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
    } catch {
      setLoginError('Error de conexión con el servidor');
    }
  }

  function handleLogout() {
    setToken('');
    localStorage.removeItem('admin_token');
  }

  async function fetchReservations() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReservations(data);
    } catch {}
    setLoading(false);
  }

  useEffect(() => {
    if (isLoggedIn) fetchReservations();
  }, [isLoggedIn]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const room = ROOMS.find(r => r.id === Number(form.room_id));
    const payload = { ...form, room_name: room?.name, room_id: Number(form.room_id) };
    const url = editingId
      ? `${BACKEND_URL}/admin/reservations/${editingId}`
      : `${BACKEND_URL}/admin/reservations`;
    const method = editingId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    fetchReservations();
  }

  async function handleDelete(id: number) {
    if (!confirm('¿Eliminar esta reserva?')) return;
    await fetch(`${BACKEND_URL}/admin/reservations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchReservations();
  }

  function handleEdit(r: Reservation) {
    setForm({
      room_id: r.room_id,
      room_name: r.room_name,
      guest_name: r.guest_name,
      guest_email: r.guest_email || '',
      guest_phone: r.guest_phone || '',
      guest_nationality: r.guest_nationality || '',
      num_persons: r.num_persons,
      check_in: r.check_in,
      check_out: r.check_out,
      price_total: r.price_total?.toString() || '',
      price_paid: r.price_paid?.toString() || '',
      payment_status: r.payment_status,
      channel: r.channel,
      notes: r.notes || '',
    });
    setEditingId(r.id);
    setShowForm(true);
  }

  // Calendario
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
  };

  const getReservationsForDay = (day: number) => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    return reservations.filter(r => {
      if (selectedRoom > 0 && r.room_id !== selectedRoom) return false;
      return dateStr >= r.check_in && dateStr < r.check_out;
    });
  };

  const roomColors: Record<number, string> = {
    1: 'bg-blue-400',
    2: 'bg-emerald-400',
    3: 'bg-purple-400',
  };

  const filteredReservations = selectedRoom > 0
    ? reservations.filter(r => r.room_id === selectedRoom)
    : reservations;

  const pendingAmount = filteredReservations.reduce((acc, r) => {
    return acc + ((r.price_total || 0) - (r.price_paid || 0));
  }, 0);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-[#E05A2B] p-2.5 rounded-xl">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900">BCN Rooms</h1>
              <p className="text-xs text-slate-400">Panel de administración</p>
            </div>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Usuario</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]"
                placeholder="••••••••"
              />
            </div>
            {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-[#E05A2B] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#c94e23] transition-colors"
            >
              Entrar
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const { firstDay, daysInMonth } = getDaysInMonth(calendarMonth);
  const monthName = calendarMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#E05A2B] p-2 rounded-xl">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Panel Admin — BCN Rooms</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowForm(true); setEditingId(null); setForm(emptyForm); }}
              className="flex items-center gap-2 bg-[#E05A2B] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#c94e23] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva reserva
            </button>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Total reservas</p>
            <p className="text-2xl font-bold text-slate-900">{filteredReservations.length}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Pendiente cobro</p>
            <p className="text-2xl font-bold text-[#E05A2B]">{pendingAmount.toFixed(0)}€</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Cobrado</p>
            <p className="text-2xl font-bold text-emerald-600">
              {filteredReservations.reduce((a, r) => a + (r.price_paid || 0), 0).toFixed(0)}€
            </p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-100">
            <p className="text-xs text-slate-400 mb-1">Huéspedes activos</p>
            <p className="text-2xl font-bold text-slate-900">
              {filteredReservations.filter(r => {
                const today = new Date().toISOString().split('T')[0];
                return r.check_in <= today && r.check_out > today;
              }).length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setSelectedRoom(0)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedRoom === 0 ? 'bg-[#E05A2B] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#E05A2B]'}`}
          >
            Todas
          </button>
          {ROOMS.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRoom(r.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selectedRoom === r.id ? 'bg-[#E05A2B] text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-[#E05A2B]'}`}
            >
              {r.name.replace('Habitación en ', '')}
            </button>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Calendario
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
          >
            Lista de reservas
          </button>
        </div>

        {/* Calendar */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 hover:bg-slate-100 rounded-xl">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h3 className="font-semibold text-slate-900 capitalize">{monthName}</h3>
              <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 hover:bg-slate-100 rounded-xl">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayRes = getReservationsForDay(day);
                const today = new Date();
                const isToday = today.getDate() === day && today.getMonth() === calendarMonth.getMonth() && today.getFullYear() === calendarMonth.getFullYear();
                return (
                  <div key={day} className={`min-h-[60px] rounded-xl p-1 ${isToday ? 'bg-orange-50 border border-[#E05A2B]/30' : 'hover:bg-slate-50'}`}>
                    <span className={`text-xs font-medium block mb-1 ${isToday ? 'text-[#E05A2B]' : 'text-slate-600'}`}>{day}</span>
                    {dayRes.map(r => (
                      <div key={r.id} className={`${roomColors[r.room_id] || 'bg-slate-400'} text-white text-[10px] px-1 py-0.5 rounded mb-0.5 truncate`}>
                        {r.guest_name}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
              {ROOMS.map(r => (
                <div key={r.id} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${roomColors[r.id]}`} />
                  <span className="text-xs text-slate-500">{r.name.replace('Habitación en ', '')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* List */}
        {activeTab === 'list' && (
          <div className="space-y-3">
            {loading && <p className="text-slate-400 text-sm text-center py-8">Cargando...</p>}
            {!loading && filteredReservations.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <p className="text-slate-400 text-sm">No hay reservas aún</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="mt-4 text-[#E05A2B] text-sm font-medium hover:underline"
                >
                  + Añadir primera reserva
                </button>
              </div>
            )}
            {filteredReservations.map(r => {
              const pending = (r.price_total || 0) - (r.price_paid || 0);
              const today = new Date().toISOString().split('T')[0];
              const isActive = r.check_in <= today && r.check_out > today;
              return (
                <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <h4 className="font-semibold text-slate-900">{r.guest_name}</h4>
                        {isActive && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Activo</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full ${r.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : r.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                          {r.payment_status === 'paid' ? 'Pagado' : r.payment_status === 'partial' ? 'Parcial' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-slate-400">Habitación</p>
                          <p className="text-slate-700 font-medium">{r.room_name?.replace('Habitación en ', '')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Fechas</p>
                          <p className="text-slate-700">{r.check_in} → {r.check_out}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Personas / Nac.</p>
                          <p className="text-slate-700">{r.num_persons} · {r.guest_nationality || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">Precio / Pendiente</p>
                          <p className="text-slate-700">{r.price_total || 0}€ / <span className={pending > 0 ? 'text-red-500 font-medium' : 'text-emerald-600'}>{pending.toFixed(0)}€</span></p>
                        </div>
                        {r.guest_phone && <div><p className="text-xs text-slate-400">Teléfono</p><p className="text-slate-700">{r.guest_phone}</p></div>}
                        {r.channel && <div><p className="text-xs text-slate-400">Canal</p><p className="text-slate-700">{r.channel}</p></div>}
                        {r.notes && <div className="col-span-2"><p className="text-xs text-slate-400">Notas</p><p className="text-slate-700 text-xs">{r.notes}</p></div>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(r)} className="p-2 text-slate-400 hover:text-[#E05A2B] hover:bg-orange-50 rounded-xl transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
            onClick={e => { if (e.target === e.currentTarget) { setShowForm(false); setEditingId(null); } }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-2xl my-4 shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <button onClick={() => { setShowForm(false); setEditingId(null); }} className="p-1.5 hover:bg-slate-100 rounded-xl">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[75vh] overflow-y-auto">
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Habitación *</label>
                  <select
                    value={form.room_id}
                    onChange={e => setForm(f => ({ ...f, room_id: Number(e.target.value) }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]"
                  >
                    {ROOMS.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre huésped *</label>
                  <input required value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
                  <input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="+34 600 000 000" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Email</label>
                  <input type="email" value={form.guest_email} onChange={e => setForm(f => ({ ...f, guest_email: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="email@ejemplo.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nacionalidad</label>
                  <select value={form.guest_nationality} onChange={e => setForm(f => ({ ...f, guest_nationality: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]">
                    <option value="">Seleccionar</option>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Nº personas *</label>
                  <input required type="number" min="1" value={form.num_persons} onChange={e => setForm(f => ({ ...f, num_persons: Number(e.target.value) }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <select value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]">
                    {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Check-in *</label>
                  <input required type="date" value={form.check_in} onChange={e => setForm(f => ({ ...f, check_in: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Check-out *</label>
                  <input required type="date" value={form.check_out} onChange={e => setForm(f => ({ ...f, check_out: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Precio total (€)</label>
                  <input type="number" value={form.price_total} onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Precio cobrado (€)</label>
                  <input type="number" value={form.price_paid} onChange={e => setForm(f => ({ ...f, price_paid: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Estado de pago</label>
                  <div className="flex gap-2">
                    {[{ value: 'pending', label: 'Pendiente', color: 'red' }, { value: 'partial', label: 'Parcial', color: 'yellow' }, { value: 'paid', label: 'Pagado', color: 'emerald' }].map(s => (
                      <button key={s.value} type="button" onClick={() => setForm(f => ({ ...f, payment_status: s.value }))}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.payment_status === s.value ? `bg-${s.color}-100 text-${s.color}-700 border-${s.color}-300` : 'bg-white text-slate-500 border-slate-200'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B] resize-none" placeholder="Cualquier información adicional..." />
                </div>
                <div className="sm:col-span-2 flex gap-3 pt-2">
                  <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-2.5 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold hover:bg-[#c94e23] transition-colors">
                    {editingId ? 'Guardar cambios' : 'Crear reserva'}
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