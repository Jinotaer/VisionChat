import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { apiUrl } from '../lib/network';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

async function readJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

export default function Login() {
  const navigate = useNavigate();
  const { dark, toggle: toggleDark } = useTheme();
  const gsiRef = useRef(null);
  const initializedRef = useRef(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const handleCredential = useCallback(async (response) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl('/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await readJsonSafely(res);
      if (!res.ok) throw new Error(data?.error || `Google sign-in failed (${res.status})`);
      if (!data?.sessionId || !data?.user) throw new Error('Google sign-in failed: invalid server response');
      localStorage.setItem('auth', JSON.stringify({
        sessionId: data.sessionId,
        name: data.user.name,
        email: data.user.email,
        picture: data.user.picture,
      }));
      navigate('/welcome');
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? 'Cannot reach server — make sure the API is running.'
          : err.message
      );
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const init = () => {
      if (!window.google || !CLIENT_ID || initializedRef.current) return;
      initializedRef.current = true;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
      });
      if (gsiRef.current) {
        window.google.accounts.id.renderButton(gsiRef.current, {
          theme: dark ? 'filled_black' : 'outline',
          text: 'continue_with',
          shape: 'pill',
          type: 'standard',
          size: 'large',
          width: gsiRef.current.offsetWidth || 400,
        });
      }
      setGoogleReady(true);
    };

    if (window.google) { init(); return; }
    const script = document.querySelector('script[src*="accounts.google.com/gsi"]');
    if (!script) return;
    script.addEventListener('load', init);
    return () => script.removeEventListener('load', init);
  }, [handleCredential, dark]);

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-white">
      <button
        onClick={toggleDark}
        title="Toggle dark mode"
        className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
      >
        <span className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300">
          {dark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[40%] h-[46rem] w-[46rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/80 blur-[140px] dark:bg-blue-900/20" />
      </div>

      <main className="relative flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-[500px] rounded-[22px] border border-slate-200/90 bg-white px-7 py-9 shadow-[0_18px_52px_rgba(33,112,228,0.14)] dark:border-slate-700 dark:bg-slate-800 sm:px-10 sm:py-10">
          <div className="mx-auto flex w-full max-w-[400px] flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_8px_18px_rgba(0,88,190,0.18)]">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </div>
              <span className="text-[28px] font-bold tracking-[-0.04em] text-blue-600">VisionChat</span>
            </div>

            <h1 className="max-w-[380px] text-[2rem] font-semibold leading-[1.12] tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[2.25rem]">
              Sign in to VisionChat
            </h1>
            <p className="mt-4 max-w-[360px] text-[1rem] leading-7 text-slate-600 dark:text-slate-400">
              Connect with strangers worldwide via live video and text chat.
            </p>

            <div className="mt-8 w-full space-y-3">
              {loading ? (
                <div className="flex h-11 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-600 dark:bg-slate-700">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                  Signing you in...
                </div>
              ) : (
                <div className="relative min-h-11 w-full">
                  {!googleReady && CLIENT_ID && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-[0.95rem] text-slate-500 dark:border-slate-600 dark:bg-slate-700">
                      Loading Google sign-in...
                    </div>
                  )}
                  <div
                    ref={gsiRef}
                    className={`flex min-h-11 w-full items-center justify-center ${googleReady ? 'opacity-100' : 'opacity-0'}`}
                  />
                </div>
              )}

              {!CLIENT_ID && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-left text-[0.82rem] text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                  <strong>Setup needed:</strong> Add <code>VITE_GOOGLE_CLIENT_ID</code> to{' '}
                  <code>client/.env</code> and restart the dev server.
                </p>
              )}

              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-left text-[0.85rem] text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
                  {error}
                </p>
              )}
            </div>

            <p className="mt-6 max-w-[360px] text-[0.88rem] leading-6 text-slate-400 dark:text-slate-500">
              By continuing you agree to our Terms and confirm you are 18+.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
