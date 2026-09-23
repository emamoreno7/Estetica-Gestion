import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, CalendarDays, Camera, ShieldCheck, Sparkles } from 'lucide-react';
import { asset } from '@/lib/asset';
import './amore-private.css';

const FEATURES = [
  { icon: CalendarDays, label: 'Próximas citas' },
  { icon: Camera, label: 'Seguimiento fotográfico' },
  { icon: ShieldCheck, label: 'Información en tu cuenta' },
] as const;

export function ConversionSection({ onRegister }: { onRegister: () => void }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="amore-private" aria-labelledby="amore-private-title">
      <div className="amore-container amore-private__layout">
        <motion.div
          className="amore-private__copy"
          initial={reduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.65 }}
        >
          <p className="amore-eyebrow">Tu espacio personal</p>
          <h2 id="amore-private-title">Tu bienestar, <em>también entre sesiones.</em></h2>
          <p className="amore-private__description">
            Tu experiencia continúa después de cada visita. Accedé a tu espacio privado,
            consultá tus tratamientos y acompañá tu evolución a tu ritmo.
          </p>
          <ul className="amore-private__features">
            {FEATURES.map(({ icon: Icon, label }) => (
              <li key={label}>
                <span><Icon size={19} strokeWidth={1.55} aria-hidden="true" /></span>
                {label}
              </li>
            ))}
          </ul>
          <motion.button
            type="button"
            className="amore-private__cta"
            onClick={onRegister}
            whileHover={reduceMotion ? undefined : { y: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
          >
            Crear mi perfil <ArrowUpRight size={17} aria-hidden="true" />
          </motion.button>
        </motion.div>

        <motion.div
          className="amore-private__visual"
          initial={reduceMotion ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.75, delay: 0.1 }}
        >
          <div className="amore-private__halo" aria-hidden="true" />
          <div className="amore-private__phone" aria-hidden="true">
            <div className="amore-private__phone-speaker" />
            <div className="amore-private__phone-header">
              <img src={asset('logo-amore-v2.png')} alt="" width="46" height="46" />
              <div>
                <p>AMORE</p>
                <span>Tu espacio personal</span>
              </div>
            </div>
            <div className="amore-private__phone-greeting">
              <span>BIENVENIDA</span>
              <strong>Un momento para vos.</strong>
            </div>
            <div className="amore-private__phone-card">
              <span className="amore-private__phone-card-icon"><CalendarDays size={19} /></span>
              <div><strong>Mis citas</strong><small>Todo organizado en un lugar</small></div>
              <ArrowUpRight size={15} />
            </div>
            <div className="amore-private__phone-card">
              <span className="amore-private__phone-card-icon"><Sparkles size={19} /></span>
              <div><strong>Mis tratamientos</strong><small>Tu historial, siempre a mano</small></div>
              <ArrowUpRight size={15} />
            </div>
            <div className="amore-private__phone-progress">
              <span>MI EVOLUCIÓN</span>
              <svg viewBox="0 0 230 75" width="100%" role="presentation">
                <path d="M0 62 C25 50 32 60 50 43 S87 52 107 35 S139 41 157 24 S186 38 203 11 L230 5"
                  fill="none" stroke="#79968e" strokeWidth="2" strokeLinecap="round" />
                <path d="M0 62 C25 50 32 60 50 43 S87 52 107 35 S139 41 157 24 S186 38 203 11 L230 5 L230 75 L0 75 Z"
                  fill="#eaf1ed" />
              </svg>
              <p>Tu progreso, a tu manera</p>
            </div>
            <div className="amore-private__phone-bottom">
              <span>Inicio</span><span>Tratamientos</span><span>Mi perfil</span>
            </div>
          </div>
          <p className="amore-private__visual-caption">Vista ilustrativa del portal de clientas.</p>
        </motion.div>
      </div>
    </section>
  );
}
