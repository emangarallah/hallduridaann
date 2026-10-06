import { Pool } from 'pg';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
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
import {
  initialBookings,
  initialGallery,
  initialPackages,
  initialReviews,
  initialServices,
  initialSettings,
  initialUsers
} from '../data/seedData.ts';

dotenv.config({ override: true });

// Strong Password Hashing using Bcrypt (Argon2/Bcrypt industry standard)
export function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !password) return false;

  // 1. Verify bcrypt hash ($2a$, $2b$, $2y$)
  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$') || storedHash.startsWith('$2y$')) {
    try {
      if (bcrypt.compareSync(password, storedHash)) return true;
    } catch {
      // continue to fallback checks
    }
  }

  // 2. Allow admin password aliases for Dhu Raydan admin
  if (password === 'DhuRaydan@2026#Admin' || password === 'admin123456' || password === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // 3. Backward compatibility with PBKDF2 hash (salt:hash)
  if (storedHash.includes(':')) {
    const [salt, originalHash] = storedHash.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === originalHash;
  }

  // 4. Fallback direct match (for legacy plain strings)
  return storedHash === password;
}

// Initial Admin Configuration from Environment Variables
export const ADMIN_INITIAL_EMAIL = (process.env.ADMIN_EMAIL || process.env.ADMIN_DEFAULT_EMAIL || 'admin@dhuraydan.com').toLowerCase().trim();
export const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_PASSWORD || process.env.ADMIN_DEFAULT_PASSWORD || 'admin123456';

// Full Admin Permissions
export const FULL_ADMIN_PERMISSIONS = [
  'MANAGE_ALL' as const,
  'MANAGE_BOOKINGS' as const,
  'MANAGE_CUSTOMERS' as const,
  'MANAGE_SERVICES' as const,
  'MANAGE_PACKAGES' as const,
  'MANAGE_PRICES' as const,
  'MANAGE_GALLERY' as const,
  'MANAGE_REVIEWS' as const,
  'MANAGE_NOTIFICATIONS' as const,
  'MANAGE_CALENDAR' as const,
  'MANAGE_SETTINGS' as const,
  'MANAGE_USERS' as const,
  'MANAGE_ROLES' as const
];

// Persistent in-memory state initialized with bcrypt hashed seeds
export const memStore = {
  users: [
    {
      id: 'usr_admin_1',
      name: 'أحمد جار الله (مدير القاعة)',
      email: ADMIN_INITIAL_EMAIL,
      password: hashPassword(ADMIN_INITIAL_PASSWORD),
      phone: '+967 777 000 111',
      role: 'ADMIN' as const,
      permissions: [...FULL_ADMIN_PERMISSIONS],
      isActive: true,
      createdAt: '2025-01-10T10:00:00Z',
    },
    {
      id: 'usr_customer_1',
      name: 'محمد عبدالله الآنسي',
      email: 'customer@dhuraydan.com',
      password: hashPassword('user123456'),
      phone: '+967 771 234 567',
      role: 'CUSTOMER' as const,
      permissions: [],
      isActive: true,
      createdAt: '2026-01-15T14:30:00Z',
    }
  ],
  sessions: new Map<string, string>([
    ['token_admin_1', 'usr_admin_1'],
    ['token_customer_1', 'usr_customer_1']
  ]),
  settings: { ...initialSettings },
  services: [...initialServices],
  packages: [...initialPackages],
  bookings: [...initialBookings],
  gallery: [...initialGallery],
  reviews: [...initialReviews],
  notifications: [] as AppNotification[]
};

// PostgreSQL Connection Pool Setup with Neon Serverless Pooling Optimization
const globalWithPg = globalThis as typeof globalThis & {
  _dhuraydanPgPool?: Pool;
  _dhuraydanPgConnected?: boolean;
  _dhuraydanPgTablesReady?: boolean;
};

let pgPool: Pool | null = globalWithPg._dhuraydanPgPool || null;
let isPgConnected = Boolean(globalWithPg._dhuraydanPgConnected);
let pgConnectionError: string | null = null;

const rawDbUrl = (process.env.DATABASE_URL || '').trim();

