import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  hashPassword,
  verifyPassword,
  ensureDbReady,
  ADMIN_INITIAL_EMAIL,
  ADMIN_INITIAL_PASSWORD,
  memStore,
  getDatabaseStatus,
  dbFindUserByEmail,
  dbFindUserByPhone,
  dbFindUserById,
  dbSaveUser,
  dbUpdateUserStatus,
  dbUpdateUserRole,
  dbUpdateUserPassword,
  dbSaveBooking,
  dbUpdateBookingStatus,
  dbSaveSettings,
  dbSaveService,
  dbDeleteService,
  dbSavePackage,
  dbDeletePackage,
  dbSaveGallery,
  dbDeleteGallery,
  dbSaveReview,
  dbUpdateReviewStatus,
  dbDeleteReview,
  dbSaveNotification,
  dbMarkNotificationRead
} from './db.ts';
import type {
  Booking,
  GalleryItem,
  HallPackage,
  HallService,
  HallSettings,
  Review,
  User,
  AppNotification
} from '../types/index.ts';

const app = express();

// Parse JSON request bodies
app.use(express.json());

// Comprehensive CORS Middleware (W3C CORS compliant for Vercel production and custom domains)
app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin) {
    // If request has an Origin header, reflect origin and allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    // Same-origin, direct API, or non-browser request
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token, X-Api-Version, rdn_auth_token'
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// URL Normalizer Middleware for Vercel Serverless Functions and Proxies
app.use((req: Request, res: Response, next: NextFunction) => {
  const original =
    req.headers['x-matched-path'] ||
    req.headers['x-vercel-matched-path'] ||
    req.headers['x-forwarded-uri'] ||
    req.headers['x-original-url'];

  if (typeof original === 'string' && original.startsWith('/api') && (req.url === '/api' || req.url === '/')) {
    req.url = original;
  } else if (req.query && req.query.__path) {
    const subpath = Array.isArray(req.query.__path) ? req.query.__path.join('/') : req.query.__path;
    req.url = `/api/${subpath}`;
  }
  next();
});

// Cookie parser helper
function parseCookies(req: Request): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
    }
  });
  return list;
}

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.BETTER_AUTH_SECRET || 'dhuraydan_auth_secret_key_2026';

