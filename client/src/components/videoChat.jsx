import { useEffect, useRef, useState } from 'react';

function CamOffPlaceholder({ size = 28 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <span className="material-symbols-outlined text-slate-500" style={{ fontSize: size }}>
        videocam_off
      </span>
    </div>
  );
}

export default function VideoChat({ localStream, remoteStream }) {
  const localSmRef = useRef();
  const localPiPRef = useRef();
  const remoteRef = useRef();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (localSmRef.current && localStream) localSmRef.current.srcObject = localStream;
    if (localPiPRef.current && localStream) localPiPRef.current.srcObject = localStream;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current && remoteStream) remoteRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((prev) => !prev);
  };

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((prev) => !prev);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 md:flex-1">

      {/* Main video area */}
      <section className="relative h-[50vh] overflow-hidden rounded-xl border border-slate-200 bg-black shadow-[0_24px_60px_rgba(15,23,42,0.12)] md:h-full md:flex-1 md:min-h-[420px]">
        {remoteStream ? (
          <video
            ref={remoteRef}
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-50" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border border-blue-100 bg-white/90 shadow-[0_16px_40px_rgba(59,130,246,0.12)] backdrop-blur-sm">
                <span className="material-symbols-outlined text-[48px] text-blue-600">person</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-blue-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]" />
                Searching
              </div>
              <h3 className="mt-5 text-[1.6rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[1.85rem]">
                Waiting for a stranger
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                When someone joins, their video will appear here.
              </p>
            </div>
          </>
        )}

        {/* PiP local preview — lg+ only */}
        <div className="hidden lg:block absolute right-5 top-5 z-20 aspect-3/4 w-36 overflow-hidden rounded-2xl border border-white/70 bg-black shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <video
            ref={localPiPRef}
            autoPlay
            playsInline
            muted
            className={`h-full w-full scale-x-[-1] object-cover ${localStream && camOn ? '' : 'invisible'}`}
          />
          {(!localStream || !camOn) && <CamOffPlaceholder size={28} />}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 pb-3 pt-7">
            <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
              You
            </span>
          </div>
        </div>

        {/* Controls — lg+ only, stays inside main video */}
        <div className="hidden lg:flex absolute bottom-5 left-1/2 z-20 -translate-x-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/92 p-2 shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur-md">
          <button
            onClick={toggleMic}
            aria-label="Toggle Mic"
            title={micOn ? 'Mute' : 'Unmute'}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
              micOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {micOn ? 'mic' : 'mic_off'}
            </span>
          </button>
          <button
            onClick={toggleCam}
            aria-label="Toggle Camera"
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors cursor-pointer ${
              camOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {camOn ? 'videocam' : 'videocam_off'}
            </span>
          </button>
        </div>
      </section>

      {/* Local preview below — small + tablet screens */}
      <div className="lg:hidden relative h-48 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-[0_4px_16px_rgba(15,23,42,0.10)]">
        <video
          ref={localSmRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full scale-x-[-1] object-cover ${localStream && camOn ? '' : 'invisible'}`}
        />
        {(!localStream || !camOn) && <CamOffPlaceholder size={24} />}

        {/* YOU label */}
        <div className="pointer-events-none absolute left-3 bottom-2">
          <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">
            You
          </span>
        </div>

        {/* Controls inside preview bar — small screens only */}
        <div className="absolute right-3 top-1/2 z-20 flex -translate-y-1/2 items-center gap-2 rounded-full border border-slate-200 bg-white/92 p-1.5 shadow-[0_4px_12px_rgba(15,23,42,0.16)] backdrop-blur-md">
          <button
            onClick={toggleMic}
            aria-label="Toggle Mic"
            title={micOn ? 'Mute' : 'Unmute'}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
              micOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {micOn ? 'mic' : 'mic_off'}
            </span>
          </button>
          <button
            onClick={toggleCam}
            aria-label="Toggle Camera"
            title={camOn ? 'Turn off camera' : 'Turn on camera'}
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors cursor-pointer ${
              camOn ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              {camOn ? 'videocam' : 'videocam_off'}
            </span>
          </button>
        </div>
      </div>

    </div>
  );
}
