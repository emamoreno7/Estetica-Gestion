// src/features/portal/PortalApp.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { PortalClienteProvider } from '@/context/PortalClienteContext';
import { PortalNotificationsProvider } from '@/context/PortalNotificationsContext';
import { ConsentimientoProvider } from '@/context/ConsentimientoContext';
import VirtualAssistantChat from '@/components/VirtualAssistantChat';
import { WhatsAppFloatingButton } from '@/components/WhatsAppFloatingButton';
import { isPortalAdmin } from '@/config/admin';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { PortalSidebar } from './PortalSidebar';
import { PortalHeaderBridge } from './PortalHeaderBridge';
import { InicioView } from './views/InicioView';
import { TratamientoView } from './views/TratamientoView';
import { EvolucionView } from './views/EvolucionView';
import { CitasView } from './views/CitasView';
import { PerfilView } from './views/PerfilView';
import { AnalizadorView } from './views/AnalizadorView';
import type { PortalView } from './types';
import type { ServicioReservable } from '@/lib/citasConstants';

export function PortalApp() {
  const [view, setView] = useState<PortalView>('inicio');
  const [servicioParaReservar, setServicioParaReservar] = useState<ServicioReservable | null>(null);
  const navigate = useNavigate();
  const { signOut, session } = useAuth();

  const user = session?.user;
  const userEmail =
    typeof user?.email === 'string' ? user.email : (user as { email?: string } | undefined)?.email ?? '';
  const portalUserIsAdmin = user ? isPortalAdmin(userEmail, user.id) : false;

  if (!user) return null;

  // ── Handler: el Analizador IA pide reservar un servicio ────────────────
  function handleReservarDesdeAnalizador(servicio: ServicioReservable) {
    setServicioParaReservar(servicio);
    setView('citas');
  }

  const renderView = () => {
    switch (view) {
      case 'inicio':
        return <InicioView onNav={setView} />;
      case 'tratamiento':
        return <TratamientoView />;
      case 'evolucion':
        return <EvolucionView />;
      case 'citas':
        return (
          <CitasView
            servicioPreseleccionado={servicioParaReservar}
            onServicioConsumido={() => setServicioParaReservar(null)}
          />
        );
      case 'analizador':
        return <AnalizadorView onReservarServicio={handleReservarDesdeAnalizador} />;
      case 'perfil':
        return <PerfilView />;
    }
  };

  return (
    <PortalClienteProvider sessionUser={user}>
      <PortalNotificationsProvider>
        <ConsentimientoProvider>
        <div className="relative min-h-screen" style={{ background: 'var(--bg-cream)' }}>
          <div
            className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            style={{ background: 'var(--bg-cream)' }}
          >
            <div
              className="absolute -left-40 -top-40 h-96 w-96 rounded-full blur-3xl"
              style={{ background: 'rgba(242,215,213,0.45)' }}
            />
            <div
              className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full blur-3xl"
              style={{ background: 'rgba(191,201,162,0.30)' }}
            />
            <div
              className="absolute left-1/3 top-1/3 h-72 w-72 rounded-full blur-3xl"
              style={{ background: 'rgba(0,61,91,0.04)' }}
            />
          </div>

          <PortalSidebar
            view={view}
            onNav={setView}
            isAdmin={portalUserIsAdmin}
            onLogout={async () => {
              await signOut();
              navigate('/', { replace: true });
            }}
          />

          <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`relative z-10 min-h-screen lg:pl-20 lg:pb-0 ${
              portalUserIsAdmin ? 'pb-40' : 'pb-28'
            }`}
          >
            <PortalHeaderBridge view={view} onNav={setView} />
            {portalUserIsAdmin ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                role="status"
                className="mx-4 mt-3 rounded-2xl border px-4 py-3 text-center sm:mx-6 lg:mx-8"
                style={{
                  borderColor: 'rgba(0,61,91,0.14)',
                  background: 'linear-gradient(100deg, rgba(0,61,91,0.07) 0%, rgba(191,201,162,0.18) 100%)',
                  boxShadow: '0 10px 32px rgba(0,61,91,0.06)',
                }}
              >
                <p className="text-sm font-semibold text-[#003D5B]">
                  Hola Emanuel, tienes privilegios de administrador
                </p>
              </motion.div>
            ) : null}
            <div className="p-4 lg:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {renderView()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.main>
          <VirtualAssistantChat whatsappHref={buildWhatsAppHref} forPortal />
          <WhatsAppFloatingButton forPortal />
        </div>
        </ConsentimientoProvider>
      </PortalNotificationsProvider>
    </PortalClienteProvider>
  );
}