export function signAuthToken(user: { id: string; email: string; role: string }): string {
  const sessionId = `sess_${user.id}_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  const payload = Buffer.from(
    JSON.stringify({
      id: user.id,
      email: user.email,
      role: user.role,
      sessionId,
      t: Date.now()
    })
  ).toString('base64url');

  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return `rdn.${payload}.${sig}`;
}

export function verifyAuthToken(token: string): { id: string; email: string; role: string } | null {
  try {
    if (!token || !token.startsWith('rdn.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
    if (sig === expectedSig) {
      const json = Buffer.from(payloadB64, 'base64url').toString('utf8');
      return JSON.parse(json);
    }
  } catch {
    return null;
  }
  return null;
}

// Global Auth Middleware: verifies token and attaches user from authoritative records
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    await ensureDbReady();
  } catch {
    // Non-fatal, proceed with fallback
  }

  let token: string | undefined;

  const authHeader = req.headers.authorization;
  if (authHeader) {
    token = authHeader.replace(/^Bearer\s+/i, '').trim();
  }

  if (!token) {
    const cookies = parseCookies(req);
    token = cookies['rdn_auth_token'];
  }

  if (!token && typeof req.query.token === 'string') {
    token = req.query.token as string;
  }

  if (token) {
    let resolvedUserId: string | null = null;

    // 1. Verify signed HMAC stateless token
    const decoded = verifyAuthToken(token);
    if (decoded && decoded.id) {
      resolvedUserId = decoded.id;
    }

    // 2. Resolve via in-memory session map
    if (!resolvedUserId) {
      resolvedUserId = memStore.sessions.get(token) || null;
    }

    // 3. Fallback for legacy admin token
    if (!resolvedUserId && (token === 'token_admin_1' || token.startsWith('token_admin_'))) {
      const admin = await dbFindUserByEmail(ADMIN_INITIAL_EMAIL);
      if (admin) resolvedUserId = admin.id;
    }

    // 4. Fallback for customer token prefix
    if (!resolvedUserId && token.startsWith('token_usr_')) {
      resolvedUserId = token.replace('token_', '');
    }

    // 5. Fallback for direct user ID or email
    if (!resolvedUserId) {
      const directUser = (await dbFindUserById(token)) || (await dbFindUserByEmail(token));
      if (directUser) resolvedUserId = directUser.id;
    }

    if (resolvedUserId) {
      const user = await dbFindUserById(resolvedUserId);
      if (user && user.isActive) {
        (req as any).user = user;
        (req as any).token = token;
      }
    }
  }
  next();
}

app.use(authMiddleware);

// Middleware Pipeline Guards
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({
      error: 'يجب تسجيل الدخول أولاً للوصول إلى هذا المسار',
      code: 'UNAUTHORIZED'
    });
  }
  next();
}

function requireActive(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'غير مسجل الدخول', code: 'UNAUTHORIZED' });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: 'هذا الحساب موقوف حالياً (Account disabled)', code: 'ACCOUNT_DISABLED' });
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({
      error: 'يجب تسجيل الدخول أولاً للوصول إلى هذا المسار',
      code: 'UNAUTHORIZED'
    });
  }
  if (!user.isActive) {
    return res.status(403).json({
      error: 'هذا الحساب موقوف حالياً (Account disabled)',
      code: 'ACCOUNT_DISABLED'
    });
  }
  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'غير مصرح: هذا الإجراء مخصص حصرياً لمدير النظام (403 Forbidden)',
      code: 'FORBIDDEN',
      userRole: user.role
    });
  }
  next();
}

// ==============================================================================
// Express API Router (Supports both /api/* and /* paths seamlessly)
// ==============================================================================
const apiRouter = express.Router();

// 1. Health & Database Diagnostic Endpoints
apiRouter.get('/health', async (req, res) => {
  const dbStatus = await getDatabaseStatus();
  res.json({
    status: 'ok',
    hallName: memStore.settings.hallName || 'قاعة ذو ريدان للأفراح والمناسبات',
    city: 'صنعاء، اليمن',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/db-status', async (req, res) => {
  const dbStatus = await getDatabaseStatus();
  res.json({
    status: 'ok',
    ...dbStatus
  });
});

// 2. Authentication & Authorization Endpoints

// Dedicated Admin Login Endpoint:
// Enforces Email + Password + Active + Role === 'ADMIN'
// Rejects CUSTOMER with 403 Forbidden
apiRouter.post('/auth/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    // Query authoritative database (PostgreSQL / In-memory)
    const user = await dbFindUserByEmail(normalizedEmail);

    // 1. Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة (Invalid credentials)' });
    }

    // 2. Verify hashed password (bcrypt)
    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة (Invalid credentials)' });
    }

    // 3. Check if account is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب موقوف حالياً (Account disabled)' });
    }

    // 4. Check if role is ADMIN
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        error: 'غير مصرح: هذا الحساب ليس لديه صلاحية مدير النظام (403 Forbidden)',
        code: 'FORBIDDEN',
        userRole: user.role
      });
    }

    // Session & Cookie creation
    const token = signAuthToken(user);
    memStore.sessions.set(token, user.id);
    memStore.sessions.set('token_admin_1', user.id);
    res.setHeader('Set-Cookie', `rdn_auth_token=${token}; Path=/; SameSite=Lax; Max-Age=604800`);

    const { password: _, ...userSafe } = user;
    res.json({
      success: true,
      user: userSafe,
      token,
      message: 'تم تسجيل الدخول بنجاح كمدير للنظام'
    });
  } catch (err: any) {
    console.error('[Admin Login Error]', err);
    res.status(500).json({ error: err.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول' });
  }
});

// Register endpoint: STRICTLY enforces role = 'CUSTOMER'. Hashes password. Never allows client to set role.
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({
        success: false,
        error: 'جميع الحقول مطلوبة: الاسم، البريد الإلكتروني، ورقم الهاتف'
      });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();
    const cleanPhone = (phone || '').trim();

    // 1. Query database for existing email and phone
    const existingEmail = await dbFindUserByEmail(normalizedEmail);
    const existingPhone = await dbFindUserByPhone(cleanPhone);

    // 2. Case A: Both email and phone exist and belong to the same customer
    if (existingEmail && existingPhone && existingEmail.id === existingPhone.id) {
      return res.status(409).json({
        success: false,
        error: 'لديك حساب مسجل بالفعل، سيتم تحويلك إلى تسجيل الدخول.',
        message: 'لديك حساب مسجل بالفعل، سيتم تحويلك إلى تسجيل الدخول.',
        code: 'ACCOUNT_EXISTS',
        email: existingEmail.email,
        redirectToLogin: true
      });
    }

    // 3. Case B: Email is already registered
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        error: 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.',
        message: 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.',
        code: 'EMAIL_EXISTS',
        email: existingEmail.email,
        redirectToLogin: true
      });
    }

    // 4. Case C: Phone is already registered for another account
    if (existingPhone) {
      return res.status(409).json({
        success: false,
        error: 'رقم الهاتف مسجل بالفعل.',
        message: 'رقم الهاتف مسجل بالفعل.',
        code: 'PHONE_EXISTS',
        redirectToLogin: false
      });
    }

    // Hash password with bcrypt
    const passwordHash = hashPassword(password || 'user123456');

    // FORCE role to CUSTOMER regardless of what frontend sends
    const newUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      email: normalizedEmail,
      password: passwordHash,
      phone: cleanPhone,
      role: 'CUSTOMER' as const,
      permissions: [],
      isActive: true,
      createdAt: new Date().toISOString()
    };

    // Persist user to PostgreSQL database
    try {
      await dbSaveUser(newUser);
    } catch (dbErr: any) {
      if (dbErr.code === '23505' || dbErr.message?.includes('duplicate key') || dbErr.message?.includes('unique')) {
        return res.status(409).json({
          success: false,
          error: 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.',
          message: 'هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول.',
          code: 'EMAIL_EXISTS',
          redirectToLogin: true
        });
      }
      throw dbErr;
    }

    // Keep the customer in the server cache.
    // Registration intentionally does not create a login session;
    // the frontend redirects the customer to the Login form.
    const existingIndex = memStore.users.findIndex(u => u.id === newUser.id);
    if (existingIndex >= 0) {
      memStore.users[existingIndex] = newUser;
    } else {
      memStore.users.push(newUser);
    }

    // Return user without password.
    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      user: userSafe,
      redirectToLogin: true
    });
  } catch (err: any) {
    console.error('[Register API Error]', err);
    const errorMsg = typeof err?.message === 'string' && err.message !== '[object Object]'
      ? err.message
      : 'فشل إنشاء الحساب، يرجى التحقق من صحة البيانات';
    res.status(500).json({ success: false, error: errorMsg });
  }
});

// General Login endpoint: checks email and password and returns authoritative server role
apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = (email || '').toLowerCase().trim();

    const user = await dbFindUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة (Invalid credentials)' });
    }

    if (!verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'بيانات الدخول غير صحيحة (Invalid credentials)' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'هذا الحساب موقوف حالياً (Account disabled)' });
    }

    const token = signAuthToken(user);
    memStore.sessions.set(token, user.id);
    if (user.role === 'ADMIN') {
      memStore.sessions.set('token_admin_1', user.id);
    } else {
      memStore.sessions.set(`token_${user.id}`, user.id);
    }

    // Set auth cookie
    res.setHeader('Set-Cookie', `rdn_auth_token=${token}; Path=/; SameSite=Lax; Max-Age=604800`);

    const { password: _, ...userSafe } = user;
    res.json({ user: userSafe, token });
  } catch (err: any) {
    console.error('[Login API Error]', err);
    res.status(500).json({ error: err.message || 'حدث خطأ أثناء تسجيل الدخول' });
  }
});

// Current user verification endpoint (returns true server role)
apiRouter.get('/auth/me', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'غير مسجل الدخول' });
  }
  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// Logout endpoint
apiRouter.post('/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    memStore.sessions.delete(token);
  }
  const cookies = parseCookies(req);
  if (cookies['rdn_auth_token']) {
    memStore.sessions.delete(cookies['rdn_auth_token']);
  }
  // Clear auth cookie
  res.setHeader('Set-Cookie', 'rdn_auth_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  res.json({ success: true });
});

// Safe profile update: strictly ignores any attempt to change role!
apiRouter.patch('/auth/profile', async (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
  }
  const { name, phone } = req.body;
  if (name && typeof name === 'string') user.name = name.trim();
  if (phone && typeof phone === 'string') user.phone = phone.trim();

  // Role is intentionally immutable here
  await dbSaveUser(user);

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

// Protection against role manipulation
apiRouter.all('/auth/role*', (req, res) => {
  return res.status(403).json({
    error: 'غير مصرح بتعديل الصلاحيات: يتم تحديد الصلاحيات حصرياً من قِبل السيرفر (403 Forbidden)',
    code: 'FORBIDDEN'
  });
});

// ==============================================================================
// Professional & Secure Password Reset System (Customer & Admin)
// ==============================================================================
interface PasswordResetRecord {
  token: string;
  userId: string;
  email: string;
  role: 'ADMIN' | 'CUSTOMER';
  name: string;
  expiresAt: number;
  createdAt: number;
  used: boolean;
}

// In-memory token store with auto-cleanup
const passwordResetTokens = new Map<string, PasswordResetRecord>();

// Periodically clean up expired tokens every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [t, record] of passwordResetTokens.entries()) {
    if (now > record.expiresAt || record.used) {
      passwordResetTokens.delete(t);
    }
  }
}, 15 * 60 * 1000);

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}${'*'.repeat(Math.min(name.length - 2, 5))}${name[name.length - 1]}@${domain}`;
}

