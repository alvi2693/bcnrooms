import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogOut, Plus, ChevronLeft, ChevronRight, X, Users, Globe, Phone, Mail, Calendar, Trash2, Edit2, CalendarDays, BarChart2, Home, AlertCircle, CheckCircle, Clock, Bell, BellOff, Search, Wallet, Scale, Calculator, UserX, KeyRound, Loader2 } from 'lucide-react';

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
const PAGADORES = ['Alvaro', 'Jeffer'];

// Solo las medianas del Born admiten renta mensual.
const MONTHLY_ROOM_IDS = [2, 3, 4];
function admiteMensual(room_id: number): boolean {
  return MONTHLY_ROOM_IDS.includes(Number(room_id));
}

type Caja = 'born' | 'sagrera' | 'bbva';
const CASH_METHODS = ['Efectivo'];

const CAJAS_INFO: { id: Caja; label: string; icon: string; color: string; bg: string; border: string; countLabel: string }[] = [
  { id: 'born',    label: 'Caja El Born', icon: '💵', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', countLabel: 'Efectivo contado' },
  { id: 'sagrera', label: 'Caja Sagrera', icon: '💵', color: 'text-blue-600',    bg: 'bg-blue-50',    border: 'border-blue-200',    countLabel: 'Efectivo contado' },
  { id: 'bbva',    label: 'Cuenta BBVA',  icon: '🏦', color: 'text-slate-700',   bg: 'bg-slate-100',  border: 'border-slate-300',   countLabel: 'Saldo real en el banco' },
];

const ROOM_TO_PROPERTY: Record<number, string> = {
  1: 'sagrera',
  2: 'born', 3: 'born', 4: 'born', 5: 'born', 6: 'born',
  7: 'sagrada',
};

function isCash(method?: string): boolean { return CASH_METHODS.includes((method || '').trim()); }

function cajaDeReserva(room_id: number, method?: string): Caja {
  if (!isCash(method)) return 'bbva';
  return ROOM_TO_PROPERTY[Number(room_id)] === 'born' ? 'born' : 'sagrera';
}
function cajaDeGasto(property_id: string, method?: string): Caja {
  if (!isCash(method)) return 'bbva';
  return property_id === 'born' ? 'born' : 'sagrera';
}
function cajaLabel(c: Caja): string { return CAJAS_INFO.find(x => x.id === c)!.label; }

const MANAGED_ROOM_IDS = [7];
const DEFAULT_COMMISSION_PER_PAX_NIGHT = 4;
function isManaged(room_id: number): boolean { return MANAGED_ROOM_IDS.includes(Number(room_id)); }

function suggestCommission(room_id: number, num_persons: number, check_in: string, check_out: string): number {
  if (!isManaged(room_id)) return 0;
  const nights = calcNights(check_in, check_out);
  return DEFAULT_COMMISSION_PER_PAX_NIGHT * (Number(num_persons) || 1) * nights;
}

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
  price_total?: number; price_per_night?: number; price_paid?: number; payment_status: string;
  payment_method?: string; channel?: string; notes?: string;
  deposit_amount?: number; deposit_method?: string;
  checkin_amount?: number; checkin_method?: string;
  commission_amount?: number; collected_by_us?: boolean;
  settled_at?: string | null; settled_method?: string | null;
  no_show?: boolean;
  rental_type?: string; monthly_rate?: number;
  created_at?: string;
}

interface Expense {
  id: number; property_id: string; property_name: string;
  category: string; description: string; amount: number; date: string;
  payment_method?: string; created_at?: string;
  paid_by?: string | null; own_money?: boolean; reimbursed_at?: string | null;
}

interface RentPayment {
  id: number; reservation_id: number; period_start: string;
  amount: number; paid_at?: string | null; method?: string | null;
  guest_name?: string; room_id?: number; room_name?: string;
}

const emptyForm = {
  room_id: 1, guest_name: '', guest_email: '', guest_phone: '',
  guest_nationality: '', num_persons: 1, check_in: '', check_out: '',
  price_per_night: '', price_total: '',
  deposit_amount: '', deposit_method: 'Transferencia',
  checkin_amount: '', checkin_method: 'Efectivo',
  commission_amount: '', collected_by_us: false,
  rental_type: 'nightly', monthly_rate: '', months_count: '1',
  channel: 'WhatsApp', notes: '',
};

const emptyExpenseForm = {
  property_id: 'sagrera', category: '🔧 Mantenimiento',
  description: '', amount: '', date: localDateStr(new Date()),
  payment_method: 'Efectivo',
  paid_by: 'Alvaro', own_money: false,
};

function addDays(date: Date, days: number): Date { const d = new Date(date); d.setDate(d.getDate() + days); return d; }

// Fecha LOCAL, no UTC: toISOString adelanta un día por la noche en verano.
function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function toDateStr(date: Date): string { return localDateStr(date); }
function parseYMD(s: string): Date { return new Date(s.split('T')[0] + 'T00:00:00'); }

function fmtDate(str: string): string {
  if (!str) return '';
  return parseYMD(str).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function fmtDateLargo(str: string): string {
  if (!str) return '';
  return parseYMD(str).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' });
}
function calcNights(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.ceil((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86400000);
}
function onlyDate(v?: string | null): string { return v ? String(v).split('T')[0] : ''; }

function esMensual(r: { rental_type?: string }): boolean { return r.rental_type === 'monthly'; }

// Suma meses conservando el día, ajustando si el mes destino es más corto.
function sumarMesesFecha(ymd: string, n: number): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1 + n, 1);
  const ultimoDia = new Date(dt.getFullYear(), dt.getMonth() + 1, 0).getDate();
  dt.setDate(Math.min(d, ultimoDia));
  return localDateStr(dt);
}

function cajaDeComision(method?: string | null): Caja {
  return isCash(method || undefined) ? 'sagrera' : 'bbva';
}
function comisionPendiente(r: Reservation): number {
  if (!isManaged(r.room_id) || r.settled_at) return 0;
  return Number(r.commission_amount) || 0;
}

// Lo que falta por cobrar. Un no-show ya no debe nada: ese dinero no llegará.
function pendienteDe(r: Reservation): number {
  if (r.no_show) return 0;
  return Math.max(0, (r.price_total || 0) - (r.price_paid || 0));
}

// ─────────────────────────────────────────────
// MOVIMIENTOS DE CAJA
// Cada euro que entra o sale, con su fecha real.
// Única fuente de verdad para balance y cuadre.
// ─────────────────────────────────────────────
type Movimiento = {
  key: string; date: string; caja: Caja; tipo: 'in' | 'out';
  concepto: string; detalle: string; amount: number;
};

function construirMovimientos(reservations: Reservation[], expenses: Expense[], rentPayments: RentPayment[]): Movimiento[] {
  const movs: Movimiento[] = [];

  reservations.forEach(r => {
    // Piso gestionado: el dinero del huésped nunca es nuestro.
    // Solo entra la comisión, y en la fecha en que se liquidó.
    if (isManaged(r.room_id)) {
      const amt = Number(r.commission_amount) || 0;
      const fecha = onlyDate(r.settled_at);
      if (!fecha || amt <= 0) return;
      movs.push({
        key: `com-${r.id}`, date: fecha, caja: cajaDeComision(r.settled_method), tipo: 'in',
        concepto: r.guest_name, detalle: `Comisión Sagrada · ${r.settled_method || 'Efectivo'}`, amount: amt,
      });
      return;
    }

    const dep = Number(r.deposit_amount) || 0;
    const chk = Number(r.checkin_amount) || 0;
    const marca = r.no_show ? ' · no vino' : '';
    // El pago de reserva se cobra al crearla; el del ingreso, el día del check-in.
    const fechaDep = onlyDate(r.created_at) || r.check_in;
    if (dep > 0) movs.push({
      key: `dep-${r.id}`, date: fechaDep, caja: cajaDeReserva(r.room_id, r.deposit_method), tipo: 'in',
      concepto: r.guest_name, detalle: `Pago de reserva · ${r.deposit_method || '—'}${marca}`, amount: dep,
    });
    if (chk > 0) movs.push({
      key: `chk-${r.id}`, date: r.check_in, caja: cajaDeReserva(r.room_id, r.checkin_method), tipo: 'in',
      concepto: r.guest_name, detalle: `Pago al ingresar · ${r.checkin_method || '—'}${marca}`, amount: chk,
    });
  });

  // Mensualidades ya cobradas del Born.
  rentPayments.forEach(p => {
    const fecha = onlyDate(p.paid_at);
    const amt = Number(p.amount) || 0;
    if (!fecha || amt <= 0) return;
    movs.push({
      key: `rent-${p.id}`, date: fecha,
      caja: cajaDeReserva(Number(p.room_id) || 2, p.method || undefined), tipo: 'in',
      concepto: p.guest_name || 'Renta mensual',
      detalle: `Mensualidad ${fmtMesCorto(p.period_start)} · ${p.method || '—'}`,
      amount: amt,
    });
  });

  expenses.forEach(e => {
    const caja = cajaDeGasto(e.property_id, e.payment_method);
    const quien = e.paid_by ? ` · ${e.paid_by}` : '';
    if (e.own_money) {
      // Lo adelantó alguien de su bolsillo: la caja no se toca hasta devolvérselo.
      const fecha = onlyDate(e.reimbursed_at);
      if (!fecha) return;
      movs.push({
        key: `reemb-${e.id}`, date: fecha, caja, tipo: 'out',
        concepto: `Devolución a ${e.paid_by || 'colaborador'}`, detalle: `${e.description} · ${e.category}`, amount: e.amount,
      });
      return;
    }
    movs.push({
      key: `gas-${e.id}`, date: e.date, caja, tipo: 'out',
      concepto: e.description, detalle: `${e.category} · ${e.payment_method || '—'}${quien}`, amount: e.amount,
    });
  });

  return movs.sort((a, b) => a.date.localeCompare(b.date) || a.key.localeCompare(b.key));
}

const CAJAS_CERO = (): Record<Caja, number> => ({ born: 0, sagrera: 0, bbva: 0 });

function acumular(movs: Movimiento[]): Record<Caja, number> {
  const acc = CAJAS_CERO();
  movs.forEach(m => { acc[m.caja] += m.tipo === 'in' ? m.amount : -m.amount; });
  return acc;
}

