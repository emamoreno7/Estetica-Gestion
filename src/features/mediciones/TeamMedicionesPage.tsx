import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole, Search, ShieldAlert, UserRound } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { isPortalAdmin } from '@/config/admin';
import { asset } from '@/lib/asset';
import {
  canManageMediciones, listMeasurementOperators, searchMeasurementClients,
  setMeasurementOperator, type ClienteMediciones, type OperadorMediciones,
} from './medicionesApi';
import MedicionesPanel from './MedicionesPanel';

export default function TeamMedicionesPage() {
  const { session, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [needle, setNeedle] = useState('');
  const [clients, setClients] = useState<ClienteMediciones[]>([]);
  const [searchBusy, setSearchBusy] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ClienteMediciones | null>(null);
  const [operators, setOperators] = useState<OperadorMediciones[]>([]);
  const [showPermissions, setShowPermissions] = useState(false);
  const [email, setEmail] = useState('');
  const [manageBusy, setManageBusy] = useState(false);
  const [manageMessage, setManageMessage] = useState<string | null>(null);
  const admin = isPortalAdmin(session?.user?.email, session?.user?.id);

  useEffect(() => {
    if (!session?.user?.id) {
      setAllowed(null);
      return;
    }
    let alive = true;
    setAllowed(null);
    setPermissionError(false);
    void canManageMediciones().then((yes) => {
      if (alive) {
        setAllowed(yes);
        setPermissionError(!yes);
      }
    });
    return () => { alive = false; };
  }, [session?.user?.id]);

  useEffect(() => {
    if (!allowed || selected || needle.trim().length < 2) {
      setClients([]);
      setSearchBusy(false);
      setSearchError(null);
      return;
    }
    let alive = true;
    const timer = window.setTimeout(async () => {
      setSearchBusy(true);
      const result = await searchMeasurementClients(needle);
      if (alive) {
        setClients(result.rows);
        setSearchError(result.error);
        setSearchBusy(false);
      }
    }, 280);
    return () => { alive = false; window.clearTimeout(timer); };
  }, [allowed, needle, selected]);

  async function refreshOperators() {
    if (!admin) return;
    const result = await listMeasurementOperators();
    if (result.error) setManageMessage(result.error);
    else setOperators(result.rows);
  }

  async function updatePermission(next: boolean, targetEmail?: string) {
    setManageBusy(true);
    setManageMessage(null);
    const error = await setMeasurementOperator(targetEmail ?? email, next);
    setManageBusy(false);
    if (error) {
      setManageMessage(error);
      return;
    }
    setManageMessage(next ? 'Acceso de mediciones autorizado.' : 'Acceso de mediciones revocado.');
    setEmail('');
    await refreshOperators();
  }

  if (loading) {
    return <main className="amore-team-page"><p className="amore-team-empty">Verificando la sesión…</p></main>;
  }
  if (!session) return <Navigate to="/ingreso" replace state={{ from: '/equipo/medidas' }}/>;

  return (
    <div className="amore-team-page">
      <header className="amore-team-header">
        <div className="amore-team-header__brand">
          <img src={asset('editorial/amore-mark.webp')} alt="Amore" width="68" height="68"
            onError={(e) => {e.currentTarget.onerror = null; e.currentTarget.src = asset('logo-amore-v2.png');}}/>
          <div><p>CENTRO DI BELLEZZA</p><strong>Equipo Amore</strong></div>
        </div>
        <div className="amore-team-header__actions">
          {admin && <Link to="/admin/clientes">Panel admin</Link>}
          <button type="button" onClick={async () => {await signOut();navigate('/', {replace:true});}}>
            <ArrowLeft size={15} aria-hidden="true"/> Salir
          </button>
        </div>
      </header>
      <main className="amore-team-main">
        {allowed === null ? (
          <div className="amore-team-empty" role="status">
            <Loader2 size={23} className="animate-spin"/> Comprobando acceso seguro…
          </div>
        ) : !allowed ? (
          <div className="amore-team-empty" role="alert">
            <LockKeyhole size={32} aria-hidden="true"/>
            <h1>Acceso restringido</h1>
            <p>{permissionError
              ? 'No se verificó el permiso de mediciones. Si sos parte del equipo, pedile al administrador que active tu cuenta.'
              : 'Tu cuenta no está habilitada.'}</p>
            <Link to="/">Volver al inicio</Link>
          </div>
        ) : (
          <>
            <div className="amore-team-intro">
              <span className="amore-measure-eyebrow">FICHAS PRIVADAS · REGISTRO HISTÓRICO</span>
              <h1>Medidas & evolución</h1>
              <p>Buscá una ficha, registrá cada control y acompañá el seguimiento con consejos generales de bienestar.</p>
            </div>

            {selected ? (
              <>
                <button type="button" className="amore-measure-secondary"
                  onClick={() => {setSelected(null);setNeedle('');setSearchError(null);}}>
                  <ArrowLeft size={17}/> Volver a buscar
                </button>
                <div className="amore-team-measure-panel">
                  <p className="amore-measure-eyebrow">{selected.full_name}</p>
                  <MedicionesPanel key={selected.id} clienteId={selected.id}
                    clienteNombre={selected.full_name} isAdmin={admin}/>
                </div>
              </>
            ) : (
              <>
                <label className="amore-team-search" htmlFor="amore-team-q">
                  <span className="amore-measure-eyebrow">BUSCAR CLIENTE</span>
                  <input id="amore-team-q" value={needle} maxLength={80}
                    placeholder="Escribí al menos dos letras del nombre o teléfono"
                    onChange={(e) => setNeedle(e.target.value)} autoComplete="off"/>
                </label>
                {searchBusy && <p className="amore-team-empty" role="status">
                  <Loader2 size={18} className="animate-spin"/> Buscando…
                </p>}
                {searchError && <p className="amore-measure-error" role="alert"><ShieldAlert size={16}/>{searchError}</p>}
                {needle.trim().length >= 2 && !searchBusy && clients.length === 0 && !searchError ? (
                  <p className="amore-team-empty"><Search size={26}/> No se encontraron clientes.</p>
                ) : null}
                <div className="amore-team-results">
                  {clients.map((c) => (
                    <button type="button" className="amore-team-client-card" key={c.id}
                      onClick={() => setSelected(c)}>
                      <div><UserRound size={19} aria-hidden="true"/>
                        <strong>{c.full_name}</strong><span>{c.phone || 'Sin teléfono'}</span>
                      </div>
                      <ArrowRight size={18} aria-hidden="true"/>
                    </button>
                  ))}
                </div>
              </>
            )}

            {admin && !selected && (
              <div className="amore-team-access">
                <button type="button" className="amore-measure-secondary"
                  aria-expanded={showPermissions}
                  onClick={() => {
                    setShowPermissions((value) => !value);
                    if (!showPermissions) void refreshOperators();
                  }}>
                  <LockKeyhole size={16}/> Permisos del equipo
                </button>
                {showPermissions && (
                  <div className="amore-team-access__panel">
                    <h2>Acceso exclusivo a mediciones</h2>
                    <p>El personal debe contar primero con una cuenta de Supabase Auth.
                      Este permiso no permite entrar al panel administrativo ni consultar otras fichas clínicas.</p>
                    <form onSubmit={(e) => {e.preventDefault();void updatePermission(true);}}>
                      <label htmlFor="amore-team-email">Correo del empleado</label>
                      <input id="amore-team-email" type="email" required autoComplete="off"
                        value={email} onChange={(e)=>setEmail(e.target.value)}
                        placeholder="empleado@ejemplo.com" disabled={manageBusy}/>
                      <button type="submit" className="amore-measure-primary" disabled={manageBusy}>
                        Autorizar
                      </button>
                    </form>
                    {manageMessage && <p className="amore-measure-eyebrow" role="status">{manageMessage}</p>}
                    {operators.length > 0 && (
                      <div className="amore-team-access__list">
                        {operators.map((operator) => (
                          <div key={operator.usuario_id}>
                            <span>{operator.email}</span>
                            <button type="button" className="amore-measure-secondary"
                              disabled={manageBusy}
                              onClick={() => void updatePermission(!operator.activo,operator.email)}>
                              {operator.activo ? 'Revocar' : 'Habilitar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