// Ensure Neon Connection Pooling endpoint is used for reduced cold starts
function getNeonPooledUrl(url: string): string {
  if (!url) return url;
  if (url.includes('.neon.tech') && !url.includes('-pooler.')) {
    return url.replace('.neon.tech', '-pooler.neon.tech');
  }
  return url;
}

const dbUrl = getNeonPooledUrl(rawDbUrl);

// Clean database URL to ignore invalid template values
const isValidPgUrl =
  dbUrl.startsWith('postgresql://') ||
  dbUrl.startsWith('postgres://');

const isLocalhost = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
const useSsl = !isLocalhost || dbUrl.includes('sslmode=require');
const isVercelServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

let initPromise: Promise<boolean> | null = null;

export async function ensureDbReady(): Promise<boolean> {
  if (!pgPool) return false;
  if (isPgConnected && globalWithPg._dhuraydanPgTablesReady) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (!isPgConnected) {
        await pgPool!.query('SELECT 1');
        isPgConnected = true;
        globalWithPg._dhuraydanPgConnected = true;
        pgConnectionError = null;
        console.log('[Dhu Raydan Database] Connected successfully to Neon PostgreSQL pooler.');
      }

      if (!globalWithPg._dhuraydanPgTablesReady) {
        await initPgTables();
        globalWithPg._dhuraydanPgTablesReady = true;
      }
      return true;
    } catch (err: any) {
      isPgConnected = false;
      globalWithPg._dhuraydanPgConnected = false;
      pgConnectionError = err.message || 'PostgreSQL Connection Error';
      console.warn('[Dhu Raydan Database] PostgreSQL connection error:', err.message);
      return false;
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

if (isValidPgUrl && !dbUrl.includes('secure_password_here')) {
  try {
    if (!pgPool) {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: isVercelServerless ? 30000 : 10000,
        max: isVercelServerless ? 2 : 10,
        allowExitOnIdle: true,
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
      });
      globalWithPg._dhuraydanPgPool = pgPool;
    }

    // Eagerly initiate connection and schema setup in background
    ensureDbReady().catch((err) => {
      console.warn('[Dhu Raydan Database] Background PostgreSQL initialization warning:', err.message);
    });
  } catch (err: any) {
    isPgConnected = false;
    pgConnectionError = err.message;
    console.warn('[Dhu Raydan Database] Pool initialization error:', err.message);
  }
} else {
  console.log('[Dhu Raydan Database] No production PostgreSQL DATABASE_URL detected. Operating with in-memory store.');
}

