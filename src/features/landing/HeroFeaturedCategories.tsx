import { ArrowUpRight } from 'lucide-react';
import { asset } from '@/lib/asset';

/** Portadas fotográficas ilustrativas: cada id pertenece al catálogo público. */
const FEATURED = [
  { id: 'corporal', eyebrow: 'CORPORAL', title: 'Remodelación corporal', description: 'Definí, tonificá y sentite mejor', photo: 'body-up' },
  { id: 'facial', eyebrow: 'FACIAL', title: 'Cuidado de la piel', description: 'Limpieza, nutrición y luminosidad', photo: 'pestanas' },
  { id: 'especialidades', eyebrow: 'TECNOLOGÍA', title: 'Tratamientos avanzados', description: 'Tecnología y cuidado personalizado', photo: 'radiofrecuencia' },
  { id: 'bienestar', eyebrow: 'BIENESTAR', title: 'Tu momento', description: 'Relajá, renová, volvé a vos', photo: 'piedras-calientes' },
] as const;

export function HeroFeaturedCategories({ onSelect }: { onSelect: (category: string) => void }) {
  return (
    <section className="amore-hero-featured" aria-label="Explorá nuestros tratamientos">
      <div className="amore-hero-featured__frame">
        <div className="amore-hero-featured__grid">
          {FEATURED.map(({ id, eyebrow, title, description, photo }) => (
            <a key={id} href="#amore-catalogo" className="amore-hero-feature-card"
              onClick={() => onSelect(id)}
              aria-label={eyebrow + ': ' + title + ', ver tratamientos'}>
              <picture aria-hidden="true">
                <source type="image/webp"
                  srcSet={[
                    asset('editorial/' + photo + '-240.webp') + ' 240w',
                    asset('editorial/' + photo + '-480.webp') + ' 480w',
                    asset('editorial/' + photo + '.webp') + ' 760w',
                  ].join(', ')}
                  sizes="(max-width: 370px) calc(100vw - 3rem), (max-width: 700px) 45vw, (max-width: 1050px) 48vw, 25vw"/>
                <img src={asset('editorial/' + photo + '.webp')} alt=""
                  loading="lazy" decoding="async" width="760" height="920"/>
              </picture>
              <span className="amore-hero-feature-card__shade" aria-hidden="true" />
              <span className="amore-hero-feature-card__body">
                <span className="amore-hero-feature-card__eyebrow">{eyebrow}</span>
                <span className="amore-hero-feature-card__title">{title}</span>
                <span className="amore-hero-feature-card__description">{description}</span>
                <span className="amore-hero-feature-card__action">VER MÁS <ArrowUpRight size={15} strokeWidth={1.5} aria-hidden="true"/></span>
              </span>
            </a>
          ))}
        </div>
      </div>
      <p className="amore-hero-featured__ending" aria-hidden="true"><span/>MÁS QUE ESTÉTICA, ES AMORE<span/></p>
    </section>
  );
}
