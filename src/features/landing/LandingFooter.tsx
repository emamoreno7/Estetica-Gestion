import { Instagram, Mail, MapPin, MessageCircle } from 'lucide-react';
import { asset } from '@/lib/asset';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import './amore-footer.css';

const ADDRESS = 'Wenceslao Núñez 735, Rivadavia, Mendoza';

export function LandingFooter() {
  return (
    <footer className="amore-footer" aria-label="Información y contacto de Amore">
      <div className="amore-container">
        <div className="amore-footer__main">
          <div className="amore-footer__brand">
            <a href="#inicio" aria-label="Amore, volver al inicio">
              <img src={asset('logo-amore-v2.png')} alt="Amore Centro di Bellezza" loading="lazy" width="110" height="110" decoding="async" />
            </a>
            <p>Un espacio para dedicarte tiempo, cuidarte y disfrutar de tu propia belleza.</p>
          </div>
          <div className="amore-footer__column">
            <h2>Explorá</h2>
            <a href="#tratamientos">Tratamientos</a>
            <a href="#resultados">Resultados</a>
            <a href="#nosotras">Nuestra esencia</a>
            <a href="#espacio">Mi espacio</a>
          </div>
          <div className="amore-footer__column">
            <h2>Encontranos</h2>
            <a href="https://maps.google.com/?q=Wenceslao+N%C3%BA%C3%B1ez+735,+Rivadavia,+Mendoza"
              target="_blank" rel="noopener noreferrer">
              <MapPin size={15} aria-hidden="true" /> {ADDRESS}
            </a>
            <p>Lunes a sábado · Atención personalizada</p>
            <a href={buildWhatsAppHref('consulta general')} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={15} aria-hidden="true" /> WhatsApp
            </a>
            <a href="https://instagram.com/amorecentrodibellezza" target="_blank" rel="noopener noreferrer">
              <Instagram size={15} aria-hidden="true" /> Instagram
            </a>
          </div>
        </div>
        <div className="amore-footer__bottom">
          <p>© {new Date().getFullYear()} Amore Centro di Bellezza. Todos los derechos reservados.</p>
          <a className="amore-footer__credit" href="https://www.bydotcom.com/"
            target="_blank" rel="noopener noreferrer" aria-label="Sitio de DotCom Desarrollo Digital">
            <span>Desarrollado por</span>
            <img src={asset('bydotcom-logo.png')} alt="" width="23" height="23" loading="lazy" decoding="async" />
            <strong>DotCom</strong>
          </a>
          <a className="amore-footer__dev-contact" href="mailto:emamoreno@icloud.com"
            aria-label="Contactar al desarrollador DotCom por correo">
            <Mail size={14} aria-hidden="true" />
          </a>
        </div>
      </div>
    </footer>
  );
}
