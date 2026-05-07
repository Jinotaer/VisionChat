import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import VideoChat from '../components/videoChat';
import TextChat from '../components/textChat';

const ICE_CONFIG = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

const SOCKET_SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (import.meta.env.DEV ? 'http://localhost:5000' : window.location.origin);

function timestamp() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function Chat() {
  const location = useLocation();
  const [messages, setMessages] = useState([]);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [started, setStarted] = useState(false);
  const [partnerName, setPartnerName] = useState('Stranger');
  const [matched, setMatched] = useState(false);
  const pc = useRef(null);
  const socket = useRef(null);
  const streamRef = useRef(null);
  const partnerNameRef = useRef('Stranger');
  const autoStartedRef = useRef(false);
  const navigate = useNavigate();

  const auth = JSON.parse(localStorage.getItem('auth') || '{}');
  const displayName = auth.name || 'User';

  const addMessage = (sender, text) =>
    setMessages((prev) => [...prev, { sender, text, time: timestamp() }]);

  useEffect(() => {
    const s = io(SOCKET_SERVER_URL, {
      auth: { sessionId: auth.sessionId },
      transports: ['websocket'],
    });
    socket.current = s;

    s.on('connect_error', (err) => {
      if (err.message === 'auth_failed') {
        localStorage.removeItem('auth');
        navigate('/');
      }
    });

    s.on('matched', async ({ initiator, partnerName: name }) => {
      partnerNameRef.current = name || 'Stranger';
      setPartnerName(name || 'Stranger');
      setMatched(true);
      addMessage('System', `You are now connected with ${name || 'a stranger'}. Say hi!`);

      pc.current = new RTCPeerConnection(ICE_CONFIG);
      pc.current.onicecandidate = (e) => {
        if (e.candidate) s.emit('ice-candidate', e.candidate);
      };
      pc.current.ontrack = (e) => setRemoteStream(e.streams[0]);
      streamRef.current?.getTracks().forEach((t) =>
        pc.current.addTrack(t, streamRef.current)
      );

      if (initiator) {
        const offer = await pc.current.createOffer();
        await pc.current.setLocalDescription(offer);
        s.emit('offer', offer);
      }
    });

    s.on('offer', async (offer) => {
      pc.current = new RTCPeerConnection(ICE_CONFIG);
      pc.current.onicecandidate = (e) => {
        if (e.candidate) s.emit('ice-candidate', e.candidate);
      };
      pc.current.ontrack = (e) => setRemoteStream(e.streams[0]);
      streamRef.current?.getTracks().forEach((t) =>
        pc.current.addTrack(t, streamRef.current)
      );
      await pc.current.setRemoteDescription(offer);
      const answer = await pc.current.createAnswer();
      await pc.current.setLocalDescription(answer);
      s.emit('answer', answer);
    });

    s.on('answer', (answer) => pc.current?.setRemoteDescription(answer));
    s.on('ice-candidate', (c) => pc.current?.addIceCandidate(c));
    s.on('message', (msg) => addMessage(partnerNameRef.current, msg));
    s.on('partner-disconnected', () => {
      addMessage('System', `${partnerNameRef.current} has left the chat.`);
      setPartnerName('Stranger');
      partnerNameRef.current = 'Stranger';
      setMatched(false);
      setRemoteStream(null);
    });

    return () => {
      s.disconnect();
      pc.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const initCamera = async () => {
    if (started) return;
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });
    streamRef.current = stream;
    setLocalStream(stream);
    setStarted(true);
  };

  const startChat = async () => {
    await initCamera();
    pc.current?.close();
    setRemoteStream(null);
    setMessages([]);
    setMatched(false);
    socket.current?.emit('next');
  };

  const handleNext = async () => {
    await startChat();
  };

  useEffect(() => {
    if (!location.state?.autoStart || autoStartedRef.current) return;

    autoStartedRef.current = true;
    startChat().catch((err) => {
      console.error('Failed to start chat automatically:', err);
    });
  }, [location.state]);

  const handleStop = () => {
    pc.current?.close();
    socket.current?.disconnect();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    navigate('/welcome');
  };

  const sendMessage = (text) => {
    socket.current?.emit('message', text);
    addMessage('You', text);
  };

  return (
    <div className="flex w-full flex-col gap-3 bg-slate-50 p-3 sm:gap-5 sm:p-4 md:h-dvh md:overflow-hidden md:flex-row md:p-5">
      <VideoChat
        localStream={localStream}
        remoteStream={remoteStream}
        onEndCall={handleStop}
      />
      <TextChat
        messages={messages}
        onSend={sendMessage}
        onNext={handleNext}
        onStop={handleStop}
        displayName={displayName}
        partnerName={partnerName}
        matched={matched}
      />
    </div>
  );
}
