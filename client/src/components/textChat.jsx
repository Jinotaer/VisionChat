import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const QUICK_EMOJIS = ['😂', '❤️', '👍', '😮', '😢', '🔥'];

const REPORT_REASONS = [
  'Inappropriate content',
  'Harassment or bullying',
  'Spam or scam',
  'Nudity or sexual content',
  'Other',
];

export default function TextChat({
  messages = [],
  onSend,
  onNext,
  onStop,
  onLogout,
  onTyping,
  onReaction,
  onReport,
  displayName,
  partnerName = 'Stranger',
  partnerTyping = false,
  matched = false,
  onlineCount,
}) {
  const { dark, toggle: toggleDark } = useTheme();
  const [input, setInput] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reactionTarget, setReactionTarget] = useState(null);
  const bottomRef = useRef();
  const clickTimerRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  useEffect(() => () => clearTimeout(clickTimerRef.current), []);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim());
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    onTyping?.();
  };

  const handleMsgClick = (msgId, isPartner) => {
    if (!isPartner) return;
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      setReactionTarget((prev) => (prev === msgId ? null : msgId));
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
      }, 300);
    }
  };

  const sendReaction = (emoji) => {
    if (reactionTarget != null) {
      onReaction?.(emoji, reactionTarget);
      setReactionTarget(null);
    }
  };

  const submitReport = (reason) => {
    onReport?.(reason);
    setShowReport(false);
  };

  return (
    <aside className="relative flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0px_4px_16px_rgba(0,0,0,0.08)] dark:border-slate-700 dark:bg-slate-800 md:h-full md:flex-none md:w-80 lg:w-96">

      {/* Header */}
      <div className="flex min-w-0 flex-none items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex min-w-0 items-center gap-2">
            <h3 className="shrink-0 text-[16px] font-semibold text-slate-900 dark:text-white">Chat</h3>
            {displayName && <span className="truncate text-[13px] text-slate-400">as {displayName}</span>}
            {partnerName !== 'Stranger' && (
              <span className="truncate text-[13px] font-medium text-blue-500">with {partnerName}</span>
            )}
          </div>
          {onlineCount !== null && (
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {onlineCount} online
            </span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={toggleDark}
            title="Toggle dark mode"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <span className="material-symbols-outlined text-[18px]">{dark ? 'light_mode' : 'dark_mode'}</span>
          </button>
          {matched && onReport && (
            <button
              onClick={() => setShowReport(true)}
              title="Report user"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-slate-700"
            >
              <span className="material-symbols-outlined text-[18px]">flag</span>
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Sign out"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
            </button>
          )}
        </div>
      </div>

      {/* Report modal */}
      {showReport && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-xs rounded-2xl border border-slate-200 bg-white p-5 shadow-xl dark:border-slate-700 dark:bg-slate-800">
            <h4 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Report this user</h4>
            <div className="flex flex-col gap-2">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => submitReport(r)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
                >
                  {r}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowReport(false)}
              className="mt-3 w-full rounded-lg py-2 text-sm text-slate-500 transition hover:text-slate-700 dark:text-slate-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="relative flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4 dark:bg-slate-900">
        {messages.length === 0 && (
          <div className="text-center">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
              Waiting to connect...
            </span>
          </div>
        )}
        {messages.map((m) => {
          if (m.sender === 'System') {
            return (
              <div key={m.id} className="text-center">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                  {m.text}
                </span>
              </div>
            );
          }
          const isMe = m.sender === 'You';
          const isPartner = !isMe;
          return (
            <div
              key={m.id}
              className={`relative flex max-w-[85%] flex-col ${isMe ? 'items-end self-end' : 'items-start'}`}
              onClick={() => handleMsgClick(m.id, isPartner)}
            >
              <div
                className={`p-3 text-sm leading-relaxed cursor-pointer select-none ${
                  isMe
                    ? 'rounded-[12px] rounded-tr-sm bg-blue-600 text-white shadow-sm'
                    : 'rounded-[12px] rounded-tl-sm border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                {m.text}
              </div>
              {m.reaction && (
                <span className="mt-0.5 text-base leading-none">{m.reaction}</span>
              )}
              <span className="mx-1 mt-1 text-[10px] text-slate-500 dark:text-slate-500">{m.time}</span>

              {reactionTarget === m.id && (
                <div className={`absolute z-10 flex gap-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${isMe ? 'right-0 bottom-full mb-1' : 'left-0 bottom-full mb-1'}`}>
                  {QUICK_EMOJIS.map((e) => (
                    <button
                      key={e}
                      onClick={(ev) => { ev.stopPropagation(); sendReaction(e); }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg transition hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {partnerTyping && (
          <div className="flex items-start">
            <div className="flex items-center gap-1 rounded-[12px] rounded-tl-sm border border-slate-200 bg-white px-3 py-2.5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-none border-t border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <div className="relative">
          <input
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={matched ? 'Type a message...' : 'Waiting for a match...'}
            disabled={!matched}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-white dark:placeholder:text-slate-500"
          />
          <button
            onClick={send}
            disabled={!matched}
            aria-label="Send Message"
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
          </button>
        </div>
        {matched && (
          <p className="mt-1.5 text-center text-[10px] text-slate-400 dark:text-slate-500">
            Double-tap a message to react
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-none gap-2 border-t border-slate-200 bg-slate-100 p-4 dark:border-slate-700 dark:bg-slate-900">
        <button
          onClick={onStop}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <span className="material-symbols-outlined text-[18px]">block</span>
          Stop
        </button>
        <button
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          Next
          <span className="material-symbols-outlined text-[18px]">skip_next</span>
        </button>
      </div>
    </aside>
  );
}
