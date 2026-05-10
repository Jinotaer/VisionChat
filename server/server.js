const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { sessions, getSession } = require('./controller/loginController');
const { registerChatHandlers } = require('./controller/chatController');
const authRoutes = require('./routes/authRoutes');
const { authLimiter } = require('./middleware/rateLimiter');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

// Exposes TURN credentials to the client without baking them into the bundle
const FREE_STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
  { urls: 'stun:openrelay.metered.ca:80' },
];

// OpenRelay — free public TURN, no account needed
const OPENRELAY_SERVERS = [
  { urls: 'turn:openrelay.metered.ca:80',               username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443',              username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turn:openrelay.metered.ca:443?transport=tcp',username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: 'turns:openrelay.metered.ca:443?transport=tcp',username: 'openrelayproject', credential: 'openrelayproject' },
];

app.get('/api/turn-config', (req, res) => {
  const iceServers = [...FREE_STUN_SERVERS, ...OPENRELAY_SERVERS];
  const u = process.env.TURN_USERNAME || '';
  const c = process.env.TURN_CREDENTIAL || '';
  const host = process.env.TURN_HOST;

  if (host && u && c) {
    iceServers.push(
      { urls: `turn:${host}:80`,                     username: u, credential: c },
      { urls: `turn:${host}:80?transport=tcp`,        username: u, credential: c },
      { urls: `turn:${host}:443?transport=tcp`,       username: u, credential: c },
      { urls: `turns:${host}:443?transport=tcp`,      username: u, credential: c },
    );
  }

  res.json({ iceServers });
});

app.use('/api/auth', authLimiter, authRoutes);

io.use(async (socket, next) => {
  const { sessionId } = socket.handshake.auth;
  const user = await getSession(sessionId);
  if (!user) return next(new Error('auth_failed'));
  socket.user = user;
  next();
});

io.on('connection', (socket) => {
  registerChatHandlers(io, socket);
});

async function init() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.warn('MongoDB connection skipped:', err.message);
  }

  server.listen(process.env.PORT || 5000, () =>
    console.log(`Server running on port ${process.env.PORT || 5000}`)
  );
}

init().catch(console.error);
