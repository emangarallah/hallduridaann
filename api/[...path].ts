import app from '../src/server/app';

// Vercel Serverless Function Catch-All for /api/*
export default function handler(req: any, res: any) {
  // Ensure req.url matches the actual API path requested
  const original =
    req.headers['x-matched-path'] ||
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'];

  if (typeof original === 'string' && original.startsWith('/api') && (req.url === '/api' || req.url === '/' || !req.url)) {
    req.url = original;
  } else if (req.query && req.query.path) {
    const subpath = Array.isArray(req.query.path) ? req.query.path.join('/') : req.query.path;
    req.url = `/api/${subpath}`;
  }

  return app(req, res);
}
