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

const socketProxy = createProxyMiddleware({
  target: BACKEND,
  changeOrigin: true,
  ws: true,
  pathFilter: '/socket.io/**',
});

const backendProxy = createProxyMiddleware({
  target: BACKEND,
  changeOrigin: true,
  pathFilter: ['/api/**', '/health'],
});

app.use(backendProxy);
app.use(socketProxy);

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

server.on('upgrade', socketProxy.upgrade);

server.listen(PORT, () =>
  console.log(`Client server running on port ${PORT}`)
);
