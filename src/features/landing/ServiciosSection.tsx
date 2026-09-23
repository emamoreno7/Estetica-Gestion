import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Hand, MessageCircle } from 'lucide-react';
import { BADGE_STYLE, serviciosCatalogo } from '@/data/serviciosCatalogo';
import { useServiciosCatalogo } from '@/hooks/useServiciosCatalogo';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { asset } from '@/lib/asset';
import './amore-services.css';

const EDITORIAL_CATEGORIES = [
  {
    id: 'corporal',
    eyebrow: 'CORPORAL',
    title: 'Remodelación corporal',
    image: 'editorial/body-up.webp',
    fallback: 'body-up.png',
  },
  {
    id: 'facial',
    eyebrow: 'FACIAL & MIRADA',
    title: 'El arte de cuidar tu piel',
    image: 'editorial/pestanas.webp',
    fallback: 'pestanas.png',
  },
  {
    id: 'bienestar',
    eyebrow: 'BIENESTAR',
    title: 'Tu momento de calma',
    image: 'editorial/masajesr.webp',
    fallback: 'masajesr.png',
  },
  {
    id: 'especialidades',
    eyebrow: 'TECNOLOGÍA',
    title: 'Cuidados especializados',
    image: 'editorial/depilacion.webp',
    fallback: 'depilacion.png',
  },
] as const;

function responsiveEditorialSrcSet(path: string): string | undefined {
  // Sólo las fotografías alojadas en el catálogo editorial público.
  const match = path.match(/(?:^|\/)editorial\/([a-z0-9-]+)\.webp$/i);
  if (!match) return undefined;
  const stem = match[1].toLowerCase();
  return [
    asset('editorial/' + stem + '-240.webp') + ' 240w',
    asset('editorial/' + stem + '-480.webp') + ' 480w',
    asset('editorial/' + stem + '.webp') + ' 760w',
  ].join(', ');
}

function editorialSrc(original: string) {
  if (!original || /^(https?:|blob:|data:)/i.test(original)) return original;
  const match = original.match(/^\/?([a-z0-9-]+)\.(?:png|jpe?g)$/i);
  return match ? asset('editorial/' + match[1].toLowerCase() + '.webp') : asset(original);
}