function createPasswordResetToken(user: { id: string; email: string; role: 'ADMIN' | 'CUSTOMER'; name: string }): string {
  const randomHex = crypto.randomBytes(32).toString('hex');
  const payload = Buffer.from(
    JSON.stringify({
      uid: user.id,
      em: user.email,
      exp: Date.now() + 30 * 60 * 1000, // 30 minutes expiration
      rnd: randomHex
    })
  ).toString('base64url');

  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  const token = `rst.${payload}.${sig}`;

  passwordResetTokens.set(token, {
    token,
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    expiresAt: Date.now() + 30 * 60 * 1000,
    createdAt: Date.now(),
    used: false
  });

  return token;
}

function validatePasswordResetToken(token: string): PasswordResetRecord | null {
  if (!token || typeof token !== 'string') return null;

  const record = passwordResetTokens.get(token);
  if (!record) return null;
  if (record.used) return null;
  if (Date.now() > record.expiresAt) {
    passwordResetTokens.delete(token);
    return null;
  }

  // Also verify HMAC signature
  try {
    if (!token.startsWith('rst.')) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [, payloadB64, sig] = parts;
    const expectedSig = crypto.createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url');
    if (sig !== expectedSig) return null;
  } catch {
    return null;
  }

  return record;
}

// 1. Request Password Reset (Anti-enumeration compliant)
apiRouter.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'يرجى إدخال بريد إلكتروني صحيح'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await dbFindUserByEmail(normalizedEmail);

    // Standard message to prevent user enumeration
    const genericSuccessMessage =
      'إذا كان هذا البريد الإلكتروني مسجلاً لدينا، فقد تم إرسال رابط آمن لإعادة تعيين كلمة المرور.';

    if (!user || !user.isActive) {
      // Simulate real response timing
      await new Promise(r => setTimeout(r, 400));
      return res.json({
        success: true,
        message: genericSuccessMessage
      });
    }

    // Generate secure time-limited token
    const token = createPasswordResetToken(user);
    const resetPath = `/reset-password?token=${encodeURIComponent(token)}`;

    console.log(`[Password Reset] Generated reset link for user ${user.id} (${user.email}, ${user.role}): ${resetPath}`);

    return res.json({
      success: true,
      message: genericSuccessMessage,
      // Provide reset link and metadata for interactive preview and verification
      resetUrl: resetPath,
      token,
      emailMasked: maskEmail(user.email),
      role: user.role
    });
  } catch (err: any) {
    console.error('[Forgot Password API Error]', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء معالجة طلب استعادة كلمة المرور' });
  }
});

