import http from 'http';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './src/server/app';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Production / Dev handling with Vite
async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const isHttps = process.env.APP_URL?.startsWith('https://');
    const clientPort = isHttps ? 443 : 3000;

    const wsConfig = {
      server: httpServer,
      clientPort: clientPort,
    };

    // Mount Vite dev server middleware with attached HTTP server for HMR WebSockets
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: wsConfig,
        hmr: wsConfig,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Dhu Raydan Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
