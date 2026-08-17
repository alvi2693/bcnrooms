import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, X, Users, Calendar, CalendarDays, Home, Settings, Trash2, Edit2,
         ChevronLeft, ChevronRight, Loader2, Wallet, Tag, CheckCircle, UserX, Building2, Receipt } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

const COLORES = ['#3B82F6', '#10B981', '#8B5CF6', '#E05A2B', '#EC4899', '#F59E0B', '#14B8A6', '#6366F1'];
const TIPOS = [
  { id: 'single', label: 'Individual', pax: 1 },
  { id: 'double', label: 'Doble',      pax: 2 },
  { id: 'medium', label: 'Mediana',    pax: 2 },
  { id: 'triple', label: 'Triple',     pax: 3 },
  { id: 'suite',  label: 'Suite',      pax: 4 },
];
const CANALES = ['Directo', 'WhatsApp', 'Airbnb', 'Booking', 'Instagram', 'Facebook'];
const METODOS = ['Efectivo', 'Transferencia', 'Bizum', 'PayPal', 'Tarjeta'];
const METODOS_EFECTIVO = ['Efectivo'];
const CATEGORIAS = ['🧹 Limpieza', '🔧 Mantenimiento', '💡 Suministros', '🛋️ Mobiliario', '🏠 Alquiler', '📋 Otros'];

interface Room {
  id: number; property_id: number; name: string;
  room_type: string; max_persons: number; sort_order: number;
}
interface Property {
  id: number; name: string; color: string; address?: string | null;
  sort_order: number; rooms: Room[];
}
interface Rate {
  id: number; room_id: number; label?: string | null;
  valid_from?: string | null; valid_to?: string | null; pax?: number | null;
  net_price: number; min_net_price?: number | null; min_nights: number;
}
interface Account { id: number; name: string; slug: string; currency?: string }

interface Cuota {
  id: number; reservation_id: number; period_start: string;
  amount: number; paid_at?: string | null; method?: string | null;
  guest_name?: string; room_id?: number; room_name?: string;
}

interface Gasto {
  id: number; property_ref: number; property_name?: string;
  category: string; description: string; amount: number; date: string;
  payment_method?: string;
}

interface Reserva {
  id: number; room_id: number; room_name: string; guest_name: string;
  guest_phone?: string | null; guest_nationality?: string | null;
  num_persons: number; check_in: string; check_out: string;
  price_total?: number; price_per_night?: number; price_paid?: number;
  payment_status?: string;
  deposit_amount?: number; deposit_method?: string;
  checkin_amount?: number; checkin_method?: string;
  channel?: string; notes?: string | null; no_show?: boolean;
  rental_type?: string; monthly_rate?: number;
}

function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

