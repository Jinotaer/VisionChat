import { useEffect, useRef, useState } from 'react';

const QUALITY_BARS = {
  excellent: { bars: 3, color: 'text-emerald-500', label: 'Excellent' },
  good:      { bars: 2, color: 'text-amber-500',   label: 'Good' },
  poor:      { bars: 1, color: 'text-red-500',      label: 'Poor' },
};

function QualityIcon({ quality }) {
  if (!quality) return null;
  const { bars, color, label } = QUALITY_BARS[quality] ?? QUALITY_BARS.poor;
  return (
    <div title={`Connection: ${label}`} className={`flex items-end gap-[2px] ${color}`}>
      {[1, 2, 3].map((b) => (
        <span
          key={b}
          className={`w-1 rounded-sm transition-all ${b <= bars ? 'opacity-100' : 'opacity-25'}`}
          style={{ height: b * 5 + 4, background: 'currentColor' }}
        />
      ))}
    </div>
  );
}

function CamOffPlaceholder({ size = 28 }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black">
      <span className="material-symbols-outlined text-slate-500" style={{ fontSize: size }}>
        videocam_off
      </span>
    </div>
  );
}

function ControlBtn({ onClick, active, activeColor = 'bg-amber-100 text-amber-700 hover:bg-amber-200', inactiveColor = 'bg-slate-100 text-slate-700 hover:bg-slate-200', label, icon, size = 11 }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex items-center justify-center rounded-full transition-colors cursor-pointer ${active ? activeColor : inactiveColor}`}
      style={{ width: size * 4, height: size * 4 }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: size * 2, fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
    </button>
  );
}

export default function VideoChat({
  localStream,
  remoteStream,
  cameraError,
  onRetryCamera,
  voiceOnly = false,
  isScreenSharing = false,
  onToggleScreenShare,
  blurOn = false,
  onToggleBlur,
  quality,
  matched,
}) {
  const localSmRef = useRef();
  const localPiPRef = useRef();
  const remoteRef = useRef();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  useEffect(() => {
    if (localSmRef.current) localSmRef.current.srcObject = localStream ?? null;
    if (localPiPRef.current) localPiPRef.current.srcObject = localStream ?? null;
  }, [localStream]);

  useEffect(() => {
    if (remoteRef.current) remoteRef.current.srcObject = remoteStream ?? null;
  }, [remoteStream]);

  const toggleMic = () => {
    localStream?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicOn((p) => !p);
  };

  const toggleCam = () => {
    localStream?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamOn((p) => !p);
  };

  const controls = (large) => (
    <div className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white/92 p-${large ? 2 : 1.5} shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/90`}>
      <ControlBtn onClick={toggleMic} active={!micOn} label={micOn ? 'Mute' : 'Unmute'} icon={micOn ? 'mic' : 'mic_off'} size={large ? 11 : 9} />
      {!voiceOnly && (
        <ControlBtn onClick={toggleCam} active={!camOn} label={camOn ? 'Camera off' : 'Camera on'} icon={camOn ? 'videocam' : 'videocam_off'} size={large ? 11 : 9} />
      )}
      {!voiceOnly && onToggleBlur && (
        <ControlBtn onClick={onToggleBlur} active={blurOn} activeColor="bg-blue-100 text-blue-700 hover:bg-blue-200" label={blurOn ? 'Disable blur' : 'Blur background'} icon="blur_on" size={large ? 11 : 9} />
      )}
      {onToggleScreenShare && (
        <ControlBtn onClick={onToggleScreenShare} active={isScreenSharing} activeColor="bg-blue-100 text-blue-700 hover:bg-blue-200" label={isScreenSharing ? 'Stop sharing' : 'Share screen'} icon={isScreenSharing ? 'cancel_presentation' : 'present_to_all'} size={large ? 11 : 9} />
      )}
    </div>
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-2 md:flex-1">

      {/* Main video — remote */}
      <section className="relative h-[50vw] overflow-hidden rounded-xl border border-slate-200 bg-black shadow-[0_24px_60px_rgba(15,23,42,0.12)] dark:border-slate-700 md:h-auto md:flex-1 md:min-h-0 lg:min-h-105">
        {remoteStream ? (
          <video ref={remoteRef} autoPlay playsInline className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-slate-50 dark:bg-slate-900" />
            <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />
            <div className="relative flex h-full w-full flex-col items-center justify-center px-6 text-center">
              {cameraError ? (
                <>
                  <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[28px] border border-red-100 bg-white/90 shadow-[0_16px_40px_rgba(239,68,68,0.12)] backdrop-blur-sm dark:bg-slate-800/90 sm:mt-5">
                    <span className="material-symbols-outlined text-[48px] text-red-500">videocam_off</span>
                  </div>
                  <h3 className="mt-2 text-[1.4rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">Camera unavailable</h3>
                  <p className="mt-3 max-w-sm text-sm leading-7 text-slate-500 dark:text-slate-400">{cameraError}</p>
                  <button
                    onClick={onRetryCamera}
                    className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Try again
                  </button>
                </>
              ) : (
                <>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] border border-blue-100 bg-white/90 shadow-[0_16px_40px_rgba(59,130,246,0.12)] backdrop-blur-sm dark:bg-slate-800/90 md:mb-5 md:h-24 md:w-24 md:rounded-[28px]">
                    <span className="material-symbols-outlined text-[32px] text-blue-600 md:text-[48px]">
                      {voiceOnly ? 'mic' : 'person'}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-blue-700 dark:bg-slate-800/80">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.45)]" />
                    Searching
                  </div>
                  <h3 className="mt-3 text-[1.1rem] font-semibold tracking-[-0.04em] text-slate-900 dark:text-white md:mt-5 md:text-[1.6rem]">
                    Waiting for a stranger
                  </h3>
                  <p className="mt-2 hidden max-w-md text-sm leading-7 text-slate-600 dark:text-slate-400 md:block">
                    When someone joins, {voiceOnly ? "you'll be connected by voice." : 'their video will appear here.'}
                  </p>
                </>
              )}
            </div>
          </>
        )}

        {matched && quality && (
          <div className="absolute left-4 top-4 z-20">
            <QualityIcon quality={quality} />
          </div>
        )}

        {isScreenSharing && (
          <div className="absolute left-1/2 top-4 z-20 -translate-x-1/2 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-[11px] font-semibold text-white shadow">
            <span className="material-symbols-outlined text-[14px]">present_to_all</span>
            Sharing screen
          </div>
        )}

        {!voiceOnly && (
          <div className="hidden lg:block absolute right-5 top-5 z-20 aspect-video w-52 overflow-hidden rounded-2xl border border-white/70 bg-black shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
            <video ref={localPiPRef} autoPlay playsInline muted className={`h-full w-full scale-x-[-1] object-cover ${localStream && camOn ? '' : 'invisible'}`} />
            {(!localStream || !camOn) && <CamOffPlaceholder size={28} />}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/70 to-transparent px-3 pb-3 pt-7">
              <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">You</span>
            </div>
          </div>
        )}

        <div className="hidden lg:flex absolute bottom-5 left-1/2 z-20 -translate-x-1/2">
          {controls(true)}
        </div>
      </section>

      {/* Local preview — small + tablet */}
      <div className="lg:hidden relative h-48 md:h-auto md:flex-1 overflow-hidden rounded-xl border border-slate-200 bg-black shadow-[0_4px_16px_rgba(15,23,42,0.10)] dark:border-slate-700">
        {voiceOnly ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-900">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-[48px] text-slate-500">mic</span>
              <span className="text-xs font-medium uppercase tracking-widest text-slate-500">Voice only</span>
            </div>
          </div>
        ) : (
          <>
            <video ref={localSmRef} autoPlay playsInline muted className={`h-full w-full scale-x-[-1] object-cover ${localStream && camOn ? '' : 'invisible'}`} />
            {(!localStream || !camOn) && <CamOffPlaceholder size={24} />}
          </>
        )}
        <div className="pointer-events-none absolute left-3 bottom-2">
          <span className="rounded-full border border-white/40 bg-white/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white">You</span>
        </div>
        {/* Tablet: controls inside video */}
        <div className="hidden md:block absolute bottom-3 right-3 z-20">
          {controls(false)}
        </div>
      </div>

      {/* Mobile: controls below video, not overlapping */}
      <div className="flex md:hidden justify-center">
        {controls(false)}
      </div>

    </div>
  );
}