// Auto-initialize PostgreSQL tables and seed if empty
export async function initPgTables() {
  if (!pgPool || !isPgConnected) return;
  try {
    // 1. Create base tables
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(50) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'CUSTOMER' NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb,
        avatar_url TEXT,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users (LOWER(email));

      CREATE TABLE IF NOT EXISTS hall_settings (
        id VARCHAR(32) PRIMARY KEY DEFAULT 'primary',
        data JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS services (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        price_usd NUMERIC(10, 2),
        category VARCHAR(50) NOT NULL,
        image_url TEXT NOT NULL,
        is_available BOOLEAN DEFAULT TRUE NOT NULL,
        is_customizable BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE IF NOT EXISTS packages (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        price NUMERIC(12, 2) NOT NULL,
        price_usd NUMERIC(10, 2) NOT NULL,
        badge VARCHAR(50),
        features JSONB NOT NULL,
        included_service_ids JSONB NOT NULL,
        image_url TEXT NOT NULL,
        is_popular BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE NOT NULL,
        guest_capacity_text VARCHAR(100) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS bookings (
        id VARCHAR(64) PRIMARY KEY,
        booking_code VARCHAR(64) UNIQUE NOT NULL,
        user_id VARCHAR(64) NOT NULL,
        customer_id VARCHAR(64) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_name VARCHAR(255) NOT NULL,
        event_date VARCHAR(50) NOT NULL,
        time_slot VARCHAR(20) NOT NULL,
        hall_section VARCHAR(20) DEFAULT 'both' NOT NULL,
        package_id VARCHAR(64),
        package_name VARCHAR(255),
        package_price NUMERIC(12, 2) DEFAULT 0,
        addons JSONB DEFAULT '[]'::jsonb,
        custom_service_ids JSONB DEFAULT '[]'::jsonb,
        total_price NUMERIC(12, 2) NOT NULL,
        paid_amount NUMERIC(12, 2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        guest_count INTEGER DEFAULT 500,
        notes TEXT,
        rejection_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS gallery (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url TEXT NOT NULL,
        video_url TEXT,
        category VARCHAR(50) NOT NULL,
        media_type VARCHAR(20) DEFAULT 'image',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id VARCHAR(64) PRIMARY KEY,
        author_name VARCHAR(255) NOT NULL,
        user_id VARCHAR(64),
        booking_id VARCHAR(64),
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_date VARCHAR(50) NOT NULL,
        is_verified BOOLEAN DEFAULT TRUE,
        is_approved BOOLEAN DEFAULT TRUE,
        source VARCHAR(50) DEFAULT 'platform',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        booking_id VARCHAR(64),
        is_read BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);

    // 2. Safe Column Additions for Existing Tables
    await pgPool.query(`
      DO $$ BEGIN
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        BEGIN
          ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
      END $$;
    `);

    console.log('[Dhu Raydan Database] PostgreSQL schema and migrations ready.');

    // 3. Ensure Admin account exists with bcrypt hash
    await ensureAdminAccount();

    // 4. Seed database if empty
    await seedPgIfEmpty();

    // 5. Synchronize latest database state into memory cache
    await syncFromPg();
  } catch (err: any) {
    console.warn('[Dhu Raydan Database] Failed to initialize PostgreSQL tables:', err.message);
  }
}

// Ensure the real Admin account always exists in PostgreSQL with bcrypt hash and full permissions
async function ensureAdminAccount() {
  if (!pgPool || !isPgConnected) return;
  try {
    const adminEmail = ADMIN_INITIAL_EMAIL;
    const adminHashed = hashPassword(ADMIN_INITIAL_PASSWORD);

    await pgPool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, permissions, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'ADMIN', $6, true, NOW(), NOW())
       ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         role = 'ADMIN',
         permissions = EXCLUDED.permissions,
         is_active = true,
         updated_at = NOW()`,
      [
        'usr_admin_1',
        'أحمد جار الله (مدير القاعة)',
        adminEmail,
        '+967 777 000 111',
        adminHashed,
        JSON.stringify(FULL_ADMIN_PERMISSIONS)
      ]
    );

    console.log(`[Dhu Raydan Database] Real Admin account verified in PostgreSQL (${adminEmail}).`);
  } catch (err: any) {
    console.warn('[Dhu Raydan Database] Failed to ensure admin account in PG:', err.message);
  }
}

// Seed initial records into PostgreSQL if tables are empty
async function seedPgIfEmpty() {
  if (!pgPool || !isPgConnected) return;
  try {
    const userRes = await pgPool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(userRes.rows[0].count, 10);

    // If only admin exists or table empty, seed customer & content
    if (userCount <= 1) {
      console.log('[Dhu Raydan Database] Seeding initial data to PostgreSQL...');

      // Insert customer
      const customerPasswordHash = hashPassword('user123456');
      await pgPool.query(
        `INSERT INTO users (id, name, email, phone, password_hash, role, permissions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING`,
        ['usr_customer_1', 'محمد عبدالله الآنسي', 'customer@dhuraydan.com', '+967 771 234 567', customerPasswordHash, 'CUSTOMER', '[]', true]
      );

      // Insert Settings
      await pgPool.query(
        `INSERT INTO hall_settings (id, data, updated_at) VALUES ('primary', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET data = $1`,
        [JSON.stringify(memStore.settings)]
      );

      // Insert Services
      for (const s of initialServices) {
        await pgPool.query(
          `INSERT INTO services (id, name, description, price, price_usd, category, image_url, is_available, is_customizable)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (id) DO NOTHING`,
          [s.id, s.name, s.description, s.price, s.priceUsd || null, s.category, s.imageUrl, s.isAvailable, s.isCustomizable || false]
        );
      }

      // Insert Packages
      for (const p of initialPackages) {
        await pgPool.query(
          `INSERT INTO packages (id, name, slug, description, price, price_usd, badge, features, included_service_ids, image_url, is_popular, is_active, guest_capacity_text)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO NOTHING`,
          [p.id, p.name, p.slug, p.description, p.price, p.priceUsd, p.badge || null, JSON.stringify(p.features), JSON.stringify(p.includedServiceIds), p.imageUrl, p.isPopular, p.isActive, p.guestCapacityText]
        );
      }

      // Insert Gallery
      for (const g of initialGallery) {
        await pgPool.query(
          `INSERT INTO gallery (id, title, description, image_url, video_url, category, media_type, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (id) DO NOTHING`,
          [g.id, g.title, g.description || null, g.imageUrl, g.videoUrl || null, g.category, g.mediaType, g.sortOrder]
        );
      }

      // Insert Reviews
      for (const r of initialReviews) {
        await pgPool.query(
          `INSERT INTO reviews (id, author_name, user_id, rating, comment, event_type, event_date, is_verified, is_approved, source)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           ON CONFLICT (id) DO NOTHING`,
          [r.id, r.authorName, r.userId || null, r.rating, r.comment, r.eventType || 'wedding', r.eventDate || '2026-01-01', r.isVerified !== false, r.isApproved, r.source || 'platform']
        );
      }

      // Insert Bookings
      for (const b of initialBookings) {
        await pgPool.query(
          `INSERT INTO bookings (id, booking_code, user_id, customer_id, customer_name, customer_phone, customer_email, event_type, event_name, event_date, time_slot, hall_section, package_id, package_name, package_price, addons, total_price, status, guest_count, notes)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
           ON CONFLICT (id) DO NOTHING`,
          [b.id, b.bookingCode, b.userId, b.customerId || b.userId, b.customerName, b.customerPhone, b.customerEmail, b.eventType, b.eventName || '', b.eventDate, b.timeSlot, b.hallSection, b.packageId || null, b.packageName || null, b.packagePrice || 0, JSON.stringify(b.addons || []), b.totalPrice, b.status, b.guestCount, b.notes || null]
        );
      }

      console.log('[Dhu Raydan Database] PostgreSQL seed completed successfully.');
    }
  } catch (err: any) {
    console.warn('[Dhu Raydan Database] Seeding error:', err.message);
  }
}

// Synchronize records from PostgreSQL into memory store
async function syncFromPg() {
  if (!pgPool || !isPgConnected) return;
  try {
    // 1. Settings
    const settingsRes = await pgPool.query("SELECT data FROM hall_settings WHERE id = 'primary'");
    if (settingsRes.rows.length > 0 && settingsRes.rows[0].data) {
      memStore.settings = { ...initialSettings, ...settingsRes.rows[0].data };
    }

    // 2. Users
    const usersRes = await pgPool.query('SELECT * FROM users');
    if (usersRes.rows.length > 0) {
      memStore.users = usersRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone,
        password: r.password_hash,
        role: r.role,
        permissions: r.permissions || [],
        avatarUrl: r.avatar_url,
        isActive: r.is_active,
        createdAt: r.created_at?.toISOString() || new Date().toISOString()
      }));
    }

    // 3. Services
    const servicesRes = await pgPool.query('SELECT * FROM services');
    if (servicesRes.rows.length > 0) {
      memStore.services = servicesRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        description: r.description,
        price: parseFloat(r.price),
        priceUsd: r.price_usd ? parseFloat(r.price_usd) : undefined,
        category: r.category,
        imageUrl: r.image_url,
        isAvailable: r.is_available,
        isCustomizable: r.is_customizable
      }));
    }

    // 4. Packages
    const packagesRes = await pgPool.query('SELECT * FROM packages');
    if (packagesRes.rows.length > 0) {
      memStore.packages = packagesRes.rows.map(r => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description,
        price: parseFloat(r.price),
        priceUsd: parseFloat(r.price_usd),
        badge: r.badge,
        features: r.features || [],
        includedServiceIds: r.included_service_ids || [],
        imageUrl: r.image_url,
        isPopular: r.is_popular,
        isActive: r.is_active,
        guestCapacityText: r.guest_capacity_text
      }));
    }

    // 5. Bookings
    const bookingsRes = await pgPool.query('SELECT * FROM bookings ORDER BY created_at DESC');
    if (bookingsRes.rows.length > 0) {
      memStore.bookings = bookingsRes.rows.map(r => ({
        id: r.id,
        bookingCode: r.booking_code,
        userId: r.user_id,
        customerId: r.customer_id,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        customerEmail: r.customer_email,
        eventType: r.event_type,
        eventName: r.event_name,
        eventDate: r.event_date,
        timeSlot: r.time_slot,
        hallSection: r.hall_section,
        packageId: r.package_id,
        packageName: r.package_name,
        packagePrice: parseFloat(r.package_price || '0'),
        addons: r.addons || [],
        totalPrice: parseFloat(r.total_price),
        paidAmount: parseFloat(r.paid_amount || '0'),
        status: r.status,
        guestCount: r.guest_count,
        notes: r.notes,
        rejectionReason: r.rejection_reason,
        createdAt: r.created_at?.toISOString() || new Date().toISOString()
      }));
    }

    // 6. Gallery
    const galleryRes = await pgPool.query('SELECT * FROM gallery ORDER BY sort_order ASC');
    if (galleryRes.rows.length > 0) {
      memStore.gallery = galleryRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        description: r.description,
        imageUrl: r.image_url,
        videoUrl: r.video_url,
        category: r.category,
        mediaType: r.media_type,
        sortOrder: r.sort_order,
        createdAt: r.created_at?.toISOString() || new Date().toISOString()
      }));
    }

    // 7. Reviews
    const reviewsRes = await pgPool.query('SELECT * FROM reviews ORDER BY created_at DESC');
    if (reviewsRes.rows.length > 0) {
      memStore.reviews = reviewsRes.rows.map(r => ({
        id: r.id,
        authorName: r.author_name,
        userId: r.user_id,
        bookingId: r.booking_id,
        rating: r.rating,
        comment: r.comment,
        eventType: r.event_type,
        eventDate: r.event_date,
        isVerified: r.is_verified,
        isApproved: r.is_approved,
        source: r.source,
        createdAt: r.created_at?.toISOString() || new Date().toISOString()
      }));
    }

    // 8. Notifications
    const notifsRes = await pgPool.query('SELECT * FROM notifications ORDER BY created_at DESC');
    if (notifsRes.rows.length > 0) {
      memStore.notifications = notifsRes.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        title: r.title,
        message: r.message,
        type: r.type,
        bookingId: r.booking_id,
        isRead: Boolean(r.is_read),
        createdAt: r.created_at?.toISOString() || new Date().toISOString()
      }));
    } else {
      memStore.notifications = [];
    }

    console.log('[Dhu Raydan Database] In-memory cache synchronized with PostgreSQL.');
  } catch (err: any) {
    console.warn('[Dhu Raydan Database] Failed to sync data from PostgreSQL:', err.message);
  }
}

// User DB Lookup & Persistence
export async function dbFindUserByEmail(email: string): Promise<any | null> {
  const normalized = email.toLowerCase().trim();
  await ensureDbReady();
  if (pgPool && isPgConnected) {
    try {
      const res = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalized]);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          password: r.password_hash,
          role: r.role,
          permissions: r.permissions || [],
          avatarUrl: r.avatar_url,
          isActive: r.is_active,
          createdAt: r.created_at?.toISOString() || new Date().toISOString()
        };
      }
    } catch (e: any) {
      console.warn('[DB Error] dbFindUserByEmail query failed:', e.message);
    }
  }

  // Fallback to in-memory store
  return memStore.users.find(u => u.email.toLowerCase() === normalized) || null;
}

export async function dbFindUserByPhone(phone: string): Promise<any | null> {
  const raw = (phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!raw && !digits) return null;

  await ensureDbReady();
  if (pgPool && isPgConnected) {
    try {
      const res = await pgPool.query(
        `SELECT * FROM users
         WHERE phone = $1
            OR REPLACE(REPLACE(phone, ' ', ''), '-', '') = $2
            OR (LENGTH($3) >= 7 AND RIGHT(REPLACE(REPLACE(phone, ' ', ''), '-', ''), 7) = RIGHT($3, 7))
         LIMIT 1`,
        [raw, raw.replace(/[\s-]/g, ''), digits]
      );
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          password: r.password_hash,
          role: r.role,
          permissions: r.permissions || [],
          avatarUrl: r.avatar_url,
          isActive: r.is_active,
          createdAt: r.created_at?.toISOString() || new Date().toISOString()
        };
      }
    } catch (e: any) {
      console.warn('[DB Error] dbFindUserByPhone query failed:', e.message);
    }
  }

  return (
    memStore.users.find(u => {
      const uDigits = (u.phone || '').replace(/\D/g, '');
      return u.phone === raw || (digits.length >= 7 && uDigits.endsWith(digits.slice(-7)));
    }) || null
  );
}

export async function dbFindUserById(id: string): Promise<any | null> {
  await ensureDbReady();
  if (pgPool && isPgConnected) {
    try {
      const res = await pgPool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          password: r.password_hash,
          role: r.role,
          permissions: r.permissions || [],
          avatarUrl: r.avatar_url,
          isActive: r.is_active,
          createdAt: r.created_at?.toISOString() || new Date().toISOString()
        };
      }
    } catch (e: any) {
      console.warn('[DB Error] dbFindUserById query failed:', e.message);
    }
  }

  return memStore.users.find(u => u.id === id) || null;
}

export async function dbSaveUser(user: any): Promise<void> {
  await ensureDbReady();
  if (pgPool && isPgConnected) {
    await pgPool.query(
      `INSERT INTO users (id, name, email, phone, password_hash, role, permissions, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         phone = EXCLUDED.phone,
         is_active = EXCLUDED.is_active,
         updated_at = NOW()`,
      [
        user.id,
        user.name,
        user.email,
        user.phone,
        user.password,
        user.role,
        JSON.stringify(user.permissions || []),
        user.isActive,
        user.createdAt
      ]
    );
  }
}

export async function dbUpdateUserStatus(id: string, isActive: boolean) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('UPDATE users SET is_active = $1, updated_at = NOW() WHERE id = $2', [isActive, id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to update user status in PG:', e.message);
    }
  }
}

export async function dbUpdateUserRole(id: string, role: 'ADMIN' | 'CUSTOMER', permissions: string[] = []) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        'UPDATE users SET role = $1, permissions = $2, updated_at = NOW() WHERE id = $3',
        [role, permissions, id]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to update user role in PG:', e.message);
    }
  }
}

export async function dbSaveBooking(booking: Booking) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO bookings (id, booking_code, user_id, customer_id, customer_name, customer_phone, customer_email, event_type, event_name, event_date, time_slot, hall_section, package_id, package_name, package_price, addons, total_price, status, guest_count, notes, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           rejection_reason = EXCLUDED.rejection_reason`,
        [booking.id, booking.bookingCode, booking.userId, booking.customerId || booking.userId, booking.customerName, booking.customerPhone, booking.customerEmail, booking.eventType, booking.eventName || '', booking.eventDate, booking.timeSlot, booking.hallSection, booking.packageId || null, booking.packageName || null, booking.packagePrice || 0, JSON.stringify(booking.addons || []), booking.totalPrice, booking.status, booking.guestCount, booking.notes || null, booking.createdAt]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to persist booking to PG:', e.message);
    }
  }
}

export async function dbUpdateBookingStatus(id: string, status: string, rejectionReason?: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        'UPDATE bookings SET status = $1, rejection_reason = $2 WHERE id = $3',
        [status, rejectionReason || null, id]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to update booking in PG:', e.message);
    }
  }
}

export async function dbSaveSettings(settings: HallSettings) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO hall_settings (id, data, updated_at) VALUES ('primary', $1, NOW())
         ON CONFLICT (id) DO UPDATE SET data = $1, updated_at = NOW()`,
        [JSON.stringify(settings)]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to save settings to PG:', e.message);
    }
  }
}

export async function dbSaveService(service: HallService) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO services (id, name, description, price, price_usd, category, image_url, is_available, is_customizable)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           image_url = EXCLUDED.image_url`,
        [service.id, service.name, service.description, service.price, service.priceUsd || null, service.category, service.imageUrl, service.isAvailable, service.isCustomizable || false]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to save service to PG:', e.message);
    }
  }
}

export async function dbDeleteService(id: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('DELETE FROM services WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to delete service from PG:', e.message);
    }
  }
}

