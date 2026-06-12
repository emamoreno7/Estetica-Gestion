/**
 * Vista "Mis Citas" del portal: agenda con anti-superposición y recomendaciones.
 */
import { useCallback, useEffect, useMemo, useState, type JSX, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon,
  CalendarPlus,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  ShieldAlert,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale/es';
import { useAuth } from '@/context/AuthContext';
import { useCitasData } from '@/context/CitasDataContext';
import { usePortalNotifications } from '@/context/PortalNotificationsContext';
import { useConsentimiento } from '@/context/ConsentimientoContext';
import { ConsentimientoModal } from '@/components/portal/ConsentimientoModal';
import type { PortalActiveTreatment } from '@/lib/portalTreatment';
import type { CitaClienteRow } from '@/lib/citasApi';
import {
  fetchHorasOcupadasPorFecha,
  filtrarFranjasDisponibles,
  generarFranjasComerciales,
  insertarReservaCliente,
  parseCitaMomentLocal,
} from '@/lib/citasApi';
import {
  CITAS_SERVICIOS_RESERVABLES,
  obtenerCrossSellPorServicio,
  type ServicioReservable,
} from '@/lib/citasConstants';
import { clienteDisplayName, firstNameOrFriendly } from '@/lib/perfilCliente';
import { WHATSAPP_ADMIN_PHONE } from '@/lib/whatsapp';

/** Sombras alineadas con banners y cards del portal (misma profundidad que Inicio). */
const PORTAL_PANEL_SHADOW = '0 24px 64px rgba(0,61,91,0.10), 0 8px 24px rgba(0,61,91,0.05)';

function waHrefComplement(serviceName: string, reason: string): string {
  const text = `Hola Amore, me interesaría conocer más sobre "${serviceName}" como complemento a mi turno. Contexto profesional que vi en el portal: ${reason}`;
  return `https://wa.me/${WHATSAPP_ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
}

function hhmmEtiqueta(horaSql: string): string {
  const m = horaSql.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : horaSql;
}

function buildGoogleCalendarHref(opts: {
  title: string;
  details: string;
  start: Date;
  durationMinutes?: number;
}): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const dur = opts.durationMinutes ?? 60;
  const end = new Date(opts.start.getTime() + dur * 60000);
  const raw = (d: Date) =>
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: opts.title,
    details: opts.details,
    dates: `${raw(opts.start)}/${raw(end)}`,
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

export type PortalSesionResumen = {
  nro: number;
  fecha: string;
  estado: 'completada' | 'proxima' | 'programada';
  notas: string;
  foto: string;
};

type EmptyPhProps = {
  title: string;
  paragraph: string | ReactNode;
  children?: ReactNode;
};

export function PortalCitasTab(props: {
  activeTreatment: PortalActiveTreatment | null;
  sessions: PortalSesionResumen[];
  PortalTreatmentEmptyPlaceholder: (p: EmptyPhProps) => JSX.Element;
  buildWhatsAppHref: (svc: string) => string;
}): JSX.Element {
  const { activeTreatment, sessions, PortalTreatmentEmptyPlaceholder, buildWhatsAppHref } = props;
  const { session, perfilCliente } = useAuth();
  const uid = session?.user?.id ?? '';

  const nombreSaludo = firstNameOrFriendly(
    clienteDisplayName(
      session?.user?.email ?? undefined,
      (session?.user?.user_metadata ?? {}) as Record<string, unknown>,
      perfilCliente?.full_name
    )
  );

  const { proximaCita, proximaLoading, refreshProximaCita, setUltimaReserva } = useCitasData();
  const { notifyCitaConfirmada } = usePortalNotifications();
  const { firmado: consentFirmado, noMigrado: consentNoMigrado, setConsentimiento } =
    useConsentimiento();

  const [bookingOpen, setBookingOpen] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  const [successSaved, setSuccessSaved] = useState<CitaClienteRow | null>(null);

  const showDbHero =
    proximaCita && parseCitaMomentLocal(proximaCita).getTime() >= Date.now() - 60_000;

  const planHero =
    activeTreatment && activeTreatment.fechaPlanPendiente === false ? activeTreatment : null;

  // Gate: si no firmó el consentimiento (y el módulo está habilitado),
  // primero pedimos la firma; al firmar, abrimos la reserva.
  const openBooking = () => {
    if (!consentFirmado && !consentNoMigrado) {
      setConsentOpen(true);
      return;
    }
    setBookingOpen(true);
  };

  const onBookingDone = async (saved: CitaClienteRow | null) => {
    await refreshProximaCita();
    if (saved) setUltimaReserva(saved);
    if (saved) {
      notifyCitaConfirmada(saved);
      setSuccessSaved(saved);
    }
    setBookingOpen(false);
  };

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl border px-6 py-5 sm:px-8 sm:py-6"
        style={{
          borderColor: 'rgba(242,215,213,0.55)',
          background: 'var(--bg-cream)',
          boxShadow: PORTAL_PANEL_SHADOW,
        }}
      >
        <p className="text-serif-premium text-lg leading-relaxed sm:text-xl" style={{ color: 'var(--primary-navy)' }}>
          Hola <span className="font-semibold">{nombreSaludo}</span>,{' '}
          <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
            agendá tu momento de relax.
          </span>
        </p>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: 'rgba(69,95,112,0.75)' }}>
          Mis citas
        </p>
      </motion.section>

      {!consentFirmado && !consentNoMigrado ? (
        <motion.button
          type="button"
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setConsentOpen(true)}
          className="flex w-full items-start gap-3 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-left"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <span>
            <span className="block text-sm font-semibold text-amber-950">
              Falta firmar tu consentimiento informado
            </span>
            <span className="mt-0.5 block text-xs text-amber-900/85">
              Es obligatorio antes de reservar. Tocá acá para leerlo y firmarlo (1 minuto).
            </span>
          </span>
        </motion.button>
      ) : null}

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-serif-premium text-xl font-bold" style={{ color: 'var(--primary-navy)' }}>
            Mis Citas
          </h2>
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={openBooking}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#BFC9A2] to-[#003D5B] px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.15em] text-white shadow-lg"
          >
            <Plus className="h-4 w-4" />
            + Agregar servicio
          </motion.button>
        </div>

        {!activeTreatment && (
          <div className="mb-6">
            <PortalTreatmentEmptyPlaceholder
              title="Agendá con Amore cuando quieras"
              paragraph={
                <>
                  Reservá Body Up, Radiofrecuencia, Crio-lipólisis, Hollywood Peel, Depilación definitiva, Presoterapia y más.
                  Elegís día y horario según disponibilidad sin superposiciones; al confirmar se guarda en tu cuenta y podés enviar el
                  comprobante por WhatsApp.
                </>
              }
              children={
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={openBooking}
                  className="mt-6 rounded-full bg-[#003D5B] px-8 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-md"
                >
                  Nueva reserva
                </motion.button>
              }
            />
          </div>
        )}
      </motion.div>

      {proximaLoading && (
        <p className="flex items-center gap-2 text-sm text-[#7A746E]">
          <Loader2 className="h-4 w-4 animate-spin" /> Actualizando turnos…
        </p>
      )}

      {showDbHero && proximaCita && (
        <ProximaHeroDesdeDb
          cita={proximaCita}
          buildWhatsAppHref={buildWhatsAppHref}
          onAddService={openBooking}
        />
      )}

      {!showDbHero && planHero && (
        <ProximaHeroPlan plan={planHero} onAdd={openBooking} buildWhatsAppHref={buildWhatsAppHref} />
      )}

      {!showDbHero && !planHero && activeTreatment?.fechaPlanPendiente === true && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong overflow-hidden rounded-2xl p-8 text-center"
        >
          <CalendarIcon className="mx-auto mb-4 h-8 w-8 text-[#003D5B]" />
          <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Reservá tu turno con calendario</h3>
          <p className="mt-2 text-sm text-[#7A746E]">
            Servicio elegido en tu perfil: <strong>{activeTreatment.nombre}</strong>. Abrí la agenda elegís día y hora disponibles — el turno se guarda en tu cuenta antes de enviar comprobantes.
          </p>
          <motion.button
            type="button"
            onClick={openBooking}
            whileTap={{ scale: 0.98 }}
            className="mx-auto mt-6 flex rounded-full px-10 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-white shadow-lg"
            style={{ background: '#003D5B' }}
          >
            Ver calendario y horarios disponibles
          </motion.button>
          <motion.a
            href={buildWhatsAppHref(`turno para ${activeTreatment.nombre}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 block text-[11px] font-medium text-[#7A746E]"
          >
            Si preferís, también podés <span className="font-semibold text-[#25D366] underline">consultar por WhatsApp</span>
          </motion.a>
        </motion.div>
      )}

      {sessions.some((s) => s.estado !== 'completada') ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-strong rounded-2xl p-6">
          <h3 className="text-serif-premium mb-4 text-lg font-bold text-[#003D5B]">Sesiones registradas</h3>
          <div className="space-y-3">
            {sessions
              .filter((s) => s.estado !== 'completada')
              .map((s, i) => (
                <motion.div
                  key={s.nro}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="flex items-center justify-between rounded-xl bg-[#FDF8F5]/75 p-4"
                >
                  <div className="flex gap-3">
                    <CalendarIcon className="h-5 w-5 shrink-0 text-[#003D5B]" />
                    <div>
                      <p className="text-sm font-semibold text-[#003D5B]">Sesión {s.nro}</p>
                      <p className="text-xs text-[#7A746E]">Recepción completa fecha y lugar.</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#7A746E]">{s.estado}</span>
                </motion.div>
              ))}
          </div>
        </motion.div>
      ) : null}

      <AnimatePresence>
        {consentOpen && uid && (
          <ConsentimientoModal
            clienteId={uid}
            nombreSugerido={clienteDisplayName(
              session?.user?.email ?? undefined,
              (session?.user?.user_metadata ?? {}) as Record<string, unknown>,
              perfilCliente?.full_name
            )}
            onClose={() => setConsentOpen(false)}
            onFirmado={(c) => {
              setConsentimiento(c);
              setConsentOpen(false);
              // Tras firmar, abrimos directamente la reserva
              setBookingOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingOpen && uid && (
          <CitasBookingModal
            userId={uid}
            onClose={() => setBookingOpen(false)}
            onComplete={async (row) => {
              await onBookingDone(row);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {successSaved && (
          <BookingSuccessCrossSellModal
            cita={successSaved}
            nombreCliente={clienteDisplayName(
              session?.user?.email ?? undefined,
              (session?.user?.user_metadata ?? {}) as Record<string, unknown>,
              perfilCliente?.full_name
            )}
            onClose={() => setSuccessSaved(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProximaHeroDesdeDb(props: {
  cita: CitaClienteRow;
  buildWhatsAppHref: (s: string) => string;
  onAddService: () => void;
}): JSX.Element {
  const { cita } = props;
  const fecha = parseCitaMomentLocal(cita);
  const gcalHref = buildGoogleCalendarHref({
    title: `Amore — ${cita.servicio}`,
    details: 'Turno reservado desde el portal cliente Amore Centro Di Bellezza.',
    start: fecha,
    durationMinutes: 60,
  });

  const estadoLbl =
    cita.estado === 'confirmado'
      ? '🟢 Confirmada'
      : cita.estado === 'pendiente'
        ? '🟡 Pendiente de confirmación'
        : cita.estado === 'realizado'
          ? '🔵 Realizada'
          : '🔴 Cancelada';

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong overflow-hidden rounded-2xl p-6"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="rounded-lg p-1.5" style={{ background: 'var(--primary-navy)' }}>
          <CalendarIcon className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Próxima Cita</h3>
        <span className="ml-auto rounded-full bg-[#BFC9A2]/25 px-3 py-1 text-[10px] font-semibold text-[#003D5B]">
          {estadoLbl}
        </span>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl bg-[#F2D7D5]/20">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col items-center justify-center border-b border-[#F2D7D5]/40 p-6 sm:border-b-0 sm:border-r sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#003D5B]/45">
              {format(fecha, 'MMMM', { locale: es })}
            </p>
            <p className="text-serif-premium text-4xl font-bold text-[#003D5B]">{fecha.getDate()}</p>
            <p className="text-xs text-[#7A746E]">{format(fecha, 'EEEE', { locale: es })}</p>
          </div>
          <div className="flex-1 space-y-3 p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">
                {hhmmEtiqueta(cita.hora)} hs — {cita.servicio}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">
                Coordinación con recepción — Equipo Amore
              </span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">Sede según valoración profesional</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.a
          href={gcalHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#BFC9A2] to-[#003D5B] px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <CalendarPlus className="h-4 w-4" /> Añadir al calendario
        </motion.a>
        <motion.a
          href={props.buildWhatsAppHref(cita.servicio)}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#F2D7D5]/60 bg-[#FDF8F5]/75 px-5 py-3 text-sm font-semibold text-[#7A746E]"
        >
          <MessageCircle className="h-4 w-4 text-[#003D5B]" /> Reagendar
        </motion.a>
        <motion.button
          type="button"
          onClick={props.onAddService}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#003D5B]/15 px-5 py-3 text-sm font-semibold text-[#003D5B]"
        >
          <Plus className="h-4 w-4" /> Agregar otro servicio
        </motion.button>
      </div>
    </motion.div>
  );
}

function ProximaHeroPlan(props: {
  plan: PortalActiveTreatment;
  onAdd: () => void;
  buildWhatsAppHref: (s: string) => string;
}): JSX.Element {
  const { plan } = props;
  const fecha = parseISO(plan.proximaSesion || '');
  const ok = !Number.isNaN(fecha.getTime());

  const hrefWa = props.buildWhatsAppHref(`turno para ${plan.nombre}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-strong overflow-hidden rounded-2xl p-6"
    >
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg p-1.5" style={{ background: 'var(--primary-navy)' }}>
          <CalendarIcon className="h-4 w-4 text-white" />
        </div>
        <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Próxima Cita</h3>
        <span className="ml-auto rounded-full bg-[#BFC9A2]/25 px-3 py-1 text-[10px] font-semibold text-[#003D5B]">
          Plan activo
        </span>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl bg-[#F2D7D5]/20">
        <div className="flex flex-col sm:flex-row">
          <div className="flex flex-col items-center justify-center border-b border-[#F2D7D5]/40 p-6 sm:border-b-0 sm:border-r sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#F2D7D5]">
              {ok ? format(fecha, 'MMMM', { locale: es }) : '—'}
            </p>
            <p className="text-serif-premium text-4xl font-bold text-[#003D5B]">
              {ok ? fecha.getDate() : '—'}
            </p>
            <p className="text-xs text-[#7A746E]">{ok ? format(fecha, 'EEEE', { locale: es }) : ''}</p>
          </div>
          <div className="flex-1 space-y-3 p-5">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">
                {plan.horaProxima} hs — {plan.nombre}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Stethoscope className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">{plan.profesional}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-[#003D5B]" />
              <span className="text-sm font-medium text-[#003D5B]">{plan.sucursal}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <motion.button
          type="button"
          onClick={props.onAdd}
          whileHover={{ scale: 1.02 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#BFC9A2] to-[#003D5B] px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          <Plus className="h-4 w-4" /> + Agregar otro servicio
        </motion.button>
        <motion.a
          href={hrefWa}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
        >
          <MessageCircle className="h-4 w-4" /> Coordinar WhatsApp
        </motion.a>
        <motion.a
          href="tel:+542634652008"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold"
        >
          <Phone className="h-4 w-4 text-[#003D5B]" /> Llamar
        </motion.a>
      </div>
    </motion.div>
  );
}

function MesCalendarioUniversal(props: {
  selected: Date;
  onPick: (d: Date) => void;
}): JSX.Element {
  const { selected, onPick } = props;
  const [cursor, setCursor] = useState(() => startOfMonth(selected));
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const grid = eachDayOfInterval({ start, end });
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div
      className="rounded-3xl p-5 sm:p-6"
      style={{
        background: 'var(--bg-cream, #FDF8F5)',
        border: '1px solid rgba(242,215,213,0.45)',
        boxShadow: '0 12px 40px rgba(0,61,91,0.04)',
      }}
    >
      <div className="mb-4 flex items-center justify-between px-0.5">
        <motion.button
          type="button"
          aria-label="Mes anterior"
          whileTap={{ scale: 0.95 }}
          onClick={() => setCursor(subMonths(cursor, 1))}
          className="rounded-full p-2.5 transition"
          style={{
            color: 'var(--primary-navy)',
            background: 'rgba(191,201,162,0.22)',
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
        <p className="text-xs font-semibold uppercase tracking-[0.22em]" style={{ color: 'rgba(0,61,91,0.55)' }}>
          {format(cursor, 'MMMM yyyy', { locale: es })}
        </p>
        <motion.button
          type="button"
          aria-label="Mes siguiente"
          whileTap={{ scale: 0.95 }}
          onClick={() => setCursor(addMonths(cursor, 1))}
          className="rounded-full p-2.5 transition"
          style={{
            color: 'var(--primary-navy)',
            background: 'rgba(191,201,162,0.22)',
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
          <span
            key={d}
            className="pb-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'rgba(69,95,112,0.55)' }}
          >
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {grid.map((day) => {
          const mute = !isSameMonth(day, cursor);
          const cmp = new Date(day);
          cmp.setHours(0, 0, 0, 0);
          const past = isBefore(cmp, today);
          const sel = isSameDay(day, selected);
          const label = format(day, 'd');
          return (
            <button
              key={format(day, 'yyyy-MM-dd')}
              type="button"
              disabled={past || mute}
              onClick={() => {
                const d = new Date(day);
                d.setHours(12, 0, 0, 0);
                onPick(d);
              }}
              className={`aspect-square rounded-2xl text-sm font-semibold transition-all ${
                past || mute ? 'cursor-not-allowed opacity-35' : 'hover:bg-[rgba(242,215,213,0.35)] active:scale-95'
              }`}
              style={
                sel && !past && !mute
                  ? {
                      background: 'linear-gradient(135deg, #BFC9A2 0%, #003D5B 100%)',
                      color: '#FFFFFF',
                      boxShadow: '0 8px 22px rgba(0,61,91,0.18)',
                      border: 'none',
                    }
                  : {
                      color: mute ? 'transparent' : 'var(--primary-navy)',
                      background: 'transparent',
                      border: mute ? 'none' : '1px solid transparent',
                    }
              }
            >
              {mute ? '' : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CitasBookingModal(props: {
  userId: string;
  onClose: () => void;
  onComplete: (c: CitaClienteRow | null) => Promise<void>;
}): JSX.Element | null {
  const todasFranjas = useMemo(() => generarFranjasComerciales(), []);

  const [wizardStep, setWizardStep] = useState<1 | 2>(1);

  const [servicio, setServicio] = useState<ServicioReservable | null>(null);
  const pickInit = (): Date => {
    const x = new Date();
    x.setHours(12, 0, 0, 0);
    return x;
  };
  const [pickedDay, setPickedDay] = useState(pickInit);
  const [hora, setHora] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>(todasFranjas);
  const [busyOcc, setBusyOcc] = useState(false);
  const [slotsWarn, setSlotsWarn] = useState<string | null>(null);
  const [availDegraded, setAvailDegraded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const fechaStr = format(pickedDay, 'yyyy-MM-dd');

  const loadSlots = useCallback(async () => {
    setBusyOcc(true);
    setSlotsWarn(null);
    setAvailDegraded(false);
    const { horasOcupadas, error } = await fetchHorasOcupadasPorFecha(fechaStr);
    setBusyOcc(false);

    if (error) {
      setSlotsWarn(error);
      setAvailDegraded(true);
      setSlots([...todasFranjas]);
      return;
    }

    const free = filtrarFranjasDisponibles(horasOcupadas, todasFranjas);
    setSlots(free);
    if (free.length === 0) {
      setSlotsWarn(null);
    }
  }, [fechaStr, todasFranjas]);

  useEffect(() => {
    if (wizardStep !== 2 || !servicio) return;
    void loadSlots();
  }, [wizardStep, servicio, fechaStr, loadSlots]);

  async function confirmar(): Promise<void> {
    if (!servicio || !hora) return;
    setSaving(true);
    setSubmitMsg(null);
    try {
      const { cita, error } = await insertarReservaCliente({
        clienteId: props.userId,
        servicio,
        fechaYmd: fechaStr,
        hora,
        // Solicitud — el admin debe confirmar desde el panel.
        estado: 'pendiente',
      });
      if (error || !cita) {
        const msg = error ?? 'No se pudo guardar la solicitud. Intentá nuevamente.';
        setSlotsWarn(msg);
        setSubmitMsg(msg);
        await loadSlots();
        return;
      }
      await props.onComplete(cita);
    } finally {
      setSaving(false);
    }
  }

  const canGoStep2 = !!servicio;
  const canSubmit = !!(wizardStep === 2 && servicio && hora && !saving);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        aria-label="Cerrar"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.42)' }}
        onClick={props.onClose}
      />
      <motion.div
        layout
        className="pointer-events-auto relative z-[9999] flex max-h-[94dvh] w-full max-w-lg flex-col overflow-hidden rounded-3xl shadow-2xl"
        style={{
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(242,215,213,0.75)',
          background: 'var(--bg-cream, #FDF8F5)',
          boxShadow: '0 32px 64px rgba(0,61,91,0.12)',
        }}
      >
        <div className="max-h-[94dvh] overflow-y-auto overscroll-contain p-5 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:p-8">
          <button
            type="button"
            className="absolute right-5 top-5 z-[2] rounded-full p-2 text-[#003D5B]/35 hover:bg-[#F2D7D5]/50"
            onClick={props.onClose}
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-serif-premium mb-2 pr-10 text-xl font-bold" style={{ color: 'var(--primary-navy)' }}>
            Reservá tu turno
          </h2>
          <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: 'rgba(0,61,91,0.45)' }}>
            {wizardStep === 1 ? 'Paso 1 — elegí tratamiento' : 'Paso 2 — día, horario y confirmación'}{' '}
            <span className="font-normal lowercase tracking-normal" style={{ color: 'var(--text-muted)' }}>
              Luego enviás el comprobante por WhatsApp.
            </span>
          </p>

          {/* ─── PASO 1: servicio ─── */}
          <section aria-current={wizardStep === 1 ? 'step' : undefined}>
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/40">
              1 · Elegí el servicio
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[...CITAS_SERVICIOS_RESERVABLES].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setServicio(s);
                    setHora(null);
                    setWizardStep(1);
                  }}
                  className={`rounded-2xl border px-4 py-3 text-left text-xs font-semibold leading-snug transition ${
                    servicio === s ? 'shadow-md' : ''
                  }`}
                  style={
                    servicio === s
                      ? {
                          borderColor: 'var(--primary-navy)',
                          background: 'var(--primary-navy)',
                          color: '#FFFFFF',
                          boxShadow: '0 8px 24px rgba(0,61,91,0.18)',
                        }
                      : {
                          borderColor: 'rgba(242,215,213,0.65)',
                          background: 'rgba(255,253,251,0.92)',
                          color: 'var(--primary-navy)',
                        }
                  }
                >
                  {s}
                </button>
              ))}
            </div>
            {wizardStep === 1 ? (
              <motion.button
                type="button"
                disabled={!canGoStep2}
                whileTap={{ scale: canGoStep2 ? 0.98 : 1 }}
                onClick={() => setWizardStep(2)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white disabled:pointer-events-none disabled:opacity-40"
                style={{
                  background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                  boxShadow: '0 10px 28px rgba(0,61,91,0.15)',
                }}
              >
                Siguiente: abrir calendario y horarios
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            ) : null}
          </section>

          {/* ─── PASO 2: calendario + slots (solo visible en paso 2) ─── */}
          {wizardStep === 2 ? (
            <>
              <div className="my-8 border-t border-[#F2D7D5]/60 pt-8">
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#003D5B]/40">
                    2 · Elegí día y horario
                  </p>
                  <button
                    type="button"
                    className="ml-auto rounded-full border border-[#003D5B]/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#003D5B]"
                    onClick={() => {
                      setWizardStep(1);
                      setHora(null);
                    }}
                  >
                    Cambiar servicio
                  </button>
                </div>
                {servicio ? (
                  <p className="mb-4 rounded-2xl border border-[#BFC9A2]/35 bg-[#BFC9A2]/10 px-4 py-3 text-xs text-[#003D5B]">
                    <strong>Servicio:</strong> {servicio}
                  </p>
                ) : null}

                <p className="mb-3 text-xs leading-relaxed text-[#455F70]">
                  Franjas disponibles desde las <strong>09:00</strong> hasta el último turno dentro del horario de la sede —
                  ocupación revisada contra la tabla <strong>citas</strong> cuando el servidor está disponible.
                </p>

                <MesCalendarioUniversal
                  selected={pickedDay}
                  onPick={(d) => {
                    setPickedDay(d);
                    setHora(null);
                  }}
                />

                <div className="mt-6 rounded-3xl border p-5" style={{
                  borderColor: 'rgba(242,215,213,0.5)',
                  background: 'rgba(253,248,245,0.85)',
                  boxShadow: '0 8px 28px rgba(0,61,91,0.04)',
                }}>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0 text-[#003D5B]" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#003D5B]/55">
                      Horarios libres este día
                    </span>
                    {busyOcc ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#003D5B]" /> : null}
                  </div>

                  {availDegraded ? (
                    <p className="mb-3 rounded-xl border border-amber-300/70 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
                      No pudimos obtener la ocupación real desde Supabase ({slotsWarn}). Te mostramos todas las horas estándar igualmente
                      podés intentar guardar; si algo falló, chequeá migración RPC <code>citas_horas_ocupadas</code> y la tabla{' '}
                      <code>citas</code>.
                    </p>
                  ) : slotsWarn ? (
                    <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      {slotsWarn}
                    </p>
                  ) : null}

                  {slots.length === 0 && !busyOcc ? (
                    <p className="text-sm text-[#7A746E]">No quedaron horas libres en esta fecha probá otro día.</p>
                  ) : (
                    <div role="radiogroup" aria-label="Elegí horario" className="flex flex-wrap gap-2">
                      {slots.map((hh) => (
                        <button
                          key={hh}
                          type="button"
                          role="radio"
                          aria-checked={hora === hh}
                          onClick={() => setHora(hh)}
                          className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition ${
                            hora === hh ? 'border-[#003D5B] bg-[#003D5B] text-white' : 'border-[#003D5B]/14 bg-white text-[#003D5B] hover:bg-[#F2D7D5]/25'
                          }`}
                        >
                          {hhmmEtiqueta(hh)} hs
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <motion.button
                  type="button"
                  disabled={!canSubmit}
                  whileTap={{ scale: canSubmit ? 0.98 : 1 }}
                  onClick={() => void confirmar()}
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-full py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-white disabled:pointer-events-none disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, #BFC9A2 0%, #003D5B 100%)',
                    boxShadow: '0 10px 28px rgba(0,61,91,0.15)',
                  }}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {saving ? 'Enviando solicitud…' : 'Solicitar este turno'}
                </motion.button>

                {submitMsg ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-[11px] text-amber-900">
                    {submitMsg}
                  </p>
                ) : null}

                {!canSubmit && wizardStep === 2 ? (
                  <p className="mt-3 text-center text-[11px] text-[#7A746E]">
                    {!hora ? 'Elegí un horario antes de guardar.' : null}
                  </p>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function formatFechaHumanaParaComprobante(dt: Date): string {
  return format(dt, "d 'de' MMMM 'de' yyyy", { locale: es });
}

function bookingComprobanteWhatsAppHref(
  servicio: string,
  fechaMoment: Date,
  horaSql: string,
  nombreCliente: string
): string {
  const hora = hhmmEtiqueta(horaSql);
  const fechaHumana = formatFechaHumanaParaComprobante(fechaMoment);
  const text = `Hola Amore Centro Di Bellezza! 👋 Acabo de reservar un turno para: ${servicio} el día ${fechaHumana} a las ${hora}. Mi nombre es ${nombreCliente}. Nos vemos!`;
  return `https://wa.me/${WHATSAPP_ADMIN_PHONE}?text=${encodeURIComponent(text)}`;
}

function BookingSuccessCrossSellModal(props: {
  cita: CitaClienteRow;
  nombreCliente: string;
  onClose: () => void;
}): JSX.Element | null {
  const reco = obtenerCrossSellPorServicio(props.cita.servicio);
  const fecha = parseCitaMomentLocal(props.cita);
  const comprobanteHref = bookingComprobanteWhatsAppHref(
    props.cita.servicio,
    fecha,
    props.cita.hora,
    props.nombreCliente
  );

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button
        type="button"
        className="absolute inset-0 backdrop-blur-sm"
        style={{ background: 'rgba(0,61,91,0.38)' }}
        onClick={props.onClose}
        aria-label="Cerrar"
      />
      <motion.div
        className="relative z-[9999] max-h-[94dvh] w-full max-w-md overflow-y-auto rounded-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] shadow-2xl sm:p-8"
        style={{
          background: 'var(--bg-cream, #FDF8F5)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(242,215,213,0.7)',
          boxShadow: '0 28px 56px rgba(0,61,91,0.12)',
        }}
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
      >
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-[#BFC9A2]" />
        <p className="text-center text-serif-premium text-lg font-semibold leading-relaxed" style={{ color: 'var(--primary-navy)' }}>
          Tu solicitud llegó a recepción.
        </p>
        <p className="mt-2 text-center text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Vamos a confirmarte el turno por WhatsApp en breve. Mientras tanto figura como{' '}
          <strong className="text-[#003D5B]">pendiente</strong> en tu agenda.
        </p>
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
          {props.cita.servicio} · {format(fecha, "d 'de' MMMM", { locale: es })} a las{' '}
          {hhmmEtiqueta(props.cita.hora)} hs
        </p>

        <motion.a
          href={comprobanteHref}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-4 text-sm font-semibold text-white shadow-lg"
          style={{ boxShadow: '0 12px 28px rgba(37,211,102,0.35)' }}
        >
          <MessageCircle className="h-5 w-5 shrink-0" />
          Enviar comprobante por WhatsApp
        </motion.a>

        {reco ? (
          <div className="mt-6 rounded-2xl border border-[#BFC9A2]/40 bg-[#BFC9A2]/12 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#003D5B]/50">
              Recomendación profesional
            </p>
            <p className="mt-2 text-sm font-semibold text-[#003D5B]">
              Te sugerimos combinarlo con {reco.complemento}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-[#455F70]">{reco.motivoProfesional}</p>
            <motion.a
              href={waHrefComplement(reco.complemento, reco.motivoProfesional)}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.98 }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white"
            >
              <MessageCircle className="h-4 w-4" /> Solicitar info por WhatsApp
            </motion.a>
          </div>
        ) : null}

        <motion.button
          type="button"
          onClick={props.onClose}
          className="mt-6 w-full rounded-full border py-3 text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{
            borderColor: 'rgba(0,61,91,0.14)',
            color: 'var(--primary-navy)',
            background: 'rgba(253,248,245,0.6)',
          }}
        >
          Cerrar
        </motion.button>
      </motion.div>
    </motion.div>,
    document.body
  );
}
