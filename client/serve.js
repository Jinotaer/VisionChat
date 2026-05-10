import express from 'express';
import { createServer } from 'http';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);

const BACKEND = process.env.BACKEND_URL || 'http://server:5000';
const PORT = process.env.PORT || 3000;

const proxy = createProxyMiddleware({ target: BACKEND, changeOrigin: true, ws: true });

app.use((_req, res, next) => {
  // Google sign-in popups break under a strict COOP policy.
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  next();
});

app.use((req, res, next) => {
  if (
    req.url.startsWith('/api') ||
    req.url.startsWith('/socket.io') ||
    req.url === '/health'
  ) {
    return proxy(req, res, next);
  }
  next();
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

server.on('upgrade', proxy.upgrade);

server.listen(PORT, () =>
  console.log(`Client server running on port ${PORT}`)
);
