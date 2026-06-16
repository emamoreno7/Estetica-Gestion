// src/features/portal/navItems.ts
import { Calendar, Home, Microscope, Sparkles, TrendingUp, User } from 'lucide-react';
import type { PortalNavItem } from './types';

export const portalNavItems: PortalNavItem[] = [
  { id: 'inicio',      label: 'Inicio',           shortLabel: 'Inicio',    icon: Home },
  { id: 'tratamiento', label: 'Mi Tratamiento',   shortLabel: 'Tratam.',   icon: Sparkles },
  { id: 'evolucion',   label: 'Evolución',         shortLabel: 'Evolución', icon: TrendingUp },
  { id: 'citas',       label: 'Mis Citas',         shortLabel: 'Citas',     icon: Calendar },
  { id: 'analizador',  label: 'Analizador de Piel',shortLabel: 'IA Piel',   icon: Microscope },
  { id: 'perfil',      label: 'Mi Perfil',         shortLabel: 'Perfil',    icon: User },
];