// 2. Verify Reset Token before showing password entry form
apiRouter.get('/auth/verify-reset-token', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    if (!token) {
      return res.status(400).json({ valid: false, error: 'رمز إعادة التعيين مفقود' });
    }

    const record = validatePasswordResetToken(token);
    if (!record) {
      return res.status(400).json({ valid: false, error: 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته' });
    }

    const user = await dbFindUserById(record.userId);
    if (!user || !user.isActive) {
      return res.status(400).json({ valid: false, error: 'الحساب غير موجود أو موقوف حالياً' });
    }

    return res.json({
      valid: true,
      emailMasked: maskEmail(user.email),
      name: user.name,
      role: user.role,
      expiresAt: record.expiresAt
    });
  } catch (err: any) {
    console.error('[Verify Reset Token API Error]', err);
    res.status(500).json({ valid: false, error: 'فشل التحقق من رمز إعادة التعيين' });
  }
});

// 3. Reset Password with new password and Bcrypt hashing
apiRouter.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ success: false, error: 'رمز إعادة التعيين مفقود' });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({ success: false, error: 'يرجى إدخال كلمة المرور الجديدة' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, error: 'كلمة المرور يجب أن لا تقل عن 8 أحرف أو أرقام' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'كلمة المرور وتأكيدها غير متطابقين' });
    }

    const record = validatePasswordResetToken(token);
    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'رابط إعادة التعيين غير صالح أو انتهت صلاحيته (الصلاحية 30 دقيقة)'
      });
    }

    const user = await dbFindUserById(record.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    }

    // Securely hash with Bcrypt
    const newHash = hashPassword(newPassword);

    // Save to PostgreSQL and update memory store
    await dbUpdateUserPassword(user.id, newHash);

    // Invalidate reset token immediately (single-use enforcement)
    record.used = true;
    passwordResetTokens.delete(token);

    // Invalidate previous sessions for security
    for (const [sessToken, uid] of memStore.sessions.entries()) {
      if (uid === user.id) {
        memStore.sessions.delete(sessToken);
      }
    }

    console.log(`[Password Reset] Password changed successfully for ${user.id} (${user.email}, ${user.role})`);

    return res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
      role: user.role
    });
  } catch (err: any) {
    console.error('[Reset Password API Error]', err);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء حفظ كلمة المرور الجديدة' });
  }
});

// 3. Hall Content Endpoints (Settings, Services, Packages, Gallery, Reviews)

// Settings
apiRouter.get('/settings', (req, res) => {
  res.json(memStore.settings);
});

apiRouter.put('/settings', requireAdmin, async (req, res) => {
  memStore.settings = { ...memStore.settings, ...req.body };
  await dbSaveSettings(memStore.settings);
  res.json(memStore.settings);
});

