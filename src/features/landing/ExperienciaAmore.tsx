import { motion, useReducedMotion } from 'framer-motion';
import { Heart, Leaf, Sparkles, UsersRound } from 'lucide-react';

const VALUES = [
  {
    icon: Leaf,
    title: 'Atención personalizada',
    description: 'Escuchamos tus objetivos y te orientamos hacia el cuidado que buscás.',
    tone: 'sage',
  },
  {
    icon: Heart,
    title: 'Un momento para vos',
    description: 'Un encuentro pensado para disfrutar de una pausa y sentirte bien.',
    tone: 'rose',
  },
  {
    icon: UsersRound,
    title: 'Acompañamiento cercano',
    description: 'Una atención dedicada y un espacio para resolver tus consultas.',
    tone: 'sand',
  },
  {
    icon: Sparkles,
    title: 'Belleza con propósito',
    description: 'Tratamientos y tecnología al servicio de tus objetivos personales.',
    tone: 'rose',
  },
] as const;

export function ExperienciaAmore() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="nosotras" className="amore-experience" aria-labelledby="experiencia-titulo">
      <div className="amore-container">
        <div className="amore-experience__intro">
          <div>
            <p className="amore-eyebrow">Más que estética</p>
            <h2 id="experiencia-titulo">La experiencia <em>Amore</em></h2>
          </div>
          <p className="amore-experience__description">
            Un encuentro donde el cuidado, la tecnología y la sensibilidad se unen
            para ofrecerte una experiencia que empieza por escucharte.
          </p>
        </div>
        <div className="amore-experience__grid">
          {VALUES.map(({ icon: Icon, title, description, tone }, index) => (
            <motion.article
              key={title}
              className="amore-experience__card"
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: index * 0.07 }}
            >
              <span className={'amore-experience__icon amore-experience__icon--' + tone}>
                <Icon size={25} strokeWidth={1.35} aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
