import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Calendar,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  Gem,
  MapPin,
  Star,
  Stethoscope,
} from 'lucide-react';
import { asset } from '@/lib/asset';
import { tratamientoProgresoPct, usePortalCliente } from '@/context/PortalClienteContext';
import { PortalTreatmentEmptyPlaceholder } from '../components/PortalTreatmentEmptyPlaceholder';
import { TratamientoSelector } from '../components/TratamientoSelector';

export function TratamientoView() {
  const { activeTreatment, sessions } = usePortalCliente();
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!activeTreatment) {
    return (
      <div className="space-y-6">
        <PortalTreatmentEmptyPlaceholder
          title="Aún no tenés un tratamiento activo"
          paragraph="Cuando te asignemos un plan vas a ver la ficha completa, el profesional a cargo y el calendario de sesiones en esta sección."
        />
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
      className="relative overflow-hidden rounded-3xl"
    >
      <img
          src={asset(activeTreatment.imagen)}
          alt={activeTreatment.nombre}
          className="h-56 w-full object-cover lg:h-72"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#FDF8F5]/30 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <Gem className="h-3 w-3" /> {activeTreatment.categoria}
          </span>
          <h2 className="text-serif-premium text-2xl font-bold text-white drop-shadow-lg lg:text-3xl">
            {activeTreatment.nombre}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-white/80">{activeTreatment.descripcion}</p>
        </div>
      </motion.div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: Stethoscope, label: 'Profesional', value: activeTreatment.profesional },
          { icon: MapPin, label: 'Zona', value: activeTreatment.zona },
          {
            icon: Calendar,
            label: 'Inicio',
            value: new Date(activeTreatment.fechaInicio).toLocaleDateString('es-AR', {
              month: 'long',
              year: 'numeric',
            }),
          },
          { icon: Star, label: 'Precio', value: activeTreatment.precio },
        ].map((info, i) => (
          <motion.div
            key={info.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.07 }}
            className="glass flex items-center gap-3 rounded-2xl p-4"
          >
            <div className="shrink-0 rounded-xl bg-[#F2D7D5]/30 p-2.5">
              <info.icon className="h-4 w-4 text-[#003D5B]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wider text-[#7A746E]">{info.label}</p>
              <p className="truncate text-sm font-semibold text-[#003D5B]">{info.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-strong rounded-2xl p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-serif-premium text-lg font-bold text-[#003D5B]">Progreso General</h3>
          <span className="text-2xl font-bold text-[#003D5B]">{progress}%</span>
        </div>
        <div className="mb-3 h-3 w-full overflow-hidden rounded-full bg-champagne-50">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.4 }}
            className="h-full rounded-full bg-gradient-to-r from-[#BFC9A2] to-[#003D5B] shadow-sm"
          />
        </div>
        <div className="flex min-h-[10px] items-center gap-1.5">
          {sessions.length > 0 ? (
            sessions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className={`h-2.5 flex-1 rounded-full ${
                  s.estado === 'completada'
                    ? 'bg-gradient-to-r from-[#F2D7D5] to-[#BFC9A2]'
                    : s.estado === 'proxima'
                    ? 'bg-champagne animate-pulse'
                    : 'bg-gray-200'
                }`}
              />
            ))
          ) : (
            <p className="w-full rounded-lg bg-[#FDF8F5]/80 py-4 text-center text-xs text-[#7A746E]">
              El detalle por sesión se mostrará acá cuando el equipo cargue tu cronograma.
            </p>
          )}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-[#7A746E]">
          <span>Inicio</span>
          <span>
            {activeTreatment.totalSesiones > 0
              ? `Sesión ${activeTreatment.sesionesCompletadas} completada`
              : 'Sin cronograma de sesiones'}
          </span>
          <span>Final</span>
        </div>
      </motion.div>

      <div>
        <h3 className="text-serif-premium mb-4 text-lg font-bold text-[#003D5B]">Historial de Sesiones</h3>
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl border border-dashed border-[#F2D7D5]/70 bg-[#FDF8F5]/75 px-6 py-14 text-center"
          >
            <p className="text-sm leading-relaxed text-[#7A746E]">
              Tu plan <strong className="text-[#003D5B]">{activeTreatment.nombre}</strong> ya está registrado. El
              historial de cada sesión se verá aquí cuando recepción lo ingrese en el sistema.
            </p>
          </motion.div>
        ) : (
          <div className="space-y-0">
            {sessions.map((session, idx) => {
              const isOpen = expanded === session.nro;
              const isCompleted = session.estado === 'completada';
              const isNext = session.estado === 'proxima';
              return (
                <motion.div
                  key={session.nro}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.06 }}
                  className="timeline-connector"
                >
                  <div className="flex gap-4 pb-5">
                    <div className="relative z-10 flex shrink-0 flex-col items-center pt-1">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                          isCompleted
                            ? 'border-[#BFC9A2] bg-[#BFC9A2]/20'
                            : isNext
                            ? 'border-[#F2D7D5] bg-[#F2D7D5]/35 animate-pulse-glow'
                            : 'border-gray-200 bg-gray-50/50'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-4 w-4 text-[#BFC9A2]" />
                        ) : isNext ? (
                          <Clock className="h-4 w-4 text-[#F2D7D5]" />
                        ) : (
                          <Circle className="h-3.5 w-3.5 text-gray-300" />
                        )}
                      </div>
                    </div>

                    <div className="flex-1 pt-0.5">
                      {isCompleted ? (
                        <button
                          onClick={() => setExpanded(isOpen ? null : session.nro)}
                          className={`w-full overflow-hidden rounded-2xl border text-left transition-all ${
                            isOpen
                              ? 'border-[#F2D7D5]/70 bg-[#FDF8F5]/95 shadow-soft'
                              : 'border-[#F2D7D5]/40 bg-[#FDF8F5]/75 hover:bg-[#FDF8F5]/90 hover:shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                                  isOpen ? 'bg-[#003D5B] text-white' : 'bg-[#F2D7D5]/30 text-[#003D5B]'
                                }`}
                              >
                                #{session.nro}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-[#003D5B]">Sesión {session.nro}</p>
                                <p className="text-[11px] text-[#7A746E]">
                                  {new Date(session.fecha).toLocaleDateString('es-AR', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {session.foto ? (
                                <span className="flex items-center gap-1 rounded-full bg-[#F2D7D5]/35 px-2 py-0.5 text-[10px] font-medium text-[#003D5B]">
                                  <Camera className="h-3 w-3" /> 1
                                </span>
                              ) : null}
                              <Star className="h-3.5 w-3.5 text-[#BFC9A2]" />
                              {isOpen ? (
                                <ChevronUp className="h-4 w-4 text-[#7A746E]" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-[#7A746E]" />
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isOpen ? (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25 }}
                                className="overflow-hidden"
                              >
                                <div className="border-t border-[#F2D7D5]/40 px-4 pb-4 pt-3">
                                  {session.foto ? (
                                    <div className="mb-3">
                                      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7A746E]">
                                        <Camera className="h-3 w-3" /> Foto de progreso
                                      </div>
                                      <img
                                        src={session.foto}
                                        alt={`Sesión ${session.nro}`}
                                        className="h-24 w-24 rounded-xl border-2 border-[#F2D7D5]/40 object-cover"
                                      />
                                    </div>
                                  ) : null}
                                  <div className="rounded-xl bg-blue-50/40 p-3">
                                    <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-blue-400">
                                      <Stethoscope className="h-3 w-3" /> Notas del Profesional
                                    </div>
                                    <p className="text-xs leading-relaxed text-[#7A746E]">{session.notas}</p>
                                  </div>
                                </div>
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </button>
                      ) : (
                        <div
                          className={`flex items-center gap-3 rounded-2xl border p-4 ${
                            isNext
                              ? 'border-[#F2D7D5]/60 bg-[#F2D7D5]/35/30'
                              : 'border-dashed border-[#F2D7D5]/60 bg-[#FDF8F5]/30'
                          }`}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-[#7A746E]">
                            #{session.nro}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#7A746E]">Sesión {session.nro}</p>
                            <p className="text-[11px] text-[#7A746E]">
                              {isNext ? 'Próxima sesión' : 'Programada'} —{' '}
                              {new Date(session.fecha).toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>
                          {isNext ? (
                            <span className="rounded-full bg-[#F2D7D5]/50 px-3 py-1 text-[10px] font-semibold text-[#003D5B]">
                              {activeTreatment.horaProxima} hs
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
