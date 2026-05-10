import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoChat from '../components/videoChat';
import TextChat from '../components/textChat';

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

let msgIdCounter = 0;

function timestamp() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function buildPeerConnection(iceServers, socketInstance, onRemoteStream) {
  const conn = new RTCPeerConnection({ iceServers });
  conn.onicecandidate = (e) => {
    if (e.candidate) socketInstance.emit('ice-candidate', e.candidate);
  };
  conn.ontrack = (e) => onRemoteStream(e.streams[0]);
  return conn;
}

function createBlurredStream(sourceStream) {
  const tmpVideo = document.createElement('video');
  tmpVideo.srcObject = sourceStream;
  tmpVideo.muted = true;
  tmpVideo.play();

  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let animFrame;
  const draw = () => {
    if (tmpVideo.readyState >= 2) {
      ctx.filter = 'blur(16px)';
      ctx.drawImage(tmpVideo, -24, -24, canvas.width + 48, canvas.height + 48);
    }
    animFrame = requestAnimationFrame(draw);
  };
  draw();

  return {
    stream: canvas.captureStream(30),
    stop: () => {
      cancelAnimationFrame(animFrame);
      tmpVideo.srcObject = null;
    },
  };
}

export default function Chat() {
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [partnerName, setPartnerName] = useState('Stranger');
  const [matched, setMatched] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [onlineCount, setOnlineCount] = useState(null);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [blurOn, setBlurOn] = useState(false);
  const [quality, setQuality] = useState(null); // 'excellent' | 'good' | 'poor'
  const [reconnecting, setReconnecting] = useState(false);

  const pc = useRef(null);
  const socket = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const blurHandleRef = useRef(null);
  const iceServersRef = useRef([{ urls: 'stun:stun.l.google.com:19302' }]);
  const cameraStartedRef = useRef(false);
  const partnerNameRef = useRef('Stranger');
  const autoStartedRef = useRef(false);
  const isTypingRef = useRef(false);
  const typingTimerRef = useRef(null);
  const qualityTimerRef = useRef(null);

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const displayName = auth.name || 'User';
  const gender = localStorage.getItem('gender') || 'any';
  const lookingFor = localStorage.getItem('lookingFor') || 'any';
  const voiceOnly = localStorage.getItem('voiceOnly') === 'true';
  const tags = (() => { try { return JSON.parse(localStorage.getItem('tags') || '[]'); } catch { return []; } })();

  const addMessage = (sender, text, extra = {}) =>
    setMessages((prev) => [...prev, { id: ++msgIdCounter, sender, text, time: timestamp(), ...extra }]);

  useEffect(() => {
    fetch('/api/turn-config')
      .then((r) => r.json())
      .then((data) => { if (data.iceServers) iceServersRef.current = data.iceServers; })
      .catch(() => {
        iceServersRef.current = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun.cloudflare.com:3478' },
          { urls: 'stun:stun.stunprotocol.org:3478' },
        ];
      });
  }, []);

  useEffect(() => {
    if (!matched || !pc.current) return;
    qualityTimerRef.current = setInterval(async () => {
      if (!pc.current) return;
      try {
        const stats = await pc.current.getStats();
        stats.forEach((r) => {
          if (r.type === 'inbound-rtp' && r.kind === 'video') {
            const total = (r.packetsReceived || 0) + (r.packetsLost || 0);
            const loss = total > 0 ? r.packetsLost / total : 0;
            const jitter = r.jitter || 0;
            if (loss < 0.02 && jitter < 0.03) setQuality('excellent');
            else if (loss < 0.1 && jitter < 0.1) setQuality('good');
            else setQuality('poor');
          }
        });
      } catch {}
    }, 3000);
    return () => clearInterval(qualityTimerRef.current);
  }, [matched]);

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      auth: { sessionId: auth.sessionId },
      reconnection: true,
      reconnectionAttempts: 6,
      reconnectionDelay: 1000,
    });
    socket.current = s;

    s.on('connect', () => setReconnecting(false));
    s.on('reconnecting', () => setReconnecting(true));
    s.on('reconnect', () => setReconnecting(false));

    s.on('connect_error', (err) => {
      if (err.message === 'auth_failed') {
        localStorage.removeItem('auth');
        navigate('/');
      }
    });

    s.on('online-count', setOnlineCount);

    s.on('matched', async ({ initiator, partnerName: name, sharedTags }) => {
      partnerNameRef.current = name || 'Stranger';
      setPartnerName(name || 'Stranger');
      setMatched(true);
      setPartnerTyping(false);
      setQuality(null);
      const tagLine = sharedTags?.length ? ` You both like: ${sharedTags.join(', ')}.` : '';
      addMessage('System', `Connected with ${name || 'a stranger'}. Say hi!${tagLine}`);

      pc.current = buildPeerConnection(iceServersRef.current, s, setRemoteStream);
      streamRef.current?.getTracks().forEach((t) => pc.current.addTrack(t, streamRef.current));

      if (initiator) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        s.emit('offer', offer);
      }
    });

    s.on('offer', async (offer) => {
      pc.current = buildPeerConnection(iceServersRef.current, s, setRemoteStream);
      streamRef.current?.getTracks().forEach((t) => pc.current.addTrack(t, streamRef.current));
      await pc.current.setRemoteDescription(offer);
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      s.emit('answer', answer);
    });

    s.on('answer', (answer) => pc.current?.setRemoteDescription(answer));
    s.on('ice-candidate', (c) => pc.current?.addIceCandidate(c));

    s.on('message', ({ text, id }) => addMessage(partnerNameRef.current, text, { remoteId: id }));
    s.on('partner-typing', setPartnerTyping);
    s.on('reaction', ({ emoji, msgId }) =>
      setMessages((prev) =>
        prev.map((m) => (m.remoteId === msgId ? { ...m, reaction: emoji } : m))
      )
    );

    s.on('partner-disconnected', () => {
      addMessage('System', `${partnerNameRef.current} has left the chat.`);
      setPartnerName('Stranger');
      partnerNameRef.current = 'Stranger';
      setMatched(false);
      setRemoteStream(null);
      setPartnerTyping(false);
      setQuality(null);
    });

    return () => {
      s.disconnect();
      pc.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      blurHandleRef.current?.stop();
      clearTimeout(typingTimerRef.current);
      clearInterval(qualityTimerRef.current);
    };
  }, []);

  const initCamera = async () => {
    if (cameraStartedRef.current) return true;
    try {
      const constraints = voiceOnly ? { audio: true } : { video: true, audio: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setLocalStream(stream);
      cameraStartedRef.current = true;
      setCameraError(null);
      return true;
    } catch (err) {
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Please allow it in your browser settings and try again.'
          : `Could not access camera: ${err.message}`
      );
      return false;
    }
  };

  const startChat = async () => {
    const ok = await initCamera();
    if (!ok) return;
    pc.current?.close();
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);
    setRemoteStream(null);
    setMessages([]);
    setMatched(false);
    setPartnerTyping(false);
    setQuality(null);
    socket.current?.emit('next', { gender, lookingFor, tags });
  };

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsScreenSharing(false);
      const camTrack = streamRef.current?.getVideoTracks()[0];
      const sender = pc.current?.getSenders().find((s) => s.track?.kind === 'video');
      if (camTrack) sender?.replaceTrack(camTrack);
      setLocalStream(blurHandleRef.current ? blurHandleRef.current.stream : streamRef.current);
    } else {
      try {
        const screen = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
        screenStreamRef.current = screen;
        setIsScreenSharing(true);
        setLocalStream(screen);
        const sender = pc.current?.getSenders().find((s) => s.track?.kind === 'video');
        sender?.replaceTrack(screen.getVideoTracks()[0]);
        screen.getVideoTracks()[0].onended = () => toggleScreenShare();
      } catch {}
    }
  }, [isScreenSharing, blurHandleRef, streamRef, pc]);

  const toggleBlur = useCallback(() => {
    if (blurOn) {
      blurHandleRef.current?.stop();
      blurHandleRef.current = null;
      setBlurOn(false);
      setLocalStream(streamRef.current);
      const sender = pc.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(streamRef.current?.getVideoTracks()[0]);
    } else {
      if (!streamRef.current) return;
      const handle = createBlurredStream(streamRef.current);
      blurHandleRef.current = handle;
      setBlurOn(true);
      setLocalStream(handle.stream);
      const sender = pc.current?.getSenders().find((s) => s.track?.kind === 'video');
      sender?.replaceTrack(handle.stream.getVideoTracks()[0]);
    }
  }, [blurOn, streamRef, pc]);

  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.current?.emit('typing', true);
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      socket.current?.emit('typing', false);
    }, 1500);
  };

  useEffect(() => {
    if (!location.state?.autoStart || autoStartedRef.current) return;
    autoStartedRef.current = true;
    startChat().catch(console.error);
  }, [location.state]);

  const handleStop = () => {
    pc.current?.close();
    socket.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    blurHandleRef.current?.stop();
    navigate('/welcome');
  };

  const handleLogout = () => {
    pc.current?.close();
    socket.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    blurHandleRef.current?.stop();
    localStorage.removeItem('auth');
    localStorage.removeItem('gender');
    localStorage.removeItem('lookingFor');
    localStorage.removeItem('voiceOnly');
    localStorage.removeItem('tags');
    navigate('/');
  };

  const sendMessage = (text) => {
    const id = ++msgIdCounter;
    socket.current?.emit('message', { text, id });
    setMessages((prev) => [...prev, { id, sender: 'You', text, time: timestamp() }]);
    isTypingRef.current = false;
    clearTimeout(typingTimerRef.current);
    socket.current?.emit('typing', false);
  };

  const sendReaction = (emoji, msgId) => {
    socket.current?.emit('reaction', { emoji, msgId });
  };

  const sendReport = (reason) => {
    socket.current?.emit('report', { reason });
    addMessage('System', 'You reported this user. Finding a new match...');
  };

  return (
    <div className="flex w-full flex-col gap-3 bg-slate-50 p-3 dark:bg-slate-900 sm:gap-5 sm:p-4 md:h-dvh md:overflow-hidden md:flex-row md:p-5">
      {reconnecting && (
        <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 py-2 text-sm font-medium text-white">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          Reconnecting…
        </div>
      )}
      <VideoChat
        localStream={localStream}
        remoteStream={remoteStream}
        cameraError={cameraError}
        onRetryCamera={startChat}
        voiceOnly={voiceOnly}
        isScreenSharing={isScreenSharing}
        onToggleScreenShare={toggleScreenShare}
        blurOn={blurOn}
        onToggleBlur={toggleBlur}
        quality={quality}
        matched={matched}
      />
      <TextChat
        messages={messages}
        onSend={sendMessage}
        onNext={startChat}
        onStop={handleStop}
        onLogout={handleLogout}
        onTyping={handleTyping}
        onReaction={sendReaction}
        onReport={sendReport}
        displayName={displayName}
        partnerName={partnerName}
        partnerTyping={partnerTyping}
        matched={matched}
        onlineCount={onlineCount}
      />
    </div>
  );
}
