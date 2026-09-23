import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import VirtualAssistantChat from '@/components/VirtualAssistantChat';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { asset } from '@/lib/asset';
import ClientSignupForm from './ClientSignupForm';

export default function ClientSignupPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: '#FDF8F5' }}>
      <div className="absolute inset-0">
        <img src={asset('editorial/masajesr.webp')} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(105deg, rgba(253,248,245,0.94) 0%, rgba(253,248,245,0.78) 42%, rgba(253,248,245,0.55) 100%)',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-10 sm:px-8 lg:flex-row lg:items-center lg:gap-16 lg:py-16">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="mb-10 max-w-md lg:mb-0 lg:flex-1"
        >
          <Link
            to="/"
            className="inline-block text-[10px] font-semibold uppercase tracking-[0.22em] text-[#003D5B]/70 underline underline-offset-4"
          >
            ← Inicio
          </Link>
          <h1
            className="text-serif-premium mt-8 text-3xl font-light leading-tight text-[#003D5B] sm:text-4xl"
            style={{ letterSpacing: '0.03em' }}
          >
            Sumate a la comunidad Amore
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-[#003D5B]/65">
            Registrate con correo y contraseña. Guardamos tu WhatsApp como contacto. Al terminar, verás tu cuenta
            pendiente de activación hasta que recepción te habilite.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          className="w-full max-w-md rounded-[1.75rem] border border-white/80 bg-white/75 p-8 shadow-2xl shadow-[#003D5B]/08 backdrop-blur-md lg:flex-1"
          style={{ borderColor: 'rgba(242,215,213,0.65)' }}
        >
          <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#003D5B]/45">
            Alta de cliente
          </p>
          <ClientSignupForm onSuccess={() => navigate('/portal', { replace: true })} />
        </motion.div>
      </div>

      <VirtualAssistantChat whatsappHref={buildWhatsAppHref} />
      <WhatsAppFloatingButton />
    </div>
  );
}
