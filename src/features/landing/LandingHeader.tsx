import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Menu, UserRound, X } from 'lucide-react';
import { asset } from '@/lib/asset';
import { buildWhatsAppHref } from '@/lib/whatsapp';

type Props = { onEnter: () => void };

const NAV = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Tratamientos', href: '#tratamientos' },
  { label: 'Resultados', href: '#resultados' },
  { label: 'Nosotras', href: '#nosotras' },
  { label: 'Contacto', href: '#contacto' },
] as const;

export function LandingHeader({ onEnter }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuTrigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuTrigger.current?.focus();
      }
    };
    const screen = window.matchMedia('(min-width: 761px)');
    const closeOnDesktop = () => { if (screen.matches) setMenuOpen(false); };
    document.addEventListener('keydown', onEscape);
    screen.addEventListener('change', closeOnDesktop);
    return () => {
      document.removeEventListener('keydown', onEscape);
      screen.removeEventListener('change', closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55 }}
      className="amore-header"
    >
      <div className="amore-container amore-header__inner">
        <a href="#inicio" className="amore-header__brand" aria-label="Amore, ir al inicio" onClick={() => setMenuOpen(false)}>
          <img src={asset('logo-amore-v2.png')} alt="Amore Centro di Bellezza" width="70" height="70" />
        </a>

        <nav
          id="amore-nav"
          className={menuOpen ? 'amore-header__nav amore-header__nav--open' : 'amore-header__nav'}
          aria-label="Navegación principal"
        >
          {NAV.map(({ href, label }) => (
            <a key={href} href={href} onClick={() => setMenuOpen(false)}>
              {label}
            </a>
          ))}
          <button
            type="button"
            className="amore-header__mobile-account"
            onClick={() => { setMenuOpen(false); onEnter(); }}
          >
            <UserRound size={16} aria-hidden="true" /> Mi cuenta
          </button>
        </nav>

        <div className="amore-header__actions">
          <button type="button" className="amore-header__account" onClick={onEnter}>
            <UserRound size={16} aria-hidden="true" /> Mi cuenta
          </button>
          <a
            className="amore-header__booking"
            href={buildWhatsAppHref('reservar una cita')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <CalendarDays size={16} aria-hidden="true" /> Reservar cita
          </a>
          <button
            className="amore-header__menu"
            ref={menuTrigger}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="amore-nav"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
