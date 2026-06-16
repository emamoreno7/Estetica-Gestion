// src/features/portal/PortalHeaderBridge.tsx
import { PortalHeader, type PortalHeaderView } from '@/components/portal/PortalHeader';
import { usePortalCliente } from '@/context/PortalClienteContext';
import type { PortalView } from './types';

type Props = { view: PortalView; onNav: (v: PortalView) => void };

/** Adaptador: convierte los datos del context portal en props para PortalHeader. */
export function PortalHeaderBridge({ view, onNav }: Props) {
  const pc = usePortalCliente();
  return (
    <PortalHeader
      view={view as PortalHeaderView}
      onNavigate={(v) => onNav(v as PortalView)}
      portalCliente={{
        displayName: pc.displayName,
        greetingName: pc.greetingName,
        photoUrl: pc.photoUrl,
      }}
    />
  );
}