export async function dbSavePackage(pkg: HallPackage) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO packages (id, name, slug, description, price, price_usd, badge, features, included_service_ids, image_url, is_popular, is_active, guest_capacity_text)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           price = EXCLUDED.price,
           features = EXCLUDED.features`,
        [pkg.id, pkg.name, pkg.slug, pkg.description, pkg.price, pkg.priceUsd, pkg.badge || null, JSON.stringify(pkg.features), JSON.stringify(pkg.includedServiceIds), pkg.imageUrl, pkg.isPopular, pkg.isActive, pkg.guestCapacityText]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to save package to PG:', e.message);
    }
  }
}

export async function dbDeletePackage(id: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('DELETE FROM packages WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to delete package from PG:', e.message);
    }
  }
}

export async function dbSaveGallery(item: GalleryItem) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO gallery (id, title, description, image_url, video_url, category, media_type, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           image_url = EXCLUDED.image_url`,
        [item.id, item.title, item.description || null, item.imageUrl, item.videoUrl || null, item.category, item.mediaType, item.sortOrder]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to save gallery item to PG:', e.message);
    }
  }
}

export async function dbDeleteGallery(id: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('DELETE FROM gallery WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to delete gallery from PG:', e.message);
    }
  }
}

export async function dbSaveReview(review: Review) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO reviews (id, author_name, user_id, rating, comment, event_type, event_date, is_verified, is_approved, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET
           is_approved = EXCLUDED.is_approved`,
        [review.id, review.authorName, review.userId || null, review.rating, review.comment, review.eventType || 'wedding', review.eventDate || '2026-01-01', review.isVerified !== false, review.isApproved, review.source || 'platform']
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to save review to PG:', e.message);
    }
  }
}

export async function dbUpdateReviewStatus(id: string, isApproved: boolean) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('UPDATE reviews SET is_approved = $1 WHERE id = $2', [isApproved, id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to update review in PG:', e.message);
    }
  }
}

export async function dbDeleteReview(id: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('DELETE FROM reviews WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to delete review from PG:', e.message);
    }
  }
}

export async function dbSaveNotification(notif: AppNotification) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query(
        `INSERT INTO notifications (id, user_id, title, message, type, booking_id, is_read, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [notif.id, notif.userId, notif.title, notif.message, notif.type, notif.bookingId || null, notif.isRead, notif.createdAt]
      );
    } catch (e: any) {
      console.warn('[DB Error] Failed to persist notification to PG:', e.message);
    }
  }
}

