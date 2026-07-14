import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LogOut, Calendar, CalendarDays, Users, Home, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

interface OwnerReservation {
  id: number;
  guest_name: string;
  guest_nationality?: string;
  num_persons: number;
  check_in: string;
  check_out: string;
  nights: number;
  price_total: number;
  commission_amount: number;
  owner_income: number;
  channel?: string;
}

function fmtDate(str: string): string {
  if (!str) return '';
  const d = new Date(str.split('T')[0] + 'T00:00:00');
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function monthKey(str: string): string {
  return str.split('T')[0].slice(0, 7); // YYYY-MM
}

function fmtMonth(key: string): string {
  const d = new Date(key + '-01T00:00:00');
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Días del mes en una rejilla lunes-domingo, con relleno de celdas vacías al inicio.
function buildMonthGrid(monthKey: string): (Date | null)[] {
  const [y, m] = monthKey.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  // getDay(): 0=domingo. Queremos lunes=0.
  const offset = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m - 1, d));
  return cells;
}

export function OwnerPanel() {
  const [token, setToken] = useState(() => localStorage.getItem('owner_token') || '');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [reservations, setReservations] = useState<OwnerReservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const isLoggedIn = !!token;

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND_URL}/owner/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
        localStorage.setItem('owner_token', data.token);
        setLoginError('');
      } else setLoginError('Contraseña incorrecta');
    } catch { setLoginError('Error de conexión'); }
  }

  function handleLogout() {
    setToken('');
    localStorage.removeItem('owner_token');
  }

  async function fetchReservations() {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/owner/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setReservations(data.map((r: any) => ({
        ...r,
        check_in: r.check_in?.split('T')[0] || r.check_in,
        check_out: r.check_out?.split('T')[0] || r.check_out,
        price_total: Number(r.price_total) || 0,
        commission_amount: Number(r.commission_amount) || 0,
        owner_income: Number(r.owner_income) || 0,
        num_persons: Number(r.num_persons) || 1,
        nights: Number(r.nights) || 0,
      })));
    } catch {} finally { setLoading(false); }
  }

  useEffect(() => { if (isLoggedIn) fetchReservations(); }, [isLoggedIn]);

  if (!isLoggedIn) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-[#8B5CF6] p-2.5 rounded-xl"><Home className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="font-bold text-slate-900">Sagrada Família</h1>
            <p className="text-xs text-slate-400">Panel del propietario</p>
          </div>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#8B5CF6]"
              placeholder="••••••••" />
          </div>
          {loginError && <p className="text-red-500 text-xs">{loginError}</p>}
          <button type="submit" className="w-full bg-[#8B5CF6] text-white py-3 rounded-xl text-sm font-semibold">
            Entrar
          </button>
        </form>
      </motion.div>
    </div>
  );

  // Navegación libre por meses (no solo los que tienen reservas)
  function shiftMonth(key: string, delta: number): string {
    const [y, m] = key.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  const monthRes = reservations
    .filter(r => monthKey(r.check_in) === selectedMonth)
    .sort((a, b) => a.check_in.localeCompare(b.check_in));

  const totalBruto = monthRes.reduce((a, r) => a + r.price_total, 0);
  const totalComision = monthRes.reduce((a, r) => a + r.commission_amount, 0);
  const totalNeto = monthRes.reduce((a, r) => a + r.owner_income, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-[#8B5CF6] p-1.5 rounded-lg"><Home className="w-4 h-4 text-white" /></div>
            <div>
              <span className="font-bold text-slate-900 text-sm block leading-tight">Sagrada Família</span>
              <span className="text-[10px] text-slate-400">Panel del propietario</span>
            </div>
          </div>
          <button onClick={handleLogout} className="p-2 text-slate-400 rounded-xl hover:bg-slate-100">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-4 space-y-4">

        {/* Selector de mes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3 flex items-center justify-between">
          <button
            onClick={() => { setSelectedMonth(m => shiftMonth(m, -1)); setSelectedDay(null); }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setSelectedMonth(new Date().toISOString().slice(0, 7)); setSelectedDay(null); }}
            className="text-sm font-semibold text-slate-800 capitalize hover:text-[#8B5CF6] transition-colors">
            {fmtMonth(selectedMonth)}
          </button>
          <button
            onClick={() => { setSelectedMonth(m => shiftMonth(m, 1)); setSelectedDay(null); }}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Calendario del mes */}
        {(() => {
          const cells = buildMonthGrid(selectedMonth);
          const today = toDateStr(new Date());

          // Una noche está ocupada si cae en [check_in, check_out).
          // El día de check_out queda libre (el huésped se va esa mañana).
          function resOf(dateStr: string): OwnerReservation | undefined {
            return reservations.find(r => dateStr >= r.check_in && dateStr < r.check_out);
          }

          const nochesOcupadas = cells.filter(d => d && resOf(toDateStr(d))).length;
          const diasDelMes = cells.filter(Boolean).length;
          const ocupacion = diasDelMes ? Math.round((nochesOcupadas / diasDelMes) * 100) : 0;

          return (
            <div className="bg-white rounded-2xl border border-slate-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-[#8B5CF6]" />
                  <h2 className="font-semibold text-slate-900 text-sm">Ocupación</h2>
                </div>
                <span className="text-xs text-slate-500">
                  {nochesOcupadas} {nochesOcupadas === 1 ? 'noche' : 'noches'} · {ocupacion}%
                </span>
              </div>

              {/* Cabecera de días */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-medium text-slate-400 py-1">{d}</div>
                ))}
              </div>

              {/* Rejilla */}
              <div className="grid grid-cols-7 gap-1">
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />;
                  const ds = toDateStr(d);
                  const res = resOf(ds);
                  const isToday = ds === today;
                  const isCheckIn = reservations.some(r => r.check_in === ds);
                  const isCheckOut = reservations.some(r => r.check_out === ds);

                  return (
                    <button key={i}
                      onClick={() => res && setSelectedDay(selectedDay === ds ? null : ds)}
                      title={res ? `${res.guest_name} · ${res.num_persons} pers.` : 'Libre'}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                        res
                          ? 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] cursor-pointer'
                          : 'bg-slate-50 text-slate-400 cursor-default'
                      } ${isToday ? 'ring-2 ring-[#E05A2B] ring-offset-1' : ''} ${
                        selectedDay === ds ? 'ring-2 ring-slate-900 ring-offset-1' : ''
                      }`}>
                      <span className={`text-xs ${res ? 'font-semibold' : ''}`}>{d.getDate()}</span>
                      {/* Marca de entrada/salida */}
                      {isCheckIn && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white/70" />}
                      {isCheckOut && !res && <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[#8B5CF6]/40" />}
                    </button>
                  );
                })}
              </div>

              {/* Leyenda */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#8B5CF6]" />
                  <span className="text-[10px] text-slate-500">Ocupado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-slate-100" />
                  <span className="text-[10px] text-slate-500">Libre</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded border-2 border-[#E05A2B]" />
                  <span className="text-[10px] text-slate-500">Hoy</span>
                </div>
              </div>

              {/* Detalle del día seleccionado */}
              {selectedDay && (() => {
                const r = resOf(selectedDay);
                if (!r) return null;
                return (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-3 bg-purple-50 rounded-xl p-3 border border-purple-100">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800">{r.guest_name}</p>
                      {r.guest_nationality && (
                        <span className="text-[10px] bg-white text-slate-500 px-2 py-0.5 rounded-full">
                          {r.guest_nationality}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {fmtDate(r.check_in)} → {fmtDate(r.check_out)} · {r.nights} {r.nights === 1 ? 'noche' : 'noches'} · {r.num_persons} {r.num_persons === 1 ? 'persona' : 'personas'}
                    </p>
                  </motion.div>
                );
              })()}
            </div>
          );
        })()}

        {/* Resumen del mes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
            <h2 className="font-semibold text-slate-900 text-sm">Resumen del mes</h2>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Ingresos brutos</span>
              <span className="font-semibold text-slate-900">{totalBruto.toFixed(0)}€</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Comisión de gestión</span>
              <span className="font-semibold text-[#E05A2B]">−{totalComision.toFixed(0)}€</span>
            </div>
            <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
              <span className="font-semibold text-slate-700">Total a recibir</span>
              <span className="font-bold text-2xl text-emerald-600">{totalNeto.toFixed(0)}€</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-3">
            {monthRes.length} {monthRes.length === 1 ? 'reserva' : 'reservas'} · Comisión de gestión según acuerdo
          </p>
        </div>

        {/* Detalle de reservas */}
        {loading && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <p className="text-slate-400 text-sm">Cargando...</p>
          </div>
        )}

        {!loading && monthRes.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">Sin reservas este mes</p>
          </div>
        )}

        {monthRes.map(r => (
          <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start gap-3">
              <div className="w-1 self-stretch rounded-full flex-shrink-0 bg-[#8B5CF6]" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-slate-900 text-sm">{r.guest_name}</span>
                  {r.guest_nationality && (
                    <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      {r.guest_nationality}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {fmtDate(r.check_in)} → {fmtDate(r.check_out)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {r.num_persons}
                  </span>
                  <span>{r.nights} {r.nights === 1 ? 'noche' : 'noches'}</span>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Precio estancia</span>
                    <span className="font-medium text-slate-700">{r.price_total.toFixed(0)}€</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Comisión de gestión</span>
                    <span className="font-medium text-[#E05A2B]">−{r.commission_amount.toFixed(0)}€</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5 mt-1.5">
                    <span className="font-semibold text-slate-700">Tu ingreso</span>
                    <span className="font-bold text-emerald-600">{r.owner_income.toFixed(0)}€</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}