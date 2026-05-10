import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const GENDER_OPTIONS = [
  { value: 'any', label: 'Any gender' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

const LOOKING_FOR_OPTIONS = [
  { value: 'any', label: 'Anyone' },
  { value: 'male', label: 'Males' },
  { value: 'female', label: 'Females' },
];

const INTEREST_TAGS = [
  'Gaming', 'Music', 'Movies', 'Travel', 'Sports',
  'Art', 'Tech', 'Food', 'Fitness', 'Books', 'Anime', 'Coding',
];

export default function Welcome() {
  const navigate = useNavigate();
  const { dark, toggle: toggleDark } = useTheme();
  const auth = JSON.parse(localStorage.getItem('auth') || '{}');

  const [displayName, setDisplayName] = useState(auth.name || '');
  const [gender, setGender] = useState(localStorage.getItem('gender') || 'any');
  const [lookingFor, setLookingFor] = useState(localStorage.getItem('lookingFor') || 'any');
  const [voiceOnly, setVoiceOnly] = useState(localStorage.getItem('voiceOnly') === 'true');
  const [selectedTags, setSelectedTags] = useState(() => {
    try { return JSON.parse(localStorage.getItem('tags') || '[]'); } catch { return []; }
  });
  const [imgError, setImgError] = useState(false);

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleStart = () => {
    if (!displayName.trim()) return;
    localStorage.setItem('auth', JSON.stringify({ ...auth, name: displayName.trim() }));
    localStorage.setItem('gender', gender);
    localStorage.setItem('lookingFor', lookingFor);
    localStorage.setItem('voiceOnly', String(voiceOnly));
    localStorage.setItem('tags', JSON.stringify(selectedTags));
    navigate('/chat', { state: { autoStart: true } });
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('gender');
    localStorage.removeItem('lookingFor');
    localStorage.removeItem('voiceOnly');
    localStorage.removeItem('tags');
    navigate('/');
  };

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
        <div className="absolute left-1/2 top-[34%] h-[44rem] w-[44rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-100/80 blur-[130px] dark:bg-blue-900/20" />
      </div>

      <main className="relative flex flex-1 items-center justify-center px-6 py-12">
        <section className="w-full max-w-xl">
          <div className="flex flex-col items-center gap-8 text-center">

            {/* Avatar */}
            <div className="relative">
              {auth.picture && !imgError ? (
                <img
                  src={auth.picture}
                  alt={auth.name}
                  onError={() => setImgError(true)}
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-[0_12px_32px_rgba(15,23,42,0.14)] dark:border-slate-700"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-600 shadow-[0_12px_32px_rgba(37,99,235,0.24)] dark:border-slate-700">
                  <span className="material-symbols-outlined text-[40px] text-white">person</span>
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-emerald-500 shadow dark:border-slate-900">
                <span className="material-symbols-outlined text-[14px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
              </span>
            </div>

            <div className="space-y-2">
              <h2 className="text-[2rem] font-semibold leading-tight tracking-[-0.04em] text-slate-900 dark:text-white sm:text-[2.4rem]">
                Welcome, <span className="text-blue-600">{auth.name?.split(' ')[0] || 'there'}</span>!
              </h2>
              <p className="mx-auto max-w-md text-base leading-7 text-slate-500 dark:text-slate-400">
                Set your preferences before starting.
              </p>
            </div>

            <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-[0px_12px_48px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-800 sm:p-10">
              <div className="flex flex-col gap-5">

                {/* Display name */}
                <div className="text-left">
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="displayName">
                    Display name
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">badge</span>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={50}
                      placeholder="How should strangers see you?"
                      className="h-14 w-full rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500 dark:focus:bg-slate-700"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-left">
                    <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="gender">I am</label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">person</span>
                      <select
                        id="gender"
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="h-14 w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-10 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-700"
                      >
                        {GENDER_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
                    </div>
                  </div>

                  <div className="text-left">
                    <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white" htmlFor="lookingFor">Looking for</label>
                    <div className="relative">
                      <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                      <select
                        id="lookingFor"
                        value={lookingFor}
                        onChange={(e) => setLookingFor(e.target.value)}
                        className="h-14 w-full appearance-none rounded-2xl border border-slate-300 bg-slate-50 py-3 pl-12 pr-10 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:focus:bg-slate-700"
                      >
                        {LOOKING_FOR_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">expand_more</span>
                    </div>
                  </div>
                </div>

                {/* Interest tags */}
                <div className="text-left">
                  <label className="mb-2 block text-sm font-semibold text-slate-900 dark:text-white">
                    Interests <span className="font-normal text-slate-400">(optional — match with similar people)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_TAGS.map((tag) => {
                      const active = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                            active
                              ? 'border-blue-500 bg-blue-600 text-white'
                              : 'border-slate-300 bg-slate-50 text-slate-600 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:border-blue-500'
                          }`}
                        >
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Voice-only toggle */}
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-600 dark:bg-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">
                      {voiceOnly ? 'mic' : 'videocam'}
                    </span>
                    <div className="text-left">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">Voice only mode</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Audio chat without camera</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVoiceOnly((v) => !v)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${voiceOnly ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'}`}
                  >
                    <span
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${voiceOnly ? 'translate-x-5' : 'translate-x-0.5'}`}
                    />
                  </button>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-600" />

                <button
                  onClick={handleStart}
                  disabled={!displayName.trim()}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-[0_10px_24px_rgba(37,99,235,0.24)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  type="button"
                >
                  <span className="material-symbols-outlined">{voiceOnly ? 'mic' : 'videocam'}</span>
                  Start chatting
                </button>

                <button
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-4 text-base font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
                  type="button"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Sign out
                </button>

                <p className="text-center text-sm leading-6 text-slate-400 dark:text-slate-500">
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
