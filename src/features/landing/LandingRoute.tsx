import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LandingPage } from './LandingPage';

/** Route handler: la landing decide a dónde mandar según sesión. */
export function LandingRoute() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const goAccount = () => {
    if (session) navigate('/portal');
    else navigate('/ingreso');
  };
  return <LandingPage onEnter={goAccount} onRegister={() => navigate('/unete')} />;
}
