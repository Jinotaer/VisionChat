const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// In-memory fallback store
const memSessions = new Map();

// Optional Redis — activated when REDIS_URL is set
let redis = null;
if (process.env.REDIS_URL) {
  try {
    const Redis = require('ioredis');
    redis = new Redis(process.env.REDIS_URL);
    redis.on('connect', () => console.log('Redis connected for sessions'));
    redis.on('error', (err) => console.warn('Redis error:', err.message));
  } catch {
    console.warn('ioredis not found — falling back to in-memory sessions');
  }
}

const SESSION_TTL_S = 86400; // 24 h in seconds

async function setSession(id, user) {
  if (redis) {
    await redis.setex(id, SESSION_TTL_S, JSON.stringify(user));
  } else {
    memSessions.set(id, user);
    const t = setTimeout(() => memSessions.delete(id), SESSION_TTL_S * 1000);
    t.unref();
  }
}

async function getSession(id) {
  if (redis) {
    const raw = await redis.get(id);
    return raw ? JSON.parse(raw) : null;
  }
  return memSessions.get(id) ?? null;
}

async function deleteSession(id) {
  if (redis) {
    await redis.del(id);
  } else {
    memSessions.delete(id);
  }
}

async function googleLogin(req, res) {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Missing credential' });

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
    };
    const sessionId = crypto.randomUUID();
    await setSession(sessionId, user);
    res.json({ sessionId, user });
  } catch {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
}

async function logout(req, res) {
  const { sessionId } = req.body;
  if (sessionId) await deleteSession(sessionId);
  res.json({ ok: true });
}

async function getMe(req, res) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const user = await getSession(sessionId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user });
}

module.exports = { googleLogin, logout, getMe, getSession };
