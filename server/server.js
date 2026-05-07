const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const { sessions } = require('./controller/loginController');
const { registerChatHandlers } = require('./controller/chatController');
const authRoutes = require('./routes/authRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
  transports: ['websocket'],
  pingTimeout: 20000,
  pingInterval: 10000,
});

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
);

app.use('/api/auth', authRoutes);

io.use((socket, next) => {
  const { sessionId } = socket.handshake.auth;
  const user = sessions.get(sessionId);
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
