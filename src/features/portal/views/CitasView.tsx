// src/features/portal/views/CitasView.tsx
import { PortalCitasTab } from '@/components/portal/PortalCitasTab';
import { usePortalCliente } from '@/context/PortalClienteContext';
import { buildWhatsAppHref } from '@/lib/whatsapp';
import { PortalTreatmentEmptyPlaceholder } from '../components/PortalTreatmentEmptyPlaceholder';
import type { ServicioReservable } from '@/lib/citasConstants';

interface Props {
  servicioPreseleccionado?: ServicioReservable | null;
  onServicioConsumido?: () => void;
}

export function CitasView({ servicioPreseleccionado, onServicioConsumido }: Props) {
  const ctx = usePortalCliente();
  return (
    <PortalCitasTab
      activeTreatment={ctx.activeTreatment}
      sessions={ctx.sessions}
      PortalTreatmentEmptyPlaceholder={PortalTreatmentEmptyPlaceholder}
      buildWhatsAppHref={buildWhatsAppHref}
      servicioPreseleccionado={servicioPreseleccionado}
      onServicioConsumido={onServicioConsumido}
    />
  );
}