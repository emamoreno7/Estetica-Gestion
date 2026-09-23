import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, Heart, Leaf, Flower2, Sparkles } from 'lucide-react';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { asset } from '@/lib/asset';
import { LandingHeader } from './LandingHeader';
import { ServiciosSection } from './ServiciosSection';
import { ConversionSection } from './ConversionSection';
import { LandingFooter } from './LandingFooter';
import { AntesYDespuesSection } from './AntesYDespuesSection';
import { ExperienciaAmore } from './ExperienciaAmore';
import { HeroFeaturedCategories } from './HeroFeaturedCategories';
import './amore-premium.css';
import './amore-hero-reference.css';

type Props = { onEnter: () => void; onRegister: () => void };
const VALUES = [
  { icon: Flower2, label: 'SALUD', description: 'Cuidamos de vos' },
  { icon: Leaf, label: 'LIMPIEZA', description: 'Renová tu piel' },
  { icon: Heart, label: 'PAZ', description: 'Tu momento' },
  { icon: Sparkles, label: 'INNOVACIÓN', description: 'Tecnología para vos' },
] as const;
const VirtualAssistantChat = lazy(() => import('@/components/VirtualAssistantChat'));

export function LandingPage({ onEnter, onRegister }: Props) {
  const [showFloatingContact, setShowFloatingContact] = useState(false);
  const [showDesktopAssistant, setShowDesktopAssistant] = useState(false);
  const [featuredCategory, setFeaturedCategory] = useState<string | null>(null);

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
    let observer: IntersectionObserver | undefined;
    const fallback = () => {
      if (!desktop.matches) setShowFloatingContact((hero?.getBoundingClientRect().bottom ?? 0) < 72);
    };
    if (hero && 'IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        if (!desktop.matches) setShowFloatingContact(!entry.isIntersecting && entry.boundingClientRect.bottom < 72);
      }, { rootMargin: '-72px 0px 0px 0px' });
      observer.observe(hero);
    } else window.addEventListener('scroll', fallback, { passive: true });
    return () => {
      desktop.removeEventListener('change', sync);
      observer?.disconnect();
      window.removeEventListener('scroll', fallback);
    };
  }, []);

  return (
    <div className="amore-landing amore-landing--editorial">
      <a className="amore-skip-link" href="#contenido">Saltar al contenido</a>
      <LandingHeader onEnter={onEnter} />
      <main id="contenido">
        <section id="inicio" className="amore-hero amore-hero-reference"
          aria-labelledby="amore-hero-title">
          <div className="amore-hero__visual" aria-hidden="true">
            <picture>
              <source media="(max-width: 760px)" srcSet={asset('hero-editorial-mobile.webp')} type="image/webp" />
              <img src={asset('hero-editorial-1280.webp')}
                srcSet={[
                  asset('hero-editorial-768.webp') + ' 768w',
                  asset('hero-editorial-1280.webp') + ' 1280w',
                  asset('hero-editorial-1920.webp') + ' 1920w',
                ].join(', ')}
                sizes="100vw" alt="" width="1920" height="1081"
                fetchPriority="high" decoding="async" />
            </picture>
          </div>
          <div className="amore-hero__overlay" aria-hidden="true" />
          <div className="amore-container amore-hero__inner">
            <div className="amore-hero__copy">
              <p className="amore-eyebrow">BELLEZA REAL, BIENESTAR DURADERO</p>
              <h1 id="amore-hero-title">Tu bienestar,<br/><em>nuestro arte.</em></h1>
              <p className="amore-hero__description">
                Tratamientos estéticos personalizados para que te sientas bien,
                por dentro y por fuera. Un espacio pensado para vos.
              </p>
              <div className="amore-hero__buttons">
                <a className="amore-hero__primary" href="#tratamientos">
                  DESCUBRÍ NUESTROS TRATAMIENTOS <ArrowRight size={19} strokeWidth={1.4} aria-hidden="true"/>
                </a>
                <a className="amore-hero__secondary" href="#nosotras">
                  <span className="amore-hero__secondary-symbol" aria-hidden="true"><ArrowRight size={15}/></span>
                  CONOCÉ AMORE
                </a>
              </div>
              <ul className="amore-hero__values" aria-label="Nuestros valores">
                {VALUES.map(({ icon: Icon, label, description }) => (
                  <li key={label}>
                    <Icon size={33} strokeWidth={1.15} aria-hidden="true"/>
                    <strong>{label}</strong><span>{description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="amore-hero__handwritten">
            <span>Una<br/>versión más<br/>linda de vos</span>
            <span className="amore-hero__handwritten-heart" aria-hidden="true">♡</span>
            <span className="amore-hero__handwritten-divider" aria-hidden="true"/>
            <small>CUIDATE<br/>DISFRUTÁ<br/>BRILLÁ</small>
          </div>
          <a className="amore-hero__scroll" href="#tratamientos" aria-label="Ir a tratamientos">
            <span>SCROLL</span><ArrowDown size={21} strokeWidth={1.25} aria-hidden="true"/>
          </a>
        </section>
        <HeroFeaturedCategories onSelect={setFeaturedCategory}/>
        <ExperienciaAmore/>
        <div id="tratamientos" className="amore-anchor">
          <ServiciosSection compactFeatured featuredCategory={featuredCategory}/>
        </div>
        <div id="resultados" className="amore-anchor"><AntesYDespuesSection/></div>
        <div id="espacio" className="amore-anchor"><ConversionSection onRegister={onRegister}/></div>
        <section id="contacto" className="amore-closing" aria-labelledby="amore-closing-title">
          <div className="amore-container amore-closing__inner">
            <div>
              <p className="amore-eyebrow">Tu momento Amore</p>
              <h2 id="amore-closing-title">¿Lista para dedicarte <em>tiempo?</em></h2>
              <p>Escribinos para conocer los tratamientos y encontrar el momento ideal para vos.</p>
            </div>
            <a className="amore-link amore-link--primary" href={buildWhatsAppHref('reservar una cita')}
              target="_blank" rel="noopener noreferrer">
              Escribinos por WhatsApp <ArrowRight size={16} aria-hidden="true"/>
            </a>
          </div>
        </section>
      </main>
      <LandingFooter/>
      <Suspense fallback={null}>
        {showDesktopAssistant && <VirtualAssistantChat whatsappHref={buildWhatsAppHref}/>}
      </Suspense>
      {showFloatingContact && <WhatsAppFloatingButton/>}
    </div>
  );
}
