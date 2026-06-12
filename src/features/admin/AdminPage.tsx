import { Navigate, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import AdminOverview from '@/features/admin/AdminOverview';
import AdminClientsView from '@/features/admin/AdminClientsView';
import AdminAgendaView from '@/features/admin/AdminAgendaView';
import AdminServicesView from '@/features/admin/AdminServicesView';
import AdminTratamientosView from '@/features/admin/AdminTratamientosView';
import AdminCostosView from '@/features/admin/AdminCostosView';
import AdminAuditoriaPreciosView from '@/features/admin/AdminAuditoriaPreciosView';
import AprobarUsuariosPage from '@/features/admin/AprobarUsuariosPage';
import { useAuth } from '@/context/AuthContext';
import { isPortalAdmin } from '@/config/admin';

function AdminOutletLayout({ onSignOut }: { onSignOut: () => void }) {
  return <Outlet context={{ onSignOut }} />;
}

export default function AdminPage() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-sm"
        style={{ background: 'var(--bg-cream)', color: 'rgba(0,61,91,0.55)' }}
      >
        Verificando acceso…
      </div>
    );
  }

  if (!session?.user) {
    return <Navigate to="/ingreso" replace state={{ from: location.pathname }} />;
  }

  const email =
    typeof session.user.email === 'string' ? session.user.email : (session.user as { email?: string }).email ?? '';
  const uid = session.user.id;

  if (!isPortalAdmin(email, uid)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ background: 'var(--bg-cream)' }}>
        <h1 className="text-serif-premium text-xl font-bold text-[#003D5B]">Acceso restringido</h1>
        <p className="mt-3 max-w-md text-center text-sm text-[#7A746E]">
          Esta zona es sólo para el equipo autorizado de Amore. Si necesitás acceso, contactá al administrador con tu
          correo de trabajo.
        </p>
        <button
          type="button"
          onClick={() => navigate('/', { replace: true })}
          className="mt-8 rounded-full bg-[#003D5B] px-10 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-white shadow-lg"
        >
          Volver al inicio
        </button>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    navigate('/', { replace: true });
  }

  return (
    <Routes>
      <Route element={<AdminOutletLayout onSignOut={handleSignOut} />}>
        <Route index element={<AdminOverview />} />
        <Route path="clientes" element={<AdminClientsView />} />
        <Route path="aprobar-usuarios" element={<AprobarUsuariosPage />} />
        <Route path="agenda" element={<AdminAgendaView />} />
        <Route path="tratamientos" element={<AdminTratamientosView />} />
        <Route path="servicios" element={<AdminServicesView />} />
        <Route path="costos" element={<AdminCostosView />} />
        <Route path="auditoria-precios" element={<AdminAuditoriaPreciosView />} />
      </Route>
    </Routes>
  );
}