// Fecha local, nunca toISOString: en verano adelanta un día por la noche.
function toDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function parseYMD(s: string): Date { return new Date(String(s).split('T')[0] + 'T00:00:00'); }
function onlyDate(v?: string | null): string { return v ? String(v).split('T')[0] : ''; }
function fmtDate(s: string): string {
  if (!s) return '';
  return parseYMD(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function noches(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.ceil((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86400000);
}
function mesActual(): string { return toDateStr(new Date()).slice(0, 7); }
function sumarMeses(ym: string, d: number): string {
  const [y, m] = ym.split('-').map(Number);
  const dt = new Date(y, m - 1 + d, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
}
function fmtMes(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}
function esEfectivo(m?: string): boolean { return METODOS_EFECTIVO.includes((m || '').trim()); }
function esMensual(r: { rental_type?: string }): boolean { return r.rental_type === 'monthly'; }

// Suma meses conservando el día, ajustando si el mes destino es más corto.
function sumarMesesFecha(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  const ultimo = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  dt.setDate(Math.min(d, ultimo));
  return toDateStr(dt);
}
function fmtMesCorto(f: string): string {
  if (!f) return '';
  return parseYMD(f).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

function pendienteDe(r: Reserva): number {
  if (r.no_show) return 0;
  return Math.max(0, (r.price_total || 0) - (r.price_paid || 0));
}

// Área táctil de 44px, el mínimo cómodo en móvil.
function IconBtn({ onClick, title, className = '', children }: {
  onClick: (e: React.MouseEvent) => void; title: string; className?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={title} title={title}
      className={`w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform ${className}`}>
      {children}
    </button>
  );
}

const formVacio = {
  room_id: 0, guest_name: '', guest_phone: '', guest_nationality: '',
  num_persons: 1, check_in: '', check_out: '',
  price_per_night: '', price_total: '',
  deposit_amount: '', deposit_method: 'Transferencia',
  checkin_amount: '', checkin_method: 'Efectivo',
  rental_type: 'nightly', monthly_rate: '', months_count: '1',
  channel: 'Directo', notes: '',
};

export function ClientPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('client_token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [entrando, setEntrando] = useState(false);

  const [account, setAccount] = useState<Account | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [rates, setRates] = useState<Rate[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [cuotaModal, setCuotaModal] = useState<Cuota | null>(null);
  const [cuotaMetodo, setCuotaMetodo] = useState('Efectivo');
  const [cuotaImporte, setCuotaImporte] = useState('');
  const [cargando, setCargando] = useState(true);

  const [tab, setTab] = useState<'calendar' | 'list' | 'expenses' | 'money' | 'settings'>('calendar');

  const [showGasto, setShowGasto] = useState(false);
  const [editGasto, setEditGasto] = useState<number | null>(null);
  const [gastoForm, setGastoForm] = useState({
    property_ref: 0, category: '🔧 Mantenimiento', description: '',
    amount: '', date: toDateStr(new Date()), payment_method: 'Efectivo',
  });

  // Efectivo contado en el cuadre, guardado en el dispositivo
  const [conteos, setConteos] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('client_conteos') || '{}'); } catch { return {}; }
  });
  function setConteo(key: string, val: string) {
    setConteos(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem('client_conteos', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  const [busy, setBusy] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(formVacio);
  const [formError, setFormError] = useState('');
  const [selected, setSelected] = useState<Reserva | null>(null);

  const [confirmar, setConfirmar] = useState<{
    titulo: string; mensaje: string; etiqueta: string; peligro?: boolean; accion: () => Promise<void>;
  } | null>(null);

  const [mesDinero, setMesDinero] = useState(() => mesActual());

  const isLogged = !!token;
  const rooms = useMemo(() => properties.flatMap(p => p.rooms.map(r => ({ ...r, prop: p }))), [properties]);
  const activas = useMemo(() => reservas.filter(r => !r.no_show), [reservas]);
  const sinConfigurar = !cargando && isLogged && rooms.length === 0;

  // ── Llamadas ──
  async function api(path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`${BACKEND_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (entrando) return;
    setEntrando(true); setLoginError('');
    try {
      const res = await fetch(`${BACKEND_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setLoginError(data.error || 'Correo o contraseña incorrectos');
        return;
      }
      localStorage.setItem('client_token', data.token);
      setToken(data.token);
    } catch {
      setLoginError('No se pudo conectar. El servidor puede estar despertando; prueba otra vez.');
    } finally { setEntrando(false); }
  }

  function salir() {
    setToken(''); localStorage.removeItem('client_token');
    setAccount(null); setProperties([]); setRates([]); setReservas([]);
  }

  async function cargarTodo() {
    setCargando(true);
    try {
      const [cfgRes, resRes, gasRes, cuoRes] = await Promise.all([
        api('/client/config'),
        api('/client/reservations'),
        api('/client/expenses'),
        api('/client/rent-payments'),
      ]);
      if (cfgRes.status === 401 || resRes.status === 401) { salir(); return; }

      const cfg = await cfgRes.json();
      setAccount(cfg.account || null);
      setProperties((cfg.properties || []).map((p: any) => ({
        ...p, rooms: (p.rooms || []).map((r: any) => ({ ...r, max_persons: Number(r.max_persons) || 2 })),
      })));
      setRates(cfg.rates || []);

      const data = await resRes.json();
      setReservas(data.map((r: any) => ({
        ...r,
        check_in: onlyDate(r.check_in), check_out: onlyDate(r.check_out),
        price_total: Number(r.price_total) || 0,
        price_per_night: Number(r.price_per_night) || 0,
        price_paid: Number(r.price_paid) || 0,
        deposit_amount: Number(r.deposit_amount) || 0,
        checkin_amount: Number(r.checkin_amount) || 0,
        num_persons: Number(r.num_persons) || 1,
        no_show: !!r.no_show,
        rental_type: r.rental_type || 'nightly',
        monthly_rate: Number(r.monthly_rate) || 0,
      })));

      if (gasRes.ok) {
        const g = await gasRes.json();
        setGastos(g.map((x: any) => ({
          ...x, amount: Number(x.amount) || 0, date: onlyDate(x.date),
          property_ref: Number(x.property_ref) || 0,
        })));
      }

      if (cuoRes.ok) {
        const c = await cuoRes.json();
        setCuotas(c.map((x: any) => ({
          ...x, amount: Number(x.amount) || 0,
          period_start: onlyDate(x.period_start),
          paid_at: x.paid_at ? onlyDate(x.paid_at) : null,
          room_id: Number(x.room_id),
        })));
      }
    } catch {}
    finally { setCargando(false); }
  }

  useEffect(() => { if (isLogged) cargarTodo(); }, [isLogged]);

  // ── Calendario ──
  const COL_W = 52, ROW_H = 52, LABEL_W = 132, DIAS_ADELANTE = 210, PASO_ATRAS = 21;
  const hoy = toDateStr(new Date());
  const [diasAtras, setDiasAtras] = useState(0);

  const dias: Date[] = useMemo(() => {
    const origen = addDays(new Date(), -diasAtras);
    const arr: Date[] = [];
    for (let i = 0; i < diasAtras + DIAS_ADELANTE; i++) arr.push(addDays(origen, i));
    return arr;
  }, [diasAtras, hoy]);

  const tramosMes = useMemo(() => {
    const g: { key: string; label: string; startIdx: number; count: number }[] = [];
    dias.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const ult = g[g.length - 1];
      if (ult && ult.key === key) ult.count++;
      else g.push({ key, label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }), startIdx: i, count: 1 });
    });
    return g;
  }, [dias]);

  const idxMes = useMemo(() => {
    const m: Record<string, number> = {};
    tramosMes.forEach((t, i) => { m[t.key] = i; });
    return m;
  }, [tramosMes]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [mesVisible, setMesVisible] = useState('');
  const ajuste = useRef(0);

  function irAHoy(smooth = true) {
    const el = scrollRef.current;
    if (!el) return;
    const i = dias.findIndex(d => toDateStr(d) === hoy);
    if (i < 0) return;
    el.scrollTo({ left: Math.max(0, i * COL_W - COL_W), behavior: smooth ? 'smooth' : 'auto' });
  }

  function verPasado() {
    ajuste.current = PASO_ATRAS * COL_W;
    setDiasAtras(d => d + PASO_ATRAS);
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !ajuste.current) return;
    const delta = ajuste.current; ajuste.current = 0;
    el.scrollLeft += delta;
    el.scrollTo({ left: Math.max(0, el.scrollLeft - delta), behavior: 'smooth' });
  }, [diasAtras]);

  useEffect(() => {
    if (tab !== 'calendar') return;
    const el = scrollRef.current;
    if (!el) return;
    const actualizar = () => {
      const i = Math.min(dias.length - 1, Math.max(0, Math.round(el.scrollLeft / COL_W)));
      setMesVisible(dias[i].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    };
    if (diasAtras === 0) irAHoy(false);
    actualizar();
    el.addEventListener('scroll', actualizar, { passive: true });
    return () => el.removeEventListener('scroll', actualizar);
  }, [tab, dias, rooms.length]);

  function barraDe(r: Reserva) {
    const primero = toDateStr(dias[0]);
    const ultimo = toDateStr(dias[dias.length - 1]);
    if (r.check_out < primero || r.check_in > ultimo) return null;

    const idxDe = (s: string) => dias.findIndex(d => toDateStr(d) === s);
    const ci = idxDe(r.check_in), co = idxDe(r.check_out);

    const saleAlEntrar = activas.some(o => o.id !== r.id && o.room_id === r.room_id && o.check_out === r.check_in);
    const entraAlSalir = activas.some(o => o.id !== r.id && o.room_id === r.room_id && o.check_in === r.check_out);

    const left = ci >= 0 ? (ci + (saleAlEntrar ? 0.5 : 0)) * COL_W : 0;
    const right = co >= 0 ? (co + (entraAlSalir ? 0.5 : 1)) * COL_W : dias.length * COL_W;

    return {
      left, width: Math.max(right - left, COL_W * 0.5),
      clipStart: ci >= 0 && saleAlEntrar,
      clipEnd: co >= 0 && entraAlSalir,
    };
  }

  // ── Guardar reserva ──
  async function guardarReserva(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setFormError(''); setBusy(true);
    try {
      const payload = {
        ...form,
        room_id: Number(form.room_id),
        num_persons: Number(form.num_persons),
        price_total: form.price_total ? Number(form.price_total) : null,
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        deposit_amount: Number(form.deposit_amount) || 0,
        checkin_amount: Number(form.checkin_amount) || 0,
        rental_type: form.rental_type,
        monthly_rate: form.rental_type === 'monthly' ? Number(form.monthly_rate) || 0 : null,
        months_count: form.rental_type === 'monthly' ? Number(form.months_count) || 1 : null,
      };
      const res = await api(
        editId ? `/client/reservations/${editId}` : '/client/reservations',
        { method: editId ? 'PUT' : 'POST', body: JSON.stringify(payload) }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.error || `El servidor respondió ${res.status}`); return; }
      setShowForm(false); setEditId(null); setForm(formVacio);
      cargarTodo();
    } catch {
      setFormError('No se pudo conectar con el servidor');
    } finally { setBusy(false); }
  }

  function abrirNueva(roomId: number, fecha: string) {
    setForm({ ...formVacio, room_id: roomId, check_in: fecha, check_out: toDateStr(addDays(parseYMD(fecha), 1)) });
    setEditId(null); setFormError(''); setShowForm(true);
  }

  function editar(r: Reserva) {
    setForm({
      room_id: r.room_id, guest_name: r.guest_name, guest_phone: r.guest_phone || '',
      guest_nationality: r.guest_nationality || '', num_persons: r.num_persons,
      check_in: r.check_in, check_out: r.check_out,
      price_per_night: r.price_per_night ? String(r.price_per_night) : '',
      price_total: r.price_total ? String(r.price_total) : '',
      deposit_amount: r.deposit_amount ? String(r.deposit_amount) : '',
      deposit_method: r.deposit_method || 'Transferencia',
      checkin_amount: r.checkin_amount ? String(r.checkin_amount) : '',
      checkin_method: r.checkin_method || 'Efectivo',
      rental_type: r.rental_type || 'nightly',
      monthly_rate: r.monthly_rate ? String(r.monthly_rate) : '',
      months_count: String(cuotasDe(r.id).length || 1),
      channel: r.channel || 'Directo', notes: r.notes || '',
    });
    setEditId(r.id); setSelected(null); setFormError(''); setShowForm(true);
  }

  function pedirBorrar(r: Reserva) {
    setConfirmar({
      titulo: 'Eliminar reserva',
      mensaje: `Se borrará la reserva de ${r.guest_name} y lo cobrado dejará de contar. Si el huésped no vino pero dejó una señal, usa "No vino" en su lugar.`,
      etiqueta: 'Eliminar', peligro: true,
      accion: async () => {
        const res = await api(`/client/reservations/${r.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        setSelected(null); cargarTodo();
      },
    });
  }

  function pedirNoShow(r: Reserva) {
    setConfirmar({
      titulo: 'Marcar que no vino',
      mensaje: `La reserva se conserva y los ${(r.price_paid || 0).toFixed(0)}€ cobrados siguen contando. La habitación queda libre y puedes volver a venderla.`,
      etiqueta: 'Sí, no vino',
      accion: async () => {
        const res = await api(`/client/reservations/${r.id}/no-show`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        setSelected(null); cargarTodo();
      },
    });
  }

  function pedirDeshacerNoShow(r: Reserva) {
    setConfirmar({
      titulo: 'Deshacer',
      mensaje: `La reserva de ${r.guest_name} vuelve a ocupar la habitación. Si esas fechas ya se vendieron, no será posible.`,
      etiqueta: 'Deshacer',
      accion: async () => {
        const res = await api(`/client/reservations/${r.id}/undo-no-show`, { method: 'PATCH' });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || `El servidor respondió ${res.status}`);
        setSelected(null); cargarTodo();
      },
    });
  }

  // ── Pisos y habitaciones ──
  // Muestra lo que respondió el servidor, no un texto genérico:
  // sin el motivo real, un fallo aquí es imposible de diagnosticar.
  async function errorDe(res: Response, porDefecto: string): Promise<string> {
    try {
      const d = await res.json();
      return d?.error ? `${d.error} (${res.status})` : `${porDefecto} (${res.status})`;
    } catch {
      return `${porDefecto} (${res.status})`;
    }
  }

  async function crearPiso(nombre: string, color: string) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api('/client/properties', { method: 'POST', body: JSON.stringify({ name: nombre, color }) });
      if (res.status === 401) { alert('Tu sesión caducó. Vuelve a entrar.'); salir(); return; }
      if (!res.ok) { alert(await errorDe(res, 'No se pudo crear el piso')); return; }
      await cargarTodo();
    } catch {
      alert('No se pudo conectar con el servidor');
    } finally { setBusy(false); }
  }

  async function crearHabitacion(propertyId: number, nombre: string, tipo: string, pax: number) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api('/client/rooms', {
        method: 'POST',
        body: JSON.stringify({ property_id: propertyId, name: nombre, room_type: tipo, max_persons: pax }),
      });
      if (res.status === 401) { alert('Tu sesión caducó. Vuelve a entrar.'); salir(); return; }
      if (!res.ok) { alert(await errorDe(res, 'No se pudo crear la habitación')); return; }
      await cargarTodo();
    } catch {
      alert('No se pudo conectar con el servidor');
    } finally { setBusy(false); }
  }

  async function renombrarHabitacion(id: number, nombre: string) {
    const res = await api(`/client/rooms/${id}`, { method: 'PUT', body: JSON.stringify({ name: nombre }) });
    if (res.ok) cargarTodo();
  }

  function pedirBorrarHabitacion(r: Room) {
    setConfirmar({
      titulo: 'Quitar habitación',
      mensaje: `Se quitará "${r.name}". Si tiene reservas, se archiva para no perder el historial y deja de aparecer en el calendario.`,
      etiqueta: 'Quitar', peligro: true,
      accion: async () => {
        const res = await api(`/client/rooms/${r.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        cargarTodo();
      },
    });
  }

  function pedirBorrarPiso(p: Property) {
    setConfirmar({
      titulo: 'Quitar piso',
      mensaje: `Se archivará "${p.name}" y sus ${p.rooms.length} ${p.rooms.length === 1 ? 'habitación' : 'habitaciones'}. El historial de reservas se conserva.`,
      etiqueta: 'Quitar', peligro: true,
      accion: async () => {
        const res = await api(`/client/properties/${p.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        cargarTodo();
      },
    });
  }

  // ── Mensualidades ──
  const cuotasDe = (resId: number) =>
    cuotas.filter(c => c.reservation_id === resId).sort((a, b) => a.period_start.localeCompare(b.period_start));

  const cuotasVencidas = useMemo(
    () => cuotas.filter(c => !c.paid_at && c.period_start <= hoy).sort((a, b) => a.period_start.localeCompare(b.period_start)),
    [cuotas, hoy]
  );

  async function confirmarCobroCuota() {
    if (!cuotaModal || busy) return;
    setBusy(true);
    try {
      const res = await api(`/client/rent-payments/${cuotaModal.id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ method: cuotaMetodo, amount: cuotaImporte === '' ? undefined : Number(cuotaImporte) }),
      });
      if (!res.ok) { alert(await errorDe(res, 'No se pudo registrar el cobro')); return; }
      setCuotaModal(null); setCuotaImporte('');
      cargarTodo();
    } catch {
      alert('No se pudo conectar con el servidor');
    } finally { setBusy(false); }
  }

  function pedirDeshacerCuota(c: Cuota) {
    setConfirmar({
      titulo: 'Deshacer cobro',
      mensaje: `La mensualidad de ${fmtMesCorto(c.period_start)} volverá a figurar como pendiente.`,
      etiqueta: 'Deshacer',
      accion: async () => {
        const res = await api(`/client/rent-payments/${c.id}/unpay`, { method: 'PATCH' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        cargarTodo();
      },
    });
  }

  function pedirProrroga(r: Reserva) {
    setConfirmar({
      titulo: 'Añadir un mes',
      mensaje: `Se alarga la estancia de ${r.guest_name} un mes más y se crea una mensualidad de ${(r.monthly_rate || 0).toFixed(0)}€ pendiente de cobro.`,
      etiqueta: 'Añadir mes',
      accion: async () => {
        const res = await api(`/client/reservations/${r.id}/extend-month`, {
          method: 'POST', body: JSON.stringify({}),
        });
        const d = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(d.error || `El servidor respondió ${res.status}`);
        setSelected(null); cargarTodo();
      },
    });
  }

  // Cambia entre noches y meses, recalculando salida y total.
  function setModalidad(tipo: 'nightly' | 'monthly') {
    setForm(f => {
      if (tipo === 'nightly') return { ...f, rental_type: 'nightly', monthly_rate: '', months_count: '1' };
      const meses = Number(f.months_count) || 1;
      const rate = Number(f.monthly_rate) || 0;
      return {
        ...f, rental_type: 'monthly',
        check_out: f.check_in ? sumarMesesFecha(f.check_in, meses) : f.check_out,
        price_total: rate > 0 ? (rate * meses).toFixed(2) : f.price_total,
        price_per_night: '', checkin_amount: '',
      };
    });
  }

  function setMeses(n: number) {
    const meses = Math.max(1, n);
    setForm(f => {
      const rate = Number(f.monthly_rate) || 0;
      return {
        ...f, months_count: String(meses),
        check_out: f.check_in ? sumarMesesFecha(f.check_in, meses) : f.check_out,
        price_total: rate > 0 ? (rate * meses).toFixed(2) : f.price_total,
      };
    });
  }

  function setImporteMes(val: string) {
    setForm(f => {
      const meses = Number(f.months_count) || 1;
      const rate = parseFloat(val) || 0;
      return { ...f, monthly_rate: val, price_total: rate > 0 ? (rate * meses).toFixed(2) : f.price_total };
    });
  }

  // ── Gastos ──
  async function guardarGasto(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const cuerpo = { ...gastoForm, property_ref: Number(gastoForm.property_ref), amount: Number(gastoForm.amount) };
      const res = await api(
        editGasto ? `/client/expenses/${editGasto}` : '/client/expenses',
        { method: editGasto ? 'PUT' : 'POST', body: JSON.stringify(cuerpo) }
      );
      if (!res.ok) { alert(await errorDe(res, 'No se pudo guardar el gasto')); return; }
      setShowGasto(false); setEditGasto(null);
      setGastoForm(g => ({ ...g, description: '', amount: '' }));
      cargarTodo();
    } catch {
      alert('No se pudo conectar con el servidor');
    } finally { setBusy(false); }
  }

  function pedirBorrarGasto(g: Gasto) {
    setConfirmar({
      titulo: 'Eliminar gasto',
      mensaje: `Se borrará "${g.description}" de ${g.amount.toFixed(0)}€ y dejará de restar en tu balance.`,
      etiqueta: 'Eliminar', peligro: true,
      accion: async () => {
        const res = await api(`/client/expenses/${g.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        cargarTodo();
      },
    });
  }

  // ── Tarifas ──
  async function guardarTarifa(roomId: number, neto: string, minimo: string) {
    const existente = rates.find(t => t.room_id === roomId && !t.valid_from && !t.valid_to);
    const cuerpo = {
      room_id: roomId,
      net_price: Number(neto) || 0,
      min_net_price: minimo ? Number(minimo) : null,
      label: 'Base',
    };
    if (!(cuerpo.net_price > 0)) return;
    const res = existente
      ? await api(`/client/rates/${existente.id}`, { method: 'PUT', body: JSON.stringify(cuerpo) })
      : await api('/client/rates', { method: 'POST', body: JSON.stringify(cuerpo) });
    if (res.ok) cargarTodo();
  }

  const tarifaDe = (roomId: number) => rates.find(t => t.room_id === roomId && !t.valid_from && !t.valid_to);

  // Al elegir habitación y fechas, propone el precio de su tarifa base.
  function elegirHabitacion(roomId: number) {
    setForm(f => {
      const t = tarifaDe(roomId);
      const n = noches(f.check_in, f.check_out);
      if (!t) return { ...f, room_id: roomId };
      return {
        ...f, room_id: roomId,
        price_per_night: String(t.net_price),
        price_total: n > 0 ? (t.net_price * n).toFixed(2) : f.price_total,
      };
    });
  }

  function cambiarFecha(campo: 'check_in' | 'check_out', valor: string) {
    setForm(f => {
      const u = { ...f, [campo]: valor };
      if (u.rental_type === 'monthly') {
        // La salida la marcan los meses, no el usuario.
        if (campo === 'check_in' && valor) u.check_out = sumarMesesFecha(valor, Number(u.months_count) || 1);
        return u;
      }
      const n = noches(campo === 'check_in' ? valor : f.check_in, campo === 'check_out' ? valor : f.check_out);
      const ppn = parseFloat(f.price_per_night) || 0;
      return { ...u, price_total: n > 0 && ppn > 0 ? (ppn * n).toFixed(2) : u.price_total };
    });
  }

  function cambiarPPN(valor: string) {
    const n = noches(form.check_in, form.check_out);
    const ppn = parseFloat(valor) || 0;
    setForm(f => ({ ...f, price_per_night: valor, price_total: n > 0 && ppn > 0 ? (ppn * n).toFixed(2) : f.price_total }));
  }

  // ── Login ──
  if (!isLogged) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-[#E05A2B] p-2.5 rounded-xl"><Building2 className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="font-bold text-slate-900">Mis habitaciones</h1>
            <p className="text-xs text-slate-400">Gestiona tu calendario y tus reservas</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4 mt-6">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Usuario</label>
            {/* type="text" y no "email": admite tanto un usuario suelto
                como un correo, y el navegador no bloquea el envío. */}
            <input type="text" autoCapitalize="none" autoCorrect="off" autoComplete="username"
              spellCheck={false} value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E05A2B]"
              placeholder="tu usuario" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label>
            <input type="password" autoComplete="current-password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#E05A2B]"
              placeholder="••••••••" />
          </div>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button type="submit" disabled={entrando}
            className="w-full bg-[#E05A2B] text-white h-12 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {entrando && <Loader2 className="w-4 h-4 animate-spin" />}
            {entrando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  if (cargando) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 text-[#E05A2B] animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-400">Cargando tus datos...</p>
      </div>
    </div>
  );

  // ── Alta inicial ──
  if (sinConfigurar) return (
    <Onboarding
      account={account}
      properties={properties}
      busy={busy}
      onCrearPiso={crearPiso}
      onCrearHabitacion={crearHabitacion}
      onListo={() => cargarTodo()}
      onSalir={salir}
    />
  );

  const totalCobrado = reservas.reduce((a, r) => a + (r.price_paid || 0), 0);
  const totalPendiente = reservas.reduce((a, r) => a + pendienteDe(r), 0);
  const ocupadasHoy = activas.filter(r => r.check_in <= hoy && r.check_out > hoy).length;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-[#E05A2B] p-1.5 rounded-lg flex-shrink-0"><Building2 className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-900 text-sm truncate">{account?.name || 'Mis habitaciones'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setForm(formVacio); setEditId(null); setFormError(''); setShowForm(true); }}
              className="flex items-center gap-1.5 bg-[#E05A2B] text-white px-3 h-11 rounded-xl text-xs font-semibold active:scale-95 transition-transform">
              <Plus className="w-4 h-4" /> Reserva
            </button>
            <IconBtn onClick={salir} title="Salir" className="text-slate-400"><LogOut className="w-4 h-4" /></IconBtn>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
        {[
          { l: 'Ocupadas hoy', v: `${ocupadasHoy}/${rooms.length}`, c: 'text-slate-900' },
          { l: 'Cobrado', v: `${totalCobrado.toFixed(0)}€`, c: 'text-emerald-600' },
          { l: 'Pendiente', v: `${totalPendiente.toFixed(0)}€`, c: 'text-[#E05A2B]' },
        ].map(s => (
          <div key={s.l} className="bg-white rounded-2xl p-3 border border-slate-100">
            <p className="text-[10px] text-slate-400">{s.l}</p>
            <p className={`text-lg font-bold ${s.c}`}>{s.v}</p>
          </div>
        ))}
      </div>

      <div className="px-4 py-3">

        {/* Mensualidades vencidas: lo primero que hay que cobrar */}
        {cuotasVencidas.length > 0 && (tab === 'calendar' || tab === 'money') && (
          <div className="bg-white rounded-2xl border border-indigo-200 p-4 mb-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">
              Mensualidades por cobrar ({cuotasVencidas.length})
            </p>
            <div className="space-y-2">
              {cuotasVencidas.map(c => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{c.guest_name}</p>
                    <p className="text-xs text-slate-500 capitalize">{c.room_name} · {fmtMesCorto(c.period_start)}</p>
                  </div>
                  <span className="text-sm font-bold text-indigo-600 flex-shrink-0">{c.amount.toFixed(0)}€</span>
                  <button onClick={() => { setCuotaModal(c); setCuotaMetodo('Efectivo'); setCuotaImporte(String(c.amount)); }}
                    className="flex-shrink-0 h-11 px-3 rounded-xl bg-indigo-500 text-white text-xs font-semibold active:scale-95 transition-transform">
                    Cobrar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALENDARIO */}
        {tab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-slate-100">
              <IconBtn onClick={verPasado} title="Ver fechas anteriores" className="text-slate-500 bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </IconBtn>
              <div className="min-w-0 flex-1 text-center">
                <span className="text-sm font-semibold text-slate-800 capitalize">{mesVisible || '—'}</span>
                <p className="text-[10px] text-slate-400">Toca un hueco libre para reservar</p>
              </div>
              <button onClick={() => irAHoy()}
                className="flex-shrink-0 h-11 px-3 bg-[#E05A2B] text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform">
                Hoy
              </button>
            </div>

            <div ref={scrollRef} className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: LABEL_W + COL_W * dias.length }}>

                <div className="flex border-b-2 border-slate-200">
                  <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                    className="sticky left-0 z-30 bg-white border-r border-slate-200" />
                  {tramosMes.map((t, i) => (
                    <div key={t.key}
                      style={{ width: COL_W * t.count, minWidth: COL_W * t.count, background: i % 2 === 0 ? '#F8FAFC' : '#EEF2F7' }}
                      className="py-1.5 border-r-2 border-slate-300 overflow-hidden">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 whitespace-nowrap capitalize">{t.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex border-b border-slate-100">
                  <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                    className="sticky left-0 z-30 bg-white border-r border-slate-200" />
                  {dias.map((d, i) => {
                    const ds = toDateStr(d), esHoy = ds === hoy, finde = d.getDay() === 0 || d.getDay() === 6;
                    const uno = d.getDate() === 1;
                    const par = idxMes[`${d.getFullYear()}-${d.getMonth()}`] % 2 === 0;
                    return (
                      <div key={i}
                        style={{
                          width: COL_W, minWidth: COL_W,
                          borderLeft: uno ? '2px solid #94A3B8' : undefined,
                          background: esHoy ? '#FFF7ED' : finde ? (par ? '#F1F5F9' : '#E7ECF3') : (par ? '#FFFFFF' : '#F8FAFC'),
                        }}
                        className="text-center py-1.5 border-r border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                        <div className={`text-xs font-bold ${esHoy ? 'text-[#E05A2B]' : 'text-slate-700'}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {properties.map(prop => (
                  <div key={prop.id}>
                    <div className="flex items-center border-b border-slate-100" style={{ background: `${prop.color}18` }}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W, background: `${prop.color}18`, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                        className="sticky left-0 z-30 px-3 py-1.5 border-r border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                      </div>
                      <div className="flex-1" style={{ height: 24 }} />
                    </div>
                    {prop.rooms.map(room => {
                      const visibles = activas.filter(r => r.room_id === room.id
                        && r.check_in <= toDateStr(dias[dias.length - 1])
                        && r.check_out >= toDateStr(dias[0]));
                      return (
                        <div key={room.id} className="flex border-b border-slate-100 relative" style={{ height: ROW_H }}>
                          <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                            className="sticky left-0 z-30 flex items-center px-3 border-r border-slate-200 bg-white">
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 truncate">{room.name}</p>
                              <p className="text-[9px] text-slate-400">
                                {TIPOS.find(t => t.id === room.room_type)?.label || room.room_type}
                                {tarifaDe(room.id) && <span className="text-emerald-500"> · {tarifaDe(room.id)!.net_price}€</span>}
                              </p>
                            </div>
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-0 flex">
                              {dias.map((d, i) => {
                                const ds = toDateStr(d), esHoy = ds === hoy, finde = d.getDay() === 0 || d.getDay() === 6;
                                const uno = d.getDate() === 1;
                                const par = idxMes[`${d.getFullYear()}-${d.getMonth()}`] % 2 === 0;
                                const ocupado = activas.some(r => r.room_id === room.id && r.check_in <= ds && r.check_out >= ds);
                                return (
                                  <div key={i}
                                    style={{
                                      width: COL_W, minWidth: COL_W,
                                      borderLeft: uno ? '2px solid #94A3B8' : undefined,
                                      background: esHoy ? 'rgba(255,237,213,0.5)' : finde ? (par ? 'rgba(241,245,249,0.6)' : 'rgba(226,232,240,0.6)') : (par ? undefined : 'rgba(248,250,252,0.9)'),
                                    }}
                                    onClick={() => { if (!ocupado) abrirNueva(room.id, ds); }}
                                    className={`h-full border-r border-slate-100 group ${!ocupado ? 'cursor-pointer active:bg-blue-100' : ''}`}>
                                    {!ocupado && <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-slate-400">+</span></div>}
                                  </div>
                                );
                              })}
                            </div>
                            {visibles.map(r => {
                              const b = barraDe(r);
                              if (!b) return null;
                              const pend = pendienteDe(r);
                              const pagada = pend <= 0 && (r.price_total || 0) > 0;
                              const diente = COL_W * 0.5;
                              const clip = (b.clipStart || b.clipEnd)
                                ? `polygon(${b.clipStart ? `${diente}px 0` : '0 0'}, 100% 0, ${b.clipEnd ? `calc(100% - ${diente}px) 100%` : '100% 100%'}, 0 100%)`
                                : undefined;
                              return (
                                <button key={r.id} onClick={() => setSelected(r)}
                                  className="absolute top-1.5 bottom-1.5 flex items-center gap-1 text-white text-[11px] font-medium shadow-sm active:opacity-80 truncate"
                                  style={{
                                    left: b.left + (b.clipStart ? 0 : 2),
                                    width: b.width - (b.clipStart ? 0 : 2) - (b.clipEnd ? 0 : 2),
                                    background: esMensual(r) ? '#6366F1' : prop.color,
                                    backgroundImage: esMensual(r)
                                      ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 8px, transparent 8px 16px)'
                                      : undefined,
                                    zIndex: 10, clipPath: clip, borderRadius: 8,
                                    paddingLeft: b.clipStart ? diente + 4 : 8,
                                    paddingRight: b.clipEnd ? diente + 4 : 8,
                                  }}>
                                  <span className="truncate">{r.guest_name}</span>
                                  {esMensual(r)
                                    ? <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[9px]">mes</span>
                                    : pagada
                                    ? <span className="flex-shrink-0 bg-white/30 rounded px-1 text-[9px]">✓</span>
                                    : <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[9px]">{pend.toFixed(0)}€</span>}
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

        {/* LISTA */}
        {tab === 'list' && (() => {
          const ordenadas = [...reservas].sort((a, b) => b.check_in.localeCompare(a.check_in));
          return (
            <div className="space-y-3">
              {ordenadas.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                  <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Todavía no tienes reservas</p>
                </div>
              )}
              {ordenadas.map(r => {
                const room = rooms.find(rm => rm.id === r.room_id);
                const pend = pendienteDe(r);
                const pasada = r.check_out < hoy;
                return (
                  <div key={r.id} onClick={() => setSelected(r)}
                    className={`bg-white rounded-2xl border border-slate-100 p-4 cursor-pointer ${pasada ? 'opacity-60' : ''}`}>
                    <div className="flex items-start gap-3">
                      <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: room?.prop.color || '#999' }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold text-slate-900 text-sm">{r.guest_name}</span>
                          {r.no_show && <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">No vino</span>}
                          {pend <= 0 && (r.price_total || 0) > 0 && !r.no_show &&
                            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Pagado</span>}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{room?.name || r.room_name}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">📅 {fmtDate(r.check_in)} → {fmtDate(r.check_out)} · 👥 {r.num_persons}</span>
                          <div className="text-right">
                            <span className="text-sm font-semibold text-slate-900">{(r.price_total || 0).toFixed(0)}€</span>
                            {pend > 0 && <span className="text-xs text-[#E05A2B] ml-1">−{pend.toFixed(0)}€</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* GASTOS */}
        {tab === 'expenses' && (() => {
          const delMes = gastos.filter(g => g.date.slice(0, 7) === mesDinero)
            .sort((a, b) => b.date.localeCompare(a.date));
          const total = delMes.reduce((a, g) => a + g.amount, 0);
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 flex items-center justify-between px-2 py-2">
                <IconBtn onClick={() => setMesDinero(m => sumarMeses(m, -1))} title="Mes anterior" className="text-slate-500 bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </IconBtn>
                <p className="text-sm font-semibold text-slate-800 capitalize">{fmtMes(mesDinero)}</p>
                <IconBtn onClick={() => setMesDinero(m => sumarMeses(m, 1))} title="Mes siguiente" className="text-slate-500 bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </IconBtn>
              </div>

              <div className="bg-white rounded-2xl border border-red-100 p-4 text-center">
                <p className="text-[10px] text-slate-400 mb-1">Gastos del mes</p>
                <p className="text-3xl font-bold text-red-500">{total.toFixed(0)}€</p>
              </div>

              <button onClick={() => {
                  setGastoForm(g => ({ ...g, property_ref: properties[0]?.id || 0, date: toDateStr(new Date()) }));
                  setEditGasto(null); setShowGasto(true);
                }}
                className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 active:scale-[0.98] transition-transform">
                <Plus className="w-4 h-4" /> Añadir gasto
              </button>

              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                {delMes.length === 0 && <p className="text-xs text-slate-400 text-center py-6">Sin gastos este mes</p>}
                <div className="divide-y divide-slate-100">
                  {delMes.map(g => (
                    <div key={g.id} className="flex items-center gap-2 p-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="text-xs text-slate-500">{g.category}</span>
                          <span className="text-[10px] text-slate-400">{fmtDate(g.date)}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{g.payment_method}</span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 truncate">{g.description}</p>
                        <p className="text-[10px] text-slate-400">{g.property_name}</p>
                      </div>
                      <span className="text-sm font-bold text-red-500 flex-shrink-0">−{g.amount.toFixed(0)}€</span>
                      <IconBtn onClick={() => {
                          setGastoForm({
                            property_ref: g.property_ref, category: g.category, description: g.description,
                            amount: String(g.amount), date: g.date, payment_method: g.payment_method || 'Efectivo',
                          });
                          setEditGasto(g.id); setShowGasto(true);
                        }} title="Editar" className="text-slate-400 bg-slate-50">
                        <Edit2 className="w-4 h-4" />
                      </IconBtn>
                      <IconBtn onClick={() => pedirBorrarGasto(g)} title="Eliminar" className="text-red-400 bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </IconBtn>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* DINERO */}
        {tab === 'money' && (() => {
          // Cada cobro va a su sitio según cómo se pagó: efectivo por un
          // lado, todo lo demás al banco.
          type Mov = { key: string; fecha: string; concepto: string; metodo: string; importe: number; efectivo: boolean };
          const movs: Mov[] = [];
          reservas.forEach(r => {
            const dep = Number(r.deposit_amount) || 0;
            const chk = Number(r.checkin_amount) || 0;
            const marca = r.no_show ? ' · no vino' : '';
            if (dep > 0) movs.push({
              key: `d${r.id}`, fecha: r.check_in, concepto: r.guest_name,
              metodo: `Reserva · ${r.deposit_method || '—'}${marca}`, importe: dep, efectivo: esEfectivo(r.deposit_method),
            });
            if (chk > 0) movs.push({
              key: `c${r.id}`, fecha: r.check_in, concepto: r.guest_name,
              metodo: `Entrada · ${r.checkin_method || '—'}${marca}`, importe: chk, efectivo: esEfectivo(r.checkin_method),
            });
          });

          // Mensualidades ya cobradas.
          cuotas.forEach(c => {
            if (!c.paid_at) return;
            movs.push({
              key: `q${c.id}`, fecha: c.paid_at, concepto: c.guest_name || 'Renta mensual',
              metodo: `Mensualidad ${fmtMesCorto(c.period_start)} · ${c.method || '—'}`,
              importe: c.amount, efectivo: esEfectivo(c.method || undefined),
            });
          });

          // Los gastos salen de la caja con la que se pagaron.
          gastos.forEach(g => {
            movs.push({
              key: `g${g.id}`, fecha: g.date, concepto: g.description,
              metodo: `${g.category} · ${g.payment_method || '—'}`,
              importe: -g.amount, efectivo: esEfectivo(g.payment_method),
            });
          });

          const delMes = movs.filter(m => m.fecha.slice(0, 7) === mesDinero).sort((a, b) => a.fecha.localeCompare(b.fecha));
          const previos = movs.filter(m => m.fecha.slice(0, 7) < mesDinero);

          const efectivo = delMes.filter(m => m.efectivo).reduce((a, m) => a + m.importe, 0);
          const banco = delMes.filter(m => !m.efectivo).reduce((a, m) => a + m.importe, 0);
          const inicialEfectivo = previos.filter(m => m.efectivo).reduce((a, m) => a + m.importe, 0);
          const inicialBanco = previos.filter(m => !m.efectivo).reduce((a, m) => a + m.importe, 0);
          const esteMes = mesDinero === mesActual();

          const cajas = [
            { id: 'efectivo', label: '💵 Efectivo', inicial: inicialEfectivo, neto: efectivo, etiqueta: 'Efectivo contado' },
            { id: 'banco',    label: '🏦 Banco',    inicial: inicialBanco,    neto: banco,    etiqueta: 'Saldo real en el banco' },
          ];

          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 flex items-center justify-between px-2 py-2">
                <IconBtn onClick={() => setMesDinero(m => sumarMeses(m, -1))} title="Mes anterior" className="text-slate-500 bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </IconBtn>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800 capitalize">{fmtMes(mesDinero)}</p>
                  {!esteMes && <button onClick={() => setMesDinero(mesActual())} className="text-[10px] text-[#E05A2B] font-medium">Volver al mes actual</button>}
                </div>
                <IconBtn onClick={() => setMesDinero(m => sumarMeses(m, 1))} title="Mes siguiente" className="text-slate-500 bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </IconBtn>
              </div>

              {cajas.map(c => {
                const teorico = c.inicial + c.neto;
                const key = `${mesDinero}:${c.id}`;
                const contadoRaw = conteos[key] ?? '';
                const contado = contadoRaw === '' ? null : Number(contadoRaw);
                const dif = contado === null ? null : contado - teorico;
                const suyos = delMes.filter(m => (c.id === 'efectivo') === m.efectivo);

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                      <span className="text-sm font-semibold text-slate-800">{c.label}</span>
                      <span className={`text-sm font-bold ${c.neto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {c.neto >= 0 ? '+' : ''}{c.neto.toFixed(0)}€
                      </span>
                    </div>

                    <div className="px-4 py-3 flex justify-between text-xs border-b border-slate-100">
                      <span className="text-slate-500">Saldo al empezar el mes</span>
                      <span className="font-semibold text-slate-700">{c.inicial.toFixed(0)}€</span>
                    </div>

                    <div className="px-4 py-3">
                      {suyos.length === 0 && <p className="text-xs text-slate-400">Sin movimientos este mes</p>}
                      <div className="space-y-1.5">
                        {suyos.map(m => (
                          <div key={m.key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-12 flex-shrink-0">{fmtDate(m.fecha)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{m.concepto}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.metodo}</p>
                            </div>
                            <span className={`text-xs font-semibold flex-shrink-0 ${m.importe >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                              {m.importe >= 0 ? '+' : '−'}{Math.abs(m.importe).toFixed(0)}€
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">Debería haber</span>
                        <span className="font-bold text-slate-900">{teorico.toFixed(0)}€</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 flex-1">{c.etiqueta}</label>
                        <input type="number" inputMode="decimal" value={contadoRaw}
                          onChange={e => setConteo(key, e.target.value)} placeholder="0"
                          className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right bg-white focus:outline-none focus:border-[#E05A2B]" />
                      </div>
                      {dif !== null && (
                        <div className={`flex justify-between items-center rounded-xl px-3 py-2.5 ${Math.abs(dif) < 0.5 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          <span className={`text-xs font-semibold ${Math.abs(dif) < 0.5 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Math.abs(dif) < 0.5 ? 'Cuadra' : dif > 0 ? 'Sobra' : 'Falta'}
                          </span>
                          <span className={`text-sm font-bold ${Math.abs(dif) < 0.5 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Math.abs(dif) < 0.5 ? '0€' : `${dif > 0 ? '+' : ''}${dif.toFixed(0)}€`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between text-sm p-4 bg-slate-900 rounded-2xl">
                <span className="font-semibold text-white">Total al cierre</span>
                <span className="font-bold text-lg text-white">
                  {(inicialEfectivo + inicialBanco + efectivo + banco).toFixed(0)}€
                </span>
              </div>

              <p className="text-[10px] text-slate-400 px-1">El importe contado se guarda en este dispositivo, no en el servidor.</p>
            </div>
          );
        })()}

        {/* AJUSTES */}
        {tab === 'settings' && (
          <Ajustes
            properties={properties}
            rates={rates}
            busy={busy}
            onCrearPiso={crearPiso}
            onCrearHabitacion={crearHabitacion}
            onRenombrarHabitacion={renombrarHabitacion}
            onBorrarHabitacion={pedirBorrarHabitacion}
            onBorrarPiso={pedirBorrarPiso}
            onGuardarTarifa={guardarTarifa}
          />
        )}
      </div>

      {/* Navegación */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {[
            { id: 'calendar', icon: CalendarDays, label: 'Calendario' },
            { id: 'list', icon: Calendar, label: 'Reservas' },
            { id: 'expenses', icon: Receipt, label: 'Gastos' },
            { id: 'money', icon: Wallet, label: 'Cuadre' },
            { id: 'settings', icon: Settings, label: 'Ajustes' },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex-1 flex flex-col items-center justify-center h-14 gap-0.5 transition-colors ${tab === t.id ? 'text-[#E05A2B]' : 'text-slate-400'}`}>
              <t.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Detalle */}
      <AnimatePresence>
        {selected && (() => {
          const room = rooms.find(r => r.id === selected.room_id);
          const pend = pendienteDe(selected);
          const n = noches(selected.check_in, selected.check_out);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
              onClick={() => setSelected(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: room?.prop.color }} />
                    <span className="text-xs text-slate-500 truncate">{room?.prop.name} · {room?.name}</span>
                  </div>
                  <IconBtn onClick={() => setSelected(null)} title="Cerrar" className="text-slate-400 -mr-2"><X className="w-5 h-5" /></IconBtn>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{selected.guest_name}</h3>
                  {selected.no_show && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">No vino</span>}
                  {esMensual(selected) && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Por meses</span>}
                </div>

                <div className="space-y-2.5 mb-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>
                      {fmtDate(selected.check_in)} → {fmtDate(selected.check_out)} · {esMensual(selected)
                        ? `${cuotasDe(selected.id).length} ${cuotasDe(selected.id).length === 1 ? 'mes' : 'meses'}`
                        : `${n} ${n === 1 ? 'noche' : 'noches'}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{selected.num_persons} {selected.num_persons === 1 ? 'persona' : 'personas'}</span>
                  </div>
                  {selected.guest_phone && (
                    <div className="flex items-center gap-3">
                      <span className="w-4 text-center text-xs">📞</span>
                      <a href={`tel:${selected.guest_phone}`} className="text-blue-600">{selected.guest_phone}</a>
                    </div>
                  )}
                  {selected.channel && <div className="flex items-center gap-3"><span className="w-4 text-center text-xs">📲</span><span>{selected.channel}</span></div>}
                </div>

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-500">Total</span>
                    <span className="font-semibold">{(selected.price_total || 0).toFixed(0)}€</span>
                  </div>
                  {(selected.deposit_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-blue-600">Señal ({selected.deposit_method})</span>
                      <span className="font-semibold text-blue-600">{(selected.deposit_amount || 0).toFixed(0)}€</span>
                    </div>
                  )}
                  {(selected.checkin_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-emerald-600">Al entrar ({selected.checkin_method})</span>
                      <span className="font-semibold text-emerald-600">{(selected.checkin_amount || 0).toFixed(0)}€</span>
                    </div>
                  )}
                  {esMensual(selected) && cuotasDe(selected.id).some(c => c.paid_at) && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-indigo-600">Mensualidades cobradas</span>
                      <span className="font-semibold text-indigo-600">
                        {cuotasDe(selected.id).filter(c => c.paid_at).reduce((a, c) => a + c.amount, 0).toFixed(0)}€
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">{selected.no_show ? 'Retenido' : 'Pendiente'}</span>
                    <span className={`font-bold ${pend > 0 ? 'text-[#E05A2B]' : 'text-emerald-600'}`}>
                      {selected.no_show ? `${(selected.price_paid || 0).toFixed(0)}€` : pend > 0 ? `${pend.toFixed(0)}€` : '✓ Pagado'}
                    </span>
                  </div>
                </div>

                {esMensual(selected) && (() => {
                  const cs = cuotasDe(selected.id);
                  return (
                    <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-700">
                          Mensualidades · {(selected.monthly_rate || 0).toFixed(0)}€/mes
                        </p>
                        <span className="text-[10px] text-slate-500">
                          {cs.filter(c => c.paid_at).length}/{cs.length} cobradas
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {cs.map(c => (
                          <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2">
                            <span className="text-xs font-medium text-slate-700 capitalize flex-1 min-w-0 truncate">{fmtMesCorto(c.period_start)}</span>
                            <span className="text-xs font-semibold text-slate-800">{c.amount.toFixed(0)}€</span>
                            {c.paid_at ? (
                              <button onClick={() => pedirDeshacerCuota(c)}
                                className="h-9 px-2.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-semibold active:scale-95 transition-transform">
                                ✓ {c.method || 'Cobrada'}
                              </button>
                            ) : (
                              <button onClick={() => { setCuotaModal(c); setCuotaMetodo('Efectivo'); setCuotaImporte(String(c.amount)); }}
                                className="h-9 px-2.5 rounded-lg bg-indigo-500 text-white text-[10px] font-semibold active:scale-95 transition-transform">
                                Cobrar
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {!selected.no_show && (
                        <button onClick={() => pedirProrroga(selected)}
                          className="w-full mt-2.5 h-11 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-xs font-semibold active:scale-[0.98] transition-transform">
                          + Añadir un mes
                        </button>
                      )}
                    </div>
                  );
                })()}

                {selected.notes && <div className="bg-yellow-50 rounded-xl p-3 mb-4 text-xs text-slate-600 whitespace-pre-wrap">{selected.notes}</div>}

                {selected.no_show ? (
                  <button onClick={() => pedirDeshacerNoShow(selected)}
                    className="w-full mb-3 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium active:scale-[0.98] transition-transform">
                    Deshacer «no vino»
                  </button>
                ) : (
                  <button onClick={() => pedirNoShow(selected)}
                    className="w-full mb-3 h-12 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                    <UserX className="w-4 h-4" /> No vino · liberar habitación
                  </button>
                )}

                <div className="flex gap-2">
                  <button onClick={() => editar(selected)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 active:scale-[0.98] transition-transform">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => pedirBorrar(selected)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 bg-red-50 border border-red-100 rounded-xl text-sm text-red-500 active:scale-[0.98] transition-transform">
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Formulario de reserva */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) { setShowForm(false); setEditId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">{editId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <IconBtn onClick={() => { if (!busy) { setShowForm(false); setEditId(null); } }} title="Cerrar" className="text-slate-500 -mr-2">
                  <X className="w-5 h-5" />
                </IconBtn>
              </div>

              <form onSubmit={guardarReserva} className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Habitación *</label>
                  <div className="space-y-2">
                    {properties.map(p => (
                      <div key={p.id}>
                        <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: p.color }}>{p.name}</p>
                        <div className="flex flex-wrap gap-2">
                          {p.rooms.map(r => (
                            <button key={r.id} type="button" onClick={() => elegirHabitacion(r.id)}
                              className={`h-11 px-3 rounded-xl text-xs font-medium border transition-colors ${form.room_id === r.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                              {r.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Nombre *</label>
                    <input required value={form.guest_name} onChange={e => setForm(f => ({ ...f, guest_name: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="Nombre del huésped" />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Teléfono</label>
                    <input value={form.guest_phone} onChange={e => setForm(f => ({ ...f, guest_phone: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="+34 600 000 000" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Modalidad</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setModalidad('nightly')}
                      className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${form.rental_type !== 'monthly' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                      Por noches
                    </button>
                    <button type="button" onClick={() => setModalidad('monthly')}
                      className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${form.rental_type === 'monthly' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-500 border-slate-200'}`}>
                      Por meses
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Personas *</label>
                    <input required type="number" min="1" value={form.num_persons}
                      onChange={e => setForm(f => ({ ...f, num_persons: Number(e.target.value) }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Entrada *</label>
                    <input required type="date" value={form.check_in} onChange={e => cambiarFecha('check_in', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-2 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">
                      {form.rental_type === 'monthly' ? 'Salida (auto)' : 'Salida *'}
                    </label>
                    <input required type="date" value={form.check_out} readOnly={form.rental_type === 'monthly'}
                      onChange={e => cambiarFecha('check_out', e.target.value)}
                      className={`w-full border rounded-xl px-2 py-3 text-sm focus:outline-none ${form.rental_type === 'monthly' ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-200 focus:border-[#E05A2B]'}`} />
                  </div>
                </div>

                {form.rental_type === 'monthly' ? (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">🔑 Alquiler por meses</p>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1.5 block">¿Cuántos meses?</label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 6, 12].map(n => (
                          <button key={n} type="button" onClick={() => setMeses(n)}
                            className={`h-11 w-11 rounded-xl text-xs font-bold border transition-colors ${(Number(form.months_count) || 1) === n ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {n}
                          </button>
                        ))}
                        <input type="number" min="1" value={form.months_count}
                          onChange={e => setMeses(Number(e.target.value))}
                          className="h-11 w-20 border border-slate-200 rounded-xl px-3 text-sm text-center bg-white focus:outline-none focus:border-indigo-500" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Importe por mes (€) *</label>
                      <input required type="number" min="0" step="0.01" value={form.monthly_rate}
                        onChange={e => setImporteMes(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm bg-white focus:outline-none focus:border-indigo-500" placeholder="0" />
                    </div>
                    {Number(form.monthly_rate) > 0 && (
                      <div className="bg-white rounded-xl p-3 text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-500">{Number(form.months_count) || 1} × {Number(form.monthly_rate).toFixed(0)}€</span>
                          <span className="font-bold text-indigo-600">{(Number(form.monthly_rate) * (Number(form.months_count) || 1)).toFixed(0)}€</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Periodo</span>
                          <span className="font-medium text-slate-700">{fmtDate(form.check_in)} → {fmtDate(form.check_out)}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Se crearán {Number(form.months_count) || 1} mensualidades pendientes. Las vas cobrando desde la ficha.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-600 mb-3">Precio</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">€/noche</label>
                        <input type="number" value={form.price_per_night} onChange={e => cambiarPPN(e.target.value)}
                          className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Noches</label>
                        <div className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white text-slate-700 font-medium text-center">
                          {noches(form.check_in, form.check_out) || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Total</label>
                        <input type="number" value={form.price_total} onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))}
                          className="w-full border border-[#E05A2B]/40 rounded-xl px-2 py-2.5 text-sm bg-orange-50 text-[#E05A2B] font-bold text-center focus:outline-none" placeholder="0" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Señal cobrada</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Importe (€)</label>
                      <input type="number" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Método</label>
                      <div className="flex flex-wrap gap-1.5">
                        {METODOS.slice(0, 4).map(m => (
                          <button key={m} type="button" onClick={() => setForm(f => ({ ...f, deposit_method: m }))}
                            className={`h-9 px-2 rounded-lg text-[10px] font-medium border transition-colors ${form.deposit_method === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {form.rental_type !== 'monthly' && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs font-semibold text-slate-700 mb-3">Cobrado al entrar</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Importe (€)</label>
                      <input type="number" value={form.checkin_amount} onChange={e => setForm(f => ({ ...f, checkin_amount: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Método</label>
                      <div className="flex flex-wrap gap-1.5">
                        {METODOS.slice(0, 4).map(m => (
                          <button key={m} type="button" onClick={() => setForm(f => ({ ...f, checkin_method: m }))}
                            className={`h-9 px-2 rounded-lg text-[10px] font-medium border transition-colors ${form.checkin_method === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {CANALES.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, channel: c }))}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${form.channel === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B] resize-none"
                    placeholder="Hora de llegada, lo que haga falta..." />
                </div>

                {formError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠️ {formError}</div>}

                <div className="flex gap-3 pb-2 sticky bottom-0 bg-white pt-2">
                  <button type="button" disabled={busy} onClick={() => { setShowForm(false); setEditId(null); }}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button type="submit" disabled={busy || !form.room_id}
                    className="flex-1 h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : editId ? 'Guardar' : 'Crear reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cobrar mensualidad */}
      <AnimatePresence>
        {cuotaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) setCuotaModal(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="font-semibold text-slate-900 mb-1">Cobrar mensualidad</h3>
              <p className="text-xs text-slate-500 mb-4 capitalize">
                {cuotaModal.guest_name} · {fmtMesCorto(cuotaModal.period_start)}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€)</label>
                  <input type="number" inputMode="decimal" value={cuotaImporte}
                    onChange={e => setCuotaImporte(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">¿Cómo te pagó?</label>
                  <div className="flex flex-wrap gap-2">
                    {METODOS.map(m => (
                      <button key={m} type="button" onClick={() => setCuotaMetodo(m)}
                        className={`h-11 px-3 rounded-xl text-xs font-medium border transition-colors ${cuotaMetodo === m ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {esEfectivo(cuotaMetodo) ? 'Entra en tu efectivo' : 'Entra en tu banco'}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button disabled={busy} onClick={() => setCuotaModal(null)}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button disabled={busy} onClick={confirmarCobroCuota}
                    className="flex-1 h-12 bg-indigo-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Formulario de gasto */}
      <AnimatePresence>
        {showGasto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) { setShowGasto(false); setEditGasto(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">{editGasto ? 'Editar gasto' : 'Nuevo gasto'}</h3>
                <IconBtn onClick={() => { if (!busy) { setShowGasto(false); setEditGasto(null); } }} title="Cerrar" className="text-slate-500 -mr-2">
                  <X className="w-5 h-5" />
                </IconBtn>
              </div>

              <form onSubmit={guardarGasto} className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="flex flex-wrap gap-2">
                    {properties.map(p => (
                      <button key={p.id} type="button" onClick={() => setGastoForm(g => ({ ...g, property_ref: p.id }))}
                        className="h-11 px-3 rounded-xl text-xs font-semibold border transition-all"
                        style={gastoForm.property_ref === p.id
                          ? { background: p.color, color: 'white', borderColor: p.color }
                          : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Categoría</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIAS.map(c => (
                      <button key={c} type="button" onClick={() => setGastoForm(g => ({ ...g, category: c }))}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${gastoForm.category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción *</label>
                  <input required value={gastoForm.description}
                    onChange={e => setGastoForm(g => ({ ...g, description: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]"
                    placeholder="Ej: Limpieza de junio" />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">¿Cómo lo pagaste?</label>
                  <div className="flex flex-wrap gap-2">
                    {METODOS.map(m => (
                      <button key={m} type="button" onClick={() => setGastoForm(g => ({ ...g, payment_method: m }))}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${gastoForm.payment_method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {esEfectivo(gastoForm.payment_method) ? 'Sale de tu efectivo' : 'Sale de tu banco'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€) *</label>
                    <input required type="number" min="0" step="0.01" value={gastoForm.amount}
                      onChange={e => setGastoForm(g => ({ ...g, amount: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha *</label>
                    <input required type="date" value={gastoForm.date}
                      onChange={e => setGastoForm(g => ({ ...g, date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>

                <div className="flex gap-3 pb-2">
                  <button type="button" disabled={busy} onClick={() => { setShowGasto(false); setEditGasto(null); }}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button type="submit" disabled={busy || !gastoForm.property_ref}
                    className="flex-1 h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : editGasto ? 'Guardar' : 'Añadir gasto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmación */}
      <AnimatePresence>
        {confirmar && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) setConfirmar(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="font-semibold text-slate-900 mb-2">{confirmar.titulo}</h3>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">{confirmar.mensaje}</p>
              <div className="flex gap-3">
                <button disabled={busy} onClick={() => setConfirmar(null)}
                  className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                <button disabled={busy}
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    try { await confirmar.accion(); setConfirmar(null); }
                    catch (err: any) { alert(err?.message || 'No se pudo completar'); }
                    finally { setBusy(false); }
                  }}
                  className={`flex-1 h-12 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 ${confirmar.peligro ? 'bg-red-500' : 'bg-[#E05A2B]'}`}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {busy ? 'Un momento...' : confirmar.etiqueta}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────
// ALTA INICIAL
// Tres pasos. Si tarda más de diez minutos, se abandona.
// ─────────────────────────────────────────────
function Onboarding({ account, properties, busy, onCrearPiso, onCrearHabitacion, onListo, onSalir }: {
  account: Account | null;
  properties: Property[];
  busy: boolean;
  onCrearPiso: (nombre: string, color: string) => Promise<void>;
  onCrearHabitacion: (propertyId: number, nombre: string, tipo: string, pax: number) => Promise<void>;
  onListo: () => void;
  onSalir: () => void;
}) {
  const [nombrePiso, setNombrePiso] = useState('');
  const [color, setColor] = useState(COLORES[0]);
  const [nombreHab, setNombreHab] = useState('');
  const [tipo, setTipo] = useState('double');
  const [pisoActivo, setPisoActivo] = useState<number | null>(properties[0]?.id ?? null);

  useEffect(() => {
    if (pisoActivo === null && properties.length > 0) setPisoActivo(properties[0].id);
  }, [properties, pisoActivo]);

  const [otroPiso, setOtroPiso] = useState(false);
  const piso = properties.find(p => p.id === pisoActivo) || properties[0];
  const paso = (properties.length === 0 || otroPiso) ? 1 : 2;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#E05A2B] p-1.5 rounded-lg"><Building2 className="w-4 h-4 text-white" /></div>
          <span className="font-bold text-slate-900 text-sm">{account?.name || 'Bienvenido'}</span>
        </div>
        <IconBtn onClick={onSalir} title="Salir" className="text-slate-400"><LogOut className="w-4 h-4" /></IconBtn>
      </header>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          {[1, 2].map(n => (
            <div key={n} className={`h-1.5 flex-1 rounded-full ${paso >= n ? 'bg-[#E05A2B]' : 'bg-slate-200'}`} />
          ))}
        </div>

        {paso === 1 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-slate-900 mb-1">¿Cómo se llama tu piso?</h2>
            <p className="text-xs text-slate-500 mb-5">
              Puedes añadir más después. Si solo tienes uno, ponle el nombre de la calle o del barrio.
            </p>
            <input value={nombrePiso} onChange={e => setNombrePiso(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-4 focus:outline-none focus:border-[#E05A2B]"
              placeholder="Ej: Piso Gràcia" autoFocus />

            <p className="text-xs font-medium text-slate-600 mb-2">Color en el calendario</p>
            <div className="flex flex-wrap gap-2 mb-5">
              {COLORES.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-11 h-11 rounded-xl transition-transform active:scale-95 ${color === c ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                  style={{ background: c }} aria-label={`Color ${c}`} />
              ))}
            </div>

            <button disabled={busy || !nombrePiso.trim()}
              onClick={async () => {
                await onCrearPiso(nombrePiso.trim(), color);
                setNombrePiso(''); setOtroPiso(false);
              }}
              className="w-full h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Continuar
            </button>

            {properties.length > 0 && (
              <button onClick={() => { setNombrePiso(''); setOtroPiso(false); }}
                className="w-full mt-2 h-11 text-xs text-slate-500">
                Volver a mis habitaciones
              </button>
            )}
          </div>
        )}

        {paso === 2 && piso && (
          <>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h2 className="font-bold text-slate-900 mb-1">Añade tus habitaciones</h2>
              <p className="text-xs text-slate-500 mb-5">
                Una por cada espacio que alquiles por separado. Van a ser las filas de tu calendario.
              </p>

              {properties.length > 1 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {properties.map(p => (
                    <button key={p.id} onClick={() => setPisoActivo(p.id)}
                      className="h-10 px-3 rounded-xl text-xs font-semibold border transition-all"
                      style={piso.id === p.id
                        ? { background: p.color, color: 'white', borderColor: p.color }
                        : { background: 'white', color: '#64748b', borderColor: '#e2e8f0' }}>
                      {p.name}
                    </button>
                  ))}
                </div>
              )}

              {piso.rooms.length > 0 && (
                <div className="space-y-2 mb-4">
                  {piso.rooms.map(r => (
                    <div key={r.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700 flex-1 min-w-0 truncate">{r.name}</span>
                      <span className="text-[10px] text-slate-400">{TIPOS.find(t => t.id === r.room_type)?.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <input value={nombreHab} onChange={e => setNombreHab(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#E05A2B]"
                placeholder="Ej: Habitación 1" />

              <div className="flex flex-wrap gap-2 mb-4">
                {TIPOS.map(t => (
                  <button key={t.id} type="button" onClick={() => setTipo(t.id)}
                    className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${tipo === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                    {t.label}
                  </button>
                ))}
              </div>

              <button disabled={busy || !nombreHab.trim()}
                onClick={async () => {
                  const t = TIPOS.find(x => x.id === tipo)!;
                  await onCrearHabitacion(piso.id, nombreHab.trim(), tipo, t.pax);
                  setNombreHab('');
                }}
                className="w-full h-12 border border-dashed border-slate-300 rounded-xl text-sm text-slate-600 font-medium disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <Plus className="w-4 h-4" /> Añadir habitación
              </button>
            </div>

            {properties.some(p => p.rooms.length > 0) && (
              <button onClick={onListo}
                className="w-full h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                Listo, ir a mi calendario
              </button>
            )}

            <button onClick={() => { setNombrePiso(''); setOtroPiso(true); }}
              className="w-full h-11 flex items-center justify-center gap-2 text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl bg-white active:scale-[0.98] transition-transform">
              <Home className="w-4 h-4" /> Añadir otro piso
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// AJUSTES — pisos, habitaciones y precios
// ─────────────────────────────────────────────
function Ajustes({ properties, rates, busy, onCrearPiso, onCrearHabitacion, onRenombrarHabitacion,
                   onBorrarHabitacion, onBorrarPiso, onGuardarTarifa }: {
  properties: Property[];
  rates: Rate[];
  busy: boolean;
  onCrearPiso: (nombre: string, color: string) => Promise<void>;
  onCrearHabitacion: (propertyId: number, nombre: string, tipo: string, pax: number) => Promise<void>;
  onRenombrarHabitacion: (id: number, nombre: string) => Promise<void>;
  onBorrarHabitacion: (r: Room) => void;
  onBorrarPiso: (p: Property) => void;
  onGuardarTarifa: (roomId: number, neto: string, minimo: string) => Promise<void>;
}) {
  const [nuevoPiso, setNuevoPiso] = useState('');
  const [colorPiso, setColorPiso] = useState(COLORES[0]);
  const [mostrarPiso, setMostrarPiso] = useState(false);
  const [nuevaHab, setNuevaHab] = useState<Record<number, string>>({});
  const [editando, setEditando] = useState<number | null>(null);
  const [nombreEdit, setNombreEdit] = useState('');
  const [precios, setPrecios] = useState<Record<number, { neto: string; min: string }>>({});

  const tarifaDe = (roomId: number) => rates.find(t => t.room_id === roomId && !t.valid_from && !t.valid_to);

  function precioDe(roomId: number) {
    if (precios[roomId]) return precios[roomId];
    const t = tarifaDe(roomId);
    return { neto: t ? String(t.net_price) : '', min: t?.min_net_price ? String(t.min_net_price) : '' };
  }

  function setPrecio(roomId: number, campo: 'neto' | 'min', valor: string) {
    setPrecios(p => ({ ...p, [roomId]: { ...precioDe(roomId), [campo]: valor } }));
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Tag className="w-4 h-4 text-[#E05A2B]" />
          <h3 className="font-semibold text-slate-900 text-sm">Tus precios</h3>
        </div>
        <p className="text-[11px] text-slate-400">
          El precio por noche que quieres recibir, y el mínimo que aceptarías si hay que cerrar una fecha floja.
        </p>
      </div>

      {properties.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100" style={{ background: `${p.color}18` }}>
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: p.color }}>{p.name}</span>
            <IconBtn onClick={() => onBorrarPiso(p)} title="Quitar piso" className="text-slate-400 -mr-2">
              <Trash2 className="w-4 h-4" />
            </IconBtn>
          </div>

          <div className="divide-y divide-slate-100">
            {p.rooms.map(r => {
              const pr = precioDe(r.id);
              const t = tarifaDe(r.id);
              const cambiado = pr.neto !== (t ? String(t.net_price) : '') || pr.min !== (t?.min_net_price ? String(t.min_net_price) : '');
              return (
                <div key={r.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    {editando === r.id ? (
                      <>
                        <input value={nombreEdit} onChange={e => setNombreEdit(e.target.value)} autoFocus
                          className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
                        <button onClick={async () => { await onRenombrarHabitacion(r.id, nombreEdit.trim()); setEditando(null); }}
                          className="h-11 px-3 rounded-xl bg-slate-900 text-white text-xs font-semibold">Guardar</button>
                        <button onClick={() => setEditando(null)} className="h-11 px-3 rounded-xl border border-slate-200 text-xs text-slate-500">Cancelar</button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{r.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {TIPOS.find(x => x.id === r.room_type)?.label} · hasta {r.max_persons} {r.max_persons === 1 ? 'persona' : 'personas'}
                          </p>
                        </div>
                        <IconBtn onClick={() => { setEditando(r.id); setNombreEdit(r.name); }} title="Renombrar" className="text-slate-400 bg-slate-50">
                          <Edit2 className="w-4 h-4" />
                        </IconBtn>
                        <IconBtn onClick={() => onBorrarHabitacion(r)} title="Quitar" className="text-red-400 bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </IconBtn>
                      </>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Precio por noche (€)</label>
                      <input type="number" inputMode="decimal" value={pr.neto}
                        onChange={e => setPrecio(r.id, 'neto', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Mínimo aceptable (€)</label>
                      <input type="number" inputMode="decimal" value={pr.min}
                        onChange={e => setPrecio(r.id, 'min', e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="opcional" />
                    </div>
                  </div>

                  {cambiado && (
                    <button disabled={busy} onClick={() => onGuardarTarifa(r.id, pr.neto, pr.min)}
                      className="w-full mt-2 h-11 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60 active:scale-[0.98] transition-transform">
                      Guardar precio
                    </button>
                  )}
                </div>
              );
            })}

            <div className="p-4 bg-slate-50">
              <div className="flex gap-2">
                <input value={nuevaHab[p.id] || ''} onChange={e => setNuevaHab(s => ({ ...s, [p.id]: e.target.value }))}
                  className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]"
                  placeholder="Nombre de la habitación" />
                <button disabled={busy || !(nuevaHab[p.id] || '').trim()}
                  onClick={async () => {
                    await onCrearHabitacion(p.id, (nuevaHab[p.id] || '').trim(), 'double', 2);
                    setNuevaHab(s => ({ ...s, [p.id]: '' }));
                  }}
                  className="h-11 px-4 rounded-xl bg-slate-900 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1.5">
                  <Plus className="w-4 h-4" /> Añadir
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {mostrarPiso ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <p className="text-xs font-semibold text-slate-600 mb-3">Nuevo piso</p>
          <input value={nuevoPiso} onChange={e => setNuevoPiso(e.target.value)} autoFocus
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm mb-3 focus:outline-none focus:border-[#E05A2B]"
            placeholder="Nombre del piso" />
          <div className="flex flex-wrap gap-2 mb-4">
            {COLORES.map(c => (
              <button key={c} type="button" onClick={() => setColorPiso(c)}
                className={`w-11 h-11 rounded-xl transition-transform active:scale-95 ${colorPiso === c ? 'ring-2 ring-offset-2 ring-slate-900' : ''}`}
                style={{ background: c }} aria-label={`Color ${c}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setMostrarPiso(false); setNuevoPiso(''); }}
              className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600">Cancelar</button>
            <button disabled={busy || !nuevoPiso.trim()}
              onClick={async () => { await onCrearPiso(nuevoPiso.trim(), colorPiso); setNuevoPiso(''); setMostrarPiso(false); }}
              className="flex-1 h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-50">Crear piso</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setMostrarPiso(true)}
          className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 active:scale-[0.98] transition-transform">
          <Home className="w-4 h-4" /> Añadir otro piso
        </button>
      )}
    </div>
  );
}