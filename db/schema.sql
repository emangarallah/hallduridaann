-- ============================================================
-- SQL Schema for Dhu Raydan Wedding and Event Hall (قاعة ذو ريدان)
-- Location: Al-Hassaba, Sana'a, Yemen
-- Target: PostgreSQL 14+
-- ============================================================

-- Create Enums
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'CUSTOMER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('wedding', 'graduation', 'conference', 'family', 'condolence', 'party', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE time_slot AS ENUM ('morning', 'evening', 'full_day');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'rejected', 'cancelled', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE hall_section AS ENUM ('men', 'women', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'CUSTOMER' NOT NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Services Table
CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    price_usd NUMERIC(10, 2),
    category VARCHAR(50) NOT NULL,
    image_url TEXT NOT NULL,
    is_available BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    price NUMERIC(12, 2) NOT NULL,
    price_usd NUMERIC(10, 2) NOT NULL,
    badge VARCHAR(50),
    features JSONB NOT NULL DEFAULT '[]'::jsonb,
    image_url TEXT NOT NULL,
    is_popular BOOLEAN DEFAULT FALSE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    guest_capacity_text VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Package Included Services Table (Pivot)
CREATE TABLE IF NOT EXISTS package_services (
    id SERIAL PRIMARY KEY,
    package_id VARCHAR(64) REFERENCES packages(id) ON DELETE CASCADE,
    service_id VARCHAR(64) REFERENCES services(id) ON DELETE CASCADE,
    UNIQUE(package_id, service_id)
);

-- 5. Bookings Table (With Conflict Prevention Index)
CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    booking_code VARCHAR(50) UNIQUE NOT NULL,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    event_type event_type NOT NULL,
    event_date DATE NOT NULL,
    time_slot time_slot NOT NULL,
    hall_section hall_section DEFAULT 'both' NOT NULL,
    guest_count INTEGER NOT NULL CHECK (guest_count > 0),
    package_id VARCHAR(64) REFERENCES packages(id) ON DELETE SET NULL,
    package_name VARCHAR(255),
    package_price NUMERIC(12, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    status booking_status DEFAULT 'pending' NOT NULL,
    notes TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Index for instant conflict check and date lookup
CREATE INDEX IF NOT EXISTS idx_bookings_conflict 
ON bookings (event_date, time_slot, status) 
WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);

-- 6. Booking Items (Add-on Services)
CREATE TABLE IF NOT EXISTS booking_items (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    service_id VARCHAR(64) REFERENCES services(id) ON DELETE RESTRICT NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL
);

-- 7. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    booking_id VARCHAR(64) REFERENCES bookings(id) ON DELETE SET NULL,
    author_name VARCHAR(255) NOT NULL,
    author_phone VARCHAR(50),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'verified_customer' NOT NULL,
    is_approved BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Gallery Table
CREATE TABLE IF NOT EXISTS gallery_items (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    video_url TEXT,
    category VARCHAR(50) NOT NULL,
    media_type VARCHAR(20) DEFAULT 'image' NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL,
    featured BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL, -- or 'all_admin'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    booking_id VARCHAR(64),
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Settings Table
CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
    hall_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    phone_primary VARCHAR(50) NOT NULL,
    phone_secondary VARCHAR(50),
    whatsapp_number VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    address TEXT NOT NULL,
    landmark TEXT,
    plus_code VARCHAR(50) NOT NULL,
    google_maps_url TEXT NOT NULL,
    working_hours VARCHAR(255) NOT NULL,
    rating_score NUMERIC(3, 1) DEFAULT 4.4 NOT NULL,
    rating_count INTEGER DEFAULT 1182 NOT NULL,
    capacity_max INTEGER DEFAULT 1500 NOT NULL,
    currency VARCHAR(50) DEFAULT 'ريال يمني' NOT NULL,
    usd_exchange_rate NUMERIC(8, 2) DEFAULT 535.00 NOT NULL,
    facebook_url TEXT,
    instagram_url TEXT,
    tiktok_url TEXT,
    hero_headline TEXT NOT NULL,
    hero_subheadline TEXT NOT NULL,
    hero_image_url TEXT NOT NULL,
    hero_notice TEXT,
    cancellation_policy TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);
