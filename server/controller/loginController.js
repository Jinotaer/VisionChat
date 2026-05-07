const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const sessions = new Map();

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
    sessions.set(sessionId, user);
    res.json({ sessionId, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid Google credential' });
  }
}

function logout(req, res) {
  const { sessionId } = req.body;
  if (sessionId) sessions.delete(sessionId);
  res.json({ ok: true });
}

function getMe(req, res) {
  const sessionId = req.headers['x-session-id'] || req.query.sessionId;
  const user = sessions.get(sessionId);
  if (!user) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ user });
}

module.exports = { googleLogin, logout, getMe, sessions };