// ── Helpers de mes ──
function mesDe(dateStr: string): string { return dateStr.slice(0, 7); }
function mesActualStr(): string { return localDateStr(new Date()).slice(0, 7); }
function sumarMeses(ym: string, delta: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
function fmtMes(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}
function fmtMesCorto(fecha: string): string {
  if (!fecha) return '';
  return parseYMD(fecha).toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
}

// VAPID viene en base64url; pushManager.subscribe necesita bytes, no string.
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const output = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
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

// Botón de icono con área táctil de 44px, el mínimo cómodo en móvil.
function IconButton({ onClick, title, className = '', children }: {
  onClick: (e: React.MouseEvent) => void; title: string; className?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={title} title={title}
      className={`w-11 h-11 flex items-center justify-center rounded-xl flex-shrink-0 active:scale-95 transition-transform ${className}`}>
      {children}
    </button>
  );
}

export function AdminPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rentPayments, setRentPayments] = useState<RentPayment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [formError, setFormError] = useState('');
  const [selectedProperty, setSelectedProperty] = useState<string>('sagrera');
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'calc' | 'calendar' | 'expenses' | 'stats' | 'cuadre'>('today');
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('Efectivo');
  const [payingResId, setPayingResId] = useState<number | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleMethod, setSettleMethod] = useState<'Efectivo' | 'BBVA'>('Efectivo');
  const [settleTargetId, setSettleTargetId] = useState<number | null>(null);

  // Un solo indicador para cualquier operación en vuelo. Mientras esté
  // activo, los botones quedan bloqueados: es lo que evita que quince
  // toques durante un arranque en frío creen quince reservas.
  const [busy, setBusy] = useState(false);

  // Sustituye a confirm(), que Safari suprime en las apps instaladas
  // desde la pantalla de inicio y devuelve false sin avisar.
  const [confirmDialog, setConfirmDialog] = useState<{
    titulo: string; mensaje: string; etiqueta: string; peligro?: boolean; accion: () => Promise<void> | void;
  } | null>(null);

  // Cobro de una mensualidad
  const [rentModal, setRentModal] = useState<RentPayment | null>(null);
  const [rentMethod, setRentMethod] = useState('Efectivo');
  const [rentAmount, setRentAmount] = useState('');

  // Cuadre mensual
  const [cuadreMes, setCuadreMes] = useState<string>(() => mesActualStr());
  const [conteos, setConteos] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('bcn_conteos') || '{}'); } catch { return {}; }
  });
  function setConteo(key: string, val: string) {
    setConteos(prev => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem('bcn_conteos', JSON.stringify(next)); } catch {}
      return next;
    });
  }

  // Calculadora de noches
  const [calcIn, setCalcIn] = useState(() => localDateStr(new Date()));
  const [calcOut, setCalcOut] = useState(() => localDateStr(addDays(new Date(), 2)));
  const [calcPPN, setCalcPPN] = useState('');

  const COL_W = 52;
  const ROW_H = 52;
  const LABEL_W = 132;
  const DIAS_ADELANTE = 210;
  const PASO_ATRAS = 21;
  const today = toDateStr(new Date());
  const isLoggedIn = !!token;

  // El calendario arranca en hoy y solo avanza. Para ver el pasado hay
  // que pedirlo con la flecha, que va revelando tres semanas cada vez.
  const [diasAtras, setDiasAtras] = useState(0);
  const days: Date[] = useMemo(() => {
    const origen = addDays(new Date(), -diasAtras);
    const arr: Date[] = [];
    for (let i = 0; i < diasAtras + DIAS_ADELANTE; i++) arr.push(addDays(origen, i));
    return arr;
  }, [diasAtras, today]);

  // Tramos de mes para pintar la banda superior y alternar el fondo.
  const tramosMes = useMemo(() => {
    const g: { key: string; label: string; corto: string; startIdx: number; count: number }[] = [];
    days.forEach((d, i) => {
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const ultimo = g[g.length - 1];
      if (ultimo && ultimo.key === key) ultimo.count++;
      else g.push({
        key,
        label: d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        corto: d.toLocaleDateString('es-ES', { month: 'short' }),
        startIdx: i, count: 1,
      });
    });
    return g;
  }, [days]);

  const indiceDeMes = useMemo(() => {
    const m: Record<string, number> = {};
    tramosMes.forEach((t, i) => { m[t.key] = i; });
    return m;
  }, [tramosMes]);

  const calScrollRef = useRef<HTMLDivElement>(null);
  const [calMesVisible, setCalMesVisible] = useState('');
  const ajustePendiente = useRef(0);

  function scrollHastaHoy(smooth = true) {
    const el = calScrollRef.current;
    if (!el) return;
    const idx = days.findIndex(d => toDateStr(d) === today);
    if (idx < 0) return;
    el.scrollTo({ left: Math.max(0, idx * COL_W - COL_W), behavior: smooth ? 'smooth' : 'auto' });
  }

  function verMasPasado() {
    // Al añadir días por la izquierda todo el contenido se desplaza.
    // Guardamos cuánto para recolocar el scroll y que no dé un salto.
    ajustePendiente.current = PASO_ATRAS * COL_W;
    setDiasAtras(d => d + PASO_ATRAS);
  }

  useEffect(() => {
    const el = calScrollRef.current;
    if (!el || !ajustePendiente.current) return;
    const delta = ajustePendiente.current;
    ajustePendiente.current = 0;
    el.scrollLeft += delta;                                  // mantiene la vista
    el.scrollTo({ left: Math.max(0, el.scrollLeft - delta), behavior: 'smooth' }); // y desliza al pasado
  }, [diasAtras]);

  useEffect(() => {
    if (activeTab !== 'calendar') return;
    const el = calScrollRef.current;
    if (!el) return;
    const actualizarMes = () => {
      const idx = Math.min(days.length - 1, Math.max(0, Math.round(el.scrollLeft / COL_W)));
      setCalMesVisible(days[idx].toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }));
    };
    if (diasAtras === 0) scrollHastaHoy(false);
    actualizarMes();
    el.addEventListener('scroll', actualizarMes, { passive: true });
    return () => el.removeEventListener('scroll', actualizarMes);
  }, [activeTab, days]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (loggingIn) return;
    if (username !== 'admin') { setLoginError('Usuario incorrecto'); return; }
    setLoggingIn(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      const data = await res.json();
      if (data.token) { setToken(data.token); localStorage.setItem('admin_token', data.token); setLoginError(''); }
      else setLoginError('Contraseña incorrecta');
    } catch { setLoginError('No se pudo conectar. El servidor puede estar despertando; inténtalo otra vez.'); }
    finally { setLoggingIn(false); }
  }

  function handleLogout() { setToken(''); localStorage.removeItem('admin_token'); }

  async function fetchReservations() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reservations`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReservations(data.map((r: any) => ({
        ...r,
        check_in: onlyDate(r.check_in), check_out: onlyDate(r.check_out),
        price_total: Number(r.price_total) || 0,
        price_per_night: Number(r.price_per_night) || 0,
        price_paid: Number(r.price_paid) || 0,
        deposit_amount: Number(r.deposit_amount) || 0,
        checkin_amount: Number(r.checkin_amount) || 0,
        commission_amount: Number(r.commission_amount) || 0,
        collected_by_us: !!r.collected_by_us,
        settled_at: r.settled_at ? onlyDate(r.settled_at) : null,
        settled_method: r.settled_method || null,
        no_show: !!r.no_show,
        rental_type: r.rental_type || 'nightly',
        monthly_rate: Number(r.monthly_rate) || 0,
        created_at: r.created_at || undefined,
        num_persons: Number(r.num_persons),
      })));
    } catch {}
  }

  async function fetchExpenses() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setExpenses(data.map((e: any) => ({
        ...e, amount: Number(e.amount), date: onlyDate(e.date),
        paid_by: e.paid_by || null, own_money: !!e.own_money,
        reimbursed_at: e.reimbursed_at ? onlyDate(e.reimbursed_at) : null,
      })));
    } catch {}
  }

  async function fetchRentPayments() {
    try {
      const res = await fetch(`${BACKEND_URL}/admin/rent-payments`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = await res.json();
      setRentPayments(data.map((p: any) => ({
        ...p, amount: Number(p.amount) || 0,
        period_start: onlyDate(p.period_start),
        paid_at: p.paid_at ? onlyDate(p.paid_at) : null,
        room_id: Number(p.room_id),
      })));
    } catch {}
  }

  function recargarTodo() { fetchReservations(); fetchExpenses(); fetchRentPayments(); }

  useEffect(() => { if (isLoggedIn) recargarTodo(); }, [isLoggedIn]);
  useEffect(() => { if (isLoggedIn && 'Notification' in window) setPushEnabled(Notification.permission === 'granted'); }, [isLoggedIn]);

  const movimientos = useMemo(
    () => construirMovimientos(reservations, expenses, rentPayments),
    [reservations, expenses, rentPayments]
  );

  const cuotasDe = (resId: number) =>
    rentPayments.filter(p => p.reservation_id === resId).sort((a, b) => a.period_start.localeCompare(b.period_start));

  const mensualidadesPendientes = useMemo(
    () => rentPayments.filter(p => !p.paid_at).sort((a, b) => a.period_start.localeCompare(b.period_start)),
    [rentPayments]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;                       // corta el doble envío en seco
    setFormError('');
    setBusy(true);
    try {
      const room = ALL_ROOMS.find(r => r.id === Number(form.room_id));
      const mensual = form.rental_type === 'monthly' && admiteMensual(Number(form.room_id));
      const payload = {
        ...form,
        room_id: Number(form.room_id),
        room_name: room ? `${room.propertyName} - ${room.name}` : '',
        num_persons: Number(form.num_persons),
        price_total: form.price_total ? Number(form.price_total) : null,
        price_per_night: form.price_per_night ? Number(form.price_per_night) : null,
        deposit_amount: Number(form.deposit_amount) || 0,
        checkin_amount: Number(form.checkin_amount) || 0,
        commission_amount: Number(form.commission_amount) || 0,
        collected_by_us: !!form.collected_by_us,
        rental_type: mensual ? 'monthly' : 'nightly',
        monthly_rate: mensual ? Number(form.monthly_rate) || 0 : null,
        months_count: mensual ? Number(form.months_count) || 1 : null,
      };
      const url = editingId ? `${BACKEND_URL}/admin/reservations/${editingId}` : `${BACKEND_URL}/admin/reservations`;
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setFormError(data.error || `El servidor respondió ${res.status}`); return; }
      setShowForm(false); setEditingId(null); setForm(emptyForm); setFormError('');
      recargarTodo();
    } catch {
      setFormError('No se pudo conectar con el servidor. Comprueba la conexión y vuelve a intentarlo.');
    } finally { setBusy(false); }
  }

  function pedirBorrarReserva(r: Reservation) {
    setConfirmDialog({
      titulo: 'Eliminar reserva',
      mensaje: `Se borrará la reserva de ${r.guest_name} y todo lo cobrado en ella dejará de contar en las cajas. Si el huésped no vino pero dejó una señal, usa "No vino" en lugar de eliminar.`,
      etiqueta: 'Eliminar',
      peligro: true,
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/reservations/${r.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        setSelectedRes(null);
        recargarTodo();
      },
    });
  }

  function pedirNoShow(r: Reservation) {
    const cobrado = r.price_paid || 0;
    setConfirmDialog({
      titulo: 'Marcar que no vino',
      mensaje: `La reserva de ${r.guest_name} se conserva y los ${cobrado.toFixed(0)}€ ya cobrados siguen contando como ingreso. La habitación queda libre desde ahora y puedes volver a venderla en esas fechas.`,
      etiqueta: 'Sí, no vino',
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/reservations/${r.id}/no-show`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        setSelectedRes(null);
        recargarTodo();
      },
    });
  }

  function pedirDeshacerNoShow(r: Reservation) {
    setConfirmDialog({
      titulo: 'Deshacer',
      mensaje: `La reserva de ${r.guest_name} vuelve a ocupar la habitación. Si esas fechas ya se han vendido a otra persona, no se podrá.`,
      etiqueta: 'Deshacer',
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/reservations/${r.id}/undo-no-show`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `El servidor respondió ${res.status}`);
        setSelectedRes(null);
        recargarTodo();
      },
    });
  }

  function handleEdit(r: Reservation) {
    const prop = PROPERTIES.find(p => p.rooms.some(rm => rm.id === r.room_id));
    if (prop) setSelectedProperty(prop.id);
    const cuotas = cuotasDe(r.id);
    setForm({
      room_id: r.room_id, guest_name: r.guest_name, guest_email: r.guest_email || '',
      guest_phone: r.guest_phone || '', guest_nationality: r.guest_nationality || '',
      num_persons: r.num_persons, check_in: onlyDate(r.check_in), check_out: onlyDate(r.check_out),
      price_per_night: r.price_per_night?.toString() || '',
      price_total: r.price_total?.toString() || '',
      deposit_amount: r.deposit_amount?.toString() || '',
      deposit_method: r.deposit_method || 'Transferencia',
      checkin_amount: r.checkin_amount?.toString() || '',
      checkin_method: r.checkin_method || 'Efectivo',
      commission_amount: r.commission_amount?.toString() || '',
      collected_by_us: !!r.collected_by_us,
      rental_type: r.rental_type || 'nightly',
      monthly_rate: r.monthly_rate ? String(r.monthly_rate) : '',
      months_count: String(cuotas.length || 1),
      channel: r.channel || 'WhatsApp', notes: r.notes || ''
    });
    setEditingId(r.id); setSelectedRes(null); setFormError(''); setShowForm(true);
  }

  async function handleExpenseSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const prop = PROPERTIES.find(p => p.id === expenseForm.property_id);
      const payload = { ...expenseForm, property_name: prop?.name || '', amount: Number(expenseForm.amount) };
      const url = editingExpenseId ? `${BACKEND_URL}/admin/expenses/${editingExpenseId}` : `${BACKEND_URL}/admin/expenses`;
      const res = await fetch(url, {
        method: editingExpenseId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { alert(`No se pudo guardar el gasto (${res.status})`); return; }
      setShowExpenseForm(false); setEditingExpenseId(null); setExpenseForm(emptyExpenseForm);
      fetchExpenses();
    } catch { alert('No se pudo conectar con el servidor'); }
    finally { setBusy(false); }
  }

  function pedirBorrarGasto(ex: Expense) {
    setConfirmDialog({
      titulo: 'Eliminar gasto',
      mensaje: `Se borrará "${ex.description}" de ${ex.amount}€ y dejará de descontarse de la caja.`,
      etiqueta: 'Eliminar',
      peligro: true,
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/expenses/${ex.id}`, {
          method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        fetchExpenses();
      },
    });
  }

  function handleExpenseEdit(ex: Expense) {
    setExpenseForm({
      property_id: ex.property_id, category: ex.category, description: ex.description,
      amount: ex.amount.toString(), date: ex.date, payment_method: ex.payment_method || 'Efectivo',
      paid_by: ex.paid_by || 'Alvaro', own_money: !!ex.own_money,
    });
    setEditingExpenseId(ex.id); setShowExpenseForm(true);
  }

  async function handleReembolso(id: number, deshacer = false) {
    if (busy) return;
    setBusy(true);
    try {
      await fetch(`${BACKEND_URL}/admin/expenses/${id}/${deshacer ? 'unreimburse' : 'reimburse'}`, {
        method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
      });
      fetchExpenses();
    } finally { setBusy(false); }
  }

  function handlePPN(val: string) {
    const n = calcNights(form.check_in, form.check_out), pn = parseFloat(val) || 0;
    setForm(f => ({ ...f, price_per_night: val, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : f.price_total }));
  }

  function handleCIO(key: 'check_in' | 'check_out', val: string) {
    setForm(f => {
      const u = { ...f, [key]: val };
      if (u.rental_type === 'monthly') {
        // En renta mensual el check-out lo marcan los meses, no el usuario.
        if (key === 'check_in' && val) u.check_out = sumarMesesFecha(val, Number(u.months_count) || 1);
        return u;
      }
      const n = calcNights(key === 'check_in' ? val : f.check_in, key === 'check_out' ? val : f.check_out);
      const pn = parseFloat(f.price_per_night) || 0;
      const next = { ...u, price_total: n > 0 && pn > 0 ? (pn * n).toFixed(2) : u.price_total };
      if (isManaged(Number(next.room_id))) {
        const sug = suggestCommission(Number(next.room_id), Number(next.num_persons), next.check_in, next.check_out);
        if (sug > 0) next.commission_amount = sug.toString();
      }
      return next;
    });
  }

  // Cambia entre alquiler por noches y renta mensual, recalculando fechas y total.
  function setModalidad(tipo: 'nightly' | 'monthly') {
    setForm(f => {
      if (tipo === 'nightly') {
        return { ...f, rental_type: 'nightly', monthly_rate: '', months_count: '1' };
      }
      const meses = Number(f.months_count) || 1;
      const rate = Number(f.monthly_rate) || 0;
      return {
        ...f, rental_type: 'monthly',
        check_out: f.check_in ? sumarMesesFecha(f.check_in, meses) : f.check_out,
        price_total: rate > 0 ? (rate * meses).toFixed(2) : f.price_total,
        price_per_night: '',
        checkin_amount: '',
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

  async function confirmarCobroMensualidad() {
    if (!rentModal || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/rent-payments/${rentModal.id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ method: rentMethod, amount: rentAmount === '' ? undefined : Number(rentAmount) }),
      });
      if (!res.ok) { alert(`No se pudo registrar el cobro (${res.status})`); return; }
      setRentModal(null); setRentAmount('');
      recargarTodo();
    } catch { alert('No se pudo conectar con el servidor'); }
    finally { setBusy(false); }
  }

  function pedirDeshacerMensualidad(p: RentPayment) {
    setConfirmDialog({
      titulo: 'Deshacer cobro',
      mensaje: `La mensualidad de ${fmtMesCorto(p.period_start)} volverá a figurar como pendiente y saldrá de la caja.`,
      etiqueta: 'Deshacer',
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/rent-payments/${p.id}/unpay`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        recargarTodo();
      },
    });
  }

  function pedirProrrogaMes(r: Reservation) {
    setConfirmDialog({
      titulo: 'Añadir un mes',
      mensaje: `Se alarga la estancia de ${r.guest_name} un mes más y se crea una mensualidad nueva de ${(r.monthly_rate || 0).toFixed(0)}€ pendiente de cobro.`,
      etiqueta: 'Añadir mes',
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/reservations/${r.id}/extend-month`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({}),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `El servidor respondió ${res.status}`);
        setSelectedRes(null);
        recargarTodo();
      },
    });
  }

  async function handleQuickPay() {
    if (!payingResId || busy) return;
    setBusy(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/reservations/${payingResId}/checkin-payment`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ checkin_amount: Number(payAmount), checkin_method: payMethod }),
      });
      if (!res.ok) { alert(`No se pudo registrar el pago (${res.status})`); return; }
      setShowPayModal(false); setPayAmount(''); setPayingResId(null); setSelectedRes(null);
      recargarTodo();
    } catch { alert('No se pudo conectar con el servidor'); }
    finally { setBusy(false); }
  }

  async function handleSettleCommissions() {
    if (busy) return;
    setBusy(true);
    try {
      const pendientes = settleTargetId
        ? reservations.filter(r => r.id === settleTargetId)
        : reservations.filter(r => isManaged(r.room_id) && !r.settled_at);
      for (const r of pendientes) {
        await fetch(`${BACKEND_URL}/admin/reservations/${r.id}/settle`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ settled_method: settleMethod }),
        });
      }
      setShowSettleModal(false); setSettleTargetId(null); setSelectedRes(null);
      recargarTodo();
    } finally { setBusy(false); }
  }

  function pedirDeshacerLiquidacion(r: Reservation) {
    setConfirmDialog({
      titulo: 'Deshacer cobro',
      mensaje: `La comisión de ${r.guest_name} volverá a figurar como pendiente y saldrá de la caja donde entró.`,
      etiqueta: 'Deshacer',
      accion: async () => {
        const res = await fetch(`${BACKEND_URL}/admin/reservations/${r.id}/unsettle`, {
          method: 'PATCH', headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`El servidor respondió ${res.status}`);
        setSelectedRes(null);
        recargarTodo();
      },
    });
  }

  async function enablePush() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Este navegador no admite notificaciones push. En iPhone hay que instalar la app desde Safari, con "Añadir a pantalla de inicio".');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert('Permiso denegado. Actívalo en los ajustes del navegador.'); return; }

      const reg = await navigator.serviceWorker.ready;
      const keyRes = await fetch(`${BACKEND_URL}/push/vapid-key`);
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error('El servidor no devolvió la clave VAPID');

      // Si quedaba una suscripción de una instalación anterior, la renovamos.
      // Sin esto se acumulan suscripciones muertas cada vez que reinstalas.
      const previa = await reg.pushManager.getSubscription();
      if (previa) await previa.unsubscribe().catch(() => {});

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
      if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
        throw new Error('El navegador devolvió una suscripción incompleta');
      }

      const res = await fetch(`${BACKEND_URL}/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `El servidor respondió ${res.status}`);
      }

      setPushEnabled(true);
      alert('Notificaciones activadas');
    } catch (err: any) {
      alert(`No se pudieron activar las notificaciones: ${err?.message || err}`);
    }
  }

  // Reservas que ocupan habitación. Un no-show ya no cuenta.
  const activas = useMemo(() => reservations.filter(r => !r.no_show), [reservations]);

  // Posición de la barra en píxeles, con medios días en los encadenamientos.
  // El diente diagonal solo se dibuja si hay otra reserva que encaje ese día.
  function getResBar(res: Reservation): { left: number; width: number; clipStart: boolean; clipEnd: boolean } | null {
    const firstDay = toDateStr(days[0]);
    const lastDay = toDateStr(days[days.length - 1]);
    if (res.check_out < firstDay || res.check_in > lastDay) return null;

    const idxOf = (dateStr: string) => days.findIndex(d => toDateStr(d) === dateStr);
    const ciIdx = idxOf(res.check_in);
    const coIdx = idxOf(res.check_out);

    const salienteEnMiEntrada = activas.some(
      o => o.id !== res.id && o.room_id === res.room_id && o.check_out === res.check_in
    );
    const entranteEnMiSalida = activas.some(
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

  const totalPending = reservations.reduce((a, r) => a + pendienteDe(r), 0);
  const totalCobrado = reservations.reduce((a, r) => a + (r.price_paid || 0), 0);
  const activeNow = activas.filter(r => r.check_in <= today && r.check_out >= today).length;

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
          <button type="submit" disabled={loggingIn}
            className="w-full bg-[#E05A2B] text-white py-3 rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
            {loggingIn && <Loader2 className="w-4 h-4 animate-spin" />}
            {loggingIn ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="bg-[#E05A2B] p-1.5 rounded-lg flex-shrink-0"><Calendar className="w-4 h-4 text-white" /></div>
            <span className="font-bold text-slate-900 text-sm truncate">BCN Rooms</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => { setForm(emptyForm); setEditingId(null); setFormError(''); setShowForm(true); }}
              className="flex items-center gap-1.5 bg-[#E05A2B] text-white px-3 h-11 rounded-xl text-xs font-semibold active:scale-95 transition-transform">
              <Plus className="w-4 h-4" /> Nueva
            </button>
            <IconButton onClick={enablePush} title="Notificaciones"
              className={pushEnabled ? 'text-emerald-500 bg-emerald-50' : 'text-slate-400'}>
              {pushEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </IconButton>
            <IconButton onClick={handleLogout} title="Salir" className="text-slate-400">
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>
        </div>
      </header>

      <div className="px-4 pt-4 pb-2 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: 'Reservas', v: activas.length, c: 'text-slate-900' },
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

        {/* HOY */}
        {activeTab === 'today' && (() => {
          const checkinsHoy = activas.filter(r => r.check_in === today);
          const checkoutsHoy = activas.filter(r => r.check_out === today);
          const urgentePago = activas.filter(r => pendienteDe(r) > 0 && r.check_in <= today && !esMensual(r))
            .sort((a, b) => pendienteDe(b) - pendienteDe(a));
          const rentasVencidas = mensualidadesPendientes.filter(p => p.period_start <= today);
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Estado de habitaciones</h3>
                <div className="space-y-2">
                  {ALL_ROOMS.map(room => {
                    const resActiva = activas.find(r => r.room_id === room.id && r.check_in <= today && r.check_out > today);
                    const checkinHoy = activas.find(r => r.room_id === room.id && r.check_in === today);
                    const checkoutHoy = activas.find(r => r.room_id === room.id && r.check_out === today);
                    const prop = PROPERTIES.find(p => p.rooms.some(r => r.id === room.id));
                    let badge = { text: 'Libre', bg: 'bg-emerald-100', color: 'text-emerald-700' };
                    let icon = <CheckCircle className="w-4 h-4 text-emerald-500" />;
                    if (checkinHoy) { badge = { text: `Check-in · ${checkinHoy.guest_name}`, bg: 'bg-blue-100', color: 'text-blue-700' }; icon = <AlertCircle className="w-4 h-4 text-blue-500" />; }
                    else if (checkoutHoy) { badge = { text: `Check-out · ${checkoutHoy.guest_name}`, bg: 'bg-yellow-100', color: 'text-yellow-700' }; icon = <Clock className="w-4 h-4 text-yellow-500" />; }
                    else if (resActiva) {
                      badge = esMensual(resActiva)
                        ? { text: `Mensual · ${resActiva.guest_name}`, bg: 'bg-indigo-100', color: 'text-indigo-700' }
                        : { text: `Ocupada · ${resActiva.guest_name}`, bg: 'bg-red-100', color: 'text-red-600' };
                      icon = esMensual(resActiva) ? <KeyRound className="w-4 h-4 text-indigo-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />;
                    }
                    return (
                      <div key={room.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => resActiva && setSelectedRes(resActiva)}>
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

              {rentasVencidas.length > 0 && (
                <div className="bg-white rounded-2xl border border-indigo-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-semibold text-slate-900 text-sm">Mensualidades por cobrar ({rentasVencidas.length})</h3>
                  </div>
                  <div className="space-y-2">
                    {rentasVencidas.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 bg-indigo-50 rounded-xl">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{p.guest_name}</p>
                          <p className="text-xs text-slate-500">{p.room_name} · {fmtMesCorto(p.period_start)}</p>
                        </div>
                        <span className="text-sm font-bold text-indigo-600 flex-shrink-0">{p.amount.toFixed(0)}€</span>
                        <button onClick={() => { setRentModal(p); setRentMethod('Efectivo'); setRentAmount(String(p.amount)); }}
                          className="flex-shrink-0 h-11 px-3 rounded-xl bg-indigo-500 text-white text-xs font-semibold active:scale-95 transition-transform">
                          Cobrar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                            <p className="text-xs text-slate-500">{room?.name} · {esMensual(r) ? 'renta mensual' : `${calcNights(r.check_in, r.check_out)} noches`} · {r.num_persons} pers.</p>
                          </div>
                          <span className="text-xs font-bold text-slate-700">{(r.price_total || 0).toFixed(0)}€</span>
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
                      const pending = pendienteDe(r);
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
                    {urgentePago.slice(0, 6).map(r => {
                      const room = ALL_ROOMS.find(rm => rm.id === r.room_id);
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl cursor-pointer" onClick={() => setSelectedRes(r)}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900">{r.guest_name}</p>
                            <p className="text-xs text-slate-500">{room?.propertyName} · {fmtDate(r.check_in)}</p>
                          </div>
                          <span className="text-sm font-bold text-[#E05A2B]">{pendienteDe(r).toFixed(0)}€</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {checkinsHoy.length === 0 && checkoutsHoy.length === 0 && urgentePago.length === 0 && rentasVencidas.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Todo tranquilo hoy</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* CALCULADORA DE NOCHES */}
        {activeTab === 'calc' && (() => {
          const noches = calcNights(calcIn, calcOut);
          const ppn = parseFloat(calcPPN) || 0;
          const total = noches > 0 && ppn > 0 ? noches * ppn : 0;
          const mover = (dias: number) => setCalcOut(localDateStr(addDays(parseYMD(calcOut), dias)));
          const desdeHoy = () => {
            const hoy = localDateStr(new Date());
            setCalcIn(hoy); setCalcOut(localDateStr(addDays(new Date(), Math.max(1, noches || 1))));
          };
          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-4 h-4 text-[#E05A2B]" />
                  <h3 className="font-semibold text-slate-900 text-sm">Calculadora de noches</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Entrada</label>
                    <input type="date" value={calcIn} onChange={e => setCalcIn(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Salida</label>
                    <input type="date" value={calcOut} onChange={e => setCalcOut(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={desdeHoy} className="h-11 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform">Desde hoy</button>
                  {[1, 2, 3, 7].map(d => (
                    <button key={d} onClick={() => mover(d)}
                      className="h-11 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform">
                      +{d === 7 ? '1 sem' : `${d}n`}
                    </button>
                  ))}
                  <button onClick={() => mover(-1)}
                    className="h-11 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform">−1n</button>
                </div>

                <div className="bg-[#E05A2B] rounded-2xl p-5 text-center">
                  <p className="text-white/70 text-xs mb-1">
                    {noches > 0 ? `${fmtDateLargo(calcIn)} → ${fmtDateLargo(calcOut)}` : 'Elige las dos fechas'}
                  </p>
                  <p className="text-white text-4xl font-bold">
                    {noches > 0 ? noches : '—'}
                    <span className="text-lg font-medium ml-1.5">{noches === 1 ? 'noche' : 'noches'}</span>
                  </p>
                  {noches <= 0 && calcIn && calcOut && (
                    <p className="text-white/80 text-[11px] mt-1">La salida tiene que ser posterior a la entrada</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">Precio</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">€ por noche</label>
                    <input type="number" inputMode="decimal" value={calcPPN} onChange={e => setCalcPPN(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 mb-1 block">Total</label>
                    <div className="border border-[#E05A2B]/40 rounded-xl px-3 py-3 text-lg bg-orange-50 text-[#E05A2B] font-bold text-center">
                      {total > 0 ? `${total.toFixed(0)}€` : '—'}
                    </div>
                  </div>
                </div>
                {total > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[30, 50, 70].map(p => (
                      <div key={p} className="flex-1 min-w-[90px] bg-slate-50 rounded-xl px-3 py-2 text-center">
                        <p className="text-[10px] text-slate-400">Señal {p}%</p>
                        <p className="text-sm font-bold text-slate-700">{(total * p / 100).toFixed(0)}€</p>
                      </div>
                    ))}
                  </div>
                )}
                {noches > 0 && (
                  <button
                    onClick={() => {
                      setForm({ ...emptyForm, check_in: calcIn, check_out: calcOut, price_per_night: calcPPN, price_total: total > 0 ? total.toFixed(2) : '' });
                      setSelectedProperty('sagrera'); setEditingId(null); setFormError(''); setShowForm(true);
                    }}
                    className="w-full mt-4 h-12 bg-slate-900 text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                    Crear reserva con estos datos
                  </button>
                )}
              </div>
            </div>
          );
        })()}

        {/* CALENDARIO */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-2 py-2 border-b border-slate-100">
              <IconButton onClick={verMasPasado} title="Ver fechas anteriores" className="text-slate-500 bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </IconButton>
              <div className="min-w-0 flex-1 text-center">
                <span className="text-sm font-semibold text-slate-800 capitalize">{calMesVisible || '—'}</span>
                <p className="text-[10px] text-slate-400">Desliza para avanzar · flecha para retroceder</p>
              </div>
              <button onClick={() => scrollHastaHoy()}
                className="flex-shrink-0 h-11 px-3 bg-[#E05A2B] text-white rounded-xl text-xs font-semibold active:scale-95 transition-transform">
                Hoy
              </button>
            </div>

            <div ref={calScrollRef} className="overflow-x-auto overscroll-x-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div style={{ width: LABEL_W + COL_W * days.length }}>

                {/* Banda de meses: cada mes ocupa el ancho de sus días */}
                <div className="flex border-b-2 border-slate-200">
                  <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                    className="sticky left-0 z-30 bg-white border-r border-slate-200" />
                  {tramosMes.map((t, i) => (
                    <div key={t.key}
                      style={{ width: COL_W * t.count, minWidth: COL_W * t.count, background: i % 2 === 0 ? '#F8FAFC' : '#EEF2F7' }}
                      className="py-1.5 border-r-2 border-slate-300 overflow-hidden">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 px-2 whitespace-nowrap capitalize">
                        {t.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Días */}
                <div className="flex border-b border-slate-100">
                  <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                    className="sticky left-0 z-30 bg-white border-r border-slate-200" />
                  {days.map((d, i) => {
                    const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                    const primeroDeMes = d.getDate() === 1;
                    const parImpar = indiceDeMes[`${d.getFullYear()}-${d.getMonth()}`] % 2 === 0;
                    return (
                      <div key={i}
                        style={{
                          width: COL_W, minWidth: COL_W,
                          borderLeft: primeroDeMes ? '2px solid #94A3B8' : undefined,
                          background: isToday ? '#FFF7ED' : isWE ? (parImpar ? '#F1F5F9' : '#E7ECF3') : (parImpar ? '#FFFFFF' : '#F8FAFC'),
                        }}
                        className="text-center py-1.5 border-r border-slate-100">
                        <div className="text-[9px] text-slate-400 uppercase">{d.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                        <div className={`text-xs font-bold ${isToday ? 'text-[#E05A2B]' : 'text-slate-700'}`}>{d.getDate()}</div>
                      </div>
                    );
                  })}
                </div>

                {PROPERTIES.map(prop => (
                  <div key={prop.id}>
                    <div className="flex items-center border-b border-slate-100" style={{ background: prop.light }}>
                      <div style={{ width: LABEL_W, minWidth: LABEL_W, background: prop.light, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                        className="sticky left-0 z-30 px-3 py-1.5 border-r border-slate-200">
                        <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: prop.color }}>{prop.name}</span>
                      </div>
                      <div className="flex-1" style={{ height: 24 }} />
                    </div>
                    {prop.rooms.map(room => {
                      const visibleRes = activas.filter(r => r.room_id === room.id && r.check_in <= toDateStr(days[days.length-1]) && r.check_out >= toDateStr(days[0]));
                      return (
                        <div key={room.id} className="flex border-b border-slate-100 relative" style={{ height: ROW_H }}>
                          <div style={{ width: LABEL_W, minWidth: LABEL_W, boxShadow: '3px 0 5px -3px rgba(15,23,42,0.15)' }}
                            className="sticky left-0 z-30 flex items-center px-3 border-r border-slate-200 bg-white">
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 truncate">{room.name}</p>
                              <p className="text-[9px] text-slate-400">
                                {room.type === 'double' ? 'Doble' : 'Mediana'}
                                {admiteMensual(room.id) && <span className="text-indigo-400"> · mensual</span>}
                              </p>
                            </div>
                          </div>
                          <div className="relative flex-1">
                            <div className="absolute inset-0 flex">
                              {days.map((d, i) => {
                                const ds = toDateStr(d), isToday = ds === today, isWE = d.getDay() === 0 || d.getDay() === 6;
                                const primeroDeMes = d.getDate() === 1;
                                const parImpar = indiceDeMes[`${d.getFullYear()}-${d.getMonth()}`] % 2 === 0;
                                const hasRes = activas.some(r => r.room_id === room.id && r.check_in <= ds && r.check_out >= ds);
                                return (
                                  <div key={i}
                                    style={{
                                      width: COL_W, minWidth: COL_W,
                                      borderLeft: primeroDeMes ? '2px solid #94A3B8' : undefined,
                                      background: isToday ? 'rgba(255,237,213,0.5)' : isWE ? (parImpar ? 'rgba(241,245,249,0.6)' : 'rgba(226,232,240,0.6)') : (parImpar ? undefined : 'rgba(248,250,252,0.9)'),
                                    }}
                                    onClick={() => {
                                      if (hasRes) return;
                                      const p = PROPERTIES.find(pr => pr.rooms.some(r => r.id === room.id));
                                      if (p) setSelectedProperty(p.id);
                                      setForm({ ...emptyForm, room_id: room.id, check_in: ds, check_out: toDateStr(addDays(parseYMD(ds), 1)) });
                                      setEditingId(null); setFormError(''); setShowForm(true);
                                    }}
                                    className={`h-full border-r border-slate-100 group ${!hasRes ? 'cursor-pointer active:bg-blue-100' : ''}`}>
                                    {!hasRes && <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="text-[10px] text-slate-400">+</span></div>}
                                  </div>
                                );
                              })}
                            </div>
                            {visibleRes.map(res => {
                              const bar = getResBar(res);
                              if (!bar) return null;
                              const pending = pendienteDe(res);
                              const isPaid = pending <= 0 && (res.price_total || 0) > 0;
                              const mensual = esMensual(res);
                              const tooth = COL_W * 0.5;
                              const { clipStart, clipEnd } = bar;
                              const clipPath = (clipStart || clipEnd)
                                ? `polygon(${clipStart ? `${tooth}px 0` : '0 0'}, 100% 0, ${clipEnd ? `calc(100% - ${tooth}px) 100%` : '100% 100%'}, 0 100%)`
                                : undefined;
                              return (
                                <button key={res.id} onClick={() => setSelectedRes(res)}
                                  className="absolute top-1.5 bottom-1.5 flex items-center gap-1 text-white text-[11px] font-medium shadow-sm active:opacity-80 truncate"
                                  style={{
                                    left: bar.left + (clipStart ? 0 : 2),
                                    width: bar.width - (clipStart ? 0 : 2) - (clipEnd ? 0 : 2),
                                    background: mensual ? '#6366F1' : prop.color,
                                    backgroundImage: mensual
                                      ? 'repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 8px, transparent 8px 16px)'
                                      : undefined,
                                    zIndex: 10,
                                    clipPath,
                                    borderRadius: 8,
                                    paddingLeft: clipStart ? tooth + 4 : 8,
                                    paddingRight: clipEnd ? tooth + 4 : 8,
                                  }}>
                                  <span className="truncate">{res.guest_name}</span>
                                  {mensual
                                    ? <span className="flex-shrink-0 bg-white/25 rounded px-1 text-[9px]">mes</span>
                                    : isPaid
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

            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-slate-100 text-[10px] text-slate-400 flex-wrap">
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-[#10B981]" /> por noches</span>
              <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-sm bg-indigo-500" /> renta mensual</span>
              <span>· toca un hueco libre para reservar</span>
            </div>
          </div>
        )}

        {/* GASTOS */}
        {activeTab === 'expenses' && (() => {
          const pendientesReembolso = expenses.filter(e => e.own_money && !e.reimbursed_at);
          return (
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
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Ingresos</p><p className="text-sm font-bold text-emerald-600">{propIncome.toFixed(0)}€</p></div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Gastos</p><p className="text-sm font-bold text-red-500">{propCost.toFixed(0)}€</p></div>
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center"><p className="text-[10px] text-slate-400">Neto</p><p className={`text-sm font-bold ${neto >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{neto.toFixed(0)}€</p></div>
                    </div>
                  </div>
                );
              })}

              {pendientesReembolso.length > 0 && (
                <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
                  <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100">
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-700">Por devolver ({pendientesReembolso.length})</span>
                    <p className="text-[10px] text-amber-600/80 mt-0.5">Lo pagaron de su bolsillo. Hasta que se devuelve, no sale de la caja.</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {pendientesReembolso.map(ex => (
                      <div key={ex.id} className="flex items-center gap-3 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{ex.description}</p>
                          <p className="text-[10px] text-slate-400">{ex.paid_by || 'Sin asignar'} · {ex.category} · {fmtDate(ex.date)}</p>
                        </div>
                        <span className="text-sm font-bold text-amber-600 flex-shrink-0">{ex.amount.toFixed(0)}€</span>
                        <button onClick={() => handleReembolso(ex.id)} disabled={busy}
                          className="flex-shrink-0 h-11 px-3 rounded-xl bg-emerald-500 text-white text-xs font-semibold disabled:opacity-60 active:scale-95 transition-transform">
                          Devuelto
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-2.5 bg-amber-50/60">
                      <span className="text-xs text-amber-700 font-medium">Total por devolver</span>
                      <span className="text-xs font-bold text-amber-700">{pendientesReembolso.reduce((a, e) => a + e.amount, 0).toFixed(0)}€</span>
                    </div>
                  </div>
                </div>
              )}

              <button onClick={() => { setExpenseForm(emptyExpenseForm); setEditingExpenseId(null); setShowExpenseForm(true); }}
                className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-dashed border-slate-300 rounded-2xl text-sm text-slate-500 active:scale-[0.98] transition-transform">
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
                      {propExpenses.map(ex => {
                        const info = CAJAS_INFO.find(c => c.id === cajaDeGasto(ex.property_id, ex.payment_method))!;
                        return (
                          <div key={ex.id} className="flex items-center gap-2 p-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="text-xs text-slate-500">{ex.category}</span>
                                <span className="text-[10px] text-slate-400">{fmtDate(ex.date)}</span>
                                {ex.payment_method && (
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${info.bg} ${info.color}`}>{ex.payment_method}</span>
                                )}
                                {ex.paid_by && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{ex.paid_by}</span>}
                                {ex.own_money && (
                                  ex.reimbursed_at
                                    ? <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Devuelto</span>
                                    : <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Por devolver</span>
                                )}
                              </div>
                              <p className="text-sm font-medium text-slate-900 truncate">{ex.description}</p>
                            </div>
                            <span className="text-sm font-bold text-red-500 flex-shrink-0">−{ex.amount.toFixed(0)}€</span>
                            <IconButton onClick={() => handleExpenseEdit(ex)} title="Editar" className="text-slate-400 bg-slate-50">
                              <Edit2 className="w-4 h-4" />
                            </IconButton>
                            <IconButton onClick={() => pedirBorrarGasto(ex)} title="Eliminar" className="text-red-400 bg-red-50">
                              <Trash2 className="w-4 h-4" />
                            </IconButton>
                          </div>
                        );
                      })}
                      <div className="flex justify-between px-4 py-2.5 bg-slate-50">
                        <span className="text-xs text-slate-500 font-medium">Total gastos</span>
                        <span className="text-xs font-bold text-red-500">{propExpenses.reduce((a, e) => a + e.amount, 0).toFixed(0)}€</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {/* STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Resumen financiero</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { l: 'Total facturado', v: `${reservations.reduce((a, r) => a + (r.price_total || 0), 0).toFixed(0)}€`, c: 'text-slate-900' },
                  { l: 'Total cobrado', v: `${totalCobrado.toFixed(0)}€`, c: 'text-emerald-600' },
                  { l: 'Pendiente cobro', v: `${totalPending.toFixed(0)}€`, c: 'text-[#E05A2B]' },
                  { l: 'Ticket medio', v: `${activas.length ? (activas.reduce((a, r) => a + (r.price_total || 0), 0) / activas.length).toFixed(0) : 0}€`, c: 'text-slate-900' },
                ].map(s => (
                  <div key={s.l} className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 mb-0.5">{s.l}</p><p className={`text-lg font-bold ${s.c}`}>{s.v}</p></div>
                ))}
              </div>
            </div>

            {/* Balance por caja */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-1">💰 Balance por caja</h3>
              <p className="text-[11px] text-slate-400 mb-4">Acumulado desde el principio. El detalle mes a mes está en Cuadre.</p>
              {(() => {
                const ingresos = CAJAS_CERO();
                const gastos = CAJAS_CERO();
                movimientos.forEach(m => {
                  if (m.tipo === 'in') ingresos[m.caja] += m.amount;
                  else gastos[m.caja] += m.amount;
                });
                const total = CAJAS_INFO.reduce((a, c) => a + ingresos[c.id] - gastos[c.id], 0);
                return (
                  <div className="space-y-3">
                    {CAJAS_INFO.map(c => {
                      const neto = ingresos[c.id] - gastos[c.id];
                      return (
                        <div key={c.id} className={`${c.bg} rounded-xl p-3`}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-600 font-medium">{c.icon} {c.label}</span>
                            <span className={`font-bold ${c.color}`}>{ingresos[c.id].toFixed(0)}€</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Gastos</span>
                            <span className="text-red-500">−{gastos[c.id].toFixed(0)}€</span>
                          </div>
                          <div className={`flex justify-between text-sm border-t ${c.border} pt-2 mt-2`}>
                            <span className="font-semibold text-slate-700">Neto</span>
                            <span className={`font-bold text-lg ${neto >= 0 ? c.color : 'text-red-500'}`}>{neto.toFixed(0)}€</span>
                          </div>
                        </div>
                      );
                    })}
                    <div className="flex justify-between text-sm p-3 bg-slate-900 rounded-xl">
                      <span className="font-semibold text-white">Total disponible</span>
                      <span className="font-bold text-lg text-white">{total.toFixed(0)}€</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Rentas mensuales */}
            {rentPayments.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <h3 className="font-semibold text-slate-900 text-sm mb-3">🔑 Rentas mensuales</h3>
                {(() => {
                  const cobradas = rentPayments.filter(p => p.paid_at);
                  const totalCobradas = cobradas.reduce((a, p) => a + p.amount, 0);
                  const totalPend = mensualidadesPendientes.reduce((a, p) => a + p.amount, 0);
                  return (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-emerald-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 mb-0.5">Cobrado</p>
                          <p className="text-lg font-bold text-emerald-600">{totalCobradas.toFixed(0)}€</p>
                        </div>
                        <div className="bg-indigo-50 rounded-xl p-3">
                          <p className="text-[10px] text-slate-400 mb-0.5">Por cobrar</p>
                          <p className="text-lg font-bold text-indigo-600">{totalPend.toFixed(0)}€</p>
                        </div>
                      </div>
                      {mensualidadesPendientes.slice(0, 8).map(p => (
                        <div key={p.id} className="flex items-center gap-2 text-xs">
                          <span className="text-slate-400 w-14 flex-shrink-0">{fmtMesCorto(p.period_start)}</span>
                          <span className="flex-1 min-w-0 truncate text-slate-600">{p.guest_name} · {p.room_name}</span>
                          <span className="font-semibold text-slate-700">{p.amount.toFixed(0)}€</span>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Comisiones Sagrada */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">🏠 Sagrada Família — Comisiones</h3>
              {(() => {
                const gestionadas = reservations.filter(r => isManaged(r.room_id));
                const pendiente = gestionadas.reduce((a, r) => a + comisionPendiente(r), 0);
                const cobrado = gestionadas.filter(r => r.settled_at).reduce((a, r) => a + (Number(r.commission_amount) || 0), 0);
                const nPend = gestionadas.filter(r => !r.settled_at).length;
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Ya cobrado</p>
                        <p className="text-lg font-bold text-emerald-600">{cobrado.toFixed(0)}€</p>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3">
                        <p className="text-[10px] text-slate-400 mb-0.5">Nos debe</p>
                        <p className="text-lg font-bold text-purple-600">{pendiente.toFixed(0)}€</p>
                      </div>
                    </div>
                    {nPend > 0 && (
                      <>
                        <div className="space-y-1.5">
                          {gestionadas.filter(r => !r.settled_at).map(r => (
                            <div key={r.id} className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 flex-1 min-w-0 truncate">{r.guest_name}</span>
                              <span className="font-medium text-slate-700 mr-2">{(Number(r.commission_amount) || 0).toFixed(0)}€</span>
                              <button onClick={() => { setSettleTargetId(r.id); setSettleMethod('Efectivo'); setShowSettleModal(true); }}
                                className="h-9 px-3 rounded-lg border border-purple-200 text-purple-700 text-[11px] font-medium active:scale-95 transition-transform">
                                Liquidar
                              </button>
                            </div>
                          ))}
                        </div>
                        <button onClick={() => { setSettleTargetId(null); setSettleMethod('Efectivo'); setShowSettleModal(true); }}
                          className="w-full h-12 bg-[#8B5CF6] text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                          Registrar cobro de {pendiente.toFixed(0)}€
                        </button>
                      </>
                    )}
                    {nPend === 0 && <p className="text-xs text-slate-400 text-center py-2">Todas las comisiones están cobradas</p>}
                  </div>
                );
              })()}
            </div>

            {/* Canales */}
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-900 text-sm mb-4">Reservas por canal</h3>
              {CHANNELS.map(ch => {
                const count = activas.filter(r => r.channel === ch).length;
                if (count === 0) return null;
                const income = activas.filter(r => r.channel === ch).reduce((a, r) => a + (r.price_total || 0), 0);
                return (
                  <div key={ch} className="mb-3 last:mb-0">
                    <div className="flex justify-between text-xs mb-1"><span className="text-slate-600 font-medium">{ch}</span><span className="text-slate-500">{count} · {income.toFixed(0)}€</span></div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#E05A2B] rounded-full" style={{ width: `${(count / Math.max(1, activas.length)) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUADRE */}
        {activeTab === 'cuadre' && (() => {
          const previos = movimientos.filter(m => mesDe(m.date) < cuadreMes);
          const delMes = movimientos.filter(m => mesDe(m.date) === cuadreMes);
          const saldoInicial = acumular(previos);

          const inMes = CAJAS_CERO();
          const outMes = CAJAS_CERO();
          delMes.forEach(m => {
            if (m.tipo === 'in') inMes[m.caja] += m.amount;
            else outMes[m.caja] += m.amount;
          });

          const totalIn = CAJAS_INFO.reduce((a, c) => a + inMes[c.id], 0);
          const totalOut = CAJAS_INFO.reduce((a, c) => a + outMes[c.id], 0);
          const pendientesReembolso = expenses.filter(e => e.own_money && !e.reimbursed_at);
          const esMesActual = cuadreMes === mesActualStr();

          return (
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-100 flex items-center justify-between px-2 py-2">
                <IconButton onClick={() => setCuadreMes(m => sumarMeses(m, -1))} title="Mes anterior" className="text-slate-500 bg-slate-50">
                  <ChevronLeft className="w-4 h-4" />
                </IconButton>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-800 capitalize">{fmtMes(cuadreMes)}</p>
                  {!esMesActual && (
                    <button onClick={() => setCuadreMes(mesActualStr())} className="text-[10px] text-[#E05A2B] font-medium">Volver al mes actual</button>
                  )}
                </div>
                <IconButton onClick={() => setCuadreMes(m => sumarMeses(m, 1))} title="Mes siguiente" className="text-slate-500 bg-slate-50">
                  <ChevronRight className="w-4 h-4" />
                </IconButton>
              </div>

              <div className="bg-white rounded-2xl border border-slate-100 p-4">
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-emerald-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400">Entró</p>
                    <p className="text-base font-bold text-emerald-600">{totalIn.toFixed(0)}€</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400">Salió</p>
                    <p className="text-base font-bold text-red-500">{totalOut.toFixed(0)}€</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-slate-400">Neto</p>
                    <p className={`text-base font-bold ${totalIn - totalOut >= 0 ? 'text-slate-900' : 'text-red-500'}`}>{(totalIn - totalOut).toFixed(0)}€</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-3">
                  Del 1 al último día del mes. Los pagos de reserva cuentan el día que se creó la reserva,
                  los pagos al ingresar el día del check-in, las mensualidades y las comisiones el día que se cobraron.
                </p>
              </div>

              {CAJAS_INFO.map(c => {
                const ingresos = delMes.filter(m => m.caja === c.id && m.tipo === 'in');
                const gastos = delMes.filter(m => m.caja === c.id && m.tipo === 'out');
                const neto = inMes[c.id] - outMes[c.id];
                const teorico = saldoInicial[c.id] + neto;
                const key = `${cuadreMes}:${c.id}`;
                const contadoRaw = conteos[key] ?? '';
                const contado = contadoRaw === '' ? null : Number(contadoRaw);
                const diferencia = contado === null ? null : contado - teorico;

                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                    <div className={`flex items-center justify-between px-4 py-3 ${c.bg} border-b ${c.border}`}>
                      <span className="text-sm font-semibold text-slate-800">{c.icon} {c.label}</span>
                      <span className={`text-sm font-bold ${neto >= 0 ? c.color : 'text-red-500'}`}>{neto >= 0 ? '+' : ''}{neto.toFixed(0)}€</span>
                    </div>

                    <div className="px-4 py-3 flex justify-between text-xs border-b border-slate-100">
                      <span className="text-slate-500">Saldo al empezar el mes</span>
                      <span className="font-semibold text-slate-700">{saldoInicial[c.id].toFixed(0)}€</span>
                    </div>

                    <div className="px-4 pt-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Ingresos ({ingresos.length})</p>
                      {ingresos.length === 0 && <p className="text-xs text-slate-400 pb-2">Sin ingresos este mes</p>}
                      <div className="space-y-1.5">
                        {ingresos.map(m => (
                          <div key={m.key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-12 flex-shrink-0">{fmtDate(m.date)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{m.concepto}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.detalle}</p>
                            </div>
                            <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">+{m.amount.toFixed(0)}€</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="px-4 pt-3">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Gastos ({gastos.length})</p>
                      {gastos.length === 0 && <p className="text-xs text-slate-400 pb-2">Sin gastos este mes</p>}
                      <div className="space-y-1.5">
                        {gastos.map(m => (
                          <div key={m.key} className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 w-12 flex-shrink-0">{fmtDate(m.date)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-slate-800 truncate">{m.concepto}</p>
                              <p className="text-[10px] text-slate-400 truncate">{m.detalle}</p>
                            </div>
                            <span className="text-xs font-semibold text-red-500 flex-shrink-0">−{m.amount.toFixed(0)}€</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 px-4 py-3 bg-slate-50 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-slate-700">Debería haber</span>
                        <span className="font-bold text-slate-900">{teorico.toFixed(0)}€</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-500 flex-1">{c.countLabel}</label>
                        <input type="number" inputMode="decimal" value={contadoRaw}
                          onChange={e => setConteo(key, e.target.value)} placeholder="0"
                          className="w-28 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right bg-white focus:outline-none focus:border-[#E05A2B]" />
                      </div>
                      {diferencia !== null && (
                        <div className={`flex justify-between items-center rounded-xl px-3 py-2.5 ${Math.abs(diferencia) < 0.5 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          <span className={`text-xs font-semibold ${Math.abs(diferencia) < 0.5 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Math.abs(diferencia) < 0.5 ? 'Cuadra' : diferencia > 0 ? 'Sobra' : 'Falta'}
                          </span>
                          <span className={`text-sm font-bold ${Math.abs(diferencia) < 0.5 ? 'text-emerald-700' : 'text-red-700'}`}>
                            {Math.abs(diferencia) < 0.5 ? '0€' : `${diferencia > 0 ? '+' : ''}${diferencia.toFixed(0)}€`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-between text-sm p-4 bg-slate-900 rounded-2xl">
                <span className="font-semibold text-white">Total al cierre de {fmtMes(cuadreMes)}</span>
                <span className="font-bold text-lg text-white">
                  {CAJAS_INFO.reduce((a, c) => a + saldoInicial[c.id] + inMes[c.id] - outMes[c.id], 0).toFixed(0)}€
                </span>
              </div>

              {pendientesReembolso.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <p className="text-xs font-semibold text-amber-800 mb-1">
                    Fuera de caja: {pendientesReembolso.reduce((a, e) => a + e.amount, 0).toFixed(0)}€ adelantados
                  </p>
                  <p className="text-[11px] text-amber-700">
                    {pendientesReembolso.length} {pendientesReembolso.length === 1 ? 'gasto pagado' : 'gastos pagados'} con dinero propio.
                    No se descuentan de la caja hasta que se devuelven, así que el conteo físico no se ve afectado.
                  </p>
                </div>
              )}

              <p className="text-[10px] text-slate-400 px-1">El importe contado se guarda en este dispositivo, no en el servidor.</p>
            </div>
          );
        })()}

      </div>

      {/* Navegación inferior */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-40 pb-[env(safe-area-inset-bottom)]">
        <div className="flex">
          {[
            { id: 'today', icon: Home, label: 'Hoy' },
            { id: 'calc', icon: Calculator, label: 'Calcular' },
            { id: 'calendar', icon: CalendarDays, label: 'Calendario' },
            { id: 'expenses', icon: Wallet, label: 'Gastos' },
            { id: 'cuadre', icon: Scale, label: 'Cuadre' },
            { id: 'stats', icon: BarChart2, label: 'Stats' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex flex-col items-center justify-center h-14 gap-0.5 transition-colors ${activeTab === tab.id ? 'text-[#E05A2B]' : 'text-slate-400'}`}>
              <tab.icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Detalle de reserva */}
      <AnimatePresence>
        {selectedRes && (() => {
          const room = ALL_ROOMS.find(r => r.id === selectedRes.room_id);
          const pending = pendienteDe(selectedRes);
          const nights = calcNights(selectedRes.check_in, selectedRes.check_out);
          const isPaid = pending <= 0 && (selectedRes.price_total || 0) > 0;
          const mensual = esMensual(selectedRes);
          const cuotas = cuotasDe(selectedRes.id);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center"
              onClick={() => setSelectedRes(null)}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6 max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: room?.color }} />
                    <span className="text-xs text-slate-500 truncate">{room?.propertyName} · {room?.name}</span>
                  </div>
                  <IconButton onClick={() => setSelectedRes(null)} title="Cerrar" className="text-slate-400 -mr-2">
                    <X className="w-5 h-5" />
                  </IconButton>
                </div>

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <h3 className="text-xl font-bold text-slate-900">{selectedRes.guest_name}</h3>
                  {selectedRes.no_show && <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">No vino</span>}
                  {mensual && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">Renta mensual</span>}
                  {isPaid && !selectedRes.no_show && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">✓ Pagado</span>}
                </div>

                <div className="space-y-2.5 mb-4 text-sm">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{fmtDate(selectedRes.check_in)} → {fmtDate(selectedRes.check_out)} · {mensual ? `${cuotas.length} ${cuotas.length === 1 ? 'mes' : 'meses'}` : `${nights} ${nights === 1 ? 'noche' : 'noches'}`}</span>
                  </div>
                  <div className="flex items-center gap-3"><Users className="w-4 h-4 text-slate-400 flex-shrink-0" /><span>{selectedRes.num_persons} {selectedRes.num_persons === 1 ? 'persona' : 'personas'}</span></div>
                  {selectedRes.guest_nationality && <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-slate-400 flex-shrink-0" /><span>{selectedRes.guest_nationality}</span></div>}
                  {selectedRes.guest_phone && <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-slate-400 flex-shrink-0" /><a href={`tel:${selectedRes.guest_phone}`} className="text-blue-600">{selectedRes.guest_phone}</a></div>}
                  {selectedRes.guest_email && <div className="flex items-center gap-3"><Mail className="w-4 h-4 text-slate-400 flex-shrink-0" /><span className="truncate">{selectedRes.guest_email}</span></div>}
                  {selectedRes.channel && <div className="flex items-center gap-3"><span className="w-4 text-center text-xs">📲</span><span>{selectedRes.channel}</span></div>}
                </div>

                {/* Mensualidades */}
                {mensual && (
                  <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold text-slate-700">Mensualidades · {(selectedRes.monthly_rate || 0).toFixed(0)}€/mes</p>
                      <span className="text-[10px] text-slate-500">{cuotas.filter(c => c.paid_at).length}/{cuotas.length} cobradas</span>
                    </div>
                    <div className="space-y-1.5">
                      {cuotas.map(c => (
                        <div key={c.id} className="flex items-center gap-2 bg-white rounded-lg px-2.5 py-2">
                          <span className="text-xs font-medium text-slate-700 capitalize flex-1 min-w-0 truncate">{fmtMesCorto(c.period_start)}</span>
                          <span className="text-xs font-semibold text-slate-800">{c.amount.toFixed(0)}€</span>
                          {c.paid_at ? (
                            <button onClick={() => pedirDeshacerMensualidad(c)}
                              className="h-9 px-2.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-semibold active:scale-95 transition-transform">
                              ✓ {c.method || 'Cobrada'}
                            </button>
                          ) : (
                            <button onClick={() => { setRentModal(c); setRentMethod('Efectivo'); setRentAmount(String(c.amount)); }}
                              className="h-9 px-2.5 rounded-lg bg-indigo-500 text-white text-[10px] font-semibold active:scale-95 transition-transform">
                              Cobrar
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!selectedRes.no_show && (
                      <button onClick={() => pedirProrrogaMes(selectedRes)}
                        className="w-full mt-2.5 h-11 rounded-xl border border-indigo-200 bg-white text-indigo-700 text-xs font-semibold active:scale-[0.98] transition-transform">
                        + Añadir un mes
                      </button>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 rounded-xl p-4 mb-4">
                  <p className="text-xs font-semibold text-slate-600 mb-2">Desglose de pagos</p>
                  <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Total</span><span className="font-semibold">{(selectedRes.price_total || 0).toFixed(0)}€</span></div>
                  {(selectedRes.deposit_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-blue-600">🔒 Reserva ({selectedRes.deposit_method})</span>
                      <span className="font-semibold text-blue-600">{(selectedRes.deposit_amount || 0).toFixed(0)}€</span>
                    </div>
                  )}
                  {(selectedRes.checkin_amount || 0) > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-emerald-600">🏠 Ingreso ({selectedRes.checkin_method})</span>
                      <span className="font-semibold text-emerald-600">{(selectedRes.checkin_amount || 0).toFixed(0)}€</span>
                    </div>
                  )}
                  {mensual && cuotas.filter(c => c.paid_at).length > 0 && (
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-indigo-600">🔑 Mensualidades</span>
                      <span className="font-semibold text-indigo-600">{cuotas.filter(c => c.paid_at).reduce((a, c) => a + c.amount, 0).toFixed(0)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5">
                    {selectedRes.no_show
                      ? <><span className="text-slate-500">Estado</span><span className="font-bold text-slate-600">No vino · {(selectedRes.price_paid || 0).toFixed(0)}€ retenidos</span></>
                      : isPaid
                      ? <><span className="text-slate-500">Estado</span><span className="font-bold text-emerald-600">✓ Completamente pagado</span></>
                      : <><span className="text-slate-500">Pendiente</span><span className="font-bold text-[#E05A2B]">{pending.toFixed(0)}€</span></>}
                  </div>
                </div>

                {/* Piso gestionado */}
                {isManaged(selectedRes.room_id) && (
                  <div className="bg-purple-50 rounded-xl p-4 mb-4 border border-purple-100">
                    <p className="text-xs font-semibold text-slate-700 mb-2">🏠 Piso gestionado</p>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-500">Nuestra comisión</span>
                      <span className="font-bold text-emerald-600">{(selectedRes.commission_amount || 0).toFixed(0)}€</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mb-2">El propietario cobra la estancia directo. Nosotros solo facturamos la comisión.</p>
                    <div className="border-t border-purple-200 pt-2 mt-2">
                      {selectedRes.settled_at ? (
                        <>
                          <p className="text-xs text-emerald-700 mb-1">✓ Cobrada el {fmtDate(selectedRes.settled_at)} · {selectedRes.settled_method || 'Efectivo'}</p>
                          <p className="text-[10px] text-slate-400 mb-2">Entró en: {cajaLabel(cajaDeComision(selectedRes.settled_method))}</p>
                          <button onClick={() => pedirDeshacerLiquidacion(selectedRes)}
                            className="w-full h-11 rounded-xl text-[11px] font-medium border border-slate-200 bg-white text-slate-500 active:scale-[0.98] transition-transform">
                            Deshacer cobro
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between text-xs mb-2">
                            <span className="text-slate-500">Pendiente de cobro</span>
                            <span className="font-bold text-[#E05A2B]">{(selectedRes.commission_amount || 0).toFixed(0)}€</span>
                          </div>
                          <button onClick={() => { setSettleTargetId(selectedRes.id); setSettleMethod('Efectivo'); setShowSettleModal(true); }}
                            className="w-full h-11 bg-[#8B5CF6] text-white rounded-xl text-xs font-semibold active:scale-[0.98] transition-transform">
                            Liquidar comisión
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedRes.notes && <div className="bg-yellow-50 rounded-xl p-3 mb-4 text-xs text-slate-600 whitespace-pre-wrap">{selectedRes.notes}</div>}

                {!isPaid && !selectedRes.no_show && !mensual && (
                  <button onClick={() => {
                      setPayingResId(selectedRes.id);
                      setPayAmount(pending.toFixed(0));
                      setPayMethod('Efectivo');
                      setShowPayModal(true);
                    }}
                    className="w-full mb-3 h-12 bg-emerald-500 text-white rounded-xl text-sm font-semibold active:scale-[0.98] transition-transform">
                    💵 Registrar pago al ingreso
                  </button>
                )}

                {/* No vino */}
                {selectedRes.no_show ? (
                  <button onClick={() => pedirDeshacerNoShow(selectedRes)}
                    className="w-full mb-3 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 font-medium active:scale-[0.98] transition-transform">
                    Deshacer «no vino»
                  </button>
                ) : (
                  <button onClick={() => pedirNoShow(selectedRes)}
                    className="w-full mb-3 h-12 border border-amber-200 bg-amber-50 text-amber-700 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                    <UserX className="w-4 h-4" /> No vino · liberar habitación
                  </button>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handleEdit(selectedRes)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 active:scale-[0.98] transition-transform">
                    <Edit2 className="w-4 h-4" /> Editar
                  </button>
                  <button onClick={() => pedirBorrarReserva(selectedRes)}
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
        {showForm && (() => {
          const puedeMensual = admiteMensual(Number(form.room_id));
          const mensual = form.rental_type === 'monthly' && puedeMensual;
          const meses = Number(form.months_count) || 1;
          return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) { setShowForm(false); setEditingId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-xl max-h-[95vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">{editingId ? 'Editar reserva' : 'Nueva reserva'}</h3>
                <IconButton onClick={() => { if (busy) return; setShowForm(false); setEditingId(null); setFormError(''); }} title="Cerrar" className="text-slate-500 -mr-2">
                  <X className="w-5 h-5" />
                </IconButton>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button" onClick={() => { setSelectedProperty(p.id); setForm(f => ({ ...f, room_id: p.rooms[0].id, rental_type: 'nightly' })); }}
                        className="h-11 rounded-xl text-xs font-semibold border transition-all"
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
                      <button key={r.id} type="button"
                        onClick={() => setForm(f => ({ ...f, room_id: r.id, rental_type: admiteMensual(r.id) ? f.rental_type : 'nightly' }))}
                        className={`h-11 px-3 rounded-xl text-xs font-medium border transition-colors ${form.room_id === r.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modalidad: solo en las medianas del Born */}
                {puedeMensual && (
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Modalidad</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setModalidad('nightly')}
                        className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${!mensual ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Por noches
                      </button>
                      <button type="button" onClick={() => setModalidad('monthly')}
                        className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${mensual ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-500 border-slate-200'}`}>
                        Renta mensual
                      </button>
                    </div>
                  </div>
                )}

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

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Canal</label>
                  <div className="flex flex-wrap gap-2">
                    {CHANNELS.map(c => (
                      <button key={c} type="button" onClick={() => setForm(f => ({ ...f, channel: c }))}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${form.channel === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{mensual ? 'Entrada *' : 'Check-in *'}</label>
                    <input required type="date" value={form.check_in} onChange={e => handleCIO('check_in', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">{mensual ? 'Salida (calculada)' : 'Check-out *'}</label>
                    <input required type="date" value={form.check_out} readOnly={mensual}
                      onChange={e => handleCIO('check_out', e.target.value)}
                      className={`w-full border rounded-xl px-3 py-3 text-sm focus:outline-none ${mensual ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-slate-200 focus:border-[#E05A2B]'}`} />
                  </div>
                </div>

                {/* RENTA MENSUAL */}
                {mensual ? (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 space-y-3">
                    <p className="text-xs font-semibold text-slate-700">🔑 Renta mensual</p>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1.5 block">¿Cuántos meses?</label>
                      <div className="flex flex-wrap gap-2">
                        {[1, 2, 3, 4, 6, 12].map(n => (
                          <button key={n} type="button" onClick={() => setMeses(n)}
                            className={`h-11 w-11 rounded-xl text-xs font-bold border transition-colors ${meses === n ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-600 border-slate-200'}`}>
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
                        <div className="flex justify-between"><span className="text-slate-500">{meses} × {Number(form.monthly_rate).toFixed(0)}€</span><span className="font-bold text-indigo-600">{(Number(form.monthly_rate) * meses).toFixed(0)}€</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">Periodo</span><span className="font-medium text-slate-700">{fmtDate(form.check_in)} → {fmtDate(form.check_out)}</span></div>
                        <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          Se crearán {meses} {meses === 1 ? 'mensualidad' : 'mensualidades'} pendientes. Las vas cobrando desde la ficha de la reserva.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-600 mb-3">💰 Calculadora</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">€/noche</label>
                          <input type="number" value={form.price_per_night} onChange={e => handlePPN(e.target.value)}
                            className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Noches</label>
                          <div className="border border-slate-200 rounded-xl px-2 py-2.5 text-sm bg-white text-slate-700 font-medium text-center">{calcNights(form.check_in, form.check_out) || '—'}</div>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 mb-1 block">Total</label>
                          <div className="border border-[#E05A2B]/40 rounded-xl px-2 py-2.5 text-sm bg-orange-50 text-[#E05A2B] font-bold text-center">
                            {form.price_per_night && calcNights(form.check_in, form.check_out) ? `${(parseFloat(form.price_per_night) * calcNights(form.check_in, form.check_out)).toFixed(0)}€` : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 mb-1 block">Total estancia (€)</label>
                      <input type="number" value={form.price_total} onChange={e => setForm(f => ({ ...f, price_total: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                  </>
                )}

                {/* Pago al reservar */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs font-semibold text-slate-700 mb-3">🔒 Pago al reservar</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Importe (€)</label>
                      <input type="number" value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 mb-1 block">Método</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['Transferencia', 'Efectivo', 'Bizum', 'PayPal'].map(m => (
                          <button key={m} type="button" onClick={() => setForm(f => ({ ...f, deposit_method: m }))}
                            className={`h-9 px-2 rounded-lg text-[10px] font-medium border transition-colors ${form.deposit_method === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3">Entra en: {cajaLabel(cajaDeReserva(Number(form.room_id), form.deposit_method))}</p>
                </div>

                {/* Pago al ingreso — no aplica en renta mensual */}
                {!mensual && (
                  <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                    <p className="text-xs font-semibold text-slate-700 mb-3">🏠 Pago al ingresar</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Importe (€)</label>
                        <input type="number" value={form.checkin_amount} onChange={e => setForm(f => ({ ...f, checkin_amount: e.target.value }))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Método</label>
                        <div className="flex flex-wrap gap-1.5">
                          {['Efectivo', 'Transferencia', 'Bizum', 'Tarjeta'].map(m => (
                            <button key={m} type="button" onClick={() => setForm(f => ({ ...f, checkin_method: m }))}
                              className={`h-9 px-2 rounded-lg text-[10px] font-medium border transition-colors ${form.checkin_method === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                              {m}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3">Entra en: {cajaLabel(cajaDeReserva(Number(form.room_id), form.checkin_method))}</p>
                  </div>
                )}

                {/* Comisión Sagrada */}
                {isManaged(Number(form.room_id)) && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-xs font-semibold text-slate-700 mb-1">🏠 Piso gestionado — Comisión</p>
                    <p className="text-[10px] text-slate-500 mb-3">Este piso no es nuestro. Solo la comisión entra en nuestro cuadre, y únicamente al liquidarla.</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">Comisión (€)</label>
                        <input type="number" value={form.commission_amount}
                          onChange={e => setForm(f => ({ ...f, commission_amount: e.target.value }))}
                          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-[#8B5CF6]" placeholder="0" />
                      </div>
                      <div className="flex items-end">
                        <button type="button"
                          onClick={() => setForm(f => ({ ...f, commission_amount: suggestCommission(Number(f.room_id), Number(f.num_persons), f.check_in, f.check_out).toString() }))}
                          className="w-full h-11 rounded-xl text-[11px] font-medium border border-purple-200 bg-white text-purple-700 active:scale-95 transition-transform">
                          {DEFAULT_COMMISSION_PER_PAX_NIGHT}€ × {form.num_persons || 1} × {calcNights(form.check_in, form.check_out) || 0}
                        </button>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.collected_by_us}
                        onChange={e => setForm(f => ({ ...f, collected_by_us: e.target.checked }))}
                        className="w-5 h-5 rounded border-slate-300 accent-[#8B5CF6]" />
                      <span className="text-xs text-slate-600">Cobramos nosotros el total</span>
                    </label>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B] resize-none" placeholder="Info adicional..." />
                </div>

                {formError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">⚠️ {formError}</div>
                )}

                <div className="flex gap-3 pb-2 sticky bottom-0 bg-white pt-2">
                  <button type="button" disabled={busy} onClick={() => { setShowForm(false); setEditingId(null); }}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">
                    Cancelar
                  </button>
                  <button type="submit" disabled={busy}
                    className="flex-1 h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : editingId ? 'Guardar' : 'Crear reserva'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Formulario de gasto */}
      <AnimatePresence>
        {showExpenseForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) { setShowExpenseForm(false); setEditingExpenseId(null); } }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-xl max-h-[90vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 flex-shrink-0">
                <h3 className="font-semibold text-slate-900">{editingExpenseId ? 'Editar gasto' : 'Nuevo gasto'}</h3>
                <IconButton onClick={() => { if (busy) return; setShowExpenseForm(false); setEditingExpenseId(null); }} title="Cerrar" className="text-slate-500 -mr-2">
                  <X className="w-5 h-5" />
                </IconButton>
              </div>
              <form onSubmit={handleExpenseSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Piso *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROPERTIES.map(p => (
                      <button key={p.id} type="button" onClick={() => setExpenseForm(f => ({ ...f, property_id: p.id }))}
                        className="h-11 rounded-xl text-xs font-semibold border transition-all"
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
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${expenseForm.category === c ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Descripción *</label>
                  <input required value={expenseForm.description} onChange={e => setExpenseForm(f => ({ ...f, description: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="Ej: Compra sofá salón" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Lo pagó *</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PAGADORES.map(p => (
                      <button key={p} type="button" onClick={() => setExpenseForm(f => ({ ...f, paid_by: p }))}
                        className={`h-11 rounded-xl text-xs font-semibold border transition-colors ${expenseForm.paid_by === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {p}
                      </button>
                    ))}
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer mt-3">
                    <input type="checkbox" checked={expenseForm.own_money}
                      onChange={e => setExpenseForm(f => ({ ...f, own_money: e.target.checked }))}
                      className="w-5 h-5 mt-0.5 rounded border-slate-300 accent-[#E05A2B]" />
                    <span className="text-xs text-slate-600">
                      Lo puso de su bolsillo
                      <span className="block text-[10px] text-slate-400">No sale de la caja hasta que se le devuelve el dinero.</span>
                    </span>
                  </label>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Método de pago</label>
                  <div className="flex flex-wrap gap-2">
                    {PAYMENT_METHODS.map(m => (
                      <button key={m} type="button" onClick={() => setExpenseForm(f => ({ ...f, payment_method: m }))}
                        className={`h-10 px-3 rounded-xl text-xs font-medium border transition-colors ${expenseForm.payment_method === m ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {expenseForm.own_money
                      ? `Se descontará de ${cajaLabel(cajaDeGasto(expenseForm.property_id, expenseForm.payment_method))} al devolver el dinero.`
                      : `Se descuenta de: ${cajaLabel(cajaDeGasto(expenseForm.property_id, expenseForm.payment_method))}`}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€) *</label>
                    <input required type="number" min="0" step="0.01" value={expenseForm.amount}
                      onChange={e => setExpenseForm(f => ({ ...f, amount: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Fecha *</label>
                    <input required type="date" value={expenseForm.date}
                      onChange={e => setExpenseForm(f => ({ ...f, date: e.target.value }))}
                      className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-[#E05A2B]" />
                  </div>
                </div>
                <div className="flex gap-3 pb-2">
                  <button type="button" disabled={busy} onClick={() => { setShowExpenseForm(false); setEditingExpenseId(null); }}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button type="submit" disabled={busy}
                    className="flex-1 h-12 bg-[#E05A2B] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : editingExpenseId ? 'Guardar' : 'Añadir gasto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cobro rápido */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) setShowPayModal(false); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="font-semibold text-slate-900 mb-4">💵 Registrar pago al ingreso</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€)</label>
                  <input type="number" inputMode="decimal" value={payAmount} onChange={e => setPayAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-emerald-500" placeholder="0" autoFocus />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Método</label>
                  <div className="flex flex-wrap gap-2">
                    {['Efectivo', 'Transferencia', 'Bizum', 'Tarjeta'].map(m => (
                      <button key={m} type="button" onClick={() => setPayMethod(m)}
                        className={`h-11 px-3 rounded-xl text-xs font-medium border transition-colors ${payMethod === m ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button disabled={busy} onClick={() => setShowPayModal(false)}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button disabled={busy} onClick={handleQuickPay}
                    className="flex-1 h-12 bg-emerald-500 text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                    {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                    {busy ? 'Guardando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cobro de mensualidad */}
      <AnimatePresence>
        {rentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget && !busy) setRentModal(null); }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="font-semibold text-slate-900 mb-1">🔑 Cobrar mensualidad</h3>
              <p className="text-xs text-slate-500 mb-4 capitalize">{rentModal.guest_name} · {fmtMesCorto(rentModal.period_start)}</p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Importe (€)</label>
                  <input type="number" inputMode="decimal" value={rentAmount} onChange={e => setRentAmount(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-2 block">Método</label>
                  <div className="flex flex-wrap gap-2">
                    {['Efectivo', 'Transferencia', 'Bizum', 'Tarjeta'].map(m => (
                      <button key={m} type="button" onClick={() => setRentMethod(m)}
                        className={`h-11 px-3 rounded-xl text-xs font-medium border transition-colors ${rentMethod === m ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-slate-500 border-slate-200'}`}>
                        {m}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Entra en: {cajaLabel(cajaDeReserva(Number(rentModal.room_id) || 2, rentMethod))}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button disabled={busy} onClick={() => setRentModal(null)}
                    className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                  <button disabled={busy} onClick={confirmarCobroMensualidad}
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

      {/* Liquidar comisiones */}
      <AnimatePresence>
        {showSettleModal && (() => {
          const target = settleTargetId ? reservations.find(r => r.id === settleTargetId) : null;
          const importe = target ? (Number(target.commission_amount) || 0) : reservations.reduce((a, r) => a + comisionPendiente(r), 0);
          return (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center"
              onClick={e => { if (e.target === e.currentTarget && !busy) { setShowSettleModal(false); setSettleTargetId(null); } }}>
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30 }}
                className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6" onClick={e => e.stopPropagation()}>
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
                <h3 className="font-semibold text-slate-900 mb-1">🏠 Cobro de comisiones</h3>
                <p className="text-xs text-slate-500 mb-4">Sagrada Família{target ? ` · ${target.guest_name}` : ' · todas las pendientes'}</p>
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-xl p-3 flex justify-between text-sm">
                    <span className="text-slate-600">Total a cobrar</span>
                    <span className="font-bold text-purple-600">{importe.toFixed(0)}€</span>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">¿Dónde entra el dinero?</label>
                    <div className="flex gap-2">
                      {(['Efectivo', 'BBVA'] as const).map(m => (
                        <button key={m} type="button" onClick={() => setSettleMethod(m)}
                          className={`flex-1 h-11 rounded-xl text-xs font-medium border transition-colors ${settleMethod === m ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]' : 'bg-white text-slate-500 border-slate-200'}`}>
                          {m === 'Efectivo' ? '💵 Efectivo' : '🏦 BBVA'}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1.5">Entra en: {cajaLabel(cajaDeComision(settleMethod))}</p>
                  </div>
                  <div className="flex gap-3">
                    <button disabled={busy} onClick={() => { setShowSettleModal(false); setSettleTargetId(null); }}
                      className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">Cancelar</button>
                    <button disabled={busy} onClick={handleSettleCommissions}
                      className="flex-1 h-12 bg-[#8B5CF6] text-white rounded-xl text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2">
                      {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                      {busy ? 'Guardando...' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* Confirmación propia. No usamos confirm(), que Safari suprime
          en las apps abiertas desde la pantalla de inicio. */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={e => { if (e.target === e.currentTarget && !busy) setConfirmDialog(null); }}>
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30 }}
              className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-sm shadow-xl p-6"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />
              <h3 className="font-semibold text-slate-900 mb-2">{confirmDialog.titulo}</h3>
              <p className="text-sm text-slate-600 mb-5 leading-relaxed">{confirmDialog.mensaje}</p>
              <div className="flex gap-3">
                <button disabled={busy} onClick={() => setConfirmDialog(null)}
                  className="flex-1 h-12 border border-slate-200 rounded-xl text-sm text-slate-600 disabled:opacity-50">
                  Cancelar
                </button>
                <button disabled={busy}
                  onClick={async () => {
                    if (busy) return;
                    setBusy(true);
                    try {
                      await confirmDialog.accion();
                      setConfirmDialog(null);
                    } catch (err: any) {
                      alert(err?.message || 'No se pudo completar la operación');
                    } finally { setBusy(false); }
                  }}
                  className={`flex-1 h-12 rounded-xl text-sm font-semibold text-white disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform ${confirmDialog.peligro ? 'bg-red-500' : 'bg-[#E05A2B]'}`}>
                  {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                  {busy ? 'Un momento...' : confirmDialog.etiqueta}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}