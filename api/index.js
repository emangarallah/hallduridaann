import app from '../src/server/app.js';

// Vercel Serverless Function entry point
export default function handler(req, res) {
  // Restore original request path if modified by edge rewrites or proxies
  const original =
    req.headers['x-matched-path'] ||
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'];

  if (typeof original === 'string' && original.startsWith('/api') && (req.url === '/api' || req.url === '/' || !req.url)) {
    req.url = original;
  } else if (req.query && req.query.__path) {
    const subpath = Array.isArray(req.query.__path) ? req.query.__path.join('/') : req.query.__path;
    req.url = `/api/${subpath}`;
  }

  return app(req, res);
}