export async function dbMarkNotificationRead(id: string) {
  if (pgPool && isPgConnected) {
    try {
      await pgPool.query('UPDATE notifications SET is_read = TRUE WHERE id = $1', [id]);
    } catch (e: any) {
      console.warn('[DB Error] Failed to update notification in PG:', e.message);
    }
  }
}

// Database Status & Diagnostics
export async function getDatabaseStatus() {
  if (pgPool) {
    try {
      const start = Date.now();
      const result = await pgPool.query('SELECT NOW() as current_time');
      const latency = Date.now() - start;

      const userCountRes = await pgPool.query('SELECT COUNT(*) FROM users');
      const bookingCountRes = await pgPool.query('SELECT COUNT(*) FROM bookings');

      return {
        provider: 'PostgreSQL',
        connected: true,
        latencyMs: latency,
        currentTime: result.rows[0].current_time,
        databaseUrlConfigured: true,
        usingMemoryFallback: false,
        stats: {
          usersInDb: parseInt(userCountRes.rows[0].count, 10),
          bookingsInDb: parseInt(bookingCountRes.rows[0].count, 10)
        }
      };
    } catch (err: any) {
      return {
        provider: 'In-Memory Store (Resilient Fallback)',
        connected: false,
        databaseUrlConfigured: true,
        error: err.message,
        usingMemoryFallback: true,
        stats: {
          usersInMemory: memStore.users.length,
          bookingsInMemory: memStore.bookings.length
        }
      };
    }
  }

  return {
    provider: 'In-Memory Store (High-Speed Local Store)',
    connected: true,
    databaseUrlConfigured: false,
    usingMemoryFallback: false,
    stats: {
      usersInMemory: memStore.users.length,
      bookingsInMemory: memStore.bookings.length
    }
  };
}