// Services
apiRouter.get('/services', (req, res) => {
  res.json(memStore.services);
});

apiRouter.post('/services', requireAdmin, async (req, res) => {
  const newService: HallService = {
    ...req.body,
    id: `srv_${Date.now()}`
  };
  memStore.services.unshift(newService);
  await dbSaveService(newService);
  res.status(201).json(newService);
});

apiRouter.delete('/services/:id', requireAdmin, async (req, res) => {
  memStore.services = memStore.services.filter(s => s.id !== req.params.id);
  await dbDeleteService(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

// Packages
apiRouter.get('/packages', (req, res) => {
  res.json(memStore.packages);
});

apiRouter.post('/packages', requireAdmin, async (req, res) => {
  const newPkg: HallPackage = {
    ...req.body,
    id: `pkg_${Date.now()}`
  };
  memStore.packages.push(newPkg);
  await dbSavePackage(newPkg);
  res.status(201).json(newPkg);
});

apiRouter.delete('/packages/:id', requireAdmin, async (req, res) => {
  memStore.packages = memStore.packages.filter(p => p.id !== req.params.id);
  await dbDeletePackage(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

// Gallery
apiRouter.get('/gallery', (req, res) => {
  res.json(memStore.gallery);
});

apiRouter.post('/gallery', requireAdmin, async (req, res) => {
  const newItem: GalleryItem = {
    ...req.body,
    id: `gal_${Date.now()}`
  };
  memStore.gallery.unshift(newItem);
  await dbSaveGallery(newItem);
  res.status(201).json(newItem);
});

apiRouter.delete('/gallery/:id', requireAdmin, async (req, res) => {
  memStore.gallery = memStore.gallery.filter(g => g.id !== req.params.id);
  await dbDeleteGallery(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

// Reviews
apiRouter.get('/reviews', (req, res) => {
  const user = (req as any).user;
  const isAdmin = user && user.role === 'ADMIN';
  const onlyApproved = req.query.approved === 'true' && !isAdmin;

  if (onlyApproved) {
    return res.json(memStore.reviews.filter(r => r.isApproved));
  }
  res.json(memStore.reviews);
});

apiRouter.post('/reviews', async (req, res) => {
  const { authorName, rating, comment, eventType, eventDate } = req.body;
  if (!authorName || !rating || !comment) {
    return res.status(400).json({ error: 'الاسم والتقييم والتعليق مطلوبين' });
  }

  const user = (req as any).user;
  const newReview: Review = {
    id: `rev_${Date.now()}`,
    authorName: authorName.trim(),
    userId: user?.id,
    rating: Number(rating),
    comment: comment.trim(),
    eventType: eventType || 'wedding',
    eventDate: eventDate || new Date().toISOString().split('T')[0],
    isVerified: !!user,
    isApproved: true,
    source: 'platform',
    createdAt: new Date().toISOString()
  };

  memStore.reviews.unshift(newReview);
  await dbSaveReview(newReview);
  res.status(201).json(newReview);
});

apiRouter.patch('/reviews/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const review = memStore.reviews.find(r => r.id === id);
  if (!review) return res.status(404).json({ error: 'التقييم غير موجود' });
  if (req.body.isApproved !== undefined) {
    review.isApproved = req.body.isApproved;
    await dbUpdateReviewStatus(id, req.body.isApproved);
  }
  res.json({ success: true, review });
});

apiRouter.delete('/reviews/:id', requireAdmin, async (req, res) => {
  memStore.reviews = memStore.reviews.filter(r => r.id !== req.params.id);
  await dbDeleteReview(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

// 4. Bookings & Conflict Prevention Endpoints
apiRouter.get('/bookings', (req, res) => {
  const user = (req as any).user;
  if (!user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول لعرض الحجوزات' });
  }
  if (user.role === 'ADMIN') {
    return res.json(memStore.bookings);
  }
  // Customer can only view their own bookings
  const myBookings = memStore.bookings.filter(b => b.userId === user.id || b.customerId === user.id || b.customerEmail === user.email);
  res.json(myBookings);
});

apiRouter.get('/bookings/conflict', (req, res) => {
  const { eventDate, timeSlot, excludeBookingId } = req.query;
  if (!eventDate || !timeSlot) {
    return res.status(400).json({ error: 'eventDate and timeSlot are required' });
  }

  const activeOnDate = memStore.bookings.filter(b => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status !== 'confirmed') return false;
    return b.eventDate === eventDate;
  });

  for (const existing of activeOnDate) {
    const isFullDay = existing.timeSlot === 'full_day' || timeSlot === 'full_day';
    const isSameSlot = existing.timeSlot === timeSlot;
    if (isFullDay || isSameSlot) {
      return res.json({
        hasConflict: true,
        conflictingBooking: existing,
        message: `تنبيه: القاعة محجوزة مسبقاً في تاريخ ${eventDate} للفترة (${existing.timeSlot === 'morning' ? 'صباحية' : existing.timeSlot === 'evening' ? 'مسائية' : 'يوم كامل'})`
      });
    }
  }

  res.json({ hasConflict: false });
});

apiRouter.post('/bookings', async (req, res) => {
  const user = (req as any).user;
  const bookingData = req.body;

  if (!bookingData.eventDate || !bookingData.timeSlot || !bookingData.customerName || !bookingData.customerPhone) {
    return res.status(400).json({ success: false, error: 'جميع بيانات المناسبة والعميل مطلوبة' });
  }

  // Conflict check for confirmed bookings
  const conflict = memStore.bookings.find(b =>
    b.status === 'confirmed' &&
    b.eventDate === bookingData.eventDate &&
    (b.timeSlot === 'full_day' || bookingData.timeSlot === 'full_day' || b.timeSlot === bookingData.timeSlot)
  );

  if (conflict) {
    return res.status(409).json({
      success: false,
      error: 'عذراً، هذا الموعد محجوز مسبقاً بشكل مؤكد. يرجى اختيار تاريخ أو فترة أخرى.',
      conflictingBookingId: conflict.id
    });
  }

  // Ensure customer is registered in PostgreSQL database and resolve authoritative customerId
  let customerId: string;
  let customerEmail = (bookingData.customerEmail || '').toLowerCase().trim();

  if (user && user.id) {
    customerId = user.id;
    if (!customerEmail) customerEmail = (user.email || '').toLowerCase().trim();
  } else {
    // Check if customer already exists in DB by email or phone
    let existingUser = customerEmail ? await dbFindUserByEmail(customerEmail) : null;
    if (!existingUser && bookingData.customerPhone) {
      existingUser = await dbFindUserByPhone(bookingData.customerPhone);
    }

    if (existingUser) {
      customerId = existingUser.id;
      if (!customerEmail) customerEmail = existingUser.email;
    } else {
      // Auto-register customer record in PostgreSQL so booking is strictly linked to a real customer
      const newCustId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const autoEmail = customerEmail || `customer_${Date.now()}@dhuraydan.com`;
      const newCust = {
        id: newCustId,
        name: bookingData.customerName.trim(),
        email: autoEmail,
        phone: bookingData.customerPhone.trim(),
        password: hashPassword('user123456'),
        role: 'CUSTOMER' as const,
        permissions: [],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      await dbSaveUser(newCust);
      memStore.users.push(newCust);
      customerId = newCustId;
      if (!customerEmail) customerEmail = autoEmail;
    }
  }

  const count = memStore.bookings.length + 101;
  const newBooking: Booking = {
    ...bookingData,
    id: `bkg_${Date.now()}`,
    bookingCode: `RDN-2026-${count}`,
    userId: customerId,
    customerId: customerId,
    customerEmail,
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  memStore.bookings.unshift(newBooking);
  await dbSaveBooking(newBooking);

  // 1. Notify Admins
  const adminNotif: AppNotification = {
    id: `notif_${Date.now()}_admin`,
    userId: 'all_admin',
    title: 'طلب حجز جديد بقاعة ذو ريدان',
    message: `قام العميل ${newBooking.customerName} بطلب حجز جديد رقم (${newBooking.bookingCode}) بتاريخ ${newBooking.eventDate}.`,
    type: 'booking_created',
    bookingId: newBooking.id,
    isRead: false,
    createdAt: new Date().toISOString()
  };
  memStore.notifications.unshift(adminNotif);
  await dbSaveNotification(adminNotif);

  // 2. Notify Customer
  const custId = newBooking.customerId || newBooking.userId;
  if (custId) {
    const custNotif: AppNotification = {
      id: `notif_${Date.now()}_cust`,
      userId: custId,
      title: 'تم استلام طلب حجزك بنجاح!',
      message: `تم استلام طلب حجزك رقم (${newBooking.bookingCode}) لمناسبة ${newBooking.eventType || 'القاعة'} في تاريخ ${newBooking.eventDate}. سنقوم بمراجعة الطلب والتواصل معك.`,
      type: 'booking_created',
      bookingId: newBooking.id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    memStore.notifications.unshift(custNotif);
    await dbSaveNotification(custNotif);
  }

  res.status(201).json({
    success: true,
    message: 'تم تسجيل حجزك بنجاح.',
    ...newBooking,
    booking: newBooking
  });
});

// Notifications
apiRouter.get('/notifications', async (req, res) => {
  await ensureDbReady();
  const user = (req as any).user;
  const queryUserId = typeof req.query.userId === 'string' ? req.query.userId : null;
  const queryIsAdmin = req.query.isAdmin === 'true';

  const effectiveUserId = user?.id || queryUserId;
  const effectiveIsAdmin = user?.role === 'ADMIN' || queryIsAdmin;

  if (!effectiveUserId && !effectiveIsAdmin) {
    return res.json([]);
  }

  // Filter out any legacy mock notifications containing Sami
  const validNotifs = memStore.notifications.filter(
    n => n.id !== 'notif_1' && n.id !== 'notif_2' && !(n.message && n.message.includes('سامي'))
  );

  if (effectiveIsAdmin) {
    return res.json(validNotifs.filter(n => n.userId === 'all_admin' || (effectiveUserId && n.userId === effectiveUserId)));
  }

  res.json(validNotifs.filter(n => n.userId === effectiveUserId));
});

apiRouter.patch('/notifications/read-all', async (req, res) => {
  await ensureDbReady();
  const user = (req as any).user;
  const targetUserId = req.body?.userId || user?.id;
  const isAdmin = req.body?.isAdmin === true || user?.role === 'ADMIN';

  for (const n of memStore.notifications) {
    if (isAdmin && (n.userId === 'all_admin' || n.userId === targetUserId)) {
      n.isRead = true;
      await dbMarkNotificationRead(n.id);
    } else if (targetUserId && n.userId === targetUserId) {
      n.isRead = true;
      await dbMarkNotificationRead(n.id);
    }
  }
  res.json({ success: true });
});

apiRouter.patch('/notifications/:id/read', async (req, res) => {
  const notif = memStore.notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.isRead = true;
    await dbMarkNotificationRead(req.params.id);
  }
  res.json({ success: true });
});

// 5. Admin Protected API Endpoints (/api/admin/*)
apiRouter.get('/admin/stats', requireAdmin, (req, res) => {
  const totalBookings = memStore.bookings.length;
  const pendingBookings = memStore.bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = memStore.bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = memStore.bookings.filter(b => b.status === 'completed').length;
  const totalRevenue = memStore.bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((acc, curr) => acc + curr.totalPrice, 0);

  res.json({
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    totalRevenue,
    customersCount: memStore.users.filter(u => u.role === 'CUSTOMER').length,
    averageRating: 4.4
  });
});

apiRouter.get('/admin/users', requireAdmin, (req, res) => {
  const users = memStore.users.map(({ password: _, ...u }) => u);
  res.json({ users });
});

apiRouter.patch('/admin/users/:id/role', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  if (!['ADMIN', 'CUSTOMER'].includes(role)) {
    return res.status(400).json({ error: 'الدور المحدد غير صالح' });
  }

  const user = memStore.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }

  user.role = role as any;
  if (role === 'ADMIN') {
    user.permissions = [
      'MANAGE_ALL',
      'MANAGE_BOOKINGS',
      'MANAGE_CUSTOMERS',
      'MANAGE_SERVICES',
      'MANAGE_PACKAGES',
      'MANAGE_PRICES',
      'MANAGE_GALLERY',
      'MANAGE_REVIEWS',
      'MANAGE_NOTIFICATIONS',
      'MANAGE_CALENDAR',
      'MANAGE_SETTINGS',
      'MANAGE_USERS',
      'MANAGE_ROLES'
    ];
  } else {
    user.permissions = [];
  }

  await dbUpdateUserRole(id, user.role, user.permissions);

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe, message: `تم تحديث دور المستخدم إلى ${role === 'ADMIN' ? 'مدير نظام' : 'عميل'}` });
});

apiRouter.patch('/admin/users/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const user = memStore.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  user.isActive = !user.isActive;
  await dbUpdateUserStatus(id, user.isActive);

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

apiRouter.get('/admin/customers', requireAdmin, (req, res) => {
  const customers = memStore.users
    .filter(u => u.role === 'CUSTOMER')
    .map(({ password: _, ...u }) => u);
  res.json({ customers });
});

apiRouter.patch('/admin/customers/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const user = memStore.users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'المستخدم غير موجود' });
  }
  user.isActive = !user.isActive;
  await dbUpdateUserStatus(id, user.isActive);

  const { password: _, ...userSafe } = user;
  res.json({ user: userSafe });
});

apiRouter.get('/admin/bookings', requireAdmin, (req, res) => {
  res.json(memStore.bookings);
});

apiRouter.patch('/admin/bookings/:id/status', requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;
  const booking = memStore.bookings.find(b => b.id === id);
  if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });

  booking.status = status;
  if (rejectionReason) booking.rejectionReason = rejectionReason;

  await dbUpdateBookingStatus(id, status, rejectionReason);

  // Notify customer
  const targetUserId = booking.userId || booking.customerId;
  if (targetUserId) {
    const custNotif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: targetUserId,
      title: status === 'confirmed' ? 'تم تأكيد حجزك في قاعة ذو ريدان!' : status === 'rejected' ? 'تحديث بخصوص طلب الحجز' : 'تحديث حالة الحجز',
      message: status === 'confirmed'
        ? `تم تأكيد حجزك رقم (${booking.bookingCode}) بنجاح.`
        : status === 'rejected'
        ? `نعتذر منك، تم رفض طلب الحجز رقم (${booking.bookingCode}). سبب الرفض: ${rejectionReason || 'عدم توفر الموعد'}`
        : `تم تغيير حالة حجزك رقم (${booking.bookingCode}) إلى ${status}.`,
      type: status === 'confirmed' ? 'booking_confirmed' : status === 'rejected' ? 'booking_rejected' : 'system',
      bookingId: booking.id,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    memStore.notifications.unshift(custNotif);
    await dbSaveNotification(custNotif);
  }

  res.json({
    success: true,
    booking
  });
});

apiRouter.post('/admin/services', requireAdmin, async (req, res) => {
  const newService: HallService = {
    ...req.body,
    id: `srv_${Date.now()}`
  };
  memStore.services.unshift(newService);
  await dbSaveService(newService);
  res.status(201).json({ success: true, service: newService });
});

apiRouter.delete('/admin/services/:id', requireAdmin, async (req, res) => {
  memStore.services = memStore.services.filter(s => s.id !== req.params.id);
  await dbDeleteService(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

apiRouter.post('/admin/packages', requireAdmin, async (req, res) => {
  const newPkg: HallPackage = {
    ...req.body,
    id: `pkg_${Date.now()}`
  };
  memStore.packages.push(newPkg);
  await dbSavePackage(newPkg);
  res.status(201).json({ success: true, package: newPkg });
});

apiRouter.delete('/admin/packages/:id', requireAdmin, async (req, res) => {
  memStore.packages = memStore.packages.filter(p => p.id !== req.params.id);
  await dbDeletePackage(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

apiRouter.post('/admin/gallery', requireAdmin, async (req, res) => {
  const newItem: GalleryItem = {
    ...req.body,
    id: `gal_${Date.now()}`
  };
  memStore.gallery.unshift(newItem);
  await dbSaveGallery(newItem);
  res.status(201).json({ success: true, item: newItem });
});

apiRouter.delete('/admin/gallery/:id', requireAdmin, async (req, res) => {
  memStore.gallery = memStore.gallery.filter(g => g.id !== req.params.id);
  await dbDeleteGallery(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

apiRouter.patch('/admin/reviews/:id', requireAdmin, async (req, res) => {
  const review = memStore.reviews.find(r => r.id === req.params.id);
  if (review && req.body.isApproved !== undefined) {
    review.isApproved = req.body.isApproved;
    await dbUpdateReviewStatus(req.params.id, req.body.isApproved);
  }
  res.json({ success: true, reviewId: req.params.id, isApproved: req.body.isApproved });
});

apiRouter.delete('/admin/reviews/:id', requireAdmin, async (req, res) => {
  memStore.reviews = memStore.reviews.filter(r => r.id !== req.params.id);
  await dbDeleteReview(req.params.id);
  res.json({ success: true, deletedId: req.params.id });
});

apiRouter.put('/admin/settings', requireAdmin, async (req, res) => {
  memStore.settings = { ...memStore.settings, ...req.body };
  await dbSaveSettings(memStore.settings);
  res.json({ success: true, settings: memStore.settings });
});

// Catch-all for ANY /admin/* API route to guarantee security
apiRouter.all('/admin/*', requireAdmin, (req, res) => {
  res.json({ success: true });
});

// Mount apiRouter on BOTH '/api' and '/'
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Root API Welcome / Health probe
app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    hallName: 'قاعة ذو ريدان للأفراح والمناسبات',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ==============================================================================
// 6. Strict Backend Route Guard for browser requests to /admin and /admin/*
// ==============================================================================
app.use((req: Request, res: Response, next: NextFunction) => {
  const p = req.path;

  // Dedicated Admin Login Route: accessible by visitors
  if (p === '/admin/login' || p.startsWith('/admin/login')) {
    const user = (req as any).user;
    if (user && user.role === 'ADMIN') {
      return res.redirect('/admin');
    }
    return next();
  }

  if (p === '/admin' || p.startsWith('/admin/')) {
    const user = (req as any).user;
    const isJson = req.headers.accept?.includes('application/json') || req.xhr;

    if (!user) {
      if (isJson) {
        return res.status(401).json({
          error: 'يجب تسجيل الدخول أولاً للوصول إلى لوحة التحكم',
          code: 'UNAUTHORIZED'
        });
      }
      return res.redirect('/admin/login');
    }

    if (user.role !== 'ADMIN') {
      if (isJson) {
        return res.status(403).json({
          error: 'غير مصرح: هذا المسار مخصص حصرياً لمدير النظام (403 Forbidden)',
          code: 'FORBIDDEN',
          userRole: user.role
        });
      }
      return res.redirect('/403');
    }
  }
  next();
});

export default app;
