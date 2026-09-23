import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Leaf, ShieldCheck, Sparkles } from 'lucide-react';
import VirtualAssistantChat from '@/components/VirtualAssistantChat';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { asset } from '@/lib/asset';
import { LandingHeader } from './LandingHeader';
import { ServiciosSection } from './ServiciosSection';
import { ConversionSection } from './ConversionSection';
import { LandingFooter } from './LandingFooter';
import { AntesYDespuesSection } from './AntesYDespuesSection';
import { ExperienciaAmore } from './ExperienciaAmore';
import { AmoreLink } from './AmoreLink';
import './amore-premium.css';

type Props = {
  onEnter: () => void;
  onRegister: () => void;
};

const VALUES = [
  { icon: Leaf, label: 'Cuidado' },
  { icon: Heart, label: 'Bienestar' },
  { icon: ShieldCheck, label: 'Confianza' },
  { icon: Sparkles, label: 'Innovación' },
] as const;

export function LandingPage({ onEnter, onRegister }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="amore-landing">
      <a className="amore-skip-link" href="#contenido">Saltar al contenido</a>
      <LandingHeader onEnter={onEnter} />

      <main id="contenido">
        <section id="inicio" className="amore-hero" aria-labelledby="amore-hero-title">
          <div className="amore-hero__visual" aria-hidden="true">
            <img
              src={asset('amore-hero.webp')}
              width="960"
              height="540"
              alt=""
              fetchPriority="high"
              decoding="async"
            />
          </div>
          <div className="amore-hero__overlay" aria-hidden="true" />
          <div className="amore-container amore-hero__inner">
            <motion.div
              className="amore-hero__copy"
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="amore-eyebrow">Belleza · Bienestar · Confianza</p>
              <h1 id="amore-hero-title">Tu bienestar,<br /><em>elevado a arte.</em></h1>
              <p className="amore-hero__description">
                Tratamientos estéticos y atención personalizada para realzar tu belleza natural.
                Un momento de calma, cuidado y bienestar, pensado para vos.
              </p>
              <div className="amore-hero__buttons">
                <AmoreLink href={buildWhatsAppHref('reservar una cita')} external>
                  Reservar mi cita
                </AmoreLink>
                <AmoreLink href="#tratamientos" variant="outline">
                  Ver tratamientos
                </AmoreLink>
              </div>
              <ul className="amore-hero__values" aria-label="Nuestros valores">
                {VALUES.map(({ icon: Icon, label }) => (
                  <li key={label}><Icon size={21} strokeWidth={1.4} aria-hidden="true" /><span>{label}</span></li>
                ))}
              </ul>
            </motion.div>
          </div>
          <p className="amore-hero__side-note" aria-hidden="true">Tu momento<br />empieza acá.</p>
        </section>

        <ExperienciaAmore />
        <div id="tratamientos" className="amore-anchor"><ServiciosSection /></div>
        <div id="resultados" className="amore-anchor"><AntesYDespuesSection /></div>
        <div id="espacio" className="amore-anchor">
          <ConversionSection onRegister={onRegister} />
        </div>

        <section id="contacto" className="amore-closing" aria-labelledby="amore-closing-title">
          <div className="amore-container amore-closing__inner">
            <div>
              <p className="amore-eyebrow">Tu momento Amore</p>
              <h2 id="amore-closing-title">¿Lista para dedicarte <em>tiempo?</em></h2>
              <p>Escribinos para conocer los tratamientos y encontrar el momento ideal para vos.</p>
            </div>
            <AmoreLink href={buildWhatsAppHref('reservar una cita')} external>
              Escribinos por WhatsApp
            </AmoreLink>
          </div>
        </section>
      </main>

      <LandingFooter />
      <VirtualAssistantChat whatsappHref={buildWhatsAppHref} />
      <WhatsAppFloatingButton />
    </div>
  );
}
