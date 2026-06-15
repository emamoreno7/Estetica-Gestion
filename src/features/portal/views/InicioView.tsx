import { motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Heart,
  MapPin,
  MessageCircle,
  Plus,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';
import BeforeAfterSlider from '@/components/BeforeAfterSlider';
import { ChampagneRing } from '@/components/ChampagneRing';
import { tratamientoProgresoPct, usePortalCliente } from '@/context/PortalClienteContext';
import { useCitasData } from '@/context/CitasDataContext';
import { esCitaFutura, parseCitaMomentLocal, type CitaClienteRow } from '@/lib/citasApi';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import type { PortalView } from '../types';
import { TratamientoSelector } from '../components/TratamientoSelector';

function resumenCitaPortalCompacta(c: CitaClienteRow): string {
  const d = parseCitaMomentLocal(c);
  const h = (c.hora ?? '').slice(0, 5);
  const day = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${h} hs · ${c.servicio}`;
}

type Props = { onNav: (v: PortalView) => void };

export function InicioView({ onNav }: Props) {
  const {
    activeTreatment,
    beforeAfterPairs,
    greetingName,
    loyaltyPoints,
    tratamientoInteresLabel,
  } = usePortalCliente();
  const { proximaCita } = useCitasData();
  const proxPortal = proximaCita && esCitaFutura(proximaCita) ? proximaCita : null;

  if (!activeTreatment) {
    const waHref = buildWhatsAppHref('seguimiento de mi portal');
    return (
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl lg:p-8"
          style={{
            background: 'linear-gradient(135deg, #003D5B 0%, #005580 55%, #004D72 100%)',
            boxShadow: '0 24px 64px rgba(0,61,91,0.28)',
          }}
        >
          <div
            className="absolute -right-12 -top-12 h-48 w-48 rounded-full"
            style={{ background: 'rgba(242,215,213,0.12)' }}
          />
          <div
            className="absolute -bottom-10 right-24 h-28 w-28 rounded-full"
            style={{ background: 'rgba(191,201,162,0.10)' }}
          />
          <div className="relative">
            <p
              className="mb-1 text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ color: 'rgba(242,215,213,0.85)' }}
            >
              Bienvenida/o a tu portal
            </p>
            <h2 className="text-serif-premium mb-3 text-2xl font-bold text-white lg:text-3xl">
              Hola, {greetingName}
            </h2>
            <p className="max-w-xl text-sm leading-relaxed" style={{ color: 'rgba(253,248,245,0.9)' }}>
              Tu espacio está listo. En cuanto el equipo cargue tu plan en el sistema vas a ver fechas de sesiones,
              progreso y recordatorios en esta pantalla. Mientras tanto, estamos aquí por WhatsApp.
            </p>
            {tratamientoInteresLabel ? (
              <p
                className="mt-4 inline-block rounded-xl px-4 py-2 text-xs font-medium backdrop-blur-sm"
                style={{
                  background: 'rgba(191,201,162,0.2)',
                  border: '1px solid rgba(191,201,162,0.35)',
                  color: 'rgba(253,248,245,0.95)',
                }}
              >
                Interés registrado: {tratamientoInteresLabel}
              </p>
            ) : null}
            <motion.a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-[#003D5B] shadow-lg"
            >
              <Heart className="h-4 w-4 text-[#F2D7D5]" /> Escribir a Amore
            </motion.a>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { icon: Zap, label: 'Sesiones', value: '0/0', accent: 'var(--accent-sage)' },
            { icon: TrendingUp, label: 'Progreso', value: '0%', accent: 'var(--primary-navy)' },
            { icon: Star, label: 'Puntos', value: `${loyaltyPoints}`, accent: 'var(--accent-rose)' },
            {
              icon: Award,
              label: 'Próxima cita',
              value: proxPortal ? resumenCitaPortalCompacta(proxPortal) : '—',
              accent: 'var(--accent-sage)',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.06 }}
              className="rounded-3xl p-4 opacity-95 lg:p-5"
              style={{
                background: 'rgba(253,248,245,0.72)',
                border: '1px dashed rgba(0,61,91,0.12)',
              }}
            >
              <div
                className="mb-2 inline-flex rounded-2xl p-2.5"
                style={{ background: `color-mix(in srgb, ${stat.accent} 14%, transparent)` }}
              >
                <stat.icon className="h-4 w-4" style={{ color: stat.accent }} />
              </div>
              <p className="text-xl font-bold text-[#003D5B]/85">{stat.value}</p>
              <p className="text-[11px] font-medium text-[#7A746E]/90">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-3xl px-6 py-8 text-center"
          style={{
            border: '1px solid var(--accent-rose)',
            background: 'rgba(253,248,245,0.92)',
            boxShadow: '0 12px 40px rgba(0,61,91,0.06)',
          }}
        >
          <p className="text-sm text-[#7A746E]">
            Cuando tengamos tu plan cargado vas a poder seguir cada sesión y comparar fotos desde acá mismo.
          </p>
          <motion.button
            type="button"
            onClick={() => onNav('perfil')}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.16em]"
            style={{ color: 'var(--primary-navy)', border: '1px solid rgba(0,61,91,0.2)', background: 'white' }}
          >
            Ver mi perfil <ArrowRight className="h-3 w-3" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const progress = tratamientoProgresoPct(activeTreatment);

  return (
  <div className="space-y-6">
    <TratamientoSelector />
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl lg:p-8"
        style={{
          background: 'linear-gradient(135deg, #003D5B 0%, #005580 55%, #004D72 100%)',
          boxShadow: '0 24px 64px rgba(0,61,91,0.28)',
        }}
      >
        <div
          className="absolute -right-12 -top-12 h-48 w-48 rounded-full"
          style={{ background: 'rgba(242,215,213,0.12)' }}
        />
        <div
          className="absolute -bottom-10 right-24 h-28 w-28 rounded-full"
          style={{ background: 'rgba(191,201,162,0.10)' }}
        />
        <div
          className="absolute bottom-0 left-0 h-full w-1 rounded-l-3xl"
          style={{ background: 'linear-gradient(180deg, var(--accent-rose), var(--accent-sage))' }}
        />
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 6 }}
        />
        <div className="relative">
          <p
            className="mb-1 text-xs font-semibold uppercase tracking-[0.28em]"
            style={{ color: 'rgba(242,215,213,0.85)' }}
          >
            Tu tratamiento activo
          </p>
          <h2 className="text-serif-premium mb-1 text-2xl font-bold lg:text-3xl text-white">
            {activeTreatment.nombre}
          </h2>
          <p className="text-sm" style={{ color: 'rgba(191,201,162,0.9)' }}>
            {activeTreatment.zona} • {activeTreatment.profesional}
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {proxPortal ? (
              <>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(191,201,162,0.22)',
                    border: '1px solid rgba(191,201,162,0.35)',
                  }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'var(--accent-sage)' }} />
                  <span className="text-sm font-medium text-white">Reserva agenda: {proxPortal.servicio}</span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(242,215,213,0.18)',
                    border: '1px solid rgba(242,215,213,0.25)',
                  }}
                >
                  <Clock className="h-4 w-4" style={{ color: 'var(--accent-rose)' }} />
                  <span className="text-sm font-medium text-white">
                    {parseCitaMomentLocal(proxPortal).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                    })}{' '}
                    · {(proxPortal.hora ?? '').slice(0, 5)} hs
                  </span>
                </div>
              </>
            ) : null}
            {activeTreatment.fechaPlanPendiente ? (
              <>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(242,215,213,0.18)',
                    border: '1px solid rgba(242,215,213,0.25)',
                  }}
                >
                  <MessageCircle className="h-4 w-4" style={{ color: 'var(--accent-rose)' }} />
                  <span className="text-sm font-medium text-white">
                    Próximo turno por coordinar por WhatsApp
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(191,201,162,0.18)',
                    border: '1px solid rgba(191,201,162,0.25)',
                  }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'var(--accent-sage)' }} />
                  <span className="text-sm font-medium text-white">
                    Plan registrado:{' '}
                    {new Date(activeTreatment.fechaInicio).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(242,215,213,0.18)',
                    border: '1px solid rgba(242,215,213,0.25)',
                  }}
                >
                  <Calendar className="h-4 w-4" style={{ color: 'var(--accent-rose)' }} />
                  <span className="text-sm font-medium text-white">
                    Próxima:{' '}
                    {new Date(activeTreatment.proximaSesion).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                    })}
                  </span>
                </div>
                <div
                  className="flex items-center gap-2 rounded-full px-4 py-2 backdrop-blur-sm"
                  style={{
                    background: 'rgba(191,201,162,0.18)',
                    border: '1px solid rgba(191,201,162,0.25)',
                  }}
                >
                  <Clock className="h-4 w-4" style={{ color: 'var(--accent-sage)' }} />
                  <span className="text-sm font-medium text-white">{activeTreatment.horaProxima} hs</span>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            icon: Zap,
            label: 'Sesiones',
            value: `${activeTreatment.sesionesCompletadas}/${activeTreatment.totalSesiones}`,
            accent: 'var(--accent-sage)',
          },
          { icon: TrendingUp, label: 'Progreso', value: `${progress}%`, accent: 'var(--primary-navy)' },
          { icon: Star, label: 'Puntos', value: loyaltyPoints.toLocaleString(), accent: 'var(--accent-rose)' },
          proxPortal
            ? {
                icon: Award,
                label: 'Próxima reserva',
                value: resumenCitaPortalCompacta(proxPortal),
                accent: 'var(--accent-sage)',
              }
            : activeTreatment.fechaPlanPendiente
            ? { icon: Calendar, label: 'Próxima sesión', value: 'A coordinar', accent: 'var(--accent-sage)' }
            : {
                icon: Award,
                label: 'Próxima sesión',
                value: new Date(activeTreatment.proximaSesion).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'short',
                }),
                accent: 'var(--accent-sage)',
              },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            whileHover={{ y: -3 }}
            className="group relative overflow-hidden rounded-3xl p-4 lg:p-5"
            style={{
              background: 'rgba(253,248,245,0.85)',
              border: '1px solid var(--accent-rose)',
              boxShadow: '0 8px 32px rgba(0,61,91,0.07)',
            }}
          >
            <div
              className="absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-30 transition-transform group-hover:scale-125"
              style={{ background: stat.accent }}
            />
            <div className="relative">
              <div
                className="mb-2 inline-flex rounded-2xl p-2.5"
                style={{ background: `color-mix(in srgb, ${stat.accent} 18%, transparent)` }}
              >
                <stat.icon className="h-4 w-4" style={{ color: stat.accent }} />
              </div>
              <p className="text-xl font-bold" style={{ color: 'var(--primary-navy)' }}>
                {stat.value}
              </p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="overflow-hidden rounded-3xl p-6"
          style={{
            background: 'rgba(253,248,245,0.92)',
            border: '1px solid var(--accent-rose)',
            boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-serif-premium text-lg font-bold" style={{ color: 'var(--primary-navy)' }}>
              Progreso del Tratamiento
            </h3>
            <button
              onClick={() => onNav('tratamiento')}
              className="flex items-center gap-1 text-xs font-semibold transition-opacity hover:opacity-70"
              style={{ color: 'var(--primary-navy)' }}
            >
              Ver detalle <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-6">
            <ChampagneRing value={progress} size={90} strokeWidth={6} label="progreso" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-semibold" style={{ color: 'var(--primary-navy)' }}>
                {activeTreatment.totalSesiones > 0
                  ? `${activeTreatment.sesionesCompletadas} de ${activeTreatment.totalSesiones} sesiones completadas`
                  : 'Aún sin sesiones cargadas — 0/0 hasta que definamos el cronograma'}
              </p>
              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ background: 'rgba(191,201,162,0.25)' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, var(--accent-sage), var(--primary-navy))' }}
                />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {activeTreatment.totalSesiones > 0
                  ? `${activeTreatment.totalSesiones - activeTreatment.sesionesCompletadas} sesiones restantes`
                  : 'Recepción completará sesiones cuando corresponda.'}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="overflow-hidden rounded-3xl p-6"
          style={{
            background: 'rgba(253,248,245,0.92)',
            border: '1px solid var(--accent-rose)',
            boxShadow: '0 12px 40px rgba(0,61,91,0.08)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Próxima Cita</h3>
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-semibold text-[#003D5B] ${
                activeTreatment.fechaPlanPendiente ? 'bg-[#F2D7D5]/40' : 'bg-[#BFC9A2]/25'
              }`}
            >
              {activeTreatment.fechaPlanPendiente ? 'Por confirmar' : 'Confirmada'}
            </span>
          </div>
          <div className="space-y-3">
            {activeTreatment.fechaPlanPendiente ? (
              <>
                <div className="rounded-xl bg-[#FDF8F5]/75 p-5 text-center">
                  <p className="text-sm leading-relaxed text-[#7A746E]">
                    Coordinamos día y hora con recepción. Escribinos por WhatsApp y te daremos opciones disponibles para{' '}
                    <strong className="text-[#003D5B]">{activeTreatment.nombre}</strong>.
                  </p>
                </div>
                <motion.a
                  href={buildWhatsAppHref('reservar mi próximo turno')}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all"
                  style={{ background: '#25D366', boxShadow: '0 10px 30px rgba(37,211,102,0.25)' }}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp para reservar
                </motion.a>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 rounded-xl bg-[#FDF8F5]/75 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#F2D7D5] to-[#BFC9A2]">
                    <Calendar className="h-5 w-5 text-[#003D5B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#003D5B]">
                      {new Date(activeTreatment.proximaSesion).toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </p>
                    <p className="text-xs text-[#7A746E]">
                      {activeTreatment.totalSesiones > 0
                        ? `${activeTreatment.horaProxima} hs — Sesión ${activeTreatment.sesionesCompletadas + 1}`
                        : `${activeTreatment.horaProxima} hs — Próximo turno (cronograma en definición)`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-[#FDF8F5]/75 p-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2D7D5]/40">
                    <MapPin className="h-5 w-5 text-[#003D5B]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#003D5B]">{activeTreatment.sucursal}</p>
                    <p className="text-xs text-[#7A746E]">{activeTreatment.profesional}</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all"
                  style={{ background: 'var(--primary-navy)', boxShadow: '0 10px 30px rgba(0,61,91,0.18)' }}
                >
                  <Plus className="h-4 w-4" />
                  Añadir al Calendario
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {beforeAfterPairs.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-strong overflow-hidden rounded-2xl p-6"
        >
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Tu Evolución</h3>
              <p className="text-xs text-[#7A746E]">Compara tu progreso con el slider interactivo</p>
            </div>
            <button
              onClick={() => onNav('evolucion')}
              className="flex items-center gap-1 text-xs font-semibold text-[#003D5B]"
            >
              Ver todo <ArrowRight className="h-3 w-3" />
            </button>
          </div>
          <BeforeAfterSlider beforeSrc={beforeAfterPairs[0].before} afterSrc={beforeAfterPairs[0].after} />
          <div className="mt-3 flex items-center justify-between rounded-xl bg-[#F2D7D5]/20 px-4 py-2.5">
            <p className="text-xs font-medium text-[#7A746E]">{beforeAfterPairs[0].title}</p>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#003D5B]">
              <div className="h-1.5 w-1.5 rounded-full bg-[#BFC9A2] animate-pulse" />
              {beforeAfterPairs[0].improvement}
            </span>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
