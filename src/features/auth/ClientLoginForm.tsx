import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { isPortalAdmin } from '@/config/admin';

function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}

export default function ClientLoginForm() {
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputClass =
    'w-full rounded-2xl border border-[#003D5B]/12 bg-white/90 px-4 py-3.5 text-sm text-[#003D5B] outline-none transition placeholder:text-[#003D5B]/35 focus:border-[#003D5B]/28 focus:ring-2 focus:ring-[#F2D7D5]/80';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const mail = correo.trim().toLowerCase();
    if (!isValidEmail(mail)) {
      setError('Ingresá un correo válido.');
      return;
    }
    if (!password) {
      setError('Ingresá tu contraseña.');
      return;
    }
    if (!isSupabaseConfigured) {
      setError(
        'Falta configurar Supabase en el build. Abrí la consola (F12): verás el diagnóstico de VITE_SUPABASE_URL y la clave enmascarada.'
      );
      return;
    }

    setBusy(true);
    const { error: signErr } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
    });
    setBusy(false);
    if (signErr) {
      setError(signErr.message === 'Invalid login credentials' ? 'Correo o contraseña incorrectos.' : signErr.message);
      return;
    }
    // El personal autorizado tiene una ruta independiente: nunca abre /admin.
    // Si aún no se aplicó la migración, conservamos el ingreso tradicional.
    if (!isPortalAdmin(mail)) {
      const { data: canMeasure, error: permissionError } = await supabase.rpc('puede_registrar_mediciones');
      if (!permissionError && canMeasure === true) {
        navigate('/equipo/medidas', { replace: true });
        return;
      }
    }
    navigate('/portal', { replace: true });
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div>
        <label htmlFor="login-email" className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#003D5B]/70">
          Correo electrónico
        </label>
        <input
          id="login-email"
          type="email"
          className={inputClass}
          value={correo}
          onChange={e => setCorreo(e.target.value)}
          placeholder="nombre@ejemplo.com"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="login-pw" className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-[#003D5B]/70">
          Contraseña
        </label>
        <input
          id="login-pw"
          type="password"
          className={inputClass}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm text-red-800">{error}</p>
      )}

      <motion.button
        type="submit"
        disabled={busy}
        whileHover={{ y: busy ? 0 : -1 }}
        whileTap={{ scale: busy ? 1 : 0.99 }}
        className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white shadow-lg disabled:opacity-60"
        style={{ background: '#003D5B', boxShadow: '0 10px 28px rgba(0,61,91,0.18)' }}
      >
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Ingresando…
          </>
        ) : (
          'Entrar al portal'
        )}
      </motion.button>

      <p className="text-center text-xs text-[#003D5B]/60">
        ¿Primera vez?{' '}
        <Link to="/unete" className="font-semibold text-[#003D5B] underline underline-offset-2">
          Creá tu perfil
        </Link>
      </p>
    </motion.form>
  );
}
