import { lazy, Suspense, useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Leaf, ShieldCheck, Sparkles } from 'lucide-react';

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

const VirtualAssistantChat = lazy(() => import('@/components/VirtualAssistantChat'));

export function LandingPage({ onEnter, onRegister }: Props) {
  const reduceMotion = useReducedMotion();
  const [showFloatingContact, setShowFloatingContact] = useState(false);
  const [showDesktopAssistant, setShowDesktopAssistant] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 761px)');
    const hero = document.getElementById('inicio');

    const sync = () => {
      const isDesktop = desktop.matches;
      setShowDesktopAssistant(isDesktop);
      setShowFloatingContact(isDesktop || (hero?.getBoundingClientRect().bottom ?? 0) < 72);
    };
    sync();
    desktop.addEventListener('change', sync);

    // En móvil, el contacto aparece al dejar atrás la portada.
    // Evitamos emitir setState con cada píxel de scroll.
    let observer: IntersectionObserver | undefined;
    const fallbackScroll = () => {
      if (!desktop.matches) setShowFloatingContact((hero?.getBoundingClientRect().bottom ?? 0) < 72);
    };
    if (hero && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        if (!desktop.matches) {
          setShowFloatingContact(!entry.isIntersecting && entry.boundingClientRect.bottom < 72);
        }
      }, { rootMargin: '-72px 0px 0px 0px' });
      observer.observe(hero);
    } else {
      window.addEventListener('scroll', fallbackScroll, { passive: true });
    }
    return () => {
      desktop.removeEventListener('change', sync);
      observer?.disconnect();
      window.removeEventListener('scroll', fallbackScroll);
    };
  }, []);

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
      <Suspense fallback={null}>
        {showDesktopAssistant && <VirtualAssistantChat whatsappHref={buildWhatsAppHref} />}
      </Suspense>
      {showFloatingContact && <WhatsAppFloatingButton />}
    </div>
  );
}
