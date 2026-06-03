-- EventX Platform - Complete Database Schema
-- Run this file in PostgreSQL to create all required tables

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('organizer', 'attendee')) DEFAULT 'attendee',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_role ON users(role);

-- ============================================
-- EVENTS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    venue VARCHAR(255),
    date_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('draft', 'published', 'cancelled')) DEFAULT 'draft',
    capacity INTEGER NOT NULL DEFAULT 0,
    banner_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_date_time ON events(date_time);

-- ============================================
-- SEAT_TIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS seat_tiers (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    tier_name VARCHAR(100) NOT NULL,
    tier_type VARCHAR(50) NOT NULL CHECK (tier_type IN ('GENERAL_ADMISSION', 'VIP', 'PREMIUM')),
    price DECIMAL(10, 2) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    UNIQUE (event_id, tier_name)
);

CREATE INDEX IF NOT EXISTS idx_seat_tiers_event_id ON seat_tiers(event_id);

-- ============================================
-- SEATS TABLE (Enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS seats (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    tier_id INTEGER NOT NULL,
    seat_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('available', 'locked', 'booked')) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (tier_id) REFERENCES seat_tiers(id) ON DELETE CASCADE,
    UNIQUE (event_id, seat_number)
);

CREATE INDEX IF NOT EXISTS idx_seats_event_id ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_tier_id ON seats(tier_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')) DEFAULT 'pending',
    payment_id VARCHAR(255),
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_event_id ON bookings(event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);

-- ============================================
-- BOOKING_SEATS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS booking_seats (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    UNIQUE (booking_id, seat_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_seats_booking_id ON booking_seats(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_seats_seat_id ON booking_seats(seat_id);

-- ============================================
-- TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(100) UNIQUE NOT NULL,
    booking_id INTEGER NOT NULL,
    seat_id INTEGER NOT NULL,
    qr_code_data TEXT,
    status VARCHAR(50) NOT NULL CHECK (status IN ('generated', 'downloaded', 'used', 'cancelled')) DEFAULT 'generated',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    downloaded_at TIMESTAMP,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    FOREIGN KEY (seat_id) REFERENCES seats(id)
);

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_id ON tickets(ticket_id);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);

-- ============================================
-- TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER NOT NULL,
    payment_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('payment', 'refund')) DEFAULT 'payment',
    stripe_event_id VARCHAR(255),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_id ON transactions(payment_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_event_id ON transactions(stripe_event_id);

-- ============================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_bookings_user_event ON bookings(user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_seats_event_status ON seats(event_id, status);
CREATE INDEX IF NOT EXISTS idx_events_organizer_status ON events(organizer_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_status ON tickets(booking_id, status);

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Run this query to verify all tables were created:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
