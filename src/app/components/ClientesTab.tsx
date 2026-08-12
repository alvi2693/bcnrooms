import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Users, Loader2, Building2, CalendarDays, TrendingUp, RefreshCw } from 'lucide-react';

const BACKEND_URL = 'https://barcelonago-backend-9g7y.onrender.com';

interface Rate {
  id: number; room_id: number; label?: string | null;
  valid_from?: string | null; valid_to?: string | null; pax?: number | null;
  net_price: number; min_net_price?: number | null; min_nights: number;
}
interface Busy { from: string; to: string }
interface PRoom {
  id: number; name: string; room_type: string; max_persons: number;
  rates: Rate[]; busy: Busy[];
}
interface PProperty { id: number; name: string; color: string; rooms: PRoom[] }
interface Partner {
  account: { id: number; name: string; slug: string };
  properties: PProperty[];
}

function addDays(d: Date, n: number): Date { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parseYMD(s: string): Date { return new Date(String(s).split('T')[0] + 'T00:00:00'); }
function fmtDate(s: string): string {
  if (!s) return '';
  return parseYMD(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
function noches(a: string, b: string): number {
  if (!a || !b) return 0;
  return Math.ceil((parseYMD(b).getTime() - parseYMD(a).getTime()) / 86400000);
}

// Dos rangos chocan si uno empieza antes de que el otro acabe.
// El día de salida no cuenta: alguien puede entrar esa misma mañana.
function solapa(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}

// Elige la tarifa más específica que encaje: primero la que acota
// fechas y ocupación, después la de fechas, y al final la base.
function tarifaAplicable(rates: Rate[], desde: string, pax: number): Rate | null {
  const candidatas = rates.filter(r => {
    if (r.pax && r.pax !== pax) return false;
    if (r.valid_from && desde < r.valid_from) return false;
    if (r.valid_to && desde > r.valid_to) return false;
    return true;
  });
  if (candidatas.length === 0) return null;
  const puntos = (r: Rate) => (r.valid_from || r.valid_to ? 2 : 0) + (r.pax ? 1 : 0);
  return candidatas.sort((a, b) => puntos(b) - puntos(a))[0];
}

// Pestaña de Clientes del AdminPanel. Recibe el token del panel para
// no montar una sesión aparte.
export function ClientesTab({ token }: { token: string }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const hoy = toDateStr(new Date());
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(() => toDateStr(addDays(new Date(), 2)));
  const [pax, setPax] = useState(2);
  const [margen, setMargen] = useState('15');

  async function cargar() {
    setCargando(true); setError('');
    try {
      const res = await fetch(`${BACKEND_URL}/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error || `El servidor respondió ${res.status}`);
        return;
      }
      const data = await res.json();
      setPartners(data.partners || []);
    } catch {
      setError('No se pudo conectar con el servidor');
    } finally { setCargando(false); }
  }

  useEffect(() => { if (token) cargar(); }, [token]);

  const n = noches(desde, hasta);
  const margenNum = Number(margen) || 0;

  // Habitaciones libres en el rango pedido, con su precio y tu margen.
  const disponibles = useMemo(() => {
    if (n <= 0) return [];
    const out: {
      partner: string; propiedad: string; color: string; habitacion: string;
      pax: number; neto: number | null; minimo: number | null;
    }[] = [];

    partners.forEach(p => {
      p.properties.forEach(prop => {
        prop.rooms.forEach(room => {
          if (room.max_persons < pax) return;
          const ocupada = room.busy.some(b => solapa(desde, hasta, b.from, b.to));
          if (ocupada) return;
          const t = tarifaAplicable(room.rates, desde, pax);
          out.push({
            partner: p.account.name, propiedad: prop.name, color: prop.color,
            habitacion: room.name, pax: room.max_persons,
            neto: t ? t.net_price : null,
            minimo: t?.min_net_price ?? null,
          });
        });
      });
    });
    return out.sort((a, b) => (a.neto ?? 1e9) - (b.neto ?? 1e9));
  }, [partners, desde, hasta, pax, n]);

  const totalHabitaciones = partners.reduce(
    (a, p) => a + p.properties.reduce((b, pr) => b + pr.rooms.length, 0), 0
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 px-4 py-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">Disponibilidad de tus clientes</p>
          <p className="text-[10px] text-slate-400">
            {partners.length} {partners.length === 1 ? 'cliente' : 'clientes'} · {totalHabitaciones} habitaciones
          </p>
        </div>
        <button onClick={cargar}
          className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-400 bg-slate-50 active:scale-95 transition-transform">
          <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
        </button>
      </div>

        {/* Buscador */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-[#E05A2B]" />
            <h2 className="font-semibold text-slate-900 text-sm">Buscar disponibilidad</h2>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Entrada</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Salida</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 mb-1 block">Personas</label>
              <input type="number" min="1" value={pax} onChange={e => setPax(Number(e.target.value) || 1)}
                className="w-full border border-slate-200 rounded-xl px-2 py-2.5 text-sm focus:outline-none focus:border-[#E05A2B]" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {[1, 2, 3, 7].map(d => (
              <button key={d} onClick={() => setHasta(toDateStr(addDays(parseYMD(desde), d)))}
                className="h-10 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform">
                {d === 7 ? '1 semana' : `${d} ${d === 1 ? 'noche' : 'noches'}`}
              </button>
            ))}
            <button onClick={() => { setDesde(hoy); setHasta(toDateStr(addDays(new Date(), 2))); }}
              className="h-10 px-3 rounded-xl text-xs font-medium border border-slate-200 bg-white text-slate-600 active:scale-95 transition-transform">
              Hoy
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 flex-1">Tu margen por noche (€)</label>
            <input type="number" inputMode="decimal" value={margen} onChange={e => setMargen(e.target.value)}
              className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-right focus:outline-none focus:border-[#E05A2B]" />
          </div>

          {n > 0 && (
            <p className="text-[11px] text-slate-400 mt-3">
              {fmtDate(desde)} → {fmtDate(hasta)} · {n} {n === 1 ? 'noche' : 'noches'} · {pax} {pax === 1 ? 'persona' : 'personas'}
            </p>
          )}
          {n <= 0 && <p className="text-[11px] text-[#E05A2B] mt-3">La salida tiene que ser posterior a la entrada</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        {cargando && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Loader2 className="w-6 h-6 text-[#E05A2B] animate-spin mx-auto mb-2" />
            <p className="text-sm text-slate-400">Cargando...</p>
          </div>
        )}

        {!cargando && partners.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
            <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm mb-1">Todavía no hay clientes</p>
            <p className="text-xs text-slate-400">Cuando des de alta una cuenta nueva, aparecerá aquí.</p>
          </div>
        )}

        {/* Resultados */}
        {!cargando && n > 0 && partners.length > 0 && (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Libres ({disponibles.length})
              </span>
              {disponibles.length > 0 && margenNum > 0 && (
                <span className="text-[10px] text-slate-400">precio de venta = neto + {margenNum}€/noche</span>
              )}
            </div>

            {disponibles.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
                <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">Nada libre en esas fechas para {pax} {pax === 1 ? 'persona' : 'personas'}</p>
              </div>
            )}

            {disponibles.map((d, i) => {
              const venta = d.neto !== null ? (d.neto + margenNum) * n : null;
              const costeNeto = d.neto !== null ? d.neto * n : null;
              const miMargen = venta !== null && costeNeto !== null ? venta - costeNeto : null;
              return (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-slate-900 text-sm">{d.habitacion}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                          hasta {d.pax}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">{d.partner} · {d.propiedad}</p>

                      {d.neto === null ? (
                        <div className="bg-amber-50 rounded-xl p-3">
                          <p className="text-xs text-amber-700">Sin precio configurado. Pregúntale cuánto quiere por noche.</p>
                        </div>
                      ) : (
                        <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Él cobra ({d.neto}€ × {n})</span>
                            <span className="font-medium text-slate-700">{costeNeto!.toFixed(0)}€</span>
                          </div>
                          {d.minimo !== null && (
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Aceptaría hasta</span>
                              <span className="text-slate-500">{d.minimo}€/noche</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm border-t border-slate-200 pt-1.5 mt-1">
                            <span className="font-semibold text-slate-700">Vendes por</span>
                            <span className="font-bold text-slate-900">{venta!.toFixed(0)}€</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold text-emerald-700">Tu margen</span>
                            <span className="font-bold text-emerald-600">{miMargen!.toFixed(0)}€</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}

        {/* Resumen por cliente */}
        {!cargando && partners.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900 text-sm">Tus clientes</h2>
            </div>
            <div className="space-y-3">
              {partners.map(p => {
                const habs = p.properties.reduce((a, pr) => a + pr.rooms.length, 0);
                const conPrecio = p.properties.reduce(
                  (a, pr) => a + pr.rooms.filter(r => r.rates.length > 0).length, 0
                );
                return (
                  <div key={p.account.id} className="bg-slate-50 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800">{p.account.name}</span>
                      <span className="text-xs text-slate-500">{habs} {habs === 1 ? 'habitación' : 'habitaciones'}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {p.properties.map(pr => (
                        <span key={pr.id} className="text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: `${pr.color}22`, color: pr.color }}>
                          {pr.name}
                        </span>
                      ))}
                    </div>
                    {conPrecio < habs && (
                      <p className="text-[10px] text-amber-600 mt-2">
                        {habs - conPrecio} sin precio configurado
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      <div className="flex items-center gap-2 text-[10px] text-slate-400 px-1">
        <Users className="w-3 h-3 flex-shrink-0" />
        <span>Solo ves ocupación y precios. Los datos de sus huéspedes y sus cobros no salen del servidor.</span>
      </div>
    </div>
  );
}