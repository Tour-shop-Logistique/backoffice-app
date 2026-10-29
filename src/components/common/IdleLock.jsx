import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Lock, Loader2, LogOut } from 'lucide-react';
import authService from '../../services/authService';
import { performLogout } from '../../redux/slices/authSlice';

// Verrouillage après 10 min sans activité (touche, souris, tactile, défilement).
const IDLE_MS = 10 * 60 * 1000;
const ACTIVITY_KEY = 'last_activity_at';
// sessionStorage survit au rechargement (F5) mais pas à la fermeture de
// l'onglet : sa disparition signale une page fermée puis rouverte.
const ALIVE_KEY = 'session_alive';
const LOCKED_KEY = 'session_locked';

const safe = (fn, fallback) => {
  try { return fn(); } catch { return fallback; }
};

const shouldStartLocked = () => safe(() => {
  if (sessionStorage.getItem(LOCKED_KEY) === '1') return true;
  if (!sessionStorage.getItem(ALIVE_KEY)) return true;
  return Date.now() - Number(localStorage.getItem(ACTIVITY_KEY) || 0) >= IDLE_MS;
}, false);

const IdleLock = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [locked, setLocked] = useState(shouldStartLocked);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    safe(() => {
      sessionStorage.setItem(ALIVE_KEY, '1');
      if (!locked) localStorage.setItem(ACTIVITY_KEY, String(Date.now()));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste l'état verrouillé ; le retire au démontage (déconnexion).
  useEffect(() => {
    safe(() => (locked ? sessionStorage.setItem(LOCKED_KEY, '1') : sessionStorage.removeItem(LOCKED_KEY)));
  }, [locked]);
  useEffect(() => () => safe(() => sessionStorage.removeItem(LOCKED_KEY)), []);

  useEffect(() => {
    if (locked) return undefined;

    let lastWrite = 0;
    const markActive = () => {
      const now = Date.now();
      if (now - lastWrite < 5000) return;
      lastWrite = now;
      safe(() => localStorage.setItem(ACTIVITY_KEY, String(now)));
    };
    const check = () => {
      const last = safe(() => Number(localStorage.getItem(ACTIVITY_KEY) || 0), 0);
      if (Date.now() - last >= IDLE_MS) setLocked(true);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((e) => window.addEventListener(e, markActive, { passive: true }));
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(check, 15000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, markActive));
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [locked]);

  const unlock = useCallback(async (e) => {
    e.preventDefault();
    if (!password || loading) return;
    setLoading(true);
    setError('');
    const credentials = { password };
    if (user?.email) credentials.email = user.email;
    else credentials.telephone = user?.telephone;
    try {
      await authService.login(credentials);
      setPassword('');
      safe(() => localStorage.setItem(ACTIVITY_KEY, String(Date.now())));
      setLocked(false);
    } catch (err) {
      setError(err?.response?.data?.message || 'Mot de passe incorrect.');
    } finally {
      setLoading(false);
    }
  }, [password, loading, user]);

  if (!locked) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Session verrouillée"
    >
      <form onSubmit={unlock} className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl space-y-4">
        <div className="flex flex-col items-center text-center gap-2">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Lock className="h-6 w-6 text-slate-700" />
          </span>
          <h2 className="text-lg font-semibold text-slate-900">Session verrouillée</h2>
          <p className="text-sm text-slate-500">
            {user?.nom ? `${user.nom}, saisissez` : 'Saisissez'} votre mot de passe pour reprendre.
          </p>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
        />
        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={!password || loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Déverrouiller
        </button>
        <button
          type="button"
          onClick={() => {
            safe(() => sessionStorage.removeItem(LOCKED_KEY));
            dispatch(performLogout());
          }}
          className="flex w-full items-center justify-center gap-2 text-sm text-slate-500 hover:text-slate-900"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </form>
    </div>
  );
};

export default IdleLock;
