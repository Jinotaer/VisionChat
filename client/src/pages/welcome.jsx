import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const GENDER_OPTIONS = [
  { value: 'any', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function Welcome() {
  const navigate = useNavigate();
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');

  const [displayName, setDisplayName] = useState(auth.name || '');
  const [gender, setGender] = useState('any');
  const [imgError, setImgError] = useState(false);

  const handleStart = () => {
    if (!displayName.trim()) return;
    localStorage.setItem('auth', JSON.stringify({ ...auth, name: displayName.trim() }));
    localStorage.setItem('gender', gender);
    navigate('/chat', { state: { autoStart: true } });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('gender');
    navigate('/');
  };

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[34%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/80 blur-[130px]" />
        <div className="absolute left-1/2 top-[48%] h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 blur-[110px]" />
      </div>

      <main className="relative flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-xl">
          <div className="flex flex-col items-center gap-8 text-center">

            {/* Profile picture from Google */}
            <div className="relative">
              {auth.picture && !imgError ? (
                <img
                  src={auth.picture}
                  alt={auth.name}
                  onError={() => setImgError(true)}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_12px_32px_rgba(15,23,42,0.14)]"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-[0_12px_32px_rgba(37,99,235,0.24)]">
                  <span className="material-symbols-outlined text-[40px] text-white">person</span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow">
                <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-900 sm:text-[2.4rem]">
                Welcome, <span className="text-blue-600">{auth.name?.split(' ')[0] || 'there'}</span>!
              </h2>
              <p className="mx-auto max-w-md text-base leading-7 text-slate-500">
                Confirm your display name and gender preference before starting.
              </p>
            </div>

            <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0px_12px_48px_rgba(15,23,42,0.08)] sm:p-10">
              <div className="flex flex-col gap-5">

                {/* Display name */}
                <div className="text-left">
                  <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="displayName">
                    Display name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      badge
                    </span>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      placeholder="How should strangers see you?"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="text-left">
                  <label className="mb-2 block text-sm font-semibold text-slate-900" htmlFor="gender">
                    I am
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      person
                    </span>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="h-14 w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-12 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200"
                    >
                      {GENDER_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                      expand_more
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-200" />

                <button
                  onClick={handleStart}
                  disabled={!displayName.trim()}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  <span className="material-symbols-outlined">videocam</span>
                  Start chatting
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-base font-semibold text-slate-600 transition hover:bg-slate-100"
                  type="button"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sign out
                </button>

                <p className="text-center text-sm leading-6 text-slate-400">
                  By using VisionChat you agree to our{' '}
                  <a href="#" className="font-medium text-blue-600 hover:underline">Terms</a>
                  {' '}and confirm you are 18+.
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>
    </div>
  );
}
