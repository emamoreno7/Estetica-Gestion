import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Apple, Check, ClipboardCopy, Droplets, Footprints, ShieldCheck, X } from 'lucide-react';

const TIPS = [
  {
    icon: Droplets, label: 'Hidratación',
    text: 'Recordale que tome agua a lo largo del día, antes y después de la actividad o sesión, según su sed y las indicaciones de su profesional. No es necesario beber de más.',
  },
  {
    icon: Footprints, label: 'Movimiento',
    text: 'Si su estado de salud y el tratamiento lo permiten, caminar, bicicleta o cardio moderado pueden acompañar una rutina activa. Comenzar de a poco.',
  },
  {
    icon: Apple, label: 'Alimentación equilibrada',
    text: 'Priorizar alimentos variados y reducir excesos de sal y azúcares añadidos, sin dietas extremas ni promesas de reducción localizada.',
  },
  {
    icon: ShieldCheck, label: 'Seguimiento responsable',
    text: 'Tomar las medidas en condiciones similares y recordar que los cambios no son siempre lineales. Respetar las contraindicaciones del tratamiento.',
  },
] as const;

const COPY_TEXT = ['AMORE · Consejos generales de bienestar', '', ...TIPS.map((t) =>
  t.label + ': ' + t.text), '', 'Orientación general: no sustituye las indicaciones médicas ni nutricionales.'].join('\n\n');

export function MedicionAdviceModal({ onClose, clientName }: {
  onClose: () => void;
  clientName: string;
}) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const done = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    done.current?.focus();
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const active = document.activeElement as HTMLElement;
        const dialog = done.current?.closest('[role=dialog]');
        const focusable = [...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? [])];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(COPY_TEXT);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return createPortal(
    <div className="amore-advice-backdrop">
      <div className="amore-advice-modal" role="dialog" aria-modal="true"
        aria-labelledby="amore-advice-title" aria-describedby="amore-advice-desc">
        <div className="amore-advice-modal__header">
          <div>
            <span className="amore-measure-eyebrow">AMORE · DESPUÉS DEL REGISTRO</span>
            <h2 id="amore-advice-title">Un pequeño consejo para compartir.</h2>
            <p id="amore-advice-desc">
              Se guardaron las medidas de <strong>{clientName}</strong>. Si corresponde, podés comentarle estas recomendaciones generales.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar consejos" className="amore-advice-close">
            <X size={19} aria-hidden="true"/>
          </button>
        </div>

        <div className="amore-advice-grid">
          {TIPS.map(({ icon: Icon, label, text }) => (
            <div key={label} className="amore-advice-tip">
              <span className="amore-advice-tip__icon"><Icon size={22} strokeWidth={1.55} aria-hidden="true"/></span>
              <div><h3>{label}</h3><p>{text}</p></div>
            </div>
          ))}
        </div>
        <p className="amore-advice-note">
          Estos consejos no son una prescripción. Adaptalos a la ficha clínica, al procedimiento realizado
          y a cualquier recomendación médica o nutricional individual.
        </p>
        {copyError && <p className="amore-measure-error" role="alert">No se pudo copiar. Podés transmitirlos verbalmente.</p>}
        <div className="amore-advice-actions">
          <button type="button" className="amore-measure-secondary" onClick={() => void copy()}>
            {copied ? <Check size={17}/> : <ClipboardCopy size={17}/>}
            {copied ? 'Consejos copiados' : 'Copiar recomendaciones'}
          </button>
          <button type="button" className="amore-measure-primary" ref={done} onClick={onClose}>
            Entendido <Check size={17}/>
          </button>
        </div>
      </div>
    </div>, document.body);
}
