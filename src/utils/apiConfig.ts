/**
 * API Configuration and Helper for Dhu Raydan Platform (قاعة ذو ريدان)
 * Handles production Vercel environments, custom domains, and development URLs seamlessly.
 */

export function getApiBaseUrl(): string {
  // Check Vite environment variable
  const rawUrl = (
    (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
    ''
  ).trim();

  // If in browser and on a remote domain (e.g. *.vercel.app, *.run.app), do NOT connect to localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const isRemote = hostname !== 'localhost' && hostname !== '127.0.0.1';

    if (isRemote && (rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1'))) {
      console.warn(
        '[Dhu Raydan API] Localhost URL detected on a remote domain (' +
          hostname +
          '). Using relative API URL to prevent connection failure.'
      );
      return '';
    }
  }

  // Remove trailing slashes
  return rawUrl ? rawUrl.replace(/\/+$/, '') : '';
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  let cleanPath = path.startsWith('/') ? path : `/${path}`;

  // If base already ends with /api and path starts with /api, avoid duplicate /api/api
  if (base.endsWith('/api') && cleanPath.startsWith('/api')) {
    cleanPath = cleanPath.substring(4);
  }

  return `${base}${cleanPath}`;
}

/**
 * Safely format error messages into clean readable strings, preventing [object Object]
 */
export function formatErrorMessage(error: any, fallback = 'حدث خطأ غير متوقع'): string {
  if (!error) return fallback;
  if (typeof error === 'string') {
    return error === '[object Object]' ? fallback : error;
  }
  if (typeof error.message === 'string' && error.message !== '[object Object]') {
    return error.message;
  }
  if (typeof error.error === 'string') {
    return error.error === '[object Object]' ? fallback : error.error;
  }
  if (error.error && typeof error.error.message === 'string') {
    return error.error.message;
  }
  if (typeof error.detail === 'string') {
    return error.detail;
  }
  return fallback;
}

/**
 * Safely parse JSON from Response, with clean fallback if HTML error page is returned
 */
export async function parseResponseJson<T = any>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }

  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    // If response was HTML or plaintext error
    return {
      error: text.length < 200 ? text : `خطأ في استجابة السيرفر (${res.status} ${res.statusText})`,
      status: res.status
    } as any;
  }
}

export async function fetchApi(path: string, options: RequestInit = {}): Promise<Response> {
  const url = apiUrl(path);
  const token = typeof window !== 'undefined' ? localStorage.getItem('rdn_auth_token') : null;

  const headers = new Headers(options.headers || {});

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(url, {
      ...options,
      headers,
      credentials: 'include' // Transmit cookies across same-origin and CORS requests
    });
  } catch (err: any) {
    console.error(`[API Network Error] Failed to fetch ${url}:`, err.message);
    throw new Error(`تعذر الاتصال بالسيرفر. يرجى التحقق من اتصال الإنترنت أو إعدادات السيرفر (${err.message})`);
  }
}
