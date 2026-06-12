import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Plus, Search, Sparkles, X } from 'lucide-react';
import { format } from 'date-fns';
import { serviciosCatalogo } from '@/data/serviciosCatalogo';
import { buscarClientesActivos, type ClienteOpcion } from './adminCitasApi';
import { crearTratamiento } from './adminTratamientosApi';

const PROFESIONALES = ['Ailen Carro', 'Ayelen', 'Equipo Amore'] as const;
const ZONAS = ['Rivadavia'] as const;

export default function AsignarTratamientoModal(props: {
  onClose: () => void;
  onCreated: () => void | Promise<void>;
}) {
  // ── Paso 1: Cliente ──
  const [termino, setTermino] = useState('');
  const [opciones, setOpciones] = useState<ClienteOpcion[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [cliente, setCliente] = useState<ClienteOpcion | null>(null);

  // ── Paso 2: Datos del tratamiento ──
  const [servicioId, setServicioId] = useState('');
  const [profesional, setProfesional] = useState<string>(PROFESIONALES[0]);
  const [zona, setZona] = useState<string>(ZONAS[0]);
  const [fechaInicio, setFechaInicio] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [sesionesTotales, setSesionesTotales] = useState('10');
  const [precioTotal, setPrecioTotal] = useState('0');
  const [notas, setNotas] = useState('');

  const [saving, setSaving] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Lista plana de servicios para el select
  const serviciosPlanos = useMemo(() => {
    const out: { id: string; nombre: string; categoria: string }[] = [];
    serviciosCatalogo.forEach((cat) => {
      cat.services.forEach((s) => {
        out.push({
          id: `${cat.id}::${s.name}`,
          nombre: s.name,
          categoria: cat.label,
        });
      });
    });
    return out;
  }, []);

  const servicioSeleccionado = useMemo(
    () => serviciosPlanos.find((s) => s.id === servicioId) ?? null,
    [serviciosPlanos, servicioId]
  );

  // Buscar clientes con debounce
  useEffect(() => {
    let cancel = false;
    setBuscando(true);
    const t = setTimeout(async () => {
      const { rows, error } = await buscarClientesActivos(termino, 20);
      if (cancel) return;
      setBuscando(false);
      if (error) {
        setOpciones([]);
        return;
      }
      setOpciones(rows);
    }, 220);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [termino]);

  const canSubmit = !!(
    cliente &&
    servicioSeleccionado &&
    fechaInicio &&
    Number(sesionesTotales) > 0 &&
    !saving
  );

  async function guardar() {
    if (!canSubmit || !cliente || !servicioSeleccionado) return;
    setSaving(true);
    setErrMsg(null);

    const sesiones = Number.parseInt(sesionesTotales, 10);
    const precio = Number.parseFloat(precioTotal.replace(',', '.')) || 0;

    const { error } = await crearTratamiento({
      clienteId: cliente.id,
      servicioId: servicioSeleccionado.id,
      servicioNombre: servicioSeleccionado.nombre,
      profesional,
      zona,
      fechaInicio,
      precioTotal: precio,
      sesionesTotales: sesiones,
      notas: notas.trim() || null,
    });

    setSaving(false);

    if (error) {
      setErrMsg(error);
      return;
    }

    await props.onCreated();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[930] flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.42)' }}
        onClick={() => !saving && props.onClose()}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[931] flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{
          border: '1px solid rgba(242,215,213,0.75)',
          background: 'var(--bg-cream, #FDF8F5)',
          boxShadow: '0 32px 64px rgba(0,61,91,0.18)',
        }}
        initial={{ scale: 0.96, y: 12 }}
        animate={{ scale: 1, y: 0 }}
      >
        <div className="max-h-[92vh] overflow-y-auto p-6 sm:p-8">
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full p-2 text-[#003D5B]/45 hover:bg-[#F2D7D5]/45"
            onClick={() => !saving && props.onClose()}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#BFC9A2]/25 text-[#003D5B]">
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-serif-premium text-xl font-bold text-[#003D5B]">
                Asignar tratamiento
              </h2>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#003D5B]/45">
                Nuevo plan para cliente
              </p>
            </div>
          </div>

          {errMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {errMsg}
            </div>
          ) : null}

          {/* ── Paso 1: Cliente ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              1 · Cliente
            </p>
            {cliente ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#BFC9A2]/45 bg-[#BFC9A2]/12 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#003D5B]">
                    {cliente.full_name}
                  </p>
                  <p className="truncate text-xs text-[#7A746E]">
                    {cliente.phone || '—'} · {cliente.email || '—'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCliente(null)}
                  className="rounded-full border border-[#003D5B]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 rounded-2xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                  <Search className="h-4 w-4 text-[#003D5B]/45" />
                  <input
                    autoFocus
                    type="text"
                    value={termino}
                    onChange={(e) => setTermino(e.target.value)}
                    placeholder="Buscar por nombre, teléfono o email"
                    className="w-full bg-transparent text-sm text-[#003D5B] outline-none placeholder:text-[#003D5B]/30"
                  />
                  {buscando ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#003D5B]/45" />
                  ) : null}
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto rounded-2xl border border-[#F2D7D5]/55 bg-white/85">
                  {opciones.length === 0 && !buscando ? (
                    <p className="px-4 py-3 text-xs text-[#7A746E]">
                      {termino.trim().length >= 2
                        ? 'Sin coincidencias.'
                        : 'Mostrando clientes activos… escribí para filtrar.'}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[#F2D7D5]/40">
                      {opciones.map((o) => (
                        <li key={o.id}>
                          <button
                            type="button"
                            onClick={() => setCliente(o)}
                            className="block w-full px-4 py-3 text-left transition hover:bg-[#F2D7D5]/25"
                          >
                            <p className="text-sm font-semibold text-[#003D5B]">{o.full_name}</p>
                            <p className="text-xs text-[#7A746E]">
                              {o.phone || '—'} · {o.email || '—'}
                            </p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>

          {/* ── Paso 2: Servicio ── */}
          <section className="mt-6">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
              2 · Servicio
            </p>
            <select
              value={servicioId}
              onChange={(e) => setServicioId(e.target.value)}
              className="w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
            >
              <option value="">— Elegir servicio —</option>
              {serviciosCatalogo.map((cat) => (
                <optgroup key={cat.id} label={cat.label}>
                  {cat.services.map((s) => (
                    <option key={`${cat.id}::${s.name}`} value={`${cat.id}::${s.name}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </section>

          {/* ── Paso 3: Profesional y Zona ── */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                3 · Profesional
              </p>
              <select
                value={profesional}
                onChange={(e) => setProfesional(e.target.value)}
                className="w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              >
                {PROFESIONALES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/45">
                4 · Zona
              </p>
              <select
                value={zona}
                onChange={(e) => setZona(e.target.value)}
                className="w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              >
                {ZONAS.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* ── Paso 4: Fecha y sesiones ── */}
          <section className="mt-6 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Fecha de inicio
              </span>
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
            </label>
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Cantidad de sesiones
              </span>
              <input
                type="number"
                min={1}
                max={100}
                value={sesionesTotales}
                onChange={(e) => setSesionesTotales(e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          {/* ── Paso 5: Precio ── */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Precio total del tratamiento (ARS)
              </span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2.5">
                <span className="text-sm font-semibold text-[#003D5B]/50">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precioTotal}
                  onChange={(e) => setPrecioTotal(e.target.value)}
                  placeholder="0"
                  className="w-full bg-transparent text-sm text-[#003D5B] outline-none"
                />
              </div>
              <p className="mt-1 text-[10px] text-[#7A746E]">
                Dejá en 0 si todavía no está definido.
              </p>
            </label>
          </section>

          {/* ── Notas ── */}
          <section className="mt-6">
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#003D5B]/50">
                Notas internas (opcional)
              </span>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observaciones, plan personalizado, indicaciones especiales…"
                rows={3}
                className="mt-1 w-full resize-none rounded-xl border border-[#F2D7D5]/75 bg-white/95 px-3 py-2 text-sm text-[#003D5B] outline-none"
              />
            </label>
          </section>

          <motion.button
            type="button"
            disabled={!canSubmit}
            whileTap={{ scale: canSubmit ? 0.98 : 1 }}
            onClick={() => void guardar()}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:pointer-events-none disabled:opacity-40"
            style={{
              background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
              boxShadow: '0 14px 32px rgba(0,61,91,0.20)',
            }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {saving ? 'Asignando…' : 'Asignar tratamiento'}
          </motion.button>

          {!canSubmit && !saving ? (
            <p className="mt-3 text-center text-[11px] text-[#7A746E]">
              {!cliente
                ? 'Elegí un cliente.'
                : !servicioSeleccionado
                  ? 'Elegí el servicio.'
                  : Number(sesionesTotales) <= 0
                    ? 'Definí la cantidad de sesiones.'
                    : ''}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}