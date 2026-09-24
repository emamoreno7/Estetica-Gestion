import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { CitasDataProvider } from '@/context/CitasDataContext';
import { RootLayout } from '@/components/RootLayout';
import { LandingRoute } from '@/features/landing/LandingRoute';

// El público no descarga el panel ni el portal antes de necesitarlos.
const AccessDeniedPage = lazy(() => import('@/features/auth/AccessDeniedPage'));
const ClientLoginPage = lazy(() => import('@/features/auth/ClientLoginPage'));
const ClientSignupPage = lazy(() => import('@/features/auth/ClientSignupPage'));
const PortalGate = lazy(() => import('@/features/portal/PortalGate').then((mod) => ({ default: mod.PortalGate })));
const AdminPage = lazy(() => import('@/features/admin/AdminPage'));
const TeamMedicionesPage = lazy(() => import('@/features/mediciones/TeamMedicionesPage'));

// BASE_URL conserva deep links en GitHub Pages sin modificar rutas de negocio.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

function RouteLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6"
      role="status" aria-live="polite"
      style={{ background: 'var(--bg-cream)', color: 'var(--primary-navy)' }}>
      <p className="text-sm">Cargando tu espacio Amore…</p>
    </div>
  );
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/acceso" element={<AccessDeniedPage />} />
        <Route path="/ingreso" element={<ClientLoginPage />} />
        <Route path="/login" element={<ClientLoginPage />} />
        <Route path="/unete" element={<ClientSignupPage />} />
        <Route path="/portal" element={<PortalGate />} />
        <Route path="/admin/*" element={<AdminPage />} />
        <Route path="/equipo/medidas" element={<TeamMedicionesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AuthProvider>
        <CitasDataProvider>
          <RootLayout><AppRoutes /></RootLayout>
        </CitasDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
