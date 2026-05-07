import { useState, useRef, useEffect } from 'react';

export default function TextChat({ messages = [], onSend, onNext, onStop, onLogout, displayName, partnerName = 'Stranger', matched = false }) {
  const [input, setInput] = useState('');
  const bottomRef = useRef();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput('');
  };

  return (
    <aside className="flex h-[60vh] w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0px_4px_16px_rgba(0,0,0,0.08)] md:h-full md:flex-none md:w-80 lg:w-96">
      <div className="flex min-w-0 flex-none items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="shrink-0 text-[16px] font-semibold text-slate-900">Chat</h3>
          {displayName && (
            <span className="truncate text-[13px] text-slate-400">as {displayName}</span>
          )}
          {partnerName !== 'Stranger' && (
            <span className="truncate text-[13px] font-medium text-blue-500">with {partnerName}</span>
          )}
        </div>
        {onLogout && (
          <button
            onClick={onLogout}
            title="Sign out"
            className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-slate-50 p-4">
        {messages.length === 0 && (
          <div className="text-center">
            <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
              Waiting to connect...
            </span>
          </div>
        )}
        {messages.map((m, i) => {
          if (m.sender === 'System') {
            return (
              <div key={i} className="text-center">
                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600">
                  {m.text}
                </span>
              </div>
            );
          }

          const isMe = m.sender === 'You';
          return (
            <div
              key={i}
              className={`flex max-w-[85%] flex-col ${
                isMe ? 'items-end self-end' : 'items-start'
              }`}
            >
              <div
                className={`p-3 text-sm leading-relaxed ${
                  isMe
                    ? 'rounded-[12px] rounded-tr-sm bg-blue-600 text-white shadow-sm'
                    : 'rounded-[12px] rounded-tl-sm border border-slate-200 bg-white text-slate-700'
                }`}
              >
                {m.text}
              </div>
              <span className="mx-1 mt-1 text-[10px] text-slate-500">
                {m.time || ''}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-none border-t border-slate-200 bg-white p-4">
        <div className="relative">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={matched ? 'Type a message...' : 'Waiting for a match...'}
            disabled={!matched}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 py-2 pl-3 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={!matched}
            aria-label="Send Message"
            className="absolute top-1/2 right-2 -translate-y-1/2 p-1 text-blue-600 transition-colors hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              send
            </span>
          </button>
        </div>
      </div>

      <div className="flex flex-none gap-2 border-t border-slate-200 bg-slate-100 p-4">
        <button
          onClick={onStop}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">block</span>
          Stop
        </button>
        <button
          onClick={onNext}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 cursor-pointer"
        >
          Next
          <span className="material-symbols-outlined text-[18px]">
            skip_next
          </span>
        </button>
      </div>
    </aside>
  );
}
