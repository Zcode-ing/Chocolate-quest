import { createHash, timingSafeEqual } from 'node:crypto';
import fs from 'node:fs';
import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '3000';
const port = Number(rawPort) || 3000;
const basePath = process.env.BASE_PATH || '/';

function apiServerPlugin(): Plugin {
  const failedAttempts = new Map<string, { count: number; resetAt: number }>();
  const ATTEMPT_WINDOW_MS = 5 * 60 * 1000;
  const MAX_FAILED_ATTEMPTS = 5;
  const LOCKOUT_MS = 5 * 60 * 1000;
  const offlineDir = path.resolve(import.meta.dirname, '..', '..', 'dist-offline');

  function digest(value: string): Buffer {
    return createHash('sha256').update(value, 'utf8').digest();
  }

  const mimeMap: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.txt': 'text/plain; charset=utf-8',
  };

  const handler = (req: any, res: any, next: any) => {
    const url = req.url?.split('?')[0] || '';
    if (url.startsWith('/dist-offline')) {
      const subPath = url.replace(/^\/dist-offline\/?/, '') || 'index.html';
      const targetPath = path.resolve(offlineDir, subPath);
      if (targetPath.startsWith(offlineDir) && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        const ext = path.extname(targetPath).toLowerCase();
        res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
        res.end(fs.readFileSync(targetPath));
        return;
      }
    }
    if (url === '/api/healthz' && req.method === 'GET') {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    if (url === '/api/developer/verify' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        res.setHeader('Content-Type', 'application/json');
        try {
          const data = JSON.parse(body || '{}');
          if (typeof data.accessCode !== 'string' || data.accessCode.trim().length < 8) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid developer access request.' }));
            return;
          }
          const expectedCode = process.env.CHOCOLATE_QUEST_DEV_ACCESS_CODE;
          if (!expectedCode) {
            res.statusCode = 503;
            res.end(JSON.stringify({ error: 'Developer access is not configured.' }));
            return;
          }
          const address = req.socket?.remoteAddress || 'unknown';
          const now = Date.now();
          const prior = failedAttempts.get(address);
          if (prior && prior.resetAt > now && prior.count >= MAX_FAILED_ATTEMPTS) {
            res.statusCode = 429;
            res.end(JSON.stringify({ error: 'Too many attempts. Try again in a few minutes.' }));
            return;
          }
          if (prior && prior.resetAt <= now) failedAttempts.delete(address);
          const verified = timingSafeEqual(digest(data.accessCode), digest(expectedCode));
          if (verified) {
            failedAttempts.delete(address);
            res.end(JSON.stringify({ verified: true }));
            return;
          }
          const current = failedAttempts.get(address);
          const nextAttempt =
            current && current.resetAt > now
              ? { count: current.count + 1, resetAt: current.resetAt }
              : { count: 1, resetAt: now + ATTEMPT_WINDOW_MS };
          if (nextAttempt.count >= MAX_FAILED_ATTEMPTS) {
            nextAttempt.resetAt = now + LOCKOUT_MS;
          }
          failedAttempts.set(address, nextAttempt);
          res.end(JSON.stringify({ verified: false }));
        } catch {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Invalid developer access request.' }));
        }
      });
      return;
    }
    next();
  };

  return {
    name: 'chocolate-quest-api-middleware',
    configureServer(server) {
      server.middlewares.use(handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    apiServerPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
