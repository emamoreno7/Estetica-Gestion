// src/features/portal/types.ts
import type { Calendar, Home, Microscope, Sparkles, TrendingUp, User } from 'lucide-react';

export type PortalView = 'inicio' | 'tratamiento' | 'evolucion' | 'citas' | 'perfil' | 'analizador';

export type PortalNavItem = {
  id: PortalView;
  label: string;
  shortLabel: string;
  icon: typeof Home | typeof Sparkles | typeof TrendingUp | typeof Calendar | typeof User | typeof Microscope;
};