type PhotoProps = {
  src: string;
  fallback: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

function EditorialPhoto({ src, fallback, alt, className = '', priority = false }: PhotoProps) {
  return (
    <img
      className={className}
      src={asset(src)}
      srcSet={responsiveEditorialSrcSet(asset(src))}
      sizes="(max-width: 650px) 45vw, (max-width: 970px) 45vw, 24vw"
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      width="760"
      height="920"
      onError={(event) => {
        const img = event.currentTarget;
        const backup = asset(fallback);
        if (img.src !== new URL(backup, window.location.href).href) {
          img.srcset = '';
          img.src = backup;
        }
      }}
    />
  );
}

export function ServiciosSection() {
  const { categorias, loading, error } = useServiciosCatalogo();
  const [activeTab, setActiveTab] = useState(serviciosCatalogo[0].id);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (categorias.length > 0 && !categorias.some((category) => category.id === activeTab)) {
      setActiveTab(categorias[0].id);
    }
  }, [categorias, activeTab]);

  const categoria = categorias.find((category) => category.id === activeTab) ?? categorias[0];
  if (!categoria) return null;

  function chooseCategory(id: string) {
    setActiveTab(id);
    window.requestAnimationFrame(() => {
      document.getElementById('amore-catalogo')?.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    });
  }

  return (
    <section className="amore-services" aria-labelledby="amore-services-title">
      <div className="amore-container">
        <div className="amore-services__heading">
          <div>
            <p className="amore-eyebrow">Tratamientos que te acompañan</p>
            <h2 id="amore-services-title">Nuestros <em>tratamientos</em></h2>
          </div>
          <p>Encontrá el cuidado que buscás. Te ayudamos a elegir un tratamiento adecuado para vos.</p>
        </div>

        <div className="amore-services__featured" aria-label="Explorá los tratamientos por categoría">
          {EDITORIAL_CATEGORIES.filter((cover) => categorias.some((item) => item.id === cover.id)).map(
            (cover, index) => (
              <motion.button
                type="button"
                key={cover.id}
                className="amore-services__featured-card"
                onClick={() => chooseCategory(cover.id)}
                initial={reduceMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.55, delay: index * 0.06 }}
                aria-label={'Descubrir ' + cover.eyebrow.toLowerCase() + ': ver tratamientos'}
              >
                <EditorialPhoto src={cover.image} fallback={cover.fallback} alt="" />
                <span className="amore-services__featured-shade" aria-hidden="true" />
                <span className="amore-services__featured-info">
                  <span className="amore-services__featured-eyebrow">{cover.eyebrow}</span>
                  <span className="amore-services__featured-title">{cover.title}</span>
                  <span className="amore-services__featured-link">Descubrir <ArrowRight size={17} aria-hidden="true" /></span>
                </span>
              </motion.button>
            ),
          )}
        </div>

        <div className="amore-services__catalogue" id="amore-catalogo">
          <div className="amore-services__catalogue-heading">
            <div>
              <p className="amore-eyebrow">Un cuidado para cada etapa</p>
              <h3>Catálogo completo</h3>
            </div>
            <p>Seleccioná una categoría para explorar sus servicios.</p>
          </div>

          <div className="amore-services__tabs" role="group" aria-label="Categorías de servicios">
            {categorias.map((category) => (
              <button
                type="button"
                key={category.id}
                aria-pressed={category.id === activeTab}
                className={category.id === activeTab ? 'amore-services__tab amore-services__tab--active' : 'amore-services__tab'}
                onClick={() => setActiveTab(category.id)}
              >
                {category.label}
              </button>
            ))}
          </div>

          {loading && <p className="amore-services__notice" role="status">Actualizando el catálogo…</p>}
          {error && <p className="amore-services__notice" role="status">Mostramos el catálogo disponible mientras se restablece la conexión.</p>}

          <motion.div
            key={activeTab}
            className="amore-services__grid"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            aria-live="polite"
          >
            {categoria.services.map((service, index) => (
              <article className="amore-services__service" key={categoria.id + service.name + index}>
                <div className="amore-services__service-visual">
                  {categoria.id === 'manos' ? (
                    <div className="amore-services__hands-illustration" role="img" aria-label="Representación editorial del cuidado de manos y uñas">
                      <span className="amore-services__hands-brand">AMORE</span>
                      <Hand size={67} strokeWidth={1} aria-hidden="true" />
                      <span className="amore-services__hands-caption">EL ARTE DE CUIDAR CADA DETALLE</span>
                    </div>
                  ) : (
                  <img
                    src={editorialSrc(service.image)}
                    srcSet={responsiveEditorialSrcSet(editorialSrc(service.image))}
                    sizes="(max-width: 650px) calc(100vw - 2rem), (max-width: 970px) 46vw, 30vw"
                    alt={'Imagen ilustrativa de ' + service.name}
                    width="720"
                    height="810"
                    loading="lazy"
                    decoding="async"
                    onError={(event) => {
                      const img = event.currentTarget;
                      const fallback = asset(service.image || '/body-up.png');
                      if (img.src !== new URL(fallback, window.location.href).href) {
                        img.srcset = '';
                        img.src = fallback;
                      }
                    }}
                  />
                  )}
                  <span className="amore-services__photo-caption">Imagen ilustrativa</span>
                </div>
                <div className="amore-services__service-body">
                  <div className="amore-services__badges">
                    {service.badges.map((badge) => (
                      <span
                        key={badge}
                        style={{
                          color: BADGE_STYLE[badge]?.color ?? '#103a4d',
                          background: BADGE_STYLE[badge]?.bg ?? '#f4f0eb',
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                  <h4>{service.name}</h4>
                  <p>{service.desc}</p>
                  <a
                    className="amore-services__inquiry"
                    href={buildWhatsAppHref(service.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={'Consultar tratamiento por WhatsApp: ' + service.name}
                  >
                    Consultar tratamiento <ArrowRight size={17} aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </motion.div>
        </div>

        <div className="amore-services__help">
          <p>¿Querés orientación para elegir tu tratamiento?</p>
          <a
            href={buildWhatsAppHref('asesoramiento sobre tratamientos')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <MessageCircle size={18} aria-hidden="true" /> Escribinos